import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Button,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebaseConfig';
import { onSnapshot, getDoc, doc } from 'firebase/firestore';
import { client } from '@/streamConfig';
import { fetchStreamToken } from '@/utils/stream';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import i18n from '@/app/i18n';

export default function Home() {
  const { user, login } = useAuth();
  const [friends, setFriends] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [isGroupModalVisible, setGroupModalVisible] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isAddFriendsModalVisible, setAddFriendsModalVisible] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState(null);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const currentColors = Colors[colorScheme || 'light'];
  const { t } = useTranslation();
  const [currentTranslations, setCurrentTranslations] = useState(i18n.t);

  // ----- FETCH DISCUSSIONS -----
  const fetchDiscussions = async () => {
    if (!user) return;

    try {
      // 1. Récupère la fiche utilisateur Firestore
      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userDocSnap.data();

      // 2. Récupère la liste d'amis
      let friendsList: any[] = [];
      if (userData?.friends) {
        const friendsPromises = userData.friends.map((friendId: string) =>
          getDoc(doc(db, 'users', friendId))
        );
        const friendsDocs = await Promise.all(friendsPromises);
        friendsList = friendsDocs.map((d) => ({ id: d.id, ...d.data() }));
        setFriends(friendsList);
      }

      // 3. Connecte l'utilisateur à Stream (si pas déjà connecté + token manquant)
      if (!user.streamToken) {
        const newToken = await fetchStreamToken(user.uid);
        // Met à jour le user context pour y ajouter le streamToken
        login({ ...user, streamToken: newToken });
      }

      if (!client.user) {
        await client.connectUser(
          {
            id: user.uid,
            name: user.username,
            image:
              user.avatar ||
              `https://getstream.io/random_svg/?id=${user.uid}&name=${user.username}`,
          },
          user.streamToken
        );
      }

      // 4. Récupère les canaux existants pour l'utilisateur (distinct = 1-1)
      const existingChannels = await client.queryChannels({
        members: { $in: [user.uid] },
        distinct: true,
      });

      // 4a. Construit une liste/Set des IDs de channels 1-1 déjà existants
      //     (en utilisant la convention channelId = "uid1_uid2" triés)
      const existingOneToOneIds = new Set();
      existingChannels.forEach((ch) => {
        const mem = ch.data?.members;
        if (Array.isArray(mem) && mem.length === 2) {
          const sortedId = mem.sort().join('_');
          existingOneToOneIds.add(sortedId);
        }
      });

      // 5. Pour chaque ami, si le channel 1-1 n'existe pas déjà, on le crée
      for (const friend of friendsList) {
        const channelId = [user.uid, friend.id].sort().join('_');
        if (!existingOneToOneIds.has(channelId)) {
          const channel = client.channel('messaging', channelId, {
            members: [user.uid, friend.id],
            image:
              friend.avatar ||
              `https://getstream.io/random_svg/?id=${channelId}&name=${friend.username}`,
            created_by: { id: user.uid },
          });
          await channel.watch(); // créé s'il n'existe pas et s'abonne
        }
      }

      // 6. Maintenant on query à nouveau (ou on réutilise existingChannels + query en plus)
      //    pour lister tous les canaux, y compris ceux nouvellement créés
      const channels = await client.queryChannels({ members: { $in: [user.uid] } });

      // 7. Prépare les unread counts, lastMessages, etc.
      const unreadCountsTemp: Record<string, number> = {};
      const lastMessagesTemp: Record<string, string> = {};

      const discussionsTemp = await Promise.all(
        channels.map(async (channel) => {
          // 1. Dernier message
          const lastMessage = channel.state.messages.at(-1);
          unreadCountsTemp[channel.id] = channel.countUnread();
          lastMessagesTemp[channel.id] = lastMessage?.text || t('group.noMessages');
      
          // 2. Valeurs par défaut (nom et avatar)
          let avatar = `https://getstream.io/random_png/?id=${channel.id}&name=${channel.data.name}`;
          let name = channel.data.name || t('group.unnamedGroup');
      
          // 3. Récupération des membres via channel.state.members (c’est un objet, pas un tableau)
          const membersMap = channel.state?.members || {};
          const memberIds = Object.keys(membersMap); 
          // memberIds est un tableau des userIds, ex: ["user1", "user2", ...]
      
          // 4. Vérifier si c'est un canal 1‑to‑1
          if (memberIds.length === 2) {
            const otherUserId = memberIds.find((m) => m !== user.uid);
            if (otherUserId) {
              // Aller chercher le doc Firestore de l’autre user
              const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
              if (otherUserDoc.exists()) {
                const otherUserData = otherUserDoc.data();
                avatar = otherUserData?.avatar || avatar;
                name = otherUserData?.username || name;
              }
            }
          }
      
          return {
            id: channel.id,
            name,
            avatar,
            isGroup: memberIds.length > 2, // ou (channel.data.member_count ?? 0) > 2
            ownerId: channel.data.created_by?.id,
          };
        })
      );      

      setUnreadCounts(unreadCountsTemp);
      setLastMessages(lastMessagesTemp);
      setDiscussions(discussionsTemp);
    } catch (error) {
      console.error(t('group.fetchError'), error);
    }
  };
  
  useEffect(() => {
    if (!user?.uid) return;
  
    // Dès que le doc utilisateur change (amis en plus, etc.),
    // on relance fetchDiscussions()
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        fetchDiscussions();
      }
    });
  
    return () => {
      unsubscribe();
    };
  }, [user?.uid]);
  
  // ----- EFFET : On fetch + on écoute la langue -----
  useEffect(() => {
    fetchDiscussions();

    const handleLanguageChange = () => {
      setCurrentTranslations(() => i18n.t);
      // Rechargement si besoin
      fetchDiscussions();
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!client?.user?.id) return;
  
    const handleEvent = (event: any) => {
      // Déclenche un refresh lorsqu’on reçoit un nouveau message,
      // lorsqu’un channel est marqué "lu", 
      // ET lorsqu’on est ajouté à un nouveau channel
      if (
        event.type === 'message.new' ||
        event.type === 'notification.mark_read' ||
        event.type === 'notification.added_to_channel' ||
        event.type === 'channel.deleted'
      ) {
        fetchDiscussions();
      }
    };
  
    client.on(handleEvent);
    return () => {
      client.off(handleEvent);
    };
  }, [client, user]);
  
  // ----- EFFET : écouter les events message.new, message.read pour mettre à jour unread -----
  useEffect(() => {
    if (!client?.user?.id) return;

    const handleEvent = (event: any) => {
      if (event.type === 'message.new' || event.type === 'notification.mark_read') {
        fetchDiscussions();
      }
    };

    client.on(handleEvent);
    return () => {
      client.off(handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, user]);

  // ----- HANDLERS -----
  const handleChat = (discussion: any) => {
    router.push({
      pathname: `/chat/${discussion.id}`,
      params: { title: discussion.name },
    });
    // Reset du unread local (visuel)
    setUnreadCounts((prev) => ({ ...prev, [discussion.id]: 0 }));
  };

  const handleGroupLongPress = async (discussion: any) => {
    if (!discussion.isGroup) return;
    const isOwner = discussion.ownerId === user.uid;

    Alert.alert(
      t('group.title'),
      isOwner ? t('group.ownerOptions') : t('group.memberOptions'),
      [
        isOwner && {
          text: t('group.addFriends'),
          onPress: () => openAddFriendsModal(discussion),
        },
        isOwner
          ? {
              text: t('group.deleteGroup'),
              onPress: async () => {
                try {
                  await deleteGroup(discussion);
                  Alert.alert(t('group.success'), t('group.groupDeleted'));
                  fetchDiscussions();
                } catch (error) {
                  console.error(t('group.deleteError'), error);
                  Alert.alert(t('group.error'), t('group.deleteErrorMessage'));
                }
              },
              style: 'destructive',
            }
          : {
              text: t('group.leaveGroup'),
              onPress: async () => {
                try {
                  await leaveGroup(discussion);
                  Alert.alert(t('group.success'), t('group.leftGroup'));
                  fetchDiscussions();
                } catch (error) {
                  console.error(t('group.leaveError'), error);
                  Alert.alert(t('group.error'), t('group.leaveErrorMessage'));
                }
              },
              style: 'destructive',
            },
        { text: t('common.close'), style: 'cancel' },
      ].filter(Boolean)
    );
  };

  const openAddFriendsModal = async (discussion: any) => {
    try {
      const channel = client.channel('messaging', discussion.id);
      const response = await channel.queryMembers({});
      const currentMembers = response.members.map((m: any) => m.user.id);

      setGroupToEdit({ ...discussion, members: currentMembers });
      setAddFriendsModalVisible(true);
    } catch (error) {
      console.error(t('group.memberFetchError'), error);
      Alert.alert(t('group.error'), t('group.memberFetchErrorMessage'));
    }
  };

  const addFriendsToGroup = async () => {
    if (!groupToEdit || selectedFriends.length === 0) {
      Alert.alert(t('group.error'), t('group.noFriendsSelected'));
      return;
    }
    try {
      const channel = client.channel('messaging', groupToEdit.id);
      await channel.addMembers(selectedFriends);
      Alert.alert(t('group.success'), t('group.friendsAdded'));
      setAddFriendsModalVisible(false);
      setSelectedFriends([]);
      fetchDiscussions();
    } catch (error) {
      console.error(t('group.addFriendsError'), error);
      Alert.alert(t('group.error'), t('group.addFriendsErrorMessage'));
    }
  };

  const deleteGroup = async (group: any) => {
    const channel = client.channel('messaging', group.id);
    await channel.delete();
  };

  const leaveGroup = async (group: any) => {
    const channel = client.channel('messaging', group.id);
    await channel.removeMembers([user.uid]);
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('group.error'), t('group.enterGroupName'));
      return;
    }
    if (selectedFriends.length === 0) {
      Alert.alert(t('group.error'), t('group.noFriendsSelected'));
      return;
    }

    try {
      const channelId = `group-${Date.now()}`;
      const members = [user.uid, ...selectedFriends];

      const groupChannel = client.channel('messaging', channelId, {
        name: groupName,
        members,
        image: `https://getstream.io/random_svg/?id=${channelId}&name=${groupName}`,
        created_by: { id: user.uid },
      });

      await groupChannel.watch();
      setGroupModalVisible(false);
      setGroupName('');
      setSelectedFriends([]);
      Alert.alert(t('group.success'), t('group.groupCreated'));
      fetchDiscussions();
    } catch (error) {
      console.error(t('group.createError'), error);
    }
  };

  const renderSeparator = () => (
    <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />
  );

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <FlatList
        data={discussions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendItem}
            onPress={() => handleChat(item)}
            onLongPress={() => handleGroupLongPress(item)}
          >
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
              defaultSource={require('../../assets/images/icon.png')}
            />
            <View style={styles.messageContainer}>
              <Text style={[styles.username, { color: currentColors.text }]}>{item.name}</Text>
              <Text style={[styles.lastMessage, { color: currentColors.icon }]}>
                {lastMessages[item.id]}
              </Text>
            </View>
            {unreadCounts[item.id] > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCounts[item.id]}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={renderSeparator}
        ListFooterComponent={() => (
          <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />
        )}
      />

      {/* Bouton flottant pour créer un groupe */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: currentColors.tabBackground }]}
        onPress={() => setGroupModalVisible(true)}
      >
        <Feather name="plus" size={24} color={currentColors.buttonText} />
      </TouchableOpacity>

      {/* Modal pour la création de groupes */}
      <Modal visible={isGroupModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.background }]}>
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              {t('group.createGroup')}
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: currentColors.cardBackground, borderColor: currentColors.icon },
              ]}
              placeholder={t('group.groupNamePlaceholder')}
              placeholderTextColor={currentColors.icon}
              value={groupName}
              onChangeText={setGroupName}
            />
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.friendItem,
                    selectedFriends.includes(item.id) && {
                      backgroundColor: currentColors.tint,
                    },
                  ]}
                  onPress={() =>
                    setSelectedFriends((prev) =>
                      prev.includes(item.id)
                        ? prev.filter((f) => f !== item.id)
                        : [...prev, item.id]
                    )
                  }
                >
                  <Text style={[styles.username, { color: currentColors.text }]}>
                    {item.username}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button title={t('group.create')} onPress={createGroup} />
            <Button title={t('group.cancel')} onPress={() => setGroupModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>

      {/* Modal pour ajouter des amis dans un groupe */}
      <Modal visible={isAddFriendsModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.background }]}>
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              {t('group.addFriends')}
            </Text>
            <FlatList
              data={friends.filter((friend) => !groupToEdit?.members?.includes(friend.id))}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.friendItem,
                    selectedFriends.includes(item.id) && {
                      backgroundColor: currentColors.tint,
                    },
                  ]}
                  onPress={() =>
                    setSelectedFriends((prev) =>
                      prev.includes(item.id)
                        ? prev.filter((f) => f !== item.id)
                        : [...prev, item.id]
                    )
                  }
                >
                  <Text style={[styles.username, { color: currentColors.text }]}>
                    {item.username}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button title={t('group.add')} onPress={addFriendsToGroup} />
            <Button
              title={t('common.cancel')}
              onPress={() => setAddFriendsModalVisible(false)}
              color="red"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------
// Styles
// ---------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messageContainer: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 4,
  },
  separator: {
    height: 1,
  },
  unreadBadge: {
    backgroundColor: 'red',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

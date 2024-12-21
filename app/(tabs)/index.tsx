import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { client } from '@/streamConfig';
import { fetchStreamToken } from '@/utils/stream';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function Home() {
  const { user, login } = useAuth();
  const [friends, setFriends] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const router = useRouter();
  const colorScheme = useColorScheme();
  const currentColors = Colors[colorScheme || 'light'];

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (userData?.friends) {
          const friendsPromises = userData.friends.map((friendId) =>
            getDoc(doc(db, 'users', friendId))
          );
          const friendsDocs = await Promise.all(friendsPromises);
          const friendsList = friendsDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setFriends(friendsList);

          // Vérifiez ou connectez l'utilisateur à GetStream
          if (!user.streamToken) {
            console.log('Aucun token Stream trouvé. Récupération d\'un nouveau token...');
            const newToken = await fetchStreamToken(user.uid);
            login({ ...user, streamToken: newToken });
          }

          if (!client.user) {
            await client.connectUser(
              {
                id: user.uid,
                name: user.username,
                image: `https://getstream.io/random_svg/?id=${user.uid}&name=${user.username}`,
              },
              user.streamToken
            );
          }

          // Récupérer les messages non lus et le dernier message pour chaque ami
          const unreadCountsTemp: Record<string, number> = {};
          const lastMessagesTemp: Record<string, string> = {};
          for (const friend of friendsList) {
            const channelId = [user.uid, friend.id].sort().join('-');
            const channel = client.channel('messaging', channelId);
            await channel.watch();

            unreadCountsTemp[friend.id] = channel.countUnread();
            const messages = channel.state.messages;
            if (messages.length > 0) {
              lastMessagesTemp[friend.id] = messages[messages.length - 1].text;
            } else {
              lastMessagesTemp[friend.id] = 'No messages yet.';
            }
          }
          setUnreadCounts(unreadCountsTemp);

          // Trier les amis par date du dernier message
          const sortedFriends = friendsList.sort((a, b) => {
            const channelA = client.channel('messaging', [user.uid, a.id].sort().join('-'));
            const channelB = client.channel('messaging', [user.uid, b.id].sort().join('-'));
            const lastMessageA = channelA.state.messages.at(-1)?.created_at || new Date(0);
            const lastMessageB = channelB.state.messages.at(-1)?.created_at || new Date(0);
            return new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime();
          });
          setFriends(sortedFriends);

          setLastMessages(lastMessagesTemp);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des amis :', error);
      }
    };

    fetchFriends();
  }, [user]);

  const handleChat = async (friend: any) => {
    if (!user) return;

    try {
      const channelId = [user.uid, friend.id].sort().join('-');
      const chatChannel = client.channel('messaging', channelId, {
        name: `Chat with ${friend.username}`,
        members: [user.uid, friend.id],
      });

      await chatChannel.watch();
      router.push({
        pathname: `/chat/${channelId}`,
        params: { title: friend.username },
      });

      // Réinitialiser le compteur de messages non lus pour ce chat
      setUnreadCounts((prev) => ({ ...prev, [friend.id]: 0 }));
    } catch (error) {
      console.error('Erreur lors de la création du canal :', error);
    }
  };

  const renderSeparator = () => (
    <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />
  );

  const renderTopSeparator = () => <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />;
  const renderBottomSeparator = () => <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />;

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderTopSeparator} // Séparateur en haut
        ListFooterComponent={renderBottomSeparator} // Séparateur en bas
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendItem}
            onPress={() => handleChat(item)}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.messageContainer}>
              <Text style={[styles.username, { color: currentColors.text }]}>{item.username}</Text>
              <Text style={[styles.lastMessage, { color: currentColors.icon }]}>{lastMessages[item.id]}</Text>
            </View>
            {unreadCounts[item.id] > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCounts[item.id]}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  );
}

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
});

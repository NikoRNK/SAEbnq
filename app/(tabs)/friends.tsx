import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import { client } from '@/streamConfig';

export default function Friends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]); // demandes reçues par NOUS
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const currentColors = Colors[colorScheme || 'light'];
  const { t } = useTranslation();

  // ------------------------------------------------------------------
  // 1. Écoute en temps réel le doc user pour remplir "friends" et "friendRequests"
  //    => "friendRequests" = IDs de ceux qui NOUS ont demandé en ami
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
      if (!docSnap.exists()) return;

      const userData = docSnap.data() || {};

      // -- FRIENDS --
      if (Array.isArray(userData.friends)) {
        const friendsPromises = userData.friends.map((friendId) =>
          getDoc(doc(db, 'users', friendId))
        );
        const friendsDocs = await Promise.all(friendsPromises);
        const friendsList = friendsDocs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriends(friendsList);
      } else {
        setFriends([]);
      }

      // -- FRIEND REQUESTS -- (IDs de ceux qui NOUS ont demandé)
      if (Array.isArray(userData.friendRequests)) {
        const requestsPromises = userData.friendRequests.map((friendId) =>
          getDoc(doc(db, 'users', friendId))
        );
        const requestsDocs = await Promise.all(requestsPromises);
        const requestsList = requestsDocs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriendRequests(requestsList);
      } else {
        setFriendRequests([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // ------------------------------------------------------------------
  // 2. fetchAllUsers => Liste de tous les users, sauf nous
  // ------------------------------------------------------------------
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(allUsers.filter((u) => u.id !== user.uid));
    } catch (error) {
      console.error(t('friends.usersFetchError'), error);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 3. handleAddFriend => J'envoie une demande à friendId
  //    => J'ajoute MON user.uid dans "friendRequests" de friendId
  // ------------------------------------------------------------------
  const handleAddFriend = async (friendId) => {
    try {
      // 1.1. Récupère le doc Firestore de l’ami
      const friendDocRef = doc(db, 'users', friendId);
      const friendSnap = await getDoc(friendDocRef);
      if (!friendSnap.exists()) {
        Alert.alert('Error', 'Friend doc does not exist');
        return;
      }

      // 1.2. Lire MON doc (puisque c’est moi qui stocke “qui je demande”)
      const meRef = doc(db, 'users', user.uid);
      const meSnap = await getDoc(meRef);
      if (!meSnap.exists()) {
        Alert.alert('Error', 'My doc does not exist');
        return;
      }
      const meData = meSnap.data() || {};
      const friendDocId = friendSnap.id;

      // POINT CLÉ : friendData.friendRequests = liste des gens qui ont demandé CET utilisateur
      // Donc si friendData.friendRequests contient déjà "user.uid",
      // ça veut dire "l'ami" nous a déjà mis dedans => on a alors un CROSS, on auto-accepte.
      const alreadyRequestedMe = Array.isArray(meData.friendRequests)
        && meData.friendRequests.includes(friendDocId);

      if (alreadyRequestedMe) {
        // Cas 1 : L’autre m’a déjà ajouté => auto-accept
        // => On devient amis tout de suite

        // a) Sur mon doc : j’ajoute friendId à mes "friends"
        //    et je retire friendId de mes "friendRequests" si besoin
        const currentUserDocRef = doc(db, 'users', user.uid);
        await updateDoc(currentUserDocRef, {
          friends: arrayUnion(friendId),
          friendRequests: arrayRemove(friendId), 
        });

        // b) Sur le doc de l’ami : j’ajoute mon userID dans "friends"
        //    et je retire mon userID de son "friendRequests"
        await updateDoc(friendDocRef, {
          friends: arrayUnion(user.uid),
          friendRequests: arrayRemove(user.uid),
        });

      } else {
        // Cas 2 : L’autre ne nous a pas demandé => on envoie une simple "friend request"
        // => J’ajoute "user.uid" dans friendRequests[] de l’ami
        await updateDoc(friendDocRef, {
          friendRequests: arrayUnion(user.uid),
        });
      }

      // Re-fetch pour mettre à jour la liste
      await fetchAllUsers();
    } catch (error) {
      console.error(t('friends.addFriendError'), error);
    }
  };

  // Supprime un ami de ma liste "friends" et me supprime de sa liste "friends"
  const handleRemoveFriend = async (friendId) => {
    try {
      Alert.alert(
        t('friends.removeConfirmationTitle'),  // Titre de l’alerte
        t('friends.removeConfirmationMessage'), // Message de l’alerte
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              // Suppression réciproque
              const meRef = doc(db, 'users', user.uid);
              await updateDoc(meRef, {
                friends: arrayRemove(friendId),
              });
              const friendRef = doc(db, 'users', friendId);
              await updateDoc(friendRef, {
                friends: arrayRemove(user.uid),
              }); 
              const channelId = [user.uid, friendId].sort().join('_');
              const channel = client.channel('messaging', channelId);
              
              // Vérifier qu'il existe et le supprimer
              await channel.delete();
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert(
        t('common.error'),
        t('friends.removeFriendErrorMessage')
      );
    }
  };

  // ------------------------------------------------------------------
  // 4. handleCancelRequest => j'annule la demande que j'ai envoyée
  //    => j'enlève mon user.uid de friendRequests du friend
  // ------------------------------------------------------------------
  const handleCancelRequest = async (friendId) => {
    try {
      const friendDocRef = doc(db, 'users', friendId);
      await updateDoc(friendDocRef, {
        friendRequests: arrayRemove(user.uid),
      });

      await fetchAllUsers();
    } catch (error) {
      console.error('Error cancelling friend request:', error);
    }
  };

  // ------------------------------------------------------------------
  // 5. handleAcceptFriend => j'accepte la demande d'ami qu'on m'a envoyée
  //    => Je retire friendId de mes friendRequests et l’ajoute dans mes friends
  //    => J’ajoute mon user.uid dans friendId.friends
  // ------------------------------------------------------------------
  const handleAcceptFriend = async (friendId) => {
    try {
      // Sur mon doc => je retire friendId de "friendRequests" (car j’accepte)
      // et je l’ajoute dans "friends"
      const currentUserDocRef = doc(db, 'users', user.uid);
      await updateDoc(currentUserDocRef, {
        friends: arrayUnion(friendId),
        friendRequests: arrayRemove(friendId),
      });

      // Sur le doc de l’ami => je l’ajoute à mes "friends" 
      // (car c’est réciproque quand j’accepte)
      const friendDocRef = doc(db, 'users', friendId);
      await updateDoc(friendDocRef, {
        friends: arrayUnion(user.uid),
      });

    } catch (error) {
      console.error(t('friends.acceptFriendError'), error);
    }
  };

  // ------------------------------------------------------------------
  // 6. Filtre pour la recherche (dans la modal)
  // ------------------------------------------------------------------
  const filteredUsers = users.filter(
    (u) =>
      u.username &&
      u.username.toLowerCase().includes(search.toLowerCase()) &&
      !friends.some((friend) => friend.id === u.id)
  );

  const renderSeparator = () => (
    <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />
  );

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* --- Liste d'amis --- */}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendItem}
            onLongPress={() => handleRemoveFriend(item.id)}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={[styles.username, { color: currentColors.text }]}>
              {item.username}
            </Text>
          </TouchableOpacity>
        )}
        refreshing={loading}
        onRefresh={fetchAllUsers}
        ItemSeparatorComponent={renderSeparator}
        ListFooterComponent={renderSeparator}
      />

      {/* --- Liste de demandes reçues --- */}
      <Text style={[styles.title, { color: currentColors.text }]}>
        {t('friends.requestsTitle')}
      </Text>
      <FlatList
        data={friendRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={[styles.username, { color: currentColors.text }]}>{item.username}</Text>
            {/* Bouton pour accepter la demande */}
            <TouchableOpacity
              onPress={() => handleAcceptFriend(item.id)}
              style={[styles.acceptButton, { backgroundColor: currentColors.tabBackground }]}
            >
              <Text style={[styles.acceptButtonText, { color: currentColors.text }]}>
                {t('friends.accept')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={renderSeparator}
        ListFooterComponent={renderSeparator}
        ListHeaderComponent={renderSeparator}
      />

      {/* --- Bouton d'ajout d'ami --- */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: currentColors.addButton }]}
        onPress={() => {
          setModalVisible(true);
          fetchAllUsers();
        }}
      >
        <Text style={[styles.addButtonText, { color: currentColors.text }]}>
          {t('friends.addFriend')}
        </Text>
      </TouchableOpacity>

      {/* --- Modal de recherche d'utilisateurs --- */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: currentColors.background }]}>
          <TextInput
            style={[
              styles.searchInput,
              { borderColor: currentColors.text, color: currentColors.text },
            ]}
            placeholder={t('friends.searchPlaceholder')}
            placeholderTextColor={currentColors.icon}
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              // isPending => savoir si j'ai déjà mis mon UID dans friendRequests de l'item
              const isPending = Array.isArray(item.friendRequests)
                ? item.friendRequests.includes(user.uid)
                : false;

              return (
                <View style={styles.userItem}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  <Text style={[styles.username, { color: currentColors.text }]}>
                    {item.username}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (isPending) {
                        // J'annule la demande => je retire mon UID de friendRequests du friend
                        handleCancelRequest(item.id);
                      } else {
                        // J'ajoute => je mets mon UID dans friendRequests du friend
                        handleAddFriend(item.id);
                      }
                    }}
                    style={[styles.addFriendButton, { backgroundColor: currentColors.addButton }]}
                  >
                    <Text style={[styles.addFriendButtonText, { color: currentColors.text }]}>
                      {isPending ? t('friends.requestPending') : t('friends.add')}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            ItemSeparatorComponent={renderSeparator}
            ListFooterComponent={() => (
              <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />
            )}
            ListHeaderComponent={() => (
              <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />
            )}
          />
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: currentColors.addButton }]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: currentColors.text }]}>
              {t('friends.close')}
            </Text>
          </TouchableOpacity>
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    flex: 1,
    fontSize: 16,
  },
  addButton: {
    padding: 15,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 15,
    margin: 10,
  },
  addFriendButton: {
    padding: 10,
    borderRadius: 5,
  },
  addFriendButtonText: {
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
  acceptButton: {
    padding: 10,
    borderRadius: 5,
  },
  acceptButtonText: {
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
  },
  title: {
    paddingBottom: 10,
    marginTop: 10,
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

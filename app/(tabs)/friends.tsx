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
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

export default function Friends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const currentColors = Colors[colorScheme || 'light'];
  const { t } = useTranslation();

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData && userData.friends) {
        const friendsPromises = userData.friends.map((friendId) =>
          getDoc(doc(db, 'users', friendId))
        );

        const friendsDocs = await Promise.all(friendsPromises);
        const friendsList = friendsDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFriends(friendsList);
      }
    } catch (error) {
      console.error(t('friends.fetchError'), error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData && userData.friendRequests) {
        const requestsPromises = userData.friendRequests.map((friendId) =>
          getDoc(doc(db, 'users', friendId))
        );

        const requestsDocs = await Promise.all(requestsPromises);
        const requestsList = requestsDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFriendRequests(requestsList);
      }
    } catch (error) {
      console.error(t('friends.requestsFetchError'), error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(allUsers.filter((u) => u.id !== user.uid));
    } catch (error) {
      console.error(t('friends.usersFetchError'), error);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      const friendDocRef = doc(db, 'users', friendId);
      await updateDoc(friendDocRef, {
        friendRequests: arrayUnion(user.uid),
      });

      Alert.alert(t('friends.requestSentTitle'), t('friends.requestSentMessage'));
      fetchAllUsers();
    } catch (error) {
      console.error(t('friends.addFriendError'), error);
    }
  };

  const handleAcceptFriend = async (friendId) => {
    try {
      const currentUserDocRef = doc(db, 'users', user.uid);
      const friendDocRef = doc(db, 'users', friendId);

      await updateDoc(currentUserDocRef, {
        friends: arrayUnion(friendId),
        friendRequests: arrayRemove(friendId),
      });

      await updateDoc(friendDocRef, {
        friends: arrayUnion(user.uid),
      });

      Alert.alert(t('friends.friendAddedTitle'), t('friends.friendAddedMessage'));
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error(t('friends.acceptFriendError'), error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) &&
      !friends.some((friend) => friend.id === u.id)
  );

  const renderSeparator = () => (
    <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />
  );

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={[styles.username, { color: currentColors.text }]}>{item.username}</Text>
          </View>
        )}
        refreshing={loading}
        onRefresh={fetchFriends}
        ItemSeparatorComponent={renderSeparator}
        ListFooterComponent={renderSeparator}
      />

      <Text style={[styles.title, { color: currentColors.text }]}>{t('friends.requestsTitle')}</Text>
      <FlatList
        data={friendRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={[styles.username, { color: currentColors.text }]}>{item.username}</Text>
            <TouchableOpacity
              onPress={() => handleAcceptFriend(item.id)}
              style={[styles.acceptButton, { backgroundColor: currentColors.tint }]}
            >
              <Text style={[styles.acceptButtonText, { color: currentColors.text }]}>{t('friends.accept')}</Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={renderSeparator}
      />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: currentColors.addButton }]}
        onPress={() => {
          setModalVisible(true);
          fetchAllUsers();
        }}
      >
        <Text style={[styles.addButtonText, { color: currentColors.text }]}>{t('friends.addFriend')}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: currentColors.background }]}>
          <TextInput
            style={[styles.searchInput, { borderColor: currentColors.text, color: currentColors.text }]}
            placeholder={t('friends.searchPlaceholder')}
            placeholderTextColor={currentColors.icon}
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <Text style={[styles.username, { color: currentColors.text }]}>{item.username}</Text>
                <TouchableOpacity
                  onPress={() => handleAddFriend(item.id)}
                  style={[styles.addFriendButton, { backgroundColor: currentColors.addButton }]}
                >
                  <Text style={[styles.addFriendButtonText, { color: currentColors.text }]}>{t('friends.add')}</Text>
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={renderSeparator}
            ListFooterComponent={() => <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />} // Ajouter un séparateur en bas
            ListHeaderComponent={() => <View style={[styles.separator, { backgroundColor: currentColors.separator }]} />} // Ajouter un séparateur en bas
          />
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: currentColors.addButton }]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: currentColors.text }]}>{t('friends.close')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
    color: '#fff',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
  },
});

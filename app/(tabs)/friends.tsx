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
import { useAuth } from '@/contexts/AuthContext'; // Contexte pour l'utilisateur connecté
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig'; // Remplacez firestore par db

export default function Friends() {
  const { user } = useAuth(); // L'utilisateur connecté
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Récupérer les amis de l'utilisateur
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
      console.error('Erreur lors de la récupération des amis :', error);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les demandes d'amis
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
      console.error('Erreur lors de la récupération des demandes d\'amis :', error);
    }
  };

  // Récupérer tous les utilisateurs, sauf l'utilisateur connecté
  const fetchAllUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id, // ID du document
        ...doc.data(), // Les données du document
      }));

      // Exclure l'utilisateur connecté
      setUsers(allUsers.filter((u) => u.id !== user.uid));
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs :', error);
    }
  };

  // Envoyer une demande d'ami
  const handleAddFriend = async (friendId) => {
    try {
      const friendDocRef = doc(db, 'users', friendId);
      await updateDoc(friendDocRef, {
        friendRequests: arrayUnion(user.uid),
      });

      Alert.alert('Demande envoyée', 'Votre demande d\'ami a été envoyée.');
      fetchAllUsers();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande d\'ami :', error);
    }
  };

  // Accepter une demande d'ami
  const handleAcceptFriend = async (friendId) => {
    try {
      const currentUserDocRef = doc(db, 'users', user.uid);
      const friendDocRef = doc(db, 'users', friendId);

      // Mise à jour de la liste des amis
      await updateDoc(currentUserDocRef, {
        friends: arrayUnion(friendId),
        friendRequests: arrayRemove(friendId),
      });

      await updateDoc(friendDocRef, {
        friends: arrayUnion(user.uid),
      });

      Alert.alert('Ami ajouté', 'Vous avez accepté la demande.');
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la demande d\'ami :', error);
    }
  };

  // Filtrer les utilisateurs pour la recherche
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) &&
      !friends.some((friend) => friend.id === u.id) // Vérifie si l'utilisateur n'est pas déjà un ami
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Amis</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} onError={() => console.log(`Erreur de chargement pour ${item.avatar}`)}/>
            <Text style={styles.username}>{item.username}</Text>
          </View>
        )}
        refreshing={loading}
        onRefresh={fetchFriends}
      />

      <Text style={styles.title}>Demandes d'amis</Text>
      <FlatList
        data={friendRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.username}>{item.username}</Text>
            <TouchableOpacity
              onPress={() => handleAcceptFriend(item.id)}
              style={styles.acceptButton}
            >
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setModalVisible(true);
          fetchAllUsers();
        }}
      >
        <Text style={styles.addButtonText}>Ajouter des amis</Text>
      </TouchableOpacity>

      {/* Modal pour afficher la liste des utilisateurs */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur"
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <Text style={styles.username}>{item.username}</Text>
                <TouchableOpacity
                  onPress={() => handleAddFriend(item.id)}
                  style={styles.addFriendButton}
                >
                  <Text style={styles.addFriendButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  addFriendButton: {
    backgroundColor: '#0a7ea4',
    padding: 10,
    borderRadius: 5,
  },
  addFriendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#0a7ea4',
    padding: 10,
    borderRadius: 5,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

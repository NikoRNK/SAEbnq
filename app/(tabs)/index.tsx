import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { client } from '@/streamConfig';
import { fetchStreamToken } from '@/utils/stream';

export default function Home() {
  const { user, login } = useAuth(); // Récupère `login` pour mettre à jour le contexte
  const [friends, setFriends] = useState([]);
  const router = useRouter();

  // Charger les amis depuis Firestore
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
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des amis :', error);
      }
    };

    fetchFriends();
  }, [user]);

  // Vérifier ou créer un canal entre deux utilisateurs
  const handleChat = async (friend: any) => {
    if (!user) return;

    try {
      // Vérifier si un token est disponible
      if (!user.streamToken) {
        console.log('Aucun token Stream trouvé. Récupération d\'un nouveau token...');
        const newToken = await fetchStreamToken(user.uid);
        login({ ...user, streamToken: newToken }); // Met à jour le contexte utilisateur
      }

      // Connecter l'utilisateur à GetStream
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

      // Vérifier ou créer le canal
      const channelId = [user.uid, friend.id].sort().join('-'); // ID unique basé sur les deux utilisateurs
      const chatChannel = client.channel('messaging', channelId, {
        name: `Chat with ${friend.username}`,
        members: [user.uid, friend.id], // Ajouter les deux utilisateurs comme membres
      });

      await chatChannel.watch(); // Surveiller ou créer le canal
      router.push({
        pathname: `/chat/${channelId}`,
        params: { title: friend.username },
      });
    } catch (error) {
      console.error('Erreur lors de la création du canal :', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Amis</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendItem}
            onPress={() => handleChat(item)} // Naviguer ou créer un chat
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.username}>{item.username}</Text>
          </TouchableOpacity>
        )}
      />
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
});

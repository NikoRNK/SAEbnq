import React, { useEffect, useState, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useRouter } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig'; // Assurez-vous que ce chemin est correct
import axios from 'axios';
import client from '../../streamConfig';
import uuid from 'react-native-uuid';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [channel, setChannel] = useState<any>(null); // Référence au canal Stream Chat

  useEffect(() => {
    const initializeChat = async () => {
      if (!user && !loading) {
        console.log('Utilisateur non connecté, redirection vers la connexion.');
        router.replace('/login');
        return;
      }

      if (user) {
        console.log('Initialisation du chat pour l\'utilisateur :', user);

        try {
          // Récupérer un token sécurisé depuis votre API Vercel
          const response = await axios.post('https://mke-1o61p0gcw-yanns-projects-d91848b9.vercel.app/generate-token', {
            userId: user.uid,
          });
          const token = response.data.token;

          console.log('Token sécurisé reçu :', token);

          // Connecter l'utilisateur à Stream Chat avec le token
          await client.connectUser(
            {
              id: user.uid,
              name: user.username,
              image: `https://getstream.io/random_svg/?id=${user.uid}&name=${user.username}`,
            },
            token
          );

          // Rejoindre ou créer un canal "general"
          const newChannel = client.channel('messaging', 'general', {
            name: 'General Chat',
          });

          await newChannel.watch();
          setChannel(newChannel);

          console.log('Canal surveillé :', newChannel.state);

          // Charger les messages existants
          setMessages(
            newChannel.state.messages.map((msg) => ({
              _id: msg.id,
              text: msg.text,
              createdAt: new Date(msg.created_at),
              user: {
                _id: msg.user.id,
                name: msg.user.name,
                avatar: msg.image,
              },
              image: msg.image || undefined,
            }))
          );

          // Écouter les nouveaux messages
          newChannel.on('message.new', (event: any) => {
            const newMsg = event.message;
            setMessages((previousMessages) =>
              GiftedChat.append(previousMessages, {
                _id: newMsg.id,
                text: newMsg.text,
                createdAt: new Date(newMsg.created_at),
                user: {
                  _id: newMsg.user.id,
                  name: newMsg.user.name,
                  avatar: newMsg.user.image,
                },
                image: newMsg.image || undefined,
              })
            );
          });
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du chat :', error);
        }
      }
    };

    initializeChat();

    return () => {
      if (channel) {
        channel.off('message.new');
        client.disconnectUser().catch((err) =>
          console.error('Erreur lors de la déconnexion de Stream Chat :', err)
        );
      }
    };
  }, [user, loading]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      if (!channel) {
        console.warn('Canal non initialisé.');
        return;
      }

      const [message] = newMessages;

      try {
        await channel.sendMessage({
          text: message.text,
          user: {
            id: user.uid,
            name: user.username,
            image: `https://getstream.io/random_svg/?id=${user.uid}&name=${user.username}`,
          },
        });
        console.log('Message envoyé avec succès :', message);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message :', error);
      }
    },
    [channel, user]
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin des permissions pour accéder à votre galerie.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;

      try {
        const blob = await (await fetch(imageUri)).blob();
        const storageRef = ref(storage, `images/${uuid.v4()}`);
        await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(storageRef);

        // Envoyer le message contenant l'image
        await channel.sendMessage({
          text: '',
          image: imageUrl,
          user: {
            id: user.uid,
            name: user.username,
            image: `https://getstream.io/random_svg/?id=${user.uid}&name=${user.username}`,
          },
        });

        console.log('Image envoyée avec succès :', imageUrl);
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'image :', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <GiftedChat
      messages={messages}
      onSend={(newMessages) => onSend(newMessages)}
      user={{
        _id: user.uid,
        name: user.username,
        avatar: `https://getstream.io/random_svg/?id=${user.uid}&name=${user.username}`,
      }}
      renderUsernameOnMessage
      renderActions={() => (
        <TouchableOpacity onPress={pickImage} style={{ marginLeft: 10 }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 30, height: 30 }}
          />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

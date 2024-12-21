import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, TouchableOpacity, Text } from 'react-native';
import { GiftedChat, IMessage, Send } from 'react-native-gifted-chat';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { client } from '@/streamConfig'; // Configuration GetStream
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import Feather from '@expo/vector-icons/Feather';

export default function Chat() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>(); // Récupérer les paramètres
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [channel, setChannel] = useState<any>(null); // Référence au canal Stream
  const { user, loading } = useAuth(); // Récupérer `user` et `loading`
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const currentColors = Colors[colorScheme || 'light'];
  const { t } = useTranslation();

  useEffect(() => {
    if (title) {
      navigation.setOptions({
        title: title,
      });
    }

    const setupChat = async () => {
      try {
        if (!user || !user.streamToken) {
          console.error('Utilisateur ou token Stream non disponible.');
          return;
        }

        // Connecter l'utilisateur à GetStream
        if (!client.user) {
          await client.connectUser(
            {
              id: user.uid,
              name: user.username,
              image: `https://getstream.io/random_svg/?id=${user.uid}&name=${user.username}`,
            },
            user.streamToken // Utiliser `streamToken` depuis l'utilisateur
          );
        }

        // Rejoindre le canal
        const chatChannel = client.channel('messaging', id);
        await chatChannel.watch();
        setChannel(chatChannel);

        // Charger les messages existants
        const loadedMessages = chatChannel.state.messages
          .map((msg: any) => ({
            _id: msg.id,
            text: msg.text,
            createdAt: new Date(msg.created_at),
            user: {
              _id: msg.user.id,
              name: msg.user.name,
              avatar: msg.image,
            },
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Trier les messages par date décroissante

        setMessages(loadedMessages);

        // Marquer les messages comme lus
        await chatChannel.markRead();

        // Écouter les nouveaux messages en temps réel
        chatChannel.on('message.new', (event: any) => {
          const newMessage = {
            _id: event.message.id,
            text: event.message.text,
            createdAt: new Date(event.message.created_at),
            user: {
              _id: event.message.user.id,
              name: event.message.user.name,
              avatar: event.message.user.image,
            },
          };
          setMessages((prevMessages) =>
            GiftedChat.append(prevMessages, [newMessage])
          );
        });
      } catch (error) {
        console.error('Erreur lors de la configuration du chat :', error);
      }
    };

    if (user && id && !loading) {
      setupChat();
    }

    return () => {
      if (channel) {
        channel.off('message.new');
        client.disconnectUser();
      }
    };
  }, [id, user, loading]);

  const handleSend = async (newMessages: IMessage[] = []) => {
    try {
      if (!channel) return;

      const [message] = newMessages;

      // Envoyer un message
      await channel.sendMessage({
        text: message.text,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message :', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={(messages) => handleSend(messages)}
          user={{
            _id: user?.uid,
            name: user?.username,
            avatar: `https://getstream.io/random_svg/?id=${user?.uid}&name=${user?.username}`,
          }}
          placeholder={t('chat.placeholder')} // Utilise i18n pour le texte
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

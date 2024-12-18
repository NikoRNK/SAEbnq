// app/register.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { doc, setDoc } from 'firebase/firestore';
import client from '../streamConfig';
import { fetch } from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  const handleRegister = async () => {
    if (!username.trim()) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur est requis');
      return;
    }

    try {
      // Créer l'utilisateur avec email et mot de passe
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Utilisateur enregistré:', user);

      // Stocker le nom d'utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: username.trim(),
        email: email.trim(),
        createdAt: new Date(),
      });
      console.log('Données utilisateur stockées dans Firestore');

      // Obtenir un token Stream depuis le backend
      const response = await fetch('https://us-central1-your-project.cloudfunctions.net/generateStreamToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        throw new Error('Échec de la récupération du token Stream');
      }

      const data = await response.json();
      const token = data.token;
      console.log('Token Stream reçu:', token);

      // Connecter l'utilisateur avec le token sécurisé
      await client.connectUser(
        {
          id: user.uid,
          name: username.trim(),
          image: `https://getstream.io/random_svg/?id=${user.uid}&name=${username.trim()}`,
        },
        token
      );
      console.log('Utilisateur connecté à Stream');

      Alert.alert('Succès', 'Inscription réussie');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="S'inscrire" onPress={handleRegister} />
      <Button title="Se connecter" onPress={() => router.push('/login')} color="gray" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});

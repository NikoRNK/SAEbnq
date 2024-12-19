// app/login.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import client from '../streamConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogin = async () => {
    try {
      // Authentifier l'utilisateur avec email et mot de passe
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Utilisateur connecté:', user);

      // Récupérer les données utilisateur depuis Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('Données utilisateur non trouvées dans Firestore');
      }
      const userData = userDoc.data();

      // Connecter l'utilisateur avec le token sécurisé
      await client.connectUser(
        {
          id: user.uid,
          name: userData.username,
          image: `https://getstream.io/random_svg/?id=${user.uid}&name=${userData.username}`,
        },
        token
      );
      console.log('Utilisateur connecté à Stream');

      Alert.alert('Succès', 'Connexion réussie');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
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
      <Button title="Se connecter" onPress={handleLogin} />
      <Button title="S'inscrire" onPress={() => router.push('/register')} color="gray" />
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

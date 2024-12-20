import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebaseConfig';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { fetchStreamToken } from '@/utils/stream';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!username.trim()) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur est requis');
      return;
    }

    try {
      // Créer un utilisateur avec Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Stocker les données utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: username.trim(),
        email: email.trim(),
        createdAt: new Date(),
      });

      // Récupérer le token Stream
      const token = await fetchStreamToken(user.uid);

      // Mettre à jour le contexte avec l'utilisateur et le token
      login({ username: username.trim(), email: email.trim(), uid: user.uid }, token);

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

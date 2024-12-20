import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebaseConfig';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { fetchStreamToken } from '@/utils/stream'; // Fonction utilitaire pour récupérer le token
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/streamConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth(); // Utilisation du contexte pour gérer l'état global

  const handleLogin = async () => {
    try {
      // Vérifiez si le client est initialisé avant de déconnecter
      if (client && client.user) {
        console.log('Déconnexion de l\'utilisateur précédent...');
        await client.disconnectUser();
      } else {
        console.log('Aucun utilisateur connecté sur le client Stream.');
      }
  
      // Authentifier l'utilisateur avec Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Récupérer les données utilisateur depuis Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('Données utilisateur non trouvées dans Firestore');
      }
      const userData = userDoc.data();
  
      // Récupérer le token Stream
      const token = await fetchStreamToken(user.uid);
      console.log(token);
  
      // Connecter l'utilisateur à GetStream
      await client.connectUser(
        {
          id: user.uid,
          name: userData.username,
          image: `https://getstream.io/random_svg/?id=${user.uid}&name=${userData.username}`,
        },
        token
      );
  
      // Mettre à jour le contexte utilisateur
      login({ ...userData, uid: user.uid }, token);
  
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

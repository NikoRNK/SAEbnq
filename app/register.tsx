import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert(t('register.success'));
      router.replace('/(tabs)'); // Redirige vers les onglets après inscription
    } catch (error: any) {
      Alert.alert(t('register.error'), error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#1c1c1c' : '#f5f5f5' }]}>
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>{t('register.title')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff', color: colorScheme === 'dark' ? '#fff' : '#000' }]}
        placeholder={t('register.email')}
        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#666'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff', color: colorScheme === 'dark' ? '#fff' : '#000' }]}
        placeholder={t('register.password')}
        placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#666'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={t('register.button')} onPress={handleRegister} />
      <Button
        title={t('register.loginLink')}
        onPress={() => router.push('/login')}
        color="gray"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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

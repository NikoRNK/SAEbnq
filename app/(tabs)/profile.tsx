import React from 'react';
import { StyleSheet, Text, View, Alert, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/useColorScheme'; // Import du hook pour le thème
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

export default function Porfile() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme(); // Détection du thème (clair ou sombre)
  const router = useRouter();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert(t('logout.success'));
      router.replace('/login'); // Redirige vers la page de connexion
    } catch (error: any) {
      Alert.alert(t('logout.error'), error.message);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1c1c1c' : '#f5f5f5' }, // Style dynamique
      ]}
    >
      <Button title={t('logout.button')} onPress={handleLogout} />
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
        {t('welcome')}
      </Text>
      <Button title={t('clickMe')} onPress={() => alert(t('welcome'))} />
      <View style={styles.buttons}>
        <Button title="English" onPress={() => changeLanguage('en')} />
        <Button title="Français" onPress={() => changeLanguage('fr')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttons: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

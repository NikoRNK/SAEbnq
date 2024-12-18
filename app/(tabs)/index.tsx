import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/useColorScheme'; // Import du hook pour le thème

export default function Home() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme(); // Détection du thème (clair ou sombre)

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1c1c1c' : '#f5f5f5' }, // Style dynamique
      ]}
    >
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

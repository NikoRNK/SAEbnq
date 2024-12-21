import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // Importer le hook de traduction

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation(); // Initialiser i18n pour les traductions
  const currentColors = Colors[colorScheme || 'light']; // Détecter les couleurs dynamiques

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentColors.tint, // Couleur active des icônes dans la TabBar
        tabBarInactiveTintColor: currentColors.icon, // Couleur inactive des icônes
        tabBarStyle: {
          backgroundColor: currentColors.tabBackground, // Couleur de fond dynamique pour la TabBar
          borderTopWidth: 0, // Supprimer la bordure si nécessaire
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: currentColors.headerBackground, // Couleur de fond dynamique pour le header
        },
        headerTitleStyle: {
          color: currentColors.text, // Couleur dynamique du texte dans le header
        },
      }}
    >
      <Tabs.Screen
        name="friends"
        options={{
          title: t('friends.title'), // Titre du header de l'écran
          tabBarLabel: t('friends.tabBarLabel'), // Étiquette pour la TabBar
          tabBarIcon: ({ color }) => <FontAwesome6 name="users" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('messages.title'), // Titre du header de l'écran
          tabBarLabel: t('messages.tabBarLabel'), // Étiquette pour la TabBar
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'), // Titre du header de l'écran
          tabBarLabel: t('profile.tabBarLabel'), // Étiquette pour la TabBar
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="face-man-profile" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

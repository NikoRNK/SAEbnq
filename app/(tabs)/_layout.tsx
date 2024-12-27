import { Tabs } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, Alert } from 'react-native'; // Importer Alert pour la confirmation
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const currentColors = Colors[colorScheme || 'light'];
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error: any) {
      alert(`${t('logout.error')}: ${error.message}`);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      t('logout.confirmTitle'), // Titre de la boîte de dialogue
      t('logout.confirmMessage'), // Message de confirmation
      [
        {
          text: t('common.cancel'), // Texte pour le bouton d'annulation
          style: 'cancel', // Style du bouton
        },
        {
          text: t('common.confirm'), // Texte pour le bouton de confirmation
          onPress: handleLogout, // Action à effectuer si l'utilisateur confirme
        },
      ]
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentColors.tint,
        tabBarInactiveTintColor: currentColors.icon,
        tabBarStyle: {
          backgroundColor: currentColors.tabBackground,
          borderTopWidth: 0,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: currentColors.headerBackground,
        },
        headerTitleStyle: {
          color: currentColors.text,
        },
      }}
    >
      <Tabs.Screen
        name="friends"
        options={{
          title: t('friends.title'),
          tabBarLabel: t('friends.tabBarLabel'),
          tabBarIcon: ({ color }) => <FontAwesome6 name="users" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('messages.title'),
          tabBarLabel: t('messages.tabBarLabel'),
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarLabel: t('profile.tabBarLabel'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="face-man-profile" size={24} color={color} />,
          headerRight: () => (
            <TouchableOpacity onPress={confirmLogout} style={{ paddingRight: 10 }}>
              <Ionicons name="log-out-outline" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}

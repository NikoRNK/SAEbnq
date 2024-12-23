import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  StyleSheet,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebaseConfig';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { fetchStreamToken } from '@/utils/stream';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/streamConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth(); // Utilisation du contexte pour gérer l'état global
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useTranslation();

  const handleLogin = async () => {
    try {
      if (client && client.user) {
        console.log('Déconnexion de l\'utilisateur précédent...');
        await client.disconnectUser();
      } else {
        console.log('Aucun utilisateur connecté sur le client Stream.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('Données utilisateur non trouvées dans Firestore');
      }
      const userData = userDoc.data();

      const token = await fetchStreamToken(user.uid);
      console.log(token);

      await client.connectUser(
        {
          id: user.uid,
          name: userData.username,
          image: `https://getstream.io/random_svg/?id=${user.uid}&name=${userData.username}`,
        },
        token
      );

      login({ ...userData, uid: user.uid }, token);

      Alert.alert('Succès', 'Connexion réussie');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.main}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
          />
          <Text style={[styles.title, { color: colors.text }]}>{t('login.title')}</Text>
        </View>

        <View style={styles.main}>
          <Text style={[styles.subtitle, { color: colors.icon }]}>{t('login.subtitle')}</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.icon, color: colors.text }]}
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={colors.icon}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.icon, color: colors.text }]}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.icon}
          />
        </View>

        <TouchableOpacity style={styles.main} onPress={handleLogin}>
          <LinearGradient
            colors={[colors.tint, colors.icon]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>{t('login.button')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.separator}>
          <View style={[styles.line, { backgroundColor: colors.separator }]} />
          <Text style={[styles.separatorText, { color: colors.text }]}>{t('common.or')}</Text>
          <View style={[styles.line, { backgroundColor: colors.separator }]} />
        </View>

        <TouchableOpacity onPress={() => Alert.alert(t('login.googleAlert'))}>
          <Image
            source={require('../assets/images/Google_G_logo.png')}
            style={styles.googleIcon}
          />
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: colors.text }]}>
          {t('login.noAccount')}{' '}
          <Text style={[styles.linkText, { color: colors.tint }]} onPress={() => router.replace('/register')}>
            {t('login.registerLink')}
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  main: {
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    marginTop: 50,
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonGradient: {
    width: '50%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '90%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  googleIcon: {
    width: 40,
    height: 40,
  },
  footerText: {
    fontSize: 14,
    marginTop: 20,
  },
  linkText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
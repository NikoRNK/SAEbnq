import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      welcome: "Welcome to Expo Router!",
      clickMe: "Click Me",
      login: {
        title: "Login",
        email: "Email Address",
        password: "Password",
        button: "Sign In",
        registerLink: "Create an account",
        success: "Login successful!",
        error: "Login error",
      },
      register: {
        title: "Register",
        username: "Username",
        email: "Email Address",
        password: "Password",
        button: "Sign Up",
        loginLink: "Back to login",
        success: "Registration successful!",
        error: "Registration error",
        usernameRequired: "Username is required.",
        usernameError: "Username error"
      },
      logout: {
        button: "Log Out",
        success: "You have successfully logged out.",
        error: "Error during logout.",
      },
      friends: {
        title: "Friends",
        tabBarLabel: "Friends"
      },
      messages: {
        title: "Chats",
        tabBarLabel: "Chats"
      },
      profile: {
        title: "Profile",
        tabBarLabel: "Me"
      },
    },
  },
  fr: {
    translation: {
      welcome: "Bienvenue sur Expo Router !",
      clickMe: "Cliquez-moi",
      login: {
        title: "Connexion",
        email: "Adresse e-mail",
        password: "Mot de passe",
        button: "Se connecter",
        registerLink: "Créer un compte",
        success: "Connexion réussie !",
        error: "Erreur de connexion",
      },
      register: {
        title: "Inscription",
        username: "Nom d'utilisateur",
        email: "Adresse e-mail",
        password: "Mot de passe",
        button: "S'inscrire",
        loginLink: "Retour à la connexion",
        success: "Inscription réussie !",
        error: "Erreur d'inscription",
        usernameRequired: "Le nom d'utilisateur est requis.",
        usernameError: "Erreur de nom d'utilisateur"
      },
      logout: {
        button: "Déconnexion",
        success: "Vous avez été déconnecté avec succès.",
        error: "Erreur lors de la déconnexion.",
      },
      friends: {
        title: "Amis",
        tabBarLabel: "Amis"
      },
      messages: {
        title: "Discussions",
        tabBarLabel: "Discussions"
      },
      profile: {
        title: "Profil",
        tabBarLabel: "Moi"
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.locale.split('-')[0], // Langue détectée
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // Pas besoin d'échapper dans React
  },
});

export default i18n;

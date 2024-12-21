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
        usernameError: "Username error",
      },
      logout: {
        button: "Log Out",
        success: "You have successfully logged out.",
        error: "Error during logout.",
      },
      friends: {
        title: "Friends",
        tabBarLabel: "Friends",
        fetchError: "Error fetching friends.",
        requestsTitle: "Friend Requests",
        accept: "Accept",
        addFriend: "Add Friend",
        requestSentTitle: "Request Sent",
        requestSentMessage: "Your friend request has been sent.",
        friendAddedTitle: "Friend Added",
        friendAddedMessage: "You have successfully added this friend.",
        searchPlaceholder: "Search a user",
        close: "Close",
      },
      messages: {
        title: "Chats",
        tabBarLabel: "Chats",
        fetchError: "Error fetching messages.",
        typePlaceholder: "Type a message...",
      },
      profile: {
        title: "Profile",
        tabBarLabel: "Me",
      },
      common: {
        close: "Close",
        searchPlaceholder: "Search...",
      },
      chat: {
        placeholder: "Type a message",
        sendButton: "Send",
        loadEarlierMessages: "Load earlier messages",
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
        usernameError: "Erreur de nom d'utilisateur",
      },
      logout: {
        button: "Déconnexion",
        success: "Vous avez été déconnecté avec succès.",
        error: "Erreur lors de la déconnexion.",
      },
      friends: {
        title: "Amis",
        tabBarLabel: "Amis",
        fetchError: "Erreur lors de la récupération des amis.",
        requestsTitle: "Demandes d'amis",
        accept: "Accepter",
        addFriend: "Ajouter un ami",
        requestSentTitle: "Demande envoyée",
        requestSentMessage: "Votre demande d'ami a été envoyée.",
        friendAddedTitle: "Ami ajouté",
        friendAddedMessage: "Vous avez ajouté cet ami avec succès.",
        searchPlaceholder: "Rechercher un utilisateur",
        close: "Fermer",
      },
      messages: {
        title: "Discussions",
        tabBarLabel: "Discussions",
        fetchError: "Erreur lors de la récupération des messages.",
        typePlaceholder: "Écrire un message...",
      },
      profile: {
        title: "Profil",
        tabBarLabel: "Moi",
      },
      common: {
        close: "Fermer",
        searchPlaceholder: "Rechercher...",
      },
      chat: {
        placeholder: "Écrivez un message",
        sendButton: "Envoyer",
        loadEarlierMessages: "Charger les messages précédents"
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.locale.split('-')[0],
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

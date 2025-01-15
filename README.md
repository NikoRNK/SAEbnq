# Projet Expo avec Backend Stream Chat

Ce projet est une application React Native basée sur Expo, intégrant un backend déployé sur Vercel pour la gestion des tokens Stream Chat.

## 🚀 Fonctionnalités

- **Chat en Temps Réel** avec [Stream Chat](https://getstream.io/chat/).
- **Gestion des Tokens Sécurisés** via un backend Express déployé sur Vercel.
- **Envoi d'Images** avec Firebase Storage.
- **Connexion et Inscription** avec Firebase Authentication.

## ⚙️ Installation et Lancement

### Prérequis

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/)
- [Git](https://git-scm.com/)
- Un compte [Stream Chat](https://getstream.io/)

### Étapes

1. Clonez ce dépôt :

   ```bash
   git clone https://github.com/NikoRNK/SAEbnq
   cd REPO
   ```

2. Installez les dépendances du frontend :

   ```bash
   npm install
   ```

3. Installez les dépendances du backend :

   ```bash
   cd backend
   npm install
   cd ..
   ```

4. Configurez vos clés dans les fichiers suivants :

   - Créer un fichier ./.env pour Firebase et ajouter les variables d'environnements
     ```
     FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
     FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
     FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
     FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
     FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
     FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
     STREAM_API_KEY=YOUR_STREAM_API_KEY
     STREAM_API_SECRET=YOUR_STREAM_API_SECRET
     ```
   - `Sur Vercel configurer les variables d'environnements` pour Stream Chat :
     ```
     STREAM_API_KEY=YOUR_STREAM_API_KEY
     STREAM_API_SECRET=YOUR_STREAM_API_SECRET
     ```

5. Déployez le backend sur Vercel :

   ```bash
   cd backend
   vercel login
   vercel --prod
   ```

6. Lancez l'application Expo :

   ```bash
   npx expo start #--tunnel" si l'application ne ce lance pas
   ```

## 🌐 Déploiement

- **Backend :** Déployé sur [Vercel](https://vercel.com/).
- **Frontend :** Fonctionne avec Expo Go.

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [Stream Chat Documentation](https://getstream.io/chat/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)

## 🔧 Auteur

- **Noms :** Yann DCS, Niko RNK, Michée CRQ, Elodie JDN

---

### 🖋️ TODO

- Ajouter la gestion des notifications push.
- Améliorer le design avec des composants personnalisés.
- Ajouter des tests unitaires.


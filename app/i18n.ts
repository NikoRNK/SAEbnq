import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  en: {
    translation: {
      welcome: "Welcome to Expo Router!",
      clickMe: "Click Me",
    },
  },
  fr: {
    translation: {
      welcome: "Bienvenue sur Expo Router !",
      clickMe: "Cliquez-moi",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.locale.split('-')[0], // Langue détectée
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

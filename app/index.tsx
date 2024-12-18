import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Rediriger vers les onglets si connecté
        router.replace('/(tabs)');
      } else {
        // Rediriger vers la connexion si non connecté
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  return null; // Affiche rien pendant la redirection
}

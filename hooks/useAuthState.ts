import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { fetchStreamToken } from '@/utils/stream';

interface User {
  uid: string;
  email: string;
  username: string;
  streamToken?: string; // Ajout du token
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser);
      if (firebaseUser) {
        try {
          // Récupère les données utilisateur depuis Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Récupérer le token GetStream
            const streamToken = await fetchStreamToken(firebaseUser.uid);

            console.log('User data from Firestore:', userData);
            console.log('Stream Token:', streamToken);

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: userData.username,
              streamToken, // Ajout du token à l'état utilisateur
            });
          } else {
            console.log('No user document found for UID:', firebaseUser.uid);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

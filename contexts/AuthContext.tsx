import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { fetchStreamToken } from '@/utils/stream';

interface User {
  uid: string;
  email: string;
  username?: string;
  streamToken?: string; // Inclure le token dans l'utilisateur
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, token: string) => void; // Ajout de l'utilisateur manuellement
  logout: () => Promise<void>; // Déconnexion utilisateur
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialisation et synchronisation avec Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          // Récupérer les données utilisateur depuis Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Récupérer le token Stream
            const streamToken = await fetchStreamToken(firebaseUser.uid);

            // Mettre à jour l'utilisateur avec toutes les informations
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: userData?.username || '',
              streamToken,
            });
          } else {
            console.warn('Utilisateur non trouvé dans Firestore.');
            setUser(null);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur :', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fonction manuelle pour mettre à jour l'utilisateur
  const login = (user: User, token: string) => {
    setUser({ ...user, streamToken: token });
  };

  // Déconnexion utilisateur
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

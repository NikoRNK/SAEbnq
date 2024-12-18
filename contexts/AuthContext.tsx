// contexts/AuthContext.tsx
import React, { createContext, useContext } from 'react';
import { useAuthState } from '@/hooks/useAuthState';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authState = useAuthState();
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

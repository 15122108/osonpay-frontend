import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { api, Auth } from '../services/api';

interface User {
  phone: string;
  fullName?: string;
  hasPin?: boolean;
  balance?: number;
  language?: string;
  kycStatus?: string;
  [key: string]: any;
}

interface AuthCtx {
  loading: boolean;
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string, user: User, hasPin: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setHasPin: (val: boolean) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading]     = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser]           = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [token, savedUser] = await Promise.all([
          Auth.getToken(),
          Auth.getUser(),
        ]);
        if (token && savedUser) {
          setIsLoggedIn(true);
          setUser(savedUser);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (token: string, userData: User, hasPin: boolean) => {
    const u = { ...userData, hasPin };
    await Auth.save(token, u);
    setUser(u);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    await Auth.clear();
    setUser(null);
    setIsLoggedIn(false);
    router.replace('/(auth)/login');
  }, []);

  const setHasPin = useCallback((val: boolean) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, hasPin: val };
      Auth.getToken().then(token => {
        if (token) Auth.save(token, updated);
      });
      return updated;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      const updated = { ...user, ...profile };
      setUser(updated);
      const token = await Auth.getToken();
      if (token) await Auth.save(token, updated);
    } catch {}
  }, [user]);

  return (
    <Ctx.Provider value={{ loading, isLoggedIn, user, login, logout, setHasPin, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

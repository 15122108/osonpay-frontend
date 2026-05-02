import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, Auth } from '../services/api';

interface User {
  phone: string;
  fullName?: string;
  hasPin: boolean;
  balance?: number;
  language?: string;
  kycStatus?: string;
}

interface AuthCtx {
  loading: boolean;
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string, user: any, hasPin: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setHasPin: (v: boolean) => void;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState<User | null>(null);
  const [isLoggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await Auth.getToken();
        if (!token) { setLoading(false); return; }
        const cached = await Auth.getUser();
        if (cached) {
          setUser(cached);
          setLoggedIn(true);
        }
        // Fresh profile from server
        try {
          const profile = await api.getProfile();
          const merged = { ...cached, ...profile };
          setUser(merged);
          await AsyncStorage.setItem('user', JSON.stringify(merged));
        } catch {}
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (token: string, userData: any, hasPin: boolean) => {
    const u: User = { ...userData, hasPin };
    await Auth.save(token, u);
    setUser(u);
    setLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    await Auth.clear();
    setUser(null);
    setLoggedIn(false);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      const updated = { ...user, ...profile };
      setUser(updated);
      await AsyncStorage.setItem('user', JSON.stringify(updated));
    } catch {}
  }, [user]);

  const setHasPin = useCallback((v: boolean) => {
    setUser(u => u ? { ...u, hasPin: v } : u);
  }, []);

  return (
    <Ctx.Provider value={{ loading, isLoggedIn, user, login, logout, refresh, setHasPin }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { KEYS } from '../app/_layout';

interface User {
  id: string;
  fullName: string;
  phone: string;
  balance: number;
  kyc_status: 'verified' | 'unverified' | 'pending';
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthCtx {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const token = await SecureStore.getItemAsync(KEYS.TOKEN);
      if (!token) { setLoading(false); return; }
      const data = await api.getProfile();
      setUser(data);
    } catch {
      // Token muddati o'tgan — o'chirish
      await SecureStore.deleteItemAsync(KEYS.TOKEN);
    } finally {
      setLoading(false);
    }
  }

  async function login(phone: string, code: string) {
    const { token, user: u } = await api.login(phone, code);
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
    setUser(u);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
    await SecureStore.deleteItemAsync(KEYS.PIN);
    await SecureStore.deleteItemAsync(KEYS.BIO);
    setUser(null);
    try { await api.logout(); } catch {}
  }

  async function refresh() {
    try {
      const data = await api.getProfile();
      setUser(data);
    } catch {}
  }

  return { user, loading, login, logout, refresh };
}

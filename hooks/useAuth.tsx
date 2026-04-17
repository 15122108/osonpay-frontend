import React, { createContext, useContext, useState, useEffect } from 'react';
import { Auth, api } from '../services/api';

interface User {
  id: string;
  phone: string;
  fullName: string;
  balance: number;
  language: string;
  hasPin: boolean;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (token: string, user: any, hasPin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setHasPin: (v: boolean) => void;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    try {
      const loggedIn = await Auth.isLoggedIn();
      if (loggedIn) {
        const d = await api.getProfile();
        // pin_hash backend dan bool sifatida keladi
        const hasPin = d.user.pin_hash === true || d.user.pin_hash === 1;
        setUser({
          id:       d.user.id,
          phone:    d.user.phone,
          fullName: d.user.full_name || '',
          balance:  parseFloat(d.user.balance) || 0,
          language: d.user.language || 'uz',
          hasPin,
        });
      }
    } catch {
      await Auth.clear();
    } finally {
      setLoading(false);
    }
  }

  async function login(token: string, userData: any, hasPin = false) {
    await Auth.save(token, userData);
    setUser({
      id:       userData.id,
      phone:    userData.phone,
      fullName: userData.fullName || userData.full_name || '',
      balance:  0,
      language: 'uz',
      hasPin,
    });
  }

  // PIN o'rnatilgandan keyin chaqiriladi — ilovani qayta yuklamasdan holat yangilanadi
  function setHasPin(v: boolean) {
    setUser(u => u ? { ...u, hasPin: v } : u);
  }

  async function logout() {
    try { await api.logout(); } catch {}
    await Auth.clear();
    setUser(null);
  }

  async function refresh() {
    try {
      const d = await api.getProfile();
      setUser(u => u ? {
        ...u,
        fullName: d.user.full_name || u.fullName,
        balance:  parseFloat(d.user.balance) || 0,
        hasPin:   d.user.pin_hash === true || d.user.pin_hash === 1,
      } : u);
    } catch {}
  }

  return (
    <Ctx.Provider value={{ user, loading, isLoggedIn: !!user, login, logout, refresh, setHasPin }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

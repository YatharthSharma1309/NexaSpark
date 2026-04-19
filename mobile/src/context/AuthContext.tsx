import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, signupRequest } from '../lib/api';
import { clearSession, loadStoredSession, saveSession } from '../lib/authStorage';
import type { UserProfile } from '../types/api';

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await loadStoredSession();
      if (cancelled) return;
      if (session) {
        setToken(session.token);
        setUser(session.user);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email.trim(), password);
    await saveSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const data = await signupRequest(email.trim(), password, name.trim());
    await saveSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, signIn, signUp, signOut }),
    [user, token, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

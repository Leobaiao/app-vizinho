import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInDemo?: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USE_DEMO = true; // Altere para false quando configurar o Supabase

const MOCK_USER = {
  id: 'demo-user-id',
  email: 'demo@vizinho.com',
  user_metadata: { full_name: 'Usuário Demo' },
} as any;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(USE_DEMO ? MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!USE_DEMO);

  useEffect(() => {
    if (USE_DEMO) {
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (USE_DEMO) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const signInDemo = () => {
    setUser(MOCK_USER);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    signInDemo, // Adicionado para facilitar o login no modo demo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

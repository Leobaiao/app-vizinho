import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
  signInDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER = {
  id: 'demo-user-id',
  email: 'ola@mercadovizinho.com.br',
  user_metadata: { full_name: 'Equipe Vizinho' },
} as any;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // 1. Verificar se estava no modo demo
    const wasDemo = localStorage.getItem('vizinho_is_demo') === 'true';
    if (wasDemo) {
      setUser(MOCK_USER);
      setIsDemo(true);
      setLoading(false);
    }

    // 2. Escutar mudanças de autenticação (inclui a carga inicial da sessão)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth Event:', event);
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setIsDemo(false);
        localStorage.removeItem('vizinho_is_demo');
      } else if (!wasDemo) {
        // Só limpa o usuário se não estivermos no modo demo
        setSession(null);
        setUser(null);
        setIsDemo(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    localStorage.removeItem('vizinho_is_demo');
    setIsDemo(false);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  const signInDemo = () => {
    localStorage.setItem('vizinho_is_demo', 'true');
    setIsDemo(true);
    setUser(MOCK_USER);
  };

  const value = {
    user,
    session,
    loading,
    isDemo,
    signOut,
    signInDemo,
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

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { InventorySession } from '../types/inventory_session';

export function useInventorySessions() {
  const { user, isDemo } = useAuth();
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [activeSession, setActiveSession] = useState<InventorySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [user, isDemo]);

  const fetchSessions = async () => {
    if (!user && !isDemo) return;
    setLoading(true);
    try {
      if (isDemo) {
        const stored = localStorage.getItem('vizinho_inventory_sessions');
        const data = stored ? JSON.parse(stored) : [];
        setSessions(data);
        const open = data.find((s: any) => s.status === 'open');
        setActiveSession(open || null);
      } else {
        const { data, error } = await supabase
          .from('inventory_sessions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSessions(data || []);
        const open = data?.find(s => s.status === 'open');
        setActiveSession(open || null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (activeSession) return activeSession;
    
    try {
      if (isDemo) {
        const newSession: InventorySession = {
          id: crypto.randomUUID(),
          user_id: 'demo-user',
          status: 'open',
          created_at: new Date().toISOString(),
        };
        const updated = [newSession, ...sessions];
        localStorage.setItem('vizinho_inventory_sessions', JSON.stringify(updated));
        setSessions(updated);
        setActiveSession(newSession);
        return newSession;
      } else {
        const { data, error } = await supabase
          .from('inventory_sessions')
          .insert([{ user_id: user?.id, status: 'open' }])
          .select()
          .single();
        
        if (error) throw error;
        setSessions([data, ...sessions]);
        setActiveSession(data);
        return data;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const finalizeSession = async (id: string) => {
    try {
      if (isDemo) {
        const updated = sessions.map(s => 
          s.id === id ? { ...s, status: 'completed' as const, completed_at: new Date().toISOString() } : s
        );
        localStorage.setItem('vizinho_inventory_sessions', JSON.stringify(updated));
        setSessions(updated);
        if (activeSession?.id === id) setActiveSession(null);
      } else {
        const { error } = await supabase
          .from('inventory_sessions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', id);
        
        if (error) throw error;
        setSessions(sessions.map(s => s.id === id ? { ...s, status: 'completed', completed_at: new Date().toISOString() } : s));
        if (activeSession?.id === id) setActiveSession(null);
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const addSessionItem = async (sessionId: string, productId: string, qty: number, expectedQty: number) => {
    try {
      if (isDemo) {
        const stored = localStorage.getItem('vizinho_inventory_items') || '[]';
        const items = JSON.parse(stored);
        
        // Se já existe o produto nessa sessão, incrementa
        const existingIndex = items.findIndex((i: any) => i.session_id === sessionId && i.product_id === productId);
        
        if (existingIndex >= 0) {
          items[existingIndex].counted_quantity += qty;
        } else {
          items.push({
            id: crypto.randomUUID(),
            session_id: sessionId,
            product_id: productId,
            counted_quantity: qty,
            expected_quantity: expectedQty,
            created_at: new Date().toISOString(),
          });
        }
        
        localStorage.setItem('vizinho_inventory_items', JSON.stringify(items));
        return true;
      } else {
        // No banco real, vamos fazer um upsert ou algo similar se quisermos agrupar
        // Por enquanto, vamos buscar se existe
        const { data: existing } = await supabase
          .from('inventory_session_items')
          .select('*')
          .eq('session_id', sessionId)
          .eq('product_id', productId)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('inventory_session_items')
            .update({ counted_quantity: existing.counted_quantity + qty })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('inventory_session_items')
            .insert([{
              session_id: sessionId,
              product_id: productId,
              counted_quantity: qty,
              expected_quantity: expectedQty
            }]);
          if (error) throw error;
        }
        return true;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getSessionItems = async (sessionId: string) => {
    try {
      if (isDemo) {
        const stored = localStorage.getItem('vizinho_inventory_items') || '[]';
        const items = JSON.parse(stored);
        return items.filter((i: any) => i.session_id === sessionId);
      } else {
        const { data, error } = await supabase
          .from('inventory_session_items')
          .select('*')
          .eq('session_id', sessionId);
        
        if (error) throw error;
        return data || [];
      }
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  return {
    sessions,
    activeSession,
    loading,
    error,
    startSession,
    finalizeSession,
    addSessionItem,
    getSessionItems,
    refresh: fetchSessions
  };
}

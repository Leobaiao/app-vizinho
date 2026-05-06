import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { InventoryCount, InventoryCountInsert } from '../types/inventory';

const STORAGE_KEY = 'vizinho_demo_inventory';

export function useInventory() {
  const { user, isDemo } = useAuth();
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();

    // Sincronização em Tempo Real (Supabase Realtime)
    if (!isDemo && user) {
      const channel = supabase
        .channel('inventory_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'inventory_counts',
          filter: `user_id=eq.${user.id}` 
        }, () => {
          fetchCounts();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isDemo]);

  const fetchCounts = async () => {
    if (!user && !isDemo) {
      setCounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isDemo) {
        const stored = localStorage.getItem(STORAGE_KEY);
        setCounts(stored ? JSON.parse(stored) : []);
      } else {
        const { data, error } = await supabase
          .from('inventory_counts')
          .select('*, products(name)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setCounts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addCount = async (count: InventoryCountInsert) => {
    try {
      if (isDemo) {
        const newCount: InventoryCount = {
          ...count,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        } as InventoryCount;
        
        const updated = [newCount, ...counts];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setCounts(updated);
        return newCount;
      } else {
        const { data, error } = await supabase
          .from('inventory_counts')
          .insert([{ ...count, user_id: user?.id }])
          .select()
          .single();
        
        if (error) throw error;
        setCounts([data, ...counts]);
        return data;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const deleteCount = async (id: string) => {
    try {
      if (isDemo) {
        const updated = counts.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setCounts(updated);
        return true;
      } else {
        const { error } = await supabase
          .from('inventory_counts')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setCounts(counts.filter(c => c.id !== id));
        return true;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return {
    counts,
    loading,
    addCount,
    deleteCount,
    refresh: fetchCounts,
  };
}

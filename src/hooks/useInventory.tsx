import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { InventoryCount, InventoryCountInsert } from '../types/inventory';

const USE_DEMO = true;
const STORAGE_KEY = 'vizinho_demo_inventory';

export function useInventory() {
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      if (USE_DEMO) {
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
      if (USE_DEMO) {
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
          .insert([count])
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

  return {
    counts,
    loading,
    addCount,
    refresh: fetchCounts,
  };
}

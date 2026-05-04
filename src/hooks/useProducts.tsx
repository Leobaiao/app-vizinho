import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, ProductInsert, ProductUpdate } from '../types/product';

const USE_DEMO = true; // Sincronizado com useAuth
const STORAGE_KEY = 'vizinho_demo_products';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (USE_DEMO) {
        const stored = localStorage.getItem(STORAGE_KEY);
        setProducts(stored ? JSON.parse(stored) : []);
      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setProducts(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: ProductInsert) => {
    try {
      if (USE_DEMO) {
        const newProduct: Product = {
          ...product,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Product;
        
        const updated = [...products, newProduct];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setProducts(updated);
        return newProduct;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select()
          .single();
        
        if (error) throw error;
        setProducts([...products, data]);
        return data;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateProduct = async (id: string, updates: ProductUpdate) => {
    try {
      if (USE_DEMO) {
        const updated = products.map(p => 
          p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setProducts(updated);
      } else {
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id);
        
        if (error) throw error;
        setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (USE_DEMO) {
        const updated = products.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setProducts(updated);
      } else {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setProducts(products.filter(p => p.id !== id));
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh: fetchProducts,
  };
}

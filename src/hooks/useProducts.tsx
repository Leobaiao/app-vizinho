import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Product, ProductInsert, ProductUpdate } from '../types/product';

const STORAGE_KEY = 'vizinho_demo_products';

export function useProducts() {
  const { user, isDemo } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();

    // Sincronização em Tempo Real (Supabase Realtime)
    if (!isDemo && user) {
      const channel = supabase
        .channel('products_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `user_id=eq.${user.id}` 
        }, () => {
          fetchProducts(); // Recarrega ao detectar mudança
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isDemo]);

  const fetchProducts = async () => {
    if (!user && !isDemo) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isDemo) {
        const storedProducts = localStorage.getItem(STORAGE_KEY);
        const storedBatches = localStorage.getItem('vizinho_demo_product_batches');
        const parsedProducts: Product[] = storedProducts ? JSON.parse(storedProducts) : [];
        const parsedBatches: any[] = storedBatches ? JSON.parse(storedBatches) : [];
        
        const mergedProducts = parsedProducts.map(p => {
          const batchesForProduct = parsedBatches
            .filter(b => b.product_id === p.id)
            .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
          return {
            ...p,
            product_batches: batchesForProduct
          };
        });
        setProducts(mergedProducts);
      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_batches(*)')
          .order('name');
        
        if (error) throw error;

        const mergedProducts = (data || []).map(p => ({
          ...p,
          product_batches: (p.product_batches || []).sort(
            (a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          )
        }));
        
        setProducts(mergedProducts);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: ProductInsert & { batches?: any[] }) => {
    const { batches, ...product } = productData;
    try {
      if (isDemo) {
        const productId = crypto.randomUUID();
        const demoBatches = (batches || []).map(b => ({
          id: crypto.randomUUID(),
          product_id: productId,
          batch_number: b.batch_number,
          expiry_date: b.expiry_date,
          quantity: Number(b.quantity || 0),
          created_at: new Date().toISOString()
        }));

        const newProduct: Product = {
          ...product,
          id: productId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product_batches: demoBatches
        } as Product;

        const storedBatches = localStorage.getItem('vizinho_demo_product_batches');
        const parsedBatches = storedBatches ? JSON.parse(storedBatches) : [];
        const updatedBatches = [...parsedBatches, ...demoBatches];
        localStorage.setItem('vizinho_demo_product_batches', JSON.stringify(updatedBatches));

        const updatedProducts = [...products, newProduct];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts.map(({ product_batches, ...p }: any) => p)));
        setProducts(updatedProducts);
        return newProduct;
      } else {
        const { data: newProd, error: prodError } = await supabase
          .from('products')
          .insert([{ ...product, user_id: user?.id }])
          .select()
          .single();
        
        if (prodError) throw prodError;

        let insertedBatches: any[] = [];
        if (batches && batches.length > 0) {
          const dbBatches = batches.map(b => ({
            product_id: newProd.id,
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            quantity: Number(b.quantity || 0)
          }));
          const { data: batchData, error: batchError } = await supabase
            .from('product_batches')
            .insert(dbBatches)
            .select();
          if (batchError) throw batchError;
          insertedBatches = batchData || [];
        }

        const newProductWithBatches = {
          ...newProd,
          product_batches: insertedBatches.sort(
            (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          )
        };
        setProducts([...products, newProductWithBatches]);
        return newProductWithBatches;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateProduct = async (id: string, updateData: ProductUpdate & { batches?: any[] }) => {
    const { batches, ...updates } = updateData;
    try {
      if (isDemo) {
        let updatedBatchesList: any[] = [];
        const storedBatches = localStorage.getItem('vizinho_demo_product_batches');
        const parsedBatches = storedBatches ? JSON.parse(storedBatches) : [];
        
        // Remove os lotes antigos do produto
        let remainingBatches = parsedBatches.filter((b: any) => b.product_id !== id);
        
        if (batches) {
          const newDemoBatches = batches.map(b => ({
            id: b.id || crypto.randomUUID(),
            product_id: id,
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            quantity: Number(b.quantity || 0),
            created_at: b.created_at || new Date().toISOString()
          }));
          remainingBatches = [...remainingBatches, ...newDemoBatches];
          updatedBatchesList = newDemoBatches.sort(
            (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          );
          localStorage.setItem('vizinho_demo_product_batches', JSON.stringify(remainingBatches));
        } else {
          updatedBatchesList = parsedBatches
            .filter((b: any) => b.product_id === id)
            .sort((a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
        }

        const updatedProducts = products.map(p => {
          if (p.id === id) {
            const updatedProd = {
              ...p,
              ...updates,
              updated_at: new Date().toISOString(),
            };
            // Se informamos lotes, atualiza a lista interna
            if (batches) {
              updatedProd.product_batches = updatedBatchesList;
            }
            return updatedProd;
          }
          return p;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts.map(({ product_batches, ...p }: any) => p)));
        setProducts(updatedProducts);
      } else {
        const { error: prodError } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id);
        
        if (prodError) throw prodError;

        let finalBatches = batches;
        if (batches) {
          // Deleta lotes anteriores
          const { error: deleteError } = await supabase
            .from('product_batches')
            .delete()
            .eq('product_id', id);
          if (deleteError) throw deleteError;

          // Insere novos lotes
          if (batches.length > 0) {
            const dbBatches = batches.map(b => ({
              product_id: id,
              batch_number: b.batch_number,
              expiry_date: b.expiry_date,
              quantity: Number(b.quantity || 0)
            }));
            const { data: batchData, error: insertError } = await supabase
              .from('product_batches')
              .insert(dbBatches)
              .select();
            if (insertError) throw insertError;
            finalBatches = batchData || [];
          }
        }

        setProducts(products.map(p => {
          if (p.id === id) {
            const updatedProd = { ...p, ...updates };
            if (batches) {
              updatedProd.product_batches = (finalBatches || []).sort(
                (a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
              );
            }
            return updatedProd;
          }
          return p;
        }));
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      if (isDemo) {
        const updated = products.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        
        const storedBatches = localStorage.getItem('vizinho_demo_product_batches');
        if (storedBatches) {
          const parsedBatches = JSON.parse(storedBatches);
          const filteredBatches = parsedBatches.filter((b: any) => b.product_id !== id);
          localStorage.setItem('vizinho_demo_product_batches', JSON.stringify(filteredBatches));
        }
        
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

  const bulkProcessProducts = async (updates: any[], creates: any[]) => {
    try {
      if (isDemo) {
        let updatedProducts = [...products];
        
        // Updates
        updates.forEach(update => {
          const index = updatedProducts.findIndex(p => p.id === update.id);
          if (index !== -1) {
            updatedProducts[index] = { 
              ...updatedProducts[index], 
              ...update, 
              updated_at: new Date().toISOString() 
            };
          }
        });

        // Creates
        const newProducts = creates.map(create => ({
          ...create,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product_batches: []
        })) as Product[];
        
        updatedProducts = [...updatedProducts, ...newProducts];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts.map(({ product_batches, ...p }: any) => p)));
        setProducts(updatedProducts);
      } else {
        // Updates via upsert
        if (updates.length > 0) {
          const fullUpdates = updates.map(u => {
            const existing = products.find(p => p.id === u.id);
            if (!existing) return null;
            const { product_batches, ...rest } = existing as any;
            return { ...rest, ...u, updated_at: new Date().toISOString() };
          }).filter(Boolean);
          
          if (fullUpdates.length > 0) {
            const { error: updateError } = await supabase.from('products').upsert(fullUpdates);
            if (updateError) throw updateError;
          }
        }
        
        // Creates via insert
        if (creates.length > 0) {
          const inserts = creates.map(c => ({ ...c, user_id: user?.id }));
          const { error: createError } = await supabase.from('products').insert(inserts);
          if (createError) throw createError;
        }

        // Recarregar os produtos no final para garantir os dados
        await fetchProducts();
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
    bulkProcessProducts,
    refresh: fetchProducts,
  };
}

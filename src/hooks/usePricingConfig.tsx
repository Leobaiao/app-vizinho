import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { PricingConfig } from '../types/pricing_config';
import { DEFAULT_PRICING_CONFIG } from '../utils/pricingDefaults';
import { calcTaxaPonderada } from '../utils/pricing';

const STORAGE_KEY = 'vizinho_pricing_config';

function recalcDerived(config: PricingConfig): PricingConfig {
  const totalCF = config.custos_fixos.reduce((sum, c) => sum + c.valor, 0);
  const taxaPonderada = calcTaxaPonderada(config);
  const pctCF = config.faturamento_estimado_rs > 0
    ? (totalCF / config.faturamento_estimado_rs) * 100
    : 0;

  return {
    ...config,
    total_custos_fixos_rs: totalCF,
    taxa_ponderada_pct: taxaPonderada,
    pct_cf_sobre_faturamento: pctCF,
  };
}

export function usePricingConfig() {
  const { user, isDemo } = useAuth();
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemo) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PricingConfig;
          setConfig(recalcDerived(parsed));
        } else {
          setConfig(recalcDerived(DEFAULT_PRICING_CONFIG));
        }
      } else if (user) {
        const { data, error: fetchError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data?.pricing_config) {
          const parsed = data.pricing_config as PricingConfig;
          setConfig(recalcDerived(parsed));
        } else {
          setConfig(recalcDerived(DEFAULT_PRICING_CONFIG));
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar config de precificação:', err);
      setError(err.message);
      setConfig(recalcDerived(DEFAULT_PRICING_CONFIG));
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (newConfig: PricingConfig) => {
    setSaving(true);
    setError(null);

    const recalculated = recalcDerived(newConfig);

    try {
      if (isDemo) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recalculated));
        setConfig(recalculated);
      } else if (user) {
        // Upsert into settings table — store entire config as JSONB
        const { error: upsertError } = await supabase
          .from('settings')
          .upsert({
            user_id: user.id,
            pricing_config: recalculated,
            default_margin_percent: 30,
            default_payment_fee: recalculated.taxa_ponderada_pct,
            total_fixed_costs: recalculated.total_custos_fixos_rs,
            estimated_monthly_sales: recalculated.faturamento_estimado_rs,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (upsertError) throw upsertError;
        setConfig(recalculated);
      }
      return true;
    } catch (err: any) {
      console.error('Erro ao salvar config:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    return saveConfig(DEFAULT_PRICING_CONFIG);
  };

  return {
    config,
    loading,
    saving,
    error,
    saveConfig,
    resetToDefaults,
    refresh: fetchConfig,
  };
}

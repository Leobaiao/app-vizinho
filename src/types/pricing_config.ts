export interface PricingConfig {
  // Taxas de Cartão
  taxa_credito_pct: number;
  taxa_debito_pct: number;
  mix_credito_pct: number;
  mix_debito_pct: number;
  mix_pix_pct: number;
  taxa_ponderada_pct: number; // Calculado: (credito*mix_credito + debito*mix_debito) / 100

  // Impostos e Perdas
  imposto_pct: number;
  perdas_pct: number;

  // Custos Fixos Mensais
  custos_fixos: CustoFixo[];
  total_custos_fixos_rs: number;
  faturamento_estimado_rs: number;
  pct_cf_sobre_faturamento: number; // Calculado: total_cf / faturamento * 100

  // Margens por Categoria
  margens_por_categoria: CategoryMargin[];
}

export interface CustoFixo {
  nome: string;
  valor: number;
}

export interface CategoryMargin {
  categoria: string;
  margem_pct: number;
  justificativa?: string;
}

export interface MarkupResult {
  fator_markup_pct: number;
  preco_sugerido: number;
  preco_psicologico: number;
  margem_real_pct: number | null;
}

/**
 * Produto do catálogo base para importação
 */
export interface CatalogProduct {
  id: number;
  nome: string;
  categoria: string;
  custo_rs: number | null;
  preco_sugerido_rs: number | null;
  estoque_minimo: number;
}

/**
 * Categorias disponíveis no mini mercado
 */
export const CATEGORIAS_MINI_MERCADO = [
  'CERVEJA PADRÃO',
  'CERVEJA PREMIUM',
  'BEBIDA PRONTA',
  'BEBIDA NÃO-ALCOÓLICA',
  'CONGELADOS',
  'MERCEARIA',
  'HIGIENE & EMERGÊNCIA',
  'GELADEIRA',
] as const;

export type CategoriaMiniMercado = typeof CATEGORIAS_MINI_MERCADO[number];

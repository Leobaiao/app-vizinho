import type { PricingConfig } from '../types/pricing_config';
import { DEFAULT_PRICING_CONFIG } from './pricingDefaults';

// ========== LEGACY (mantida para backward compat) ==========

export interface PricingInput {
  costPrice: number;
  marginPercent: number;
  paymentFeesPercent: number;
  fixedCostsAmount: number;
}

export interface PricingOutput {
  sellingPrice: number;
  grossProfitAmount: number;
  grossProfitPercent: number;
  breakEvenPrice: number;
}

/**
 * [LEGACY] Calcula o preço de venda baseado no Markup/Margem de Contribuição
 * Fórmula: Preço = (Custo + Custo Fixo + Taxas) / (1 - Margem%)
 */
export function calculateSellingPrice(input: PricingInput): PricingOutput {
  const { costPrice, marginPercent, paymentFeesPercent, fixedCostsAmount } = input;
  
  const marginDecimal = marginPercent / 100;
  const feesDecimal = paymentFeesPercent / 100;
  
  // Preço de venda necessário para atingir a margem desejada após todas as deduções
  // PV = (Custo + CustoFixo) / (1 - Margem% - Taxas%)
  const divisor = 1 - marginDecimal - feesDecimal;
  
  // Evitar divisão por zero ou resultados negativos bizarros
  const safeDivisor = divisor <= 0 ? 0.01 : divisor;
  
  const sellingPrice = (costPrice + fixedCostsAmount) / safeDivisor;
  const grossProfitAmount = sellingPrice - costPrice - fixedCostsAmount - (sellingPrice * feesDecimal);
  const grossProfitPercent = sellingPrice > 0 ? (grossProfitAmount / sellingPrice) * 100 : 0;
  
  const breakEvenPrice = costPrice + fixedCostsAmount;

  return {
    sellingPrice: Math.max(0, sellingPrice),
    grossProfitAmount: Math.max(0, grossProfitAmount),
    grossProfitPercent: Math.max(0, grossProfitPercent),
    breakEvenPrice,
  };
}


// ========== NOVA ENGINE — Fórmula do Mini Mercado ==========

export interface MarkupInput {
  costPrice: number;
  categoria: string;
  config?: PricingConfig;
}

export interface MarkupOutput {
  fatorMarkupPct: number;
  precoSugerido: number;
  precoPsicologico: number;
  margemDesejadaPct: number;
  taxaPonderadaPct: number;
  impostoPerdasPct: number;
  custoFixoPct: number;
}

/**
 * Calcula a taxa ponderada de cartão a partir dos parâmetros de config.
 */
export function calcTaxaPonderada(config: PricingConfig): number {
  return (
    (config.taxa_credito_pct * config.mix_credito_pct) +
    (config.taxa_debito_pct * config.mix_debito_pct)
  ) / 100;
}

/**
 * Calcula o % de custos fixos sobre o faturamento.
 */
export function calcPctCustoFixo(config: PricingConfig): number {
  if (config.faturamento_estimado_rs <= 0) return 0;
  return (config.total_custos_fixos_rs / config.faturamento_estimado_rs) * 100;
}

/**
 * Calcula o fator de markup para uma categoria.
 * Fator = 1 - TaxaPonderada% - (Imposto% + Perdas%) - %CF - Margem%
 * Retorna em formato percentual (ex: 61.308 para 61.308%)
 */
export function calcFatorMarkup(
  margemCategoriaPct: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  const taxaPonderada = calcTaxaPonderada(config);
  const impostoMaisPerdas = config.imposto_pct + config.perdas_pct;
  const pctCF = calcPctCustoFixo(config);

  return 100 - taxaPonderada - impostoMaisPerdas - pctCF - margemCategoriaPct;
}

/**
 * Arredonda para cima na casa de R$ 0,10
 * Ex: 7.65 → 7.70 | 8.01 → 8.10
 */
export function ceilToTenCents(value: number): number {
  return Math.ceil(value * 10) / 10;
}

/**
 * Sugere o preço psicológico mais próximo (X,90 ou X,99).
 * Ex: sugestão 8.40 → preço praticado 8.90
 *     sugestão 7.70 → preço praticado 7.90
 *     sugestão 12.30 → preço praticado 12.90
 */
export function getSuggestedPsychologicalPrice(price: number): number {
  const intPart = Math.floor(price);
  const decPart = price - intPart;

  // Se a parte decimal é > 0.90, vai para o próximo inteiro + 0.90
  if (decPart > 0.90) {
    return intPart + 1 + 0.90;
  }
  // Se a parte decimal é <= 0.90, arredonda para X.90
  return intPart + 0.90;
}

/**
 * NOVA FÓRMULA DE PRECIFICAÇÃO DO MINI MERCADO
 * 
 * Preço Sugerido = TETO(Custo / Fator de Markup, R$0.10)
 * Fator de Markup = 1 - TaxaCartão - (Imposto + Perdas) - %CF - MargemCategoria
 * 
 * @param input - Custo do produto e categoria
 * @returns Todos os dados do cálculo de markup
 */
export function calculateMarkupPrice(input: MarkupInput): MarkupOutput {
  const config = input.config || DEFAULT_PRICING_CONFIG;
  const { costPrice, categoria } = input;

  // Encontrar margem da categoria
  const margemCategoria = config.margens_por_categoria.find(
    m => m.categoria.toUpperCase() === categoria.toUpperCase()
  );
  const margemDesejadaPct = margemCategoria ? margemCategoria.margem_pct : 30;

  // Calcular componentes
  const taxaPonderadaPct = calcTaxaPonderada(config);
  const impostoPerdasPct = config.imposto_pct + config.perdas_pct;
  const custoFixoPct = calcPctCustoFixo(config);
  const fatorMarkupPct = calcFatorMarkup(margemDesejadaPct, config);

  // Calcular preço sugerido
  let precoSugerido = 0;
  if (costPrice > 0 && fatorMarkupPct > 0) {
    const fatorDecimal = fatorMarkupPct / 100;
    precoSugerido = ceilToTenCents(costPrice / fatorDecimal);
  }

  // Preço psicológico
  const precoPsicologico = precoSugerido > 0 
    ? getSuggestedPsychologicalPrice(precoSugerido) 
    : 0;

  return {
    fatorMarkupPct,
    precoSugerido,
    precoPsicologico,
    margemDesejadaPct,
    taxaPonderadaPct,
    impostoPerdasPct,
    custoFixoPct,
  };
}

/**
 * Calcula a margem real quando o preço praticado é informado.
 * 
 * Margem Real % = (PrecoPraticado - Custo - PrecoPraticado × (TaxaCartão + Imposto + Perdas + %CF)) / PrecoPraticado
 */
export function calculateRealMargin(
  costPrice: number,
  practicedPrice: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  if (practicedPrice <= 0) return 0;

  const taxaPonderada = calcTaxaPonderada(config) / 100;
  const impostoMaisPerdas = (config.imposto_pct + config.perdas_pct) / 100;
  const pctCF = calcPctCustoFixo(config) / 100;

  const deductions = taxaPonderada + impostoMaisPerdas + pctCF;
  const marginReal = (practicedPrice - costPrice - (practicedPrice * deductions)) / practicedPrice;

  return marginReal * 100;
}

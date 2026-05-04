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
 * Calcula o preço de venda baseado no Markup/Margem de Contribuição
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

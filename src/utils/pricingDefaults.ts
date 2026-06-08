import type { PricingConfig, CatalogProduct } from '../types/pricing_config';

/**
 * Configuração padrão de precificação conforme documento Precificacao_Mini_Mercado.md
 */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  taxa_credito_pct: 2.99,
  taxa_debito_pct: 1.49,
  mix_credito_pct: 50,
  mix_debito_pct: 30,
  mix_pix_pct: 20,
  taxa_ponderada_pct: 1.942,

  imposto_pct: 6.0,
  perdas_pct: 2.0,

  custos_fixos: [
    { nome: 'Energia Elétrica (geladeiras, freezers, luz)', valor: 350 },
    { nome: 'Internet / Telefone', valor: 120 },
    { nome: 'Embalagens, Sacolas e Descartáveis', valor: 80 },
    { nome: 'Manutenção de Equipamentos', valor: 50 },
    { nome: 'Outros Custos Fixos', valor: 100 },
  ],
  total_custos_fixos_rs: 700,
  faturamento_estimado_rs: 8000,
  pct_cf_sobre_faturamento: 8.75,

  margens_por_categoria: [
    { categoria: 'CERVEJA PADRÃO', margem_pct: 20, justificativa: 'Concorrência alta — margem moderada' },
    { categoria: 'CERVEJA PREMIUM', margem_pct: 28, justificativa: 'Premium justifica margem maior' },
    { categoria: 'BEBIDA PRONTA', margem_pct: 30, justificativa: 'Baixo giro — margem maior' },
    { categoria: 'BEBIDA NÃO-ALCOÓLICA', margem_pct: 25, justificativa: 'Alto giro — equilibre com volume' },
    { categoria: 'CONGELADOS', margem_pct: 30, justificativa: 'Custo de energia alto — compense na margem' },
    { categoria: 'MERCEARIA', margem_pct: 30, justificativa: 'Produtos secos — boa margem' },
    { categoria: 'HIGIENE & EMERGÊNCIA', margem_pct: 40, justificativa: 'Compra por urgência — maior margem' },
    { categoria: 'GELADEIRA', margem_pct: 28, justificativa: 'Perecíveis — atenção ao prazo de validade' },
  ],
};

/**
 * Catálogo base de 130 produtos do mini mercado de condomínio.
 * custo_rs = null indica que o custo ainda não foi cadastrado.
 */
export const CATALOGO_BASE: CatalogProduct[] = [
  // CERVEJA PADRÃO
  { id: 1, nome: 'CERVEJA PETRA', categoria: 'CERVEJA PADRÃO', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 2, nome: 'CERVEJA HEINEKEN', categoria: 'CERVEJA PADRÃO', custo_rs: 4.69, preco_sugerido_rs: 7.70, estoque_minimo: 0 },
  { id: 3, nome: 'CERVEJA HEINEKEN ZERO', categoria: 'CERVEJA PADRÃO', custo_rs: 6.58, preco_sugerido_rs: 10.80, estoque_minimo: 0 },
  { id: 4, nome: 'CERVEJA STELA', categoria: 'CERVEJA PADRÃO', custo_rs: 4.99, preco_sugerido_rs: 8.20, estoque_minimo: 0 },
  { id: 5, nome: 'CERVEJA SPATEN', categoria: 'CERVEJA PADRÃO', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },

  // CERVEJA PREMIUM
  { id: 6, nome: 'CERVEJA COLORADO', categoria: 'CERVEJA PREMIUM', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 7, nome: 'CERVEJA MALZBIER', categoria: 'CERVEJA PREMIUM', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },

  // BEBIDA PRONTA
  { id: 8, nome: 'SKOL BEATS', categoria: 'BEBIDA PRONTA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 9, nome: 'SMIRNOFF ICE', categoria: 'BEBIDA PRONTA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 10, nome: 'XEQUE-MATE', categoria: 'BEBIDA PRONTA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 11, nome: 'VELHO BARREIRO', categoria: 'BEBIDA PRONTA', custo_rs: 13.90, preco_sugerido_rs: 27.10, estoque_minimo: 0 },
  { id: 12, nome: 'SMIRNOFF VODKA', categoria: 'BEBIDA PRONTA', custo_rs: 29.90, preco_sugerido_rs: 58.30, estoque_minimo: 0 },

  // BEBIDA NÃO-ALCOÓLICA
  { id: 13, nome: 'ÁGUA COM GÁS', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 1.89, preco_sugerido_rs: 3.40, estoque_minimo: 0 },
  { id: 14, nome: 'ÁGUA SEM GÁS', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 15, nome: 'ENERGÉTICO', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 9.29, preco_sugerido_rs: 16.50, estoque_minimo: 0 },
  { id: 16, nome: 'ENERGÉTICO (2)', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 17, nome: 'COCA COLA', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 2.05, preco_sugerido_rs: 3.70, estoque_minimo: 0 },
  { id: 18, nome: 'COCA COLA ZERO', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 2.89, preco_sugerido_rs: 5.20, estoque_minimo: 0 },
  { id: 19, nome: 'GUARANÁ ANTÁRTICA', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 6.89, preco_sugerido_rs: 12.30, estoque_minimo: 0 },
  { id: 20, nome: 'FANTA LARANJA', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 6.19, preco_sugerido_rs: 11.00, estoque_minimo: 0 },
  { id: 21, nome: 'FANTA UVA', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 6.19, preco_sugerido_rs: 11.00, estoque_minimo: 0 },
  { id: 22, nome: 'H2OH', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 6.89, preco_sugerido_rs: 12.30, estoque_minimo: 0 },
  { id: 23, nome: 'ÁGUA TÔNICA', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 24, nome: 'SUCO INTEGRAL LARANJA', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 13.90, preco_sugerido_rs: 24.70, estoque_minimo: 0 },
  { id: 25, nome: 'SUCO INTEGRAL UVA', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 14.90, preco_sugerido_rs: 26.50, estoque_minimo: 0 },
  { id: 26, nome: 'SUCO PEQUENO', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 4.79, preco_sugerido_rs: 8.60, estoque_minimo: 0 },
  { id: 27, nome: 'TODDYNHO', categoria: 'BEBIDA NÃO-ALCOÓLICA', custo_rs: 2.75, preco_sugerido_rs: 4.90, estoque_minimo: 0 },

  // CONGELADOS
  { id: 28, nome: 'GELO', categoria: 'CONGELADOS', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 29, nome: 'FRANGO À PASSARINHO', categoria: 'CONGELADOS', custo_rs: 11.49, preco_sugerido_rs: 22.40, estoque_minimo: 0 },
  { id: 30, nome: 'NUGGETS', categoria: 'CONGELADOS', custo_rs: 7.99, preco_sugerido_rs: 15.60, estoque_minimo: 0 },
  { id: 31, nome: 'PIZZA CONGELADA', categoria: 'CONGELADOS', custo_rs: 17.90, preco_sugerido_rs: 34.90, estoque_minimo: 0 },
  { id: 32, nome: 'PÃO FRANCÊS CONGELADO', categoria: 'CONGELADOS', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 33, nome: 'CARNE', categoria: 'CONGELADOS', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 34, nome: 'GELADINHO', categoria: 'CONGELADOS', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 35, nome: 'SORVETE EM MASSA', categoria: 'CONGELADOS', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 36, nome: 'PICOLÉ', categoria: 'CONGELADOS', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 37, nome: 'AÇAÍ', categoria: 'CONGELADOS', custo_rs: 13.90, preco_sugerido_rs: 27.10, estoque_minimo: 0 },
  { id: 38, nome: 'PÃO DE QUEIJO CONGELADO', categoria: 'CONGELADOS', custo_rs: 10.90, preco_sugerido_rs: 21.30, estoque_minimo: 0 },
  { id: 39, nome: 'LASANHA', categoria: 'CONGELADOS', custo_rs: 12.90, preco_sugerido_rs: 25.20, estoque_minimo: 0 },
  { id: 40, nome: 'STEAK DE FRANGO', categoria: 'CONGELADOS', custo_rs: 1.49, preco_sugerido_rs: 3.00, estoque_minimo: 0 },
  { id: 41, nome: 'HAMBURGER', categoria: 'CONGELADOS', custo_rs: 10.90, preco_sugerido_rs: 21.30, estoque_minimo: 0 },

  // MERCEARIA
  { id: 42, nome: 'PÃO DE FORMA', categoria: 'MERCEARIA', custo_rs: 6.99, preco_sugerido_rs: 13.70, estoque_minimo: 0 },
  { id: 43, nome: 'OVO', categoria: 'MERCEARIA', custo_rs: 11.00, preco_sugerido_rs: 21.50, estoque_minimo: 0 },
  { id: 44, nome: 'ANA MARIA', categoria: 'MERCEARIA', custo_rs: 2.99, preco_sugerido_rs: 5.90, estoque_minimo: 0 },
  { id: 45, nome: 'LEITE', categoria: 'MERCEARIA', custo_rs: 4.79, preco_sugerido_rs: 9.40, estoque_minimo: 0 },
  { id: 46, nome: 'CAFÉ EM PÓ', categoria: 'MERCEARIA', custo_rs: 23.89, preco_sugerido_rs: 46.60, estoque_minimo: 0 },
  { id: 47, nome: 'NESCAU', categoria: 'MERCEARIA', custo_rs: 5.39, preco_sugerido_rs: 10.60, estoque_minimo: 0 },
  { id: 48, nome: 'AÇÚCAR', categoria: 'MERCEARIA', custo_rs: 2.85, preco_sugerido_rs: 5.60, estoque_minimo: 0 },
  { id: 49, nome: 'ADOÇANTE', categoria: 'MERCEARIA', custo_rs: 6.89, preco_sugerido_rs: 13.50, estoque_minimo: 0 },
  { id: 50, nome: 'CHÁ', categoria: 'MERCEARIA', custo_rs: 2.99, preco_sugerido_rs: 5.90, estoque_minimo: 0 },
  { id: 51, nome: 'CLUBE SOCIAL', categoria: 'MERCEARIA', custo_rs: 10.69, preco_sugerido_rs: 20.90, estoque_minimo: 0 },
  { id: 52, nome: 'BISCOITO ÁGUA E SAL', categoria: 'MERCEARIA', custo_rs: 2.90, preco_sugerido_rs: 5.70, estoque_minimo: 0 },
  { id: 53, nome: 'BOLACHA MAISENA', categoria: 'MERCEARIA', custo_rs: 4.49, preco_sugerido_rs: 8.80, estoque_minimo: 0 },
  { id: 54, nome: 'BISCOITO RECHEADO', categoria: 'MERCEARIA', custo_rs: 1.79, preco_sugerido_rs: 3.50, estoque_minimo: 0 },
  { id: 55, nome: 'TORRADA', categoria: 'MERCEARIA', custo_rs: 3.99, preco_sugerido_rs: 7.80, estoque_minimo: 0 },
  { id: 56, nome: 'BATATA CHIPS', categoria: 'MERCEARIA', custo_rs: 3.95, preco_sugerido_rs: 7.70, estoque_minimo: 0 },
  { id: 57, nome: 'DORITOS', categoria: 'MERCEARIA', custo_rs: 4.59, preco_sugerido_rs: 9.00, estoque_minimo: 0 },
  { id: 58, nome: 'FANDANGOS', categoria: 'MERCEARIA', custo_rs: 3.39, preco_sugerido_rs: 6.70, estoque_minimo: 0 },
  { id: 59, nome: 'CHEETOS', categoria: 'MERCEARIA', custo_rs: 3.59, preco_sugerido_rs: 7.00, estoque_minimo: 0 },
  { id: 60, nome: 'AMENDOIM "OVINHO"', categoria: 'MERCEARIA', custo_rs: 3.29, preco_sugerido_rs: 6.50, estoque_minimo: 0 },
  { id: 61, nome: 'AMENDOIM SEM PELE', categoria: 'MERCEARIA', custo_rs: 6.69, preco_sugerido_rs: 13.10, estoque_minimo: 0 },
  { id: 62, nome: 'AMENDOIM JAPONÊS', categoria: 'MERCEARIA', custo_rs: 5.49, preco_sugerido_rs: 10.80, estoque_minimo: 0 },
  { id: 63, nome: 'FINI', categoria: 'MERCEARIA', custo_rs: 4.99, preco_sugerido_rs: 9.80, estoque_minimo: 0 },
  { id: 64, nome: 'SNICKERS', categoria: 'MERCEARIA', custo_rs: 3.89, preco_sugerido_rs: 7.60, estoque_minimo: 0 },
  { id: 65, nome: 'TRENTO', categoria: 'MERCEARIA', custo_rs: 2.45, preco_sugerido_rs: 4.80, estoque_minimo: 0 },
  { id: 66, nome: 'CHICLETS', categoria: 'MERCEARIA', custo_rs: 41.99, preco_sugerido_rs: 81.90, estoque_minimo: 0 },
  { id: 67, nome: 'HALLS', categoria: 'MERCEARIA', custo_rs: 12.90, preco_sugerido_rs: 25.20, estoque_minimo: 0 },
  { id: 68, nome: 'MENTOS', categoria: 'MERCEARIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 69, nome: 'CUP NOODLES', categoria: 'MERCEARIA', custo_rs: 5.29, preco_sugerido_rs: 10.40, estoque_minimo: 0 },
  { id: 70, nome: 'PRINGLES', categoria: 'MERCEARIA', custo_rs: 10.90, preco_sugerido_rs: 21.30, estoque_minimo: 0 },
  { id: 71, nome: 'BARRA DE CHOCOLATE', categoria: 'MERCEARIA', custo_rs: 8.19, preco_sugerido_rs: 16.00, estoque_minimo: 0 },
  { id: 72, nome: 'MILHO', categoria: 'MERCEARIA', custo_rs: 2.19, preco_sugerido_rs: 4.30, estoque_minimo: 0 },
  { id: 73, nome: 'MOLHO DE TOMATE', categoria: 'MERCEARIA', custo_rs: 1.79, preco_sugerido_rs: 3.50, estoque_minimo: 0 },
  { id: 74, nome: 'CREME DE LEITE', categoria: 'MERCEARIA', custo_rs: 2.15, preco_sugerido_rs: 4.20, estoque_minimo: 0 },
  { id: 75, nome: 'LEITE CONDENSADO', categoria: 'MERCEARIA', custo_rs: 5.79, preco_sugerido_rs: 11.30, estoque_minimo: 0 },
  { id: 76, nome: 'ÓLEO', categoria: 'MERCEARIA', custo_rs: 6.55, preco_sugerido_rs: 12.80, estoque_minimo: 0 },
  { id: 77, nome: 'KETCHUP', categoria: 'MERCEARIA', custo_rs: 4.19, preco_sugerido_rs: 8.20, estoque_minimo: 0 },
  { id: 78, nome: 'MAIONESE', categoria: 'MERCEARIA', custo_rs: 7.45, preco_sugerido_rs: 14.60, estoque_minimo: 0 },
  { id: 79, nome: 'MOSTARDA', categoria: 'MERCEARIA', custo_rs: 5.45, preco_sugerido_rs: 10.70, estoque_minimo: 0 },
  { id: 80, nome: 'PIPOCA DE MICROONDAS', categoria: 'MERCEARIA', custo_rs: 2.09, preco_sugerido_rs: 4.10, estoque_minimo: 0 },
  { id: 81, nome: 'FILTRO DE CAFÉ', categoria: 'MERCEARIA', custo_rs: 3.29, preco_sugerido_rs: 6.50, estoque_minimo: 0 },
  { id: 82, nome: 'SAL', categoria: 'MERCEARIA', custo_rs: 2.79, preco_sugerido_rs: 5.50, estoque_minimo: 0 },
  { id: 83, nome: 'BARBEADOR', categoria: 'MERCEARIA', custo_rs: 6.20, preco_sugerido_rs: 12.10, estoque_minimo: 0 },
  { id: 84, nome: 'SABÃO EM PÓ', categoria: 'MERCEARIA', custo_rs: 7.89, preco_sugerido_rs: 15.40, estoque_minimo: 0 },
  { id: 85, nome: 'AMACIANTE', categoria: 'MERCEARIA', custo_rs: 11.29, preco_sugerido_rs: 22.10, estoque_minimo: 0 },
  { id: 86, nome: 'DETERGENTE', categoria: 'MERCEARIA', custo_rs: 2.29, preco_sugerido_rs: 4.50, estoque_minimo: 0 },
  { id: 87, nome: 'VEJA', categoria: 'MERCEARIA', custo_rs: 3.69, preco_sugerido_rs: 7.20, estoque_minimo: 0 },
  { id: 88, nome: 'FARINHA DE TRIGO', categoria: 'MERCEARIA', custo_rs: 2.69, preco_sugerido_rs: 5.30, estoque_minimo: 0 },
  { id: 89, nome: 'MACARRÃO', categoria: 'MERCEARIA', custo_rs: 2.79, preco_sugerido_rs: 5.50, estoque_minimo: 0 },
  { id: 90, nome: 'BISCOITO DE POLVILHO', categoria: 'MERCEARIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 91, nome: 'KITKAT', categoria: 'MERCEARIA', custo_rs: 4.65, preco_sugerido_rs: 9.10, estoque_minimo: 0 },
  { id: 92, nome: 'SUFLAIR', categoria: 'MERCEARIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 93, nome: 'TAPIOCA', categoria: 'MERCEARIA', custo_rs: 6.70, preco_sugerido_rs: 13.10, estoque_minimo: 0 },
  { id: 94, nome: 'ARROZ', categoria: 'MERCEARIA', custo_rs: 3.49, preco_sugerido_rs: 6.90, estoque_minimo: 0 },
  { id: 95, nome: 'FEIJÃO', categoria: 'MERCEARIA', custo_rs: 8.39, preco_sugerido_rs: 16.40, estoque_minimo: 0 },
  { id: 96, nome: 'ATUM EM LATA', categoria: 'MERCEARIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 97, nome: 'VINAGRE', categoria: 'MERCEARIA', custo_rs: 1.90, preco_sugerido_rs: 3.80, estoque_minimo: 0 },
  { id: 98, nome: 'LEITE S/ LACTOSE', categoria: 'MERCEARIA', custo_rs: 5.39, preco_sugerido_rs: 10.60, estoque_minimo: 0 },
  { id: 99, nome: 'CARVÃO', categoria: 'MERCEARIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 100, nome: 'ACENDEDOR', categoria: 'MERCEARIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 101, nome: 'PALITO P/ ESPETO', categoria: 'MERCEARIA', custo_rs: 3.69, preco_sugerido_rs: 7.20, estoque_minimo: 0 },
  { id: 102, nome: 'PALITO DE DENTE', categoria: 'MERCEARIA', custo_rs: 0.99, preco_sugerido_rs: 2.00, estoque_minimo: 0 },
  { id: 103, nome: 'VELA DE ANIVERSÁRIO', categoria: 'MERCEARIA', custo_rs: 8.35, preco_sugerido_rs: 16.30, estoque_minimo: 0 },

  // HIGIENE & EMERGÊNCIA
  { id: 104, nome: 'SABONETE', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 2.10, preco_sugerido_rs: 5.10, estoque_minimo: 0 },
  { id: 105, nome: 'PAPEL HIGIÊNICO', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 3.79, preco_sugerido_rs: 9.20, estoque_minimo: 0 },
  { id: 106, nome: 'ABSORVENTE', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 4.55, preco_sugerido_rs: 11.10, estoque_minimo: 0 },
  { id: 107, nome: 'DESODORANTE EM SPRAY', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 13.90, preco_sugerido_rs: 33.70, estoque_minimo: 0 },
  { id: 108, nome: 'DESODORANTE EM ROLLON', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 8.99, preco_sugerido_rs: 21.80, estoque_minimo: 0 },
  { id: 109, nome: 'PROTETOR SOLAR', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 52.90, preco_sugerido_rs: 128.10, estoque_minimo: 0 },
  { id: 110, nome: 'BAND-AID', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 111, nome: 'PASTA DE DENTE', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 2.99, preco_sugerido_rs: 7.30, estoque_minimo: 0 },
  { id: 112, nome: 'PRESERVATIVO', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 113, nome: 'PAPEL TOALHA', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 3.29, preco_sugerido_rs: 8.00, estoque_minimo: 0 },
  { id: 114, nome: 'ENGOV', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 115, nome: 'EPOCLER', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 116, nome: 'ANALGÉSICO', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 117, nome: 'ANTITÉRMICO', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 118, nome: 'DRAMIN', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 119, nome: 'PARA MACHUCADOS', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 120, nome: 'LENÇO UMEDECIDO', categoria: 'HIGIENE & EMERGÊNCIA', custo_rs: 8.90, preco_sugerido_rs: 21.60, estoque_minimo: 0 },

  // GELADEIRA
  { id: 121, nome: 'ESCOVA DE DENTE', categoria: 'GELADEIRA', custo_rs: 4.15, preco_sugerido_rs: 7.80, estoque_minimo: 0 },
  { id: 122, nome: 'REPELENTE', categoria: 'GELADEIRA', custo_rs: null, preco_sugerido_rs: null, estoque_minimo: 0 },
  { id: 123, nome: 'MANTEIGA', categoria: 'GELADEIRA', custo_rs: 3.20, preco_sugerido_rs: 6.10, estoque_minimo: 0 },
  { id: 124, nome: 'REQUEIJÃO', categoria: 'GELADEIRA', custo_rs: 6.99, preco_sugerido_rs: 13.20, estoque_minimo: 0 },
  { id: 125, nome: 'QUEIJO', categoria: 'GELADEIRA', custo_rs: 8.65, preco_sugerido_rs: 16.30, estoque_minimo: 0 },
  { id: 126, nome: 'PRESUNTO', categoria: 'GELADEIRA', custo_rs: 7.49, preco_sugerido_rs: 14.10, estoque_minimo: 0 },
  { id: 127, nome: 'MORTADELA', categoria: 'GELADEIRA', custo_rs: 4.89, preco_sugerido_rs: 9.20, estoque_minimo: 0 },
  { id: 128, nome: 'ÁGUA DE COCO', categoria: 'GELADEIRA', custo_rs: 1.99, preco_sugerido_rs: 3.80, estoque_minimo: 0 },
  { id: 129, nome: 'YOPRO', categoria: 'GELADEIRA', custo_rs: 7.65, preco_sugerido_rs: 14.40, estoque_minimo: 0 },
  { id: 130, nome: 'POWERADE', categoria: 'GELADEIRA', custo_rs: 4.29, preco_sugerido_rs: 8.10, estoque_minimo: 0 },
];

/**
 * Retorna a margem padrão para uma categoria
 */
export function getDefaultMarginForCategory(
  categoria: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  const found = config.margens_por_categoria.find(
    m => m.categoria.toUpperCase() === categoria.toUpperCase()
  );
  return found ? found.margem_pct : 30; // Fallback: 30%
}

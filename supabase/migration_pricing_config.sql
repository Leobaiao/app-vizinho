-- Migration: Adicionar suporte a precificação do Mini Mercado
-- Data: 2026-06-08
-- Descrição: Adiciona coluna pricing_config (JSONB) na tabela settings
--            e practiced_price na tabela products.

-- 1. Adicionar campo de configuração global de precificação na tabela settings
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS pricing_config JSONB DEFAULT '{}';

-- 2. Adicionar campo de preço praticado nos produtos
ALTER TABLE products
ADD COLUMN IF NOT EXISTS practiced_price DECIMAL(10,2);

-- 3. Comentários para documentação
COMMENT ON COLUMN settings.pricing_config IS 'Configuração JSON completa de precificação (taxas, margens, custos fixos, etc.)';
COMMENT ON COLUMN products.practiced_price IS 'Preço efetivamente praticado na gôndola (pode diferir do preço sugerido)';

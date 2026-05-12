-- 1. Tabelas Principais

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  barcode TEXT,
  image_url TEXT,
  cost_price DECIMAL(10,2) NOT NULL,
  market_price DECIMAL(10,2),
  market_costs JSONB DEFAULT '[]',
  selling_price DECIMAL(10,2),
  margin_percent DECIMAL(5,2) DEFAULT 30,
  payment_fees DECIMAL(5,2) DEFAULT 0,
  fixed_costs DECIMAL(10,2) DEFAULT 0,
  min_margin DECIMAL(5,2) DEFAULT 20,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_barcode ON products(barcode);

-- Inventory Counts
CREATE TABLE inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  counted_quantity INTEGER NOT NULL DEFAULT 0,
  expected_quantity INTEGER,
  count_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_counts_user_id ON inventory_counts(user_id);
CREATE INDEX idx_inventory_counts_product_id ON inventory_counts(product_id);

-- Inventory Sessions (Novo Sistema de Contagem)
CREATE TABLE inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE inventory_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  counted_quantity INTEGER NOT NULL DEFAULT 0,
  expected_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Batches (Histórico de Lotes)
CREATE TABLE product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_sessions_user_id ON inventory_sessions(user_id);
CREATE INDEX idx_inventory_session_items_session_id ON inventory_session_items(session_id);
CREATE INDEX idx_product_batches_product_id ON product_batches(product_id);

-- Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nfe_key TEXT,
  nfe_number TEXT,
  series INTEGER,
  issue_date TIMESTAMPTZ,
  supplier_name TEXT,
  supplier_cnpj TEXT,
  total_amount DECIMAL(10,2),
  xml_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_nfe_key ON purchases(nfe_key);

-- Purchase Items
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  barcode TEXT,
  description TEXT NOT NULL,
  ncm TEXT,
  quantity DECIMAL(10,4) NOT NULL,
  unit_price DECIMAL(10,4) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) NOT NULL,
  default_margin_percent DECIMAL(5,2) DEFAULT 30,
  default_payment_fee DECIMAL(5,2) DEFAULT 0,
  total_fixed_costs DECIMAL(10,2) DEFAULT 0,
  estimated_monthly_sales INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ativar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Products
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Inventory
CREATE POLICY "Users can view own inventory counts" ON inventory_counts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory counts" ON inventory_counts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Purchases
CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchases" ON purchases FOR DELETE USING (auth.uid() = user_id);

-- Purchase Items (vincular via purchase_id)
CREATE POLICY "Users can view own purchase items" ON purchase_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid())
);
CREATE POLICY "Users can insert own purchase items" ON purchase_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid())
);

-- Settings
CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);

-- 4. Storage (product-images bucket)
-- Nota: O bucket deve ser criado manualmente no dashboard do Supabase antes
-- ou via API se permitido.

-- Policies para Storage
CREATE POLICY "Users can upload own product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policies para Sessions e Batches
CREATE POLICY "Users can manage own inventory sessions" ON inventory_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory session items" ON inventory_session_items FOR ALL USING (
  EXISTS (SELECT 1 FROM inventory_sessions WHERE inventory_sessions.id = inventory_session_items.session_id AND inventory_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can manage own product batches" ON product_batches FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_batches.product_id AND products.user_id = auth.uid())
);

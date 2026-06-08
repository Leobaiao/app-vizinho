import type { ProductBatch } from './inventory_session';

export interface MarketCost {
  price: number;
  location: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  barcode?: string;
  image_url?: string;
  cost_price: number;
  market_price?: number;
  market_costs?: MarketCost[];
  selling_price?: number;
  practiced_price?: number;
  margin_percent: number;
  payment_fees: number;
  fixed_costs: number;
  min_margin: number;
  current_stock: number;
  min_stock?: number;
  batch_number?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  product_batches?: ProductBatch[];
}


export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<ProductInsert>;


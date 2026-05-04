export interface Product {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  barcode?: string;
  image_url?: string;
  cost_price: number;
  market_price?: number;
  selling_price?: number;
  margin_percent: number;
  payment_fees: number;
  fixed_costs: number;
  min_margin: number;
  current_stock: number;
  min_stock?: number;
  created_at: string;
  updated_at: string;
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<ProductInsert>;

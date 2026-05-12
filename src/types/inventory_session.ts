export interface InventorySession {
  id: string;
  user_id: string;
  status: 'open' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface InventorySessionItem {
  id: string;
  session_id: string;
  product_id: string;
  counted_quantity: number;
  expected_quantity?: number;
  created_at: string;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  created_at: string;
}

export type InventorySessionInsert = Omit<InventorySession, 'id' | 'created_at'>;
export type InventorySessionItemInsert = Omit<InventorySessionItem, 'id' | 'created_at'>;
export type ProductBatchInsert = Omit<ProductBatch, 'id' | 'created_at'>;

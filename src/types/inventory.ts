export interface InventoryCount {
  id: string;
  product_id: string;
  counted_quantity: number;
  expected_quantity?: number;
  notes?: string;
  created_at: string;
}

export type InventoryCountInsert = Omit<InventoryCount, 'id' | 'created_at'>;

export interface Purchase {
  id: string;
  user_id: string;
  nfe_key?: string;
  nfe_number?: string;
  series?: number;
  issue_date?: string;
  supplier_name?: string;
  supplier_cnpj?: string;
  total_amount: number;
  xml_data?: any;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id?: string;
  barcode?: string;
  description: string;
  ncm?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
  created_at: string;
}

export type PurchaseInsert = Omit<Purchase, 'id' | 'created_at'>;
export type PurchaseItemInsert = Omit<PurchaseItem, 'id' | 'created_at'>;

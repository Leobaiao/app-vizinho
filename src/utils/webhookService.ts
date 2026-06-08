import type { Product } from '../types/product';
import type { PricingConfig } from '../types/pricing_config';

interface WebhookAlertPayload {
  alert_type: 'vencimento_estoque' | 'teste';
  timestamp: string;
  days_threshold: number;
  stock_threshold: number;
  expiring_products: Array<{
    id: string;
    name: string;
    barcode?: string;
    category?: string;
    current_stock: number;
    min_stock?: number;
    expiry_date: string;
    days_left: number;
    batch_number?: string;
    quantity?: number;
  }>;
  low_stock_products: Array<{
    id: string;
    name: string;
    barcode?: string;
    category?: string;
    current_stock: number;
    min_stock?: number;
  }>;
}

const STORAGE_LAST_SENT = 'vizinho_webhook_last_sent';

export function getWebhookAlertData(products: Product[], config: PricingConfig) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysDiff = (dateStr: string) => {
    const d = new Date(dateStr);
    // Adjust timezone offset so it parses correctly as local date
    const dLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = dLocal.getTime() - todayLocal.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysThreshold = config.webhook_days_threshold ?? 7;
  const stockThreshold = config.webhook_stock_threshold ?? 5;
  const stockEnabled = config.webhook_stock_threshold_enabled ?? false;

  const expiringProducts: WebhookAlertPayload['expiring_products'] = [];
  const lowStockProducts: WebhookAlertPayload['low_stock_products'] = [];

  products.forEach((product) => {
    // 1. Verificar vencimento por lote ou data do produto
    if (product.product_batches && product.product_batches.length > 0) {
      product.product_batches.forEach((batch) => {
        const daysLeft = getDaysDiff(batch.expiry_date);
        if (daysLeft <= daysThreshold) {
          expiringProducts.push({
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            category: product.category,
            current_stock: product.current_stock,
            min_stock: product.min_stock,
            expiry_date: batch.expiry_date,
            days_left: daysLeft,
            batch_number: batch.batch_number,
            quantity: Number(batch.quantity || 0),
          });
        }
      });
    } else if (product.expiry_date) {
      const daysLeft = getDaysDiff(product.expiry_date);
      if (daysLeft <= daysThreshold) {
        expiringProducts.push({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          category: product.category,
          current_stock: product.current_stock,
          min_stock: product.min_stock,
          expiry_date: product.expiry_date,
          days_left: daysLeft,
          batch_number: product.batch_number || 'Único',
          quantity: product.current_stock,
        });
      }
    }

    // 2. Verificar estoque baixo
    if (stockEnabled) {
      const isLowStock = product.current_stock <= (product.min_stock ?? stockThreshold);
      if (isLowStock) {
        lowStockProducts.push({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          category: product.category,
          current_stock: product.current_stock,
          min_stock: product.min_stock,
        });
      }
    }
  });

  return {
    expiringProducts,
    lowStockProducts,
    daysThreshold,
    stockThreshold,
  };
}

export async function triggerWebhook(
  products: Product[],
  config: PricingConfig,
  isManual = false
): Promise<{ success: boolean; message: string; payload?: WebhookAlertPayload }> {
  const webhookUrl = config.webhook_url;

  if (!webhookUrl) {
    return { success: false, message: 'URL do Webhook não configurada.' };
  }

  const { expiringProducts, lowStockProducts, daysThreshold, stockThreshold } = getWebhookAlertData(
    products,
    config
  );

  // Se for automático e não houver alertas, não envia nada
  if (!isManual && expiringProducts.length === 0 && lowStockProducts.length === 0) {
    return { success: true, message: 'Nenhum item em alerta para enviar.' };
  }

  const payload: WebhookAlertPayload = {
    alert_type: isManual ? 'teste' : 'vencimento_estoque',
    timestamp: new Date().toISOString(),
    days_threshold: daysThreshold,
    stock_threshold: stockThreshold,
    expiring_products: expiringProducts,
    low_stock_products: lowStockProducts,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      if (!isManual) {
        // Grava no localStorage que enviou hoje
        localStorage.setItem(STORAGE_LAST_SENT, new Date().toDateString());
      }
      return { success: true, message: 'Alerta enviado com sucesso!', payload };
    } else {
      return {
        success: false,
        message: `Servidor retornou status ${response.status}: ${response.statusText}`,
        payload,
      };
    }
  } catch (error: any) {
    console.error('Erro ao disparar webhook:', error);
    return {
      success: false,
      message: `Erro de rede/conexão: ${error.message || error}`,
      payload,
    };
  }
}

export function shouldTriggerAutoWebhook(config: PricingConfig): boolean {
  if (!config.webhook_enabled || !config.webhook_url) {
    return false;
  }

  const lastSent = localStorage.getItem(STORAGE_LAST_SENT);
  const todayStr = new Date().toDateString();

  const today = new Date();
  const todayDbStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Se já enviou hoje localmente ou via Edge Function
  if (lastSent === todayStr || (config as any).last_webhook_sent_date === todayDbStr) {
    return false;
  }

  // Verificar se já passou do horário configurado (ex: '09:00')
  const timeStr = config.webhook_time || '09:00';
  const [targetHours, targetMinutes] = timeStr.split(':').map(Number);
  
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(targetHours, targetMinutes, 0, 0);

  return now >= targetTime;
}

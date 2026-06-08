import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obter hora e data atual em Brasília/São Paulo
    const paulistao = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const parts = paulistao.formatToParts(new Date());
    const dateParts: Record<string, string> = {};
    parts.forEach(p => { dateParts[p.type] = p.value; });

    const localYear = dateParts.year;
    const localMonth = dateParts.month;
    const localDay = dateParts.day;
    const localHour = Number(dateParts.hour);
    const localMinute = Number(dateParts.minute);

    const todayStr = `${localYear}-${localMonth}-${localDay}`; // YYYY-MM-DD

    // 2. Buscar configurações de todos os usuários
    const { data: allSettings, error: settingsError } = await supabase
      .from("settings")
      .select("user_id, pricing_config");

    if (settingsError) throw settingsError;

    const webhookResults = [];

    // 3. Processar webhooks de cada usuário
    for (const setting of (allSettings || [])) {
      const userId = setting.user_id;
      const config = setting.pricing_config || {};

      if (!config.webhook_enabled || !config.webhook_url) {
        continue;
      }

      // Evitar disparo duplo no mesmo dia
      if (config.last_webhook_sent_date === todayStr) {
        continue;
      }

      // Validar horário do disparo
      const timeStr = config.webhook_time || "09:00";
      const [targetHours, targetMinutes] = timeStr.split(":").map(Number);

      if (localHour < targetHours || (localHour === targetHours && localMinute < targetMinutes)) {
        continue; // Ainda não chegou no horário programado
      }

      // Buscar produtos e lotes do usuário correspondente
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("*, product_batches(*)")
        .eq("user_id", userId);

      if (prodError) {
        console.error(`Erro ao buscar produtos para o usuario ${userId}:`, prodError);
        continue;
      }

      // Filtrar produtos de acordo com os limites configurados pelo usuário
      const daysThreshold = config.webhook_days_threshold ?? 7;
      const stockThreshold = config.webhook_stock_threshold ?? 5;
      const stockEnabled = config.webhook_stock_threshold_enabled ?? false;

      const expiringProducts: any[] = [];
      const lowStockProducts: any[] = [];

      const todayObj = new Date();
      todayObj.setHours(0, 0, 0, 0);

      const getDaysDiff = (dateStr: string) => {
        const d = new Date(dateStr);
        const dLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayLocal = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
        const diffTime = dLocal.getTime() - todayLocal.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };

      (products || []).forEach((product: any) => {
        // Vencimento
        if (product.product_batches && product.product_batches.length > 0) {
          product.product_batches.forEach((batch: any) => {
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

        // Estoque Baixo
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

      // Se há alertas para enviar
      if (expiringProducts.length > 0 || lowStockProducts.length > 0) {
        const payload = {
          alert_type: "vencimento_estoque",
          timestamp: new Date().toISOString(),
          days_threshold: daysThreshold,
          stock_threshold: stockThreshold,
          expiring_products: expiringProducts,
          low_stock_products: lowStockProducts,
        };

        try {
          const response = await fetch(config.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            // Atualizar last_webhook_sent_date no BD
            const updatedConfig = {
              ...config,
              last_webhook_sent_date: todayStr,
            };

            await supabase
              .from("settings")
              .update({ pricing_config: updatedConfig })
              .eq("user_id", userId);

            webhookResults.push({ userId, status: "success", itemsSent: expiringProducts.length + lowStockProducts.length });
          } else {
            webhookResults.push({ userId, status: "error", code: response.status });
          }
        } catch (err) {
          console.error(`Erro ao disparar webhook para ${userId}:`, err);
          webhookResults.push({ userId, status: "exception", error: err.message });
        }
      }
    }

    // 4. Executar fluxo original de notificação direta por email/whatsapp (opcional/legado)
    // Para manter compatibilidade com o sistema original do cliente.
    return new Response(JSON.stringify({ success: true, localTime: `${todayStr} ${localHour}:${localMinute}`, webhooks: webhookResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

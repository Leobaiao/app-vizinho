import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratar requisição CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Inicializar o cliente do Supabase com a Service Role Key (ignora políticas RLS para automações de backend)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no ambiente.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calcular as datas futuras (em 7 dias e 3 dias)
    const getFutureDateString = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    };

    const date7Days = getFutureDateString(7);
    const date3Days = getFutureDateString(3);

    // Buscar lotes de produtos vencendo exatamente em 3 ou 7 dias
    const { data: expiringBatches, error: dbError } = await supabase
      .from("product_batches")
      .select(`
        id,
        batch_number,
        expiry_date,
        quantity,
        products (
          id,
          name,
          user_id
        )
      `)
      .or(`expiry_date.eq.${date7Days},expiry_date.eq.${date3Days}`);

    if (dbError) throw dbError;

    if (!expiringBatches || expiringBatches.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum lote vencendo em 3 ou 7 dias encontrado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Agrupar lotes por usuário para enviar notificações individualizadas
    const alertsByUser: Record<string, any[]> = {};
    expiringBatches.forEach((batch: any) => {
      const userId = batch.products?.user_id;
      if (userId) {
        if (!alertsByUser[userId]) alertsByUser[userId] = [];
        alertsByUser[userId].push(batch);
      }
    });

    const results = [];

    // Iterar sobre os usuários para enviar os alertas
    for (const [userId, batches] of Object.entries(alertsByUser)) {
      // 1. Obter contato/email do usuário ou configurações do gateway
      // NOTA: Caso o usuário tenha e-mail registrado no auth.users ou nas configurações
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email;

      // 2. Montar mensagem de alerta
      let textContent = `⚠️ *Alerta de Vencimento de Lotes - Vizinho Precifica* ⚠️\n\n`;
      textContent += `Olá! Identificamos produtos no seu estoque próximos do vencimento:\n\n`;

      batches.forEach((b: any) => {
        const diffDays = Math.ceil(
          (new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        const warningIcon = diffDays <= 3 ? "🔴" : "🟡";
        textContent += `${warningIcon} *${b.products?.name}*\n`;
        textContent += `   Lote: ${b.batch_number} | Qtd: ${b.quantity}\n`;
        textContent += `   Validade: ${new Date(b.expiry_date).toLocaleDateString("pt-BR")} (Vence em ${diffDays} dias)\n\n`;
      });

      textContent += `Por favor, atente-se para organizar a exposição FEFO ou realizar promoções!`;

      // 3. Enviar via E-mail ou WhatsApp Gateway
      // Exemplo de integração com Gateway de WhatsApp (ex: Wuzapi, Z-API ou Twilio)
      const whatsappGatewayUrl = Deno.env.get("WHATSAPP_GATEWAY_URL");
      const whatsappInstanceId = Deno.env.get("WHATSAPP_INSTANCE_ID");
      const whatsappToken = Deno.env.get("WHATSAPP_TOKEN");
      const destinationPhone = Deno.env.get(`PHONE_USER_${userId.replace(/-/g, '_')}`) || Deno.env.get("ADMIN_PHONE");

      let notificationSent = false;
      let methodUsed = "Nenhum";

      if (whatsappGatewayUrl && destinationPhone) {
        try {
          const response = await fetch(`${whatsappGatewayUrl}/send-message`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${whatsappToken}`
            },
            body: JSON.stringify({
              instance: whatsappInstanceId,
              to: destinationPhone,
              message: textContent
            })
          });
          
          if (response.ok) {
            notificationSent = true;
            methodUsed = "WhatsApp";
          }
        } catch (err) {
          console.error(`Erro ao disparar WhatsApp para o usuário ${userId}:`, err);
        }
      }

      // Fallback para envio de E-mail (ex: via Resend API)
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!notificationSent && resendApiKey && userEmail) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: "Vizinho Precifica <alertas@vizinhoprecifica.com.br>",
              to: userEmail,
              subject: "⚠️ Alerta de Vencimento de Lotes - FEFO",
              html: textContent.replace(/\n/g, "<br>").replace(/\*(.*?)\*/g, "<strong>$1</strong>")
            })
          });

          if (response.ok) {
            notificationSent = true;
            methodUsed = "E-mail";
          }
        } catch (err) {
          console.error(`Erro ao disparar E-mail para o usuário ${userId}:`, err);
        }
      }

      results.push({
        userId,
        email: userEmail,
        alertCount: batches.length,
        notificationSent,
        methodUsed
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
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

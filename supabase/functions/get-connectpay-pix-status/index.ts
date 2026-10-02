// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function extractIdentifiers(req: Request): Promise<{ externalId: string; transactionId: string }> {
  const url = new URL(req.url);
  let externalId = url.searchParams.get("external_id") || "";
  let transactionId = url.searchParams.get("transaction_id") || "";

  if (req.method === "POST") {
    try {
      const body = await req.json();
      externalId = body.external_id || externalId;
      transactionId = body.transaction_id || transactionId;
    } catch {
      // Ignora erro de parse se o corpo estiver vazio ou não for JSON
    }
  }

  return { externalId, transactionId };
}

async function fetchFromSupabase(supabase: any, externalId: string, transactionId: string) {
  let query = supabase.from("orders").select("*");
  if (externalId && transactionId) {
    query = query.or(`external_id.eq.${externalId},transaction_id.eq.${transactionId}`);
  } else if (externalId) {
    query = query.eq("external_id", externalId);
  } else {
    query = query.eq("transaction_id", transactionId);
  }
  const { data: rows } = await query.limit(1);
  return rows?.[0] || null;
}

async function checkConnectPayFallback(
  supabase: any,
  txId: string,
  externalId: string,
  secret: string,
) {
  if (!txId || !secret) return null;

  try {
    const cpRes = await fetch(`https://api.connectpay.vc/v1/transactions/${encodeURIComponent(txId)}`, {
      headers: {
        "api-secret": secret,
        "Content-Type": "application/json",
      },
    });

    if (!cpRes.ok) return null;

    const apiData = await cpRes.json();
    const isPaid = String(apiData.status || "").toUpperCase() === "AUTHORIZED";

    if (isPaid) {
      await supabase.from("orders").upsert({
        external_id: apiData.external_id || externalId,
        transaction_id: apiData.id || txId,
        status: "AUTHORIZED",
        updated_at: new Date().toISOString(),
      }, { onConflict: "external_id" });

      return {
        ok: true,
        paid: true,
        status: "AUTHORIZED",
        external_id: apiData.external_id || externalId,
        transaction_id: apiData.id || txId,
        amount: apiData.total_value || apiData.amount,
      };
    }
  } catch (error) {
    console.error("Falha ao consultar fallback ConnectPay:", error);
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { externalId, transactionId } = await extractIdentifiers(req);
    const queryId = externalId || transactionId;

    if (!queryId) {
      return new Response(JSON.stringify({ ok: false, error: "Pedido não informado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const connectPaySecret = Deno.env.get("CONNECTPAY_API_SECRET") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Consulta pedido existente no Supabase
    const order = await fetchFromSupabase(supabase, externalId, transactionId);

    if (order && String(order.status).toUpperCase() === "AUTHORIZED") {
      return new Response(JSON.stringify({
        ok: true,
        paid: true,
        status: "AUTHORIZED",
        external_id: order.external_id,
        transaction_id: order.transaction_id,
        amount: order.amount,
        package: order.package,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Consulta fallback na ConnectPay se ainda pendente
    const txId = transactionId || order?.transaction_id || "";
    const fallbackResult = await checkConnectPayFallback(supabase, txId, externalId, connectPaySecret);
    if (fallbackResult) {
      return new Response(JSON.stringify(fallbackResult), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      paid: false,
      status: order?.status || "PENDING",
      external_id: externalId,
      transaction_id: txId,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ ok: false, error: errorDetails }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

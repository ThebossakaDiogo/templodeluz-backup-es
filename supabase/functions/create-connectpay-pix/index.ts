// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const DEFAULT_IP = ["177", "100", "100", "100"].join(".");

function packageFromAmount(amount: number) {
  if (amount >= 59.99) {
    return {
      amount: 60,
      title: "Pacote Sagrado VIP - Tudo Incluso",
      description: "Tudo incluso com prioridade máxima e oráculo 90 dias",
    };
  }
  if (amount >= 54.99) {
    return {
      amount: 55,
      title: "Leitura Completa com Terceira Pessoa",
      description: "10 respostas e revelação de rivais",
    };
  }
  if (amount >= 44.99) {
    return {
      amount: 45,
      title: "Amarração Amorosa com Leitura da Mão",
      description: "7 respostas e amarração amorosa",
    };
  }
  if (amount >= 34.99) {
    return {
      amount: 35,
      title: "Amarração Amorosa com 5 Respostas",
      description: "5 respostas e amarração amorosa",
    };
  }
  if (amount >= 24.99) {
    return {
      amount: 25,
      title: "Leitura Amorosa com Oráculo",
      description: "5 respostas e 30 dias de oráculo",
    };
  }
  return {
    amount: 15,
    title: "Leitura Amorosa Essencial",
    description: "3 respostas e leitura amorosa imediata",
  };
}

function resolveClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const cfIp = req.headers.get("cf-connecting-ip");
  let ip = (forwarded || cfIp || DEFAULT_IP).trim();
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) ? ip : DEFAULT_IP;
}

function generateExternalId(): string {
  const randomSuffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
  return `tdl_${Date.now()}_${randomSuffix}`;
}

function formatCustomerName(rawName?: string, phone?: string): string {
  const clean = (rawName || "").trim().replace(/[^\p{L}\s]/gu, "");
  const phoneDigits = (phone || "").replaceAll(/\D/g, "");
  const phoneSuffix = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
  if (!clean) {
    return `Cliente ${phoneSuffix}`;
  }
  return clean;
}

function generateValidCpf(seed?: string): string {
  const clean = (seed || "").replaceAll(/\D/g, "");
  const baseDigits = (clean + Date.now().toString() + "789123456").slice(0, 9).split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += baseDigits[i] * (10 - i);
  }
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;

  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += baseDigits[i] * (11 - i);
  }
  sum += d1 * 2;
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;

  return [...baseDigits, d1, d2].join("");
}

async function requestConnectPayPix(payload: Record<string, unknown>, secret: string) {
  const response = await fetch("https://api.connectpay.vc/v1/transactions", {
    method: "POST",
    headers: {
      "api-secret": secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { ok: response.ok, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const amount = Number.parseFloat(String(body.amount || 0));
    if (amount < 1) {
      return new Response(JSON.stringify({ ok: false, error: "Valor inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawPhone = String(body.phone || "").replaceAll(/\D/g, "");
    const phone = rawPhone.length >= 10 ? rawPhone : (rawPhone.length > 0 ? `119${rawPhone.padEnd(8, "0")}` : `119${Math.floor(10000000 + Math.random() * 90000000)}`);
    const customerName = formatCustomerName(body.name, phone);
    const rawDoc = String(body.document || body.cpf || "").replaceAll(/\D/g, "");
    const document = rawDoc.length === 11 ? rawDoc : generateValidCpf(phone);
    const email = body.email ? String(body.email).trim() : `cliente_${phone.slice(-9)}_${Date.now().toString().slice(-4)}@templodaluz.larequilibrado.com`;

    const ente = String(body.ente || "").trim();
    const letter = String(body.letter || "").trim();
    const tracking = body.tracking || {};

    let pkg = packageFromAmount(amount);
    if (body.package_override?.title) {
      pkg = { ...pkg, ...body.package_override };
    }

    const externalId = generateExternalId();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const connectPaySecret = Deno.env.get("CONNECTPAY_API_SECRET") ?? "";

    if (!connectPaySecret) {
      return new Response(JSON.stringify({ ok: false, error: "CONNECTPAY_API_SECRET não configurado nos Secrets do Supabase." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/checkout-webhook`;
    const clientIp = resolveClientIp(req);

    const cpPayload = {
      external_id: externalId,
      total_amount: Math.round(amount * 100) / 100,
      payment_method: "PIX",
      webhook_url: webhookUrl,
      ip: clientIp,
      items: [{
        id: `tarot_${String(amount).replaceAll(".", "_")}`,
        title: pkg.title,
        description: pkg.description || "Leitura de tarot espiritual",
        price: Math.round(amount * 100) / 100,
        quantity: 1,
        is_physical: false,
      }],
      customer: {
        name: customerName,
        email,
        phone,
        document_type: "CPF",
        document,
      },
    };

    const cpResult = await requestConnectPayPix(cpPayload, connectPaySecret);
    const api = cpResult.data;

    if (!cpResult.ok) {
      return new Response(JSON.stringify({
        ok: false,
        error: api.message || api.error || "A ConnectPay recusou a criação do PIX",
        detail: api,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pixPayload = api.pix?.payload || api.payload || api.pix_payload || api.qr_code || "";
    const transactionId = api.id || api.transaction_id || "";
    const status = api.status || "PENDING";

    if (!pixPayload || !transactionId) {
      return new Response(JSON.stringify({ ok: false, error: "ConnectPay não retornou dados do PIX", detail: api }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("orders").upsert({
        external_id: externalId,
        transaction_id: transactionId,
        status,
        amount: Math.round(amount * 100) / 100,
        payment_method: "PIX",
        name: customerName,
        phone,
        email,
        document,
        ente,
        letter,
        package_title: pkg.title,
        package_description: pkg.description,
        package: pkg,
        tracking,
        updated_at: new Date().toISOString(),
      }, { onConflict: "external_id" });
    }

    return new Response(JSON.stringify({
      ok: true,
      external_id: externalId,
      transaction_id: transactionId,
      status,
      amount: Math.round(amount * 100) / 100,
      pix_payload: pixPayload,
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

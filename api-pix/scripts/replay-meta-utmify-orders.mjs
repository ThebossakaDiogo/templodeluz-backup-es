import { readFileSync } from "node:fs";

function loadEnv(path) {
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return values;
}

const fileEnv = loadEnv(process.env.ENV_FILE || ".env.local");
const supabaseUrl = process.env.SUPABASE_URL || fileEnv.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;
const connectPaySecret = process.env.CONNECTPAY_API_SECRET || fileEnv.CONNECTPAY_API_SECRET;
const utmifyToken = process.env.UTMIFY_API_TOKEN;
const orderIds = (process.env.ORDER_IDS || "").split(",").map((value) => value.trim()).filter(Boolean);

if (process.env.CONFIRM_REPLAY !== "YES") throw new Error("Set CONFIRM_REPLAY=YES to execute.");
if (!supabaseUrl || !serviceKey || !connectPaySecret || !utmifyToken) throw new Error("Missing credentials.");
if (orderIds.length === 0) throw new Error("ORDER_IDS is empty.");

const dbHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function rpc(name, body) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: dbHeaders,
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${name} failed (${response.status}): ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const fields = [
  "id", "connectpay_transaction_id", "amount_cents", "created_at", "updated_at",
  "customer_name", "customer_email", "customer_phone", "customer_cpf",
  "product_id", "product_name", "src", "sck", "utm_source", "utm_medium",
  "utm_campaign", "utm_content", "utm_term",
].join(",");
const filter = `in.(${orderIds.join(",")})`;
const ordersResponse = await fetch(
  `${supabaseUrl}/rest/v1/pix_orders?id=${encodeURIComponent(filter)}&select=${fields}`,
  { headers: dbHeaders },
);
if (!ordersResponse.ok) throw new Error(`Order query failed (${ordersResponse.status}).`);
const orders = await ordersResponse.json();
if (orders.length !== orderIds.length) throw new Error(`Expected ${orderIds.length} orders, found ${orders.length}.`);

const paidStatuses = new Set(["AUTHORIZED", "PAID", "APPROVED"]);
const formatDate = (value) => new Date(value).toISOString().replace("T", " ").slice(0, 19);
const results = [];

for (const order of orders) {
  const gatewayResponse = await fetch(
    `https://api.connectpay.vc/v1/transactions/${encodeURIComponent(order.connectpay_transaction_id)}`,
    { headers: { "api-secret": connectPaySecret, "Content-Type": "application/json" } },
  );
  const gatewayPayload = await gatewayResponse.json().catch(() => ({}));
  const transaction = gatewayPayload.data || gatewayPayload;
  const gatewayStatus = String(transaction.status || "").toUpperCase();
  const gatewayAmountCents = Math.round(Number(transaction.total_amount ?? transaction.amount) * 100);
  if (
    !gatewayResponse.ok
    || !paidStatuses.has(gatewayStatus)
    || String(transaction.external_id) !== order.id
    || String(transaction.id) !== order.connectpay_transaction_id
    || gatewayAmountCents !== order.amount_cents
  ) {
    throw new Error(`Gateway verification failed for order ${order.id}.`);
  }

  const payload = {
    orderId: order.id,
    platform: "TemploDeLuzMeta",
    paymentMethod: "pix",
    status: "paid",
    createdAt: formatDate(order.created_at),
    approvedDate: formatDate(order.created_at),
    refundedAt: null,
    customer: {
      name: order.customer_name || "Consulente Templo de Luz",
      email: order.customer_email || "contato@templodeluz.com",
      phone: order.customer_phone || null,
      document: order.customer_cpf || null,
      country: "BR",
    },
    products: [{
      id: order.product_id || "carta_sagrada",
      name: order.product_name || "Doacao ao Templo de Luz",
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: order.amount_cents,
    }],
    trackingParameters: {
      src: order.src || null,
      sck: order.sck || null,
      utm_source: order.utm_source || null,
      utm_medium: order.utm_medium || null,
      utm_campaign: order.utm_campaign || null,
      utm_content: order.utm_content || null,
      utm_term: order.utm_term || null,
    },
    commission: {
      totalPriceInCents: order.amount_cents,
      gatewayFeeInCents: 0,
      userCommissionInCents: order.amount_cents,
      currency: "BRL",
    },
    isTest: false,
  };

  const claimed = await rpc("claim_utmify_delivery", {
    p_order_id: order.id,
    p_destination: "meta_recovery",
    p_event_status: "paid",
    p_payload: payload,
  });
  if (!claimed) {
    results.push({ orderId: order.id, skipped: true, reason: "already_sent_or_processing" });
    continue;
  }

  let utmifyResponse;
  let responseBody = "";
  let errorMessage = null;
  try {
    utmifyResponse = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": utmifyToken },
      body: JSON.stringify(payload),
    });
    responseBody = await utmifyResponse.text();
    if (!utmifyResponse.ok) throw new Error(`UTMIFY_HTTP_${utmifyResponse.status}`);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  const success = Boolean(utmifyResponse?.ok && !errorMessage);
  await rpc("finish_utmify_delivery", {
    p_order_id: order.id,
    p_destination: "meta_recovery",
    p_event_status: "paid",
    p_success: success,
    p_http_status: utmifyResponse?.status || 0,
    p_response_body: responseBody,
    p_error: errorMessage,
  });
  results.push({ orderId: order.id, gatewayStatus, httpStatus: utmifyResponse?.status || 0, success });
}

console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.success === false)) process.exitCode = 1;

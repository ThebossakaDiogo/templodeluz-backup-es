import { PIX_CONFIG_ORIGINAL, pixFunctionHeaders } from "./pix-config";
import { getMetaBrowserAttribution } from "./metaPixel";
import { getStoredUtms } from "./utmify";

export interface StripeCheckoutInput {
  amountCents: number;
  productId: "carta_sagrada" | "cirurgia_milena" | "chamada_ao_vivo_milena";
  productName: string;
  customerName?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createStripeCheckoutSession(input: StripeCheckoutInput): Promise<{ url: string }> {
  const supabaseUrl = PIX_CONFIG_ORIGINAL.supabaseUrl;
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/create-stripe-checkout`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const successUrl = input.successUrl || (input.productId === "carta_sagrada"
    ? `${origin}/apoio-milena?payment=stripe_success`
    : `${origin}/obrigado?payment=stripe_success`);
  const cancelUrl = input.cancelUrl || (typeof window !== "undefined" ? window.location.href : `${origin}/`);
  const trackingParameters = getStoredUtms();
  const metaAttribution = getMetaBrowserAttribution();
  const idempotencyKey = crypto.randomUUID();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: pixFunctionHeaders(),
    body: JSON.stringify({
      amountCents: input.amountCents,
      productName: input.productName,
      customerName: input.customerName,
      productId: input.productId,
      successUrl,
      cancelUrl,
      trackingParameters,
      metaAttribution,
      idempotencyKey,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.url) {
    throw new Error(data?.message || data?.error || "Não foi possível iniciar o checkout da Stripe no momento.");
  }
  return { url: data.url };
}

export async function verifyStripeCheckoutSession(input: {
  readonly sessionId: string;
  readonly productId: StripeCheckoutInput["productId"];
  readonly amountCents: number;
}): Promise<boolean> {
  const endpoint = `${PIX_CONFIG_ORIGINAL.supabaseUrl.replace(/\/$/, "")}/functions/v1/create-stripe-checkout`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: pixFunctionHeaders(),
    body: JSON.stringify({ action: "verify_session", ...input }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Não foi possível validar o pagamento por cartão.");
  return data?.paid === true;
}

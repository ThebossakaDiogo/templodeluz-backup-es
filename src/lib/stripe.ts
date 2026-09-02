export interface StripeCheckoutInput {
  amountCents: number;
  productId: "carta_sagrada" | "cirurgia_milena";
  productName: string;
  customerName?: string;
  successUrl?: string;
  cancelUrl?: string;
}

const DEFAULT_SUPABASE_URL = "https://opftmzegcvfyoinjfmcj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24";

import { getStoredUtms } from "./utmify";

export async function createStripeCheckoutSession(input: StripeCheckoutInput): Promise<{ url: string }> {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_SUPABASE_URL;
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_SUPABASE_ANON_KEY;

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/create-stripe-checkout`;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const successUrl =
    input.successUrl ||
    (input.productId === "carta_sagrada"
      ? `${origin}/apoio-milena?payment=stripe_success`
      : `${origin}/obrigado?payment=stripe_success`);

  const cancelUrl = input.cancelUrl || (typeof window !== "undefined" ? window.location.href : `${origin}/`);
  const trackingParameters = getStoredUtms();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      amountCents: input.amountCents,
      productName: input.productName,
      customerName: input.customerName,
      productId: input.productId,
      successUrl,
      cancelUrl,
      trackingParameters,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.url) {
    throw new Error(data?.message || data?.error || "Não foi possível iniciar o checkout da Stripe no momento.");
  }

  return { url: data.url };
}

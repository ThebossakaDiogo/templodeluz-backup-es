/**
 * Telemetria de Conversas do WhatsApp
 * Registra o momento em que o consulente envia a mensagem para a médium,
 * capturando nome, ente querido e a forma de pagamento que utilizou (PIX, Cartão Stripe ou Pendente).
 */

const DEFAULT_SUPABASE_URL = "https://yfpiqfytonuhigwkssio.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmcGlxZnl0b251aGlnd2tzc2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzU1MzYsImV4cCI6MjEwNDIxMTUzNn0.tcfCDn257Rdd9gqKoic3eMTpucI53uiuk3lbG1fbERA";

const supabaseUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) || DEFAULT_SUPABASE_ANON_KEY;

export interface WhatsAppEventPayload {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  enteQuerido?: string;
  grauParentesco?: string;
  paymentMethod: "pix" | "credit_card" | "pending" | "none";
  paymentStatus: "paid" | "pending" | "none";
  amountCents?: number;
  sourcePage?: string;
  messagePreview?: string;
}

export async function trackWhatsAppEvent(payload: WhatsAppEventPayload): Promise<void> {
  try {
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const utm_source = urlParams?.get("utm_source") || null;
    const utm_medium = urlParams?.get("utm_medium") || null;
    const utm_campaign = urlParams?.get("utm_campaign") || null;

    // Dispara requisição REST para salvar na tabela whatsapp_conversations
    const res = await fetch(`${supabaseUrl}/rest/v1/whatsapp_conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        customer_name: payload.customerName || "Consulente",
        customer_phone: payload.customerPhone || null,
        customer_email: payload.customerEmail || null,
        ente_querido: payload.enteQuerido || null,
        grau_parentesco: payload.grauParentesco || null,
        payment_method: payload.paymentMethod || "pending",
        payment_status: payload.paymentStatus || "pending",
        amount_cents: payload.amountCents ?? 0,
        source_page: payload.sourcePage || "escrever_carta",
        message_preview: payload.messagePreview || null,
        utm_source,
        utm_medium,
        utm_campaign,
      }),
    });

    if (!res.ok) {
      console.warn("[WHATSAPP TRACK WARN] Resposta Supabase:", res.status);
    }

    // Disparo para o Meta Pixel
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("trackCustom", "WhatsAppInitiated", {
        customer_name: payload.customerName,
        payment_method: payload.paymentMethod,
        payment_status: payload.paymentStatus,
      });
    }
  } catch (err) {
    console.warn("[WHATSAPP TELEMETRY ERROR]", err);
  }
}

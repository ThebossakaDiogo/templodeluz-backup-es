/**
 * Telemetria de Conversas do WhatsApp
 * Registra o momento em que o consulente envia a mensagem para a médium,
 * capturando nome, ente querido e a forma de pagamento que utilizou (PIX, Cartão Stripe ou Pendente).
 */

import { PIX_CONFIG_ORIGINAL } from "./pix-config";
import { getStoredUtms } from "@/lib/utmify";

const supabaseUrl = PIX_CONFIG_ORIGINAL.supabaseUrl;
const supabaseAnonKey = PIX_CONFIG_ORIGINAL.supabaseAnonKey;

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
    const utms = getStoredUtms();

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
        utm_source: utms.utm_source,
        utm_medium: utms.utm_medium,
        utm_campaign: utms.utm_campaign,
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

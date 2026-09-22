/**
 * Telemetria em Tempo Real do Funil de Psicografia
 * Envia o progresso de cada etapa, tempo de permanência e eventos de checkout diretamente ao Supabase
 */

import { PIX_CONFIG_ORIGINAL } from "./pix-config";

const supabaseUrl = PIX_CONFIG_ORIGINAL.supabaseUrl;
const supabaseAnonKey = PIX_CONFIG_ORIGINAL.supabaseAnonKey;

export type CheckoutEvent =
  | "step_view"
  | "checkout_initiated"
  | "checkout_opened"
  | "checkout_form_started"
  | "pix_generated"
  | "card_declined"
  | "card_abandoned"
  | "completed";

export interface FunnelProgressPayload {
  stepIndex: number;
  stepName: string;
  leadName?: string | undefined;
  leadEmail?: string | undefined;
  leadPhone?: string | undefined;
  enteQuerido?: string | undefined;
  grauParentesco?: string | undefined;
  mensagemPreview?: string | undefined;
  temas?: string[] | undefined;
  completed?: boolean | undefined;
  paymentStatus?: ("none" | "waiting_payment" | "paid" | "failed") | undefined;
  amountCents?: number | undefined;
  checkoutEvent?: CheckoutEvent | undefined;
}

const SESSION_STORAGE_KEY = "templodeluz_telemetry_session_id";
const QUIZ_START_TIME_KEY = "templodeluz_quiz_start_timestamp";

/**
 * Retorna ou gera o ID único da sessão do visitante
 */
export function getTelemetrySessionId(): string {
  if (typeof window === "undefined") return "server_session";
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    const randomPart = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36);
    sessionId = `tl_${Date.now()}_${randomPart}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Retorna o tempo decorrido no quiz em segundos (desde a primeira interação)
 */
export function getQuizTimeSpentSeconds(): number {
  if (typeof window === "undefined") return 0;
  let start = sessionStorage.getItem(QUIZ_START_TIME_KEY);
  if (!start) {
    start = String(Date.now());
    sessionStorage.setItem(QUIZ_START_TIME_KEY, start);
  }
  const diffMs = Date.now() - Number(start);
  return Math.max(1, Math.round(diffMs / 1000));
}

/**
 * Envia o progresso de cada etapa ao Supabase
 */
export function trackQuizStep(payload: FunnelProgressPayload): void {
  if (typeof window === "undefined") return;

  try {
    const sessionId = getTelemetrySessionId();
    const timeSpentSeconds = getQuizTimeSpentSeconds();

    const utmsRaw = localStorage.getItem("templodeluz_utm_parameters");
    let utms: Record<string, string | null> = {};
    if (utmsRaw) {
      try {
        utms = JSON.parse(utmsRaw);
      } catch {
        // ignore
      }
    }

    const rpcBody = {
      p_session_id: sessionId,
      p_step_index: payload.stepIndex,
      p_step_name: payload.stepName,
      p_lead_name: payload.leadName || null,
      p_lead_email: payload.leadEmail || null,
      p_lead_phone: payload.leadPhone || null,
      p_ente_querido: payload.enteQuerido || null,
      p_grau_parentesco: payload.grauParentesco || null,
      p_mensagem_preview: payload.mensagemPreview || null,
      p_temas: payload.temas && payload.temas.length > 0 ? payload.temas : null,
      p_completed: payload.completed || false,
      p_time_spent_seconds: timeSpentSeconds ?? 0,
      p_checkout_event: payload.checkoutEvent || (payload.stepIndex >= 8 ? "checkout_initiated" : "none"),
      p_payment_status: payload.paymentStatus || "none",
      p_amount_cents: payload.amountCents || 0,
      p_utm_source: utms["utm_source"] || null,
      p_utm_medium: utms["utm_medium"] || null,
      p_utm_campaign: utms["utm_campaign"] || null,
      p_utm_content: utms["utm_content"] || null,
      p_utm_term: utms["utm_term"] || null,
      p_src: utms["src"] || null,
      p_sck: utms["sck"] || null,
      p_ttclid: utms["ttclid"] || null,
    };

    // A RPC aplica atualizações monotônicas e grava um único evento de etapa.
    // O antigo upsert paralelo podia regredir estados como "pix_generated" para "checkout_initiated".
    void fetch(`${supabaseUrl}/rest/v1/rpc/track_quiz_progress`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(rpcBody),
    }).then((response) => {
      if (!response.ok) {
        console.warn("[FUNNEL TELEMETRY WARN]", response.status, payload.stepName);
      }
    }).catch((error: unknown) => {
      console.warn("[FUNNEL TELEMETRY ERROR]", payload.stepName, error);
    });
  } catch (error) {
    console.warn("[FUNNEL TELEMETRY ERROR]", payload.stepName, error);
  }
}

/**
 * Disparado somente no clique real que abre o modal de checkout.
 */
export function trackCheckoutInitiated(params: {
  leadName?: string | undefined;
  leadEmail?: string | undefined;
  leadPhone?: string | undefined;
  amountCents?: number | undefined;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout_opened",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    leadPhone: params.leadPhone,
    amountCents: params.amountCents,
    checkoutEvent: "checkout_initiated",
    paymentStatus: "none",
  });
}

/** Disparado uma vez ao preencher o primeiro campo do modal de pagamento. */
export function trackCheckoutFormStarted(params: {
  leadName?: string | undefined;
  leadEmail?: string | undefined;
  leadPhone?: string | undefined;
  amountCents?: number | undefined;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout_form_started",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    leadPhone: params.leadPhone,
    amountCents: params.amountCents,
    checkoutEvent: "checkout_form_started",
    paymentStatus: "none",
  });
}

/**
 * Disparado no momento em que um código PIX é gerado na tela
 */
export function trackPixGenerated(params: {
  leadName?: string | undefined;
  leadEmail?: string | undefined;
  leadPhone?: string | undefined;
  amountCents?: number | undefined;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout_pix",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    leadPhone: params.leadPhone,
    amountCents: params.amountCents,
    checkoutEvent: "pix_generated",
    paymentStatus: "waiting_payment",
  });
}

/**
 * Disparado quando uma transação com cartão é recusada ou falha
 */
export function trackCardDeclined(params: {
  leadName?: string | undefined;
  leadEmail?: string | undefined;
  leadPhone?: string | undefined;
  amountCents?: number | undefined;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout_card_failed",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    leadPhone: params.leadPhone,
    amountCents: params.amountCents,
    checkoutEvent: "card_declined",
    paymentStatus: "failed",
  });
}

/**
 * Disparado quando a pessoa chega no checkout e abandona/fecha
 */
export function trackCardAbandoned(params: {
  leadName?: string | undefined;
  leadEmail?: string | undefined;
  leadPhone?: string | undefined;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout_abandoned",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    leadPhone: params.leadPhone,
    checkoutEvent: "card_abandoned",
  });
}

let phoneSyncDebounce: number | undefined;

/**
 * Sincroniza em tempo real o número de WhatsApp/telefone do lead no Supabase.
 * Executado no onChange do campo com debounce de 400ms para salvar mesmo em abandonos.
 */
export function syncLeadPhone(phone: string, leadName?: string): void {
  if (typeof window === "undefined") return;
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 9) return;

  if (phoneSyncDebounce) {
    window.clearTimeout(phoneSyncDebounce);
  }

  phoneSyncDebounce = window.setTimeout(() => {
    syncLeadPhoneImmediate(cleanPhone, leadName);
  }, 400);
}

/**
 * Envia o WhatsApp/telefone imediatamente (ex: onBlur ou submit)
 */
export function syncLeadPhoneImmediate(phone: string, leadName?: string): void {
  if (typeof window === "undefined") return;
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 9) return;

  try {
    localStorage.setItem("templodeluz_lead_phone", cleanPhone);
    if (leadName?.trim() && leadName !== "Consulente") {
      localStorage.setItem("templodeluz_lead_name", leadName.trim());
    }

    const sessionId = getTelemetrySessionId();
    const payload: Record<string, unknown> = {
      session_id: sessionId,
      lead_phone: cleanPhone,
      updated_at: new Date().toISOString(),
    };
    if (leadName?.trim() && leadName !== "Consulente") {
      payload["lead_name"] = leadName.trim();
    }

    void fetch(`${supabaseUrl}/rest/v1/quiz_funnel_leads?on_conflict=session_id`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    }).then((response) => {
      if (!response.ok) console.warn("[LEAD PHONE SYNC WARN]", response.status);
    }).catch((error: unknown) => {
      console.warn("[LEAD PHONE SYNC ERROR]", error);
    });
  } catch (error) {
    console.warn("[LEAD PHONE SYNC ERROR]", error);
  }
}

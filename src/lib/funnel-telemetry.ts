/**
 * Telemetria em Tempo Real do Funil de Psicografia
 * Envia o progresso de cada etapa, tempo de permanência e eventos de checkout diretamente ao Supabase
 */

const DEFAULT_SUPABASE_URL = "https://opftmzegcvfyoinjfmcj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24";

const supabaseUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) || DEFAULT_SUPABASE_ANON_KEY;

export type CheckoutEvent =
  | "step_view"
  | "checkout_initiated"
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
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `tl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Retorna o tempo decorrido no quiz em segundos (desde a primeira interação)
 */
export function getQuizTimeSpentSeconds(): number {
  if (typeof window === "undefined") return 0;
  let start = localStorage.getItem(QUIZ_START_TIME_KEY);
  if (!start) {
    start = String(Date.now());
    localStorage.setItem(QUIZ_START_TIME_KEY, start);
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
      p_time_spent_seconds: timeSpentSeconds,
      p_checkout_event: payload.checkoutEvent || (payload.stepIndex >= 8 ? "checkout_initiated" : null),
      p_payment_status: payload.paymentStatus || null,
      p_amount_cents: payload.amountCents || null,
      p_utm_source: utms["utm_source"] || null,
      p_utm_medium: utms["utm_medium"] || null,
      p_utm_campaign: utms["utm_campaign"] || null,
      p_utm_content: utms["utm_content"] || null,
      p_utm_term: utms["utm_term"] || null,
      p_src: utms["src"] || null,
    };

    fetch(`${supabaseUrl}/rest/v1/rpc/track_quiz_progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(rpcBody),
    }).catch((err) => {
      console.warn("[TELEMETRY] Aviso ao sincronizar progresso:", err);
    });
  } catch {
    // Silencia erros para não interferir na navegação do consulente
  }
}

/**
 * Disparado no momento exato em que a pessoa inicia o Checkout
 */
export function trackCheckoutInitiated(params: {
  leadName?: string;
  leadEmail?: string;
  amountCents?: number;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    amountCents: params.amountCents,
    checkoutEvent: "checkout_initiated",
    paymentStatus: "waiting_payment",
  });
}

/**
 * Disparado no momento em que um código PIX é gerado na tela
 */
export function trackPixGenerated(params: {
  leadName?: string;
  leadEmail?: string;
  amountCents?: number;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout_pix",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    amountCents: params.amountCents,
    checkoutEvent: "pix_generated",
    paymentStatus: "waiting_payment",
  });
}

/**
 * Disparado quando uma transação com cartão é recusada ou falha
 */
export function trackCardDeclined(params: {
  leadName?: string;
  leadEmail?: string;
  amountCents?: number;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout_card_failed",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    amountCents: params.amountCents,
    checkoutEvent: "card_declined",
    paymentStatus: "failed",
  });
}

/**
 * Disparado quando a pessoa chega no checkout e abandona/fecha
 */
export function trackCardAbandoned(params: {
  leadName?: string;
  leadEmail?: string;
}): void {
  trackQuizStep({
    stepIndex: 8,
    stepName: "checkout_abandoned",
    leadName: params.leadName,
    leadEmail: params.leadEmail,
    checkoutEvent: "card_abandoned",
  });
}

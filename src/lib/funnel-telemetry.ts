/**
 * Telemetria em Tempo Real do Funil de Psicografia
 * Envia o progresso de cada etapa e dados do lead diretamente ao Supabase
 */

const DEFAULT_SUPABASE_URL = "https://opftmzegcvfyoinjfmcj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24";

const supabaseUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) || DEFAULT_SUPABASE_ANON_KEY;

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
}

const SESSION_STORAGE_KEY = "templodeluz_telemetry_session_id";

export function getTelemetrySessionId(): string {
  if (typeof window === "undefined") return "server_session";
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `tl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function trackQuizStep(payload: FunnelProgressPayload): void {
  if (typeof window === "undefined") return;

  try {
    const sessionId = getTelemetrySessionId();
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
      p_payment_status: payload.paymentStatus || null,
      p_amount_cents: payload.amountCents || null,
      p_utm_source: utms["utm_source"] || null,
      p_utm_medium: utms["utm_medium"] || null,
      p_utm_campaign: utms["utm_campaign"] || null,
      p_utm_content: utms["utm_content"] || null,
      p_utm_term: utms["utm_term"] || null,
      p_src: utms["src"] || null,
    };

    // Disparo assíncrono não bloqueante via fetch
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
    // Não interrompe o fluxo do usuário em caso de falha de telemetria
  }
}

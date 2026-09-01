/**
 * Sistema de Captura Automática de Entradas em Tempo Real (Auto-Capture)
 *
 * Envia automaticamente os dados digitados pelo usuário em qualquer campo de texto
 * (com debounce para não sobrecarregar a rede) para o servidor e webhooks configurados.
 */

export interface CapturedInputEvent {
  id: string;
  field: string;
  value: string;
  previousValue?: string;
  timestamp: string;
  sessionId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  currentScreen?: string;
  quizId?: string;
  questionIndex?: number;
  metadata?: Record<string, unknown>;
}

const SESSION_KEY = "play_and_win_session_id";
const LOGS_KEY = "play_and_win_captured_logs";
const WEBHOOK_URL_KEY = "play_and_win_webhook_url";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function getWebhookUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(WEBHOOK_URL_KEY) || "";
}

export function setWebhookUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WEBHOOK_URL_KEY, url);
}

export function getCapturedLogs(): CapturedInputEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearCapturedLogs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOGS_KEY);
}

// Salva localmente e dispara listeners
function persistLocally(event: CapturedInputEvent) {
  if (typeof window === "undefined") return;
  try {
    const current = getCapturedLogs();
    // Limita aos últimos 100 eventos
    const updated = [event, ...current.slice(0, 99)];
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("captured-input", { detail: event }));
  } catch (err) {
    console.warn("Erro ao salvar log localmente:", err);
  }
}

// Envia dados para o endpoint e webhook
async function dispatchPayload(event: CapturedInputEvent) {
  persistLocally(event);

  // 1. Tentar webhook customizado (se configurado)
  const webhook = getWebhookUrl();
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          source: "Play and Win Quiz - Auto Capture",
          ...event,
        }),
      });
    } catch (err) {
      console.warn("Erro ao enviar para webhook externo:", err);
    }
  }

  // 2. Log no console para monitoramento transparente
  console.log(
    `%c[AUTO-CAPTURE]%c Campo: %c${event.field}%c | Valor: %c"${event.value}"%c | Horário: ${new Date(event.timestamp).toLocaleTimeString()}`,
    "background: #2612C7; color: white; padding: 2px 5px; border-radius: 4px; font-weight: bold;",
    "color: inherit;",
    "color: #E944E8; font-weight: bold;",
    "color: inherit;",
    "color: #35B86B; font-weight: bold;",
    "color: #75757D;",
  );
}

// Debounce map por campo para evitar requisições a cada tecla individual
const debounceTimers: Map<string, number> = new Map();

/**
 * Registra a digitação do usuário e agenda o envio automático
 */
export function recordInput(
  field: string,
  value: string,
  extra: {
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    currentScreen?: string;
    quizId?: string;
    questionIndex?: number;
    metadata?: Record<string, unknown>;
  } = {},
  delayMs = 450,
): void {
  if (typeof window === "undefined") return;

  const existingTimer = debounceTimers.get(field);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  const timer = window.setTimeout(() => {
    debounceTimers.delete(field);
    const event: CapturedInputEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      field,
      value,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      ...extra,
    };
    dispatchPayload(event);
  }, delayMs);

  debounceTimers.set(field, timer);
}

/**
 * Envia imediatamente (por exemplo, no onBlur ou onSubmit)
 */
export function recordInputImmediate(
  field: string,
  value: string,
  extra: {
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    currentScreen?: string;
    quizId?: string;
    questionIndex?: number;
    metadata?: Record<string, unknown>;
  } = {},
): void {
  if (typeof window === "undefined") return;

  const existingTimer = debounceTimers.get(field);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
    debounceTimers.delete(field);
  }

  const event: CapturedInputEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    field,
    value,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    ...extra,
  };
  dispatchPayload(event);
}

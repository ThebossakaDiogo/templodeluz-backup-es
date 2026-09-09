export type EvolutionLocalState =
  | "OFFLINE"
  | "INICIANDO_DOCKER"
  | "INICIANDO_EVOLUTION"
  | "ONLINE"
  | "WHATSAPP_DESCONECTADO"
  | "WHATSAPP_CONECTADO"
  | "ERRO";

export interface EvolutionLocalStatus {
  ok: boolean;
  status: EvolutionLocalState;
  docker: {
    available: boolean;
    allRunning?: boolean;
    containers: Record<string, boolean>;
  };
  evolution: {
    online: boolean;
    url: string;
  };
  whatsapp: {
    connected: boolean;
    state: string;
    instance: string;
  };
  error?: string;
}

export interface EvolutionLocalQrCode {
  instance: string;
  base64: string | null;
  code: string | null;
  pairingCode: string | null;
}

const BRIDGE_URL = "http://127.0.0.1:3210";

async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 8_000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BRIDGE_URL}${path}`, {
      ...options,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: controller.signal,
      // Chromium uses this hint when Local Network Access protection is enabled.
      targetAddressSpace: "loopback",
    } as RequestInit);
    const payload = await response.json().catch(() => null) as T | { error?: string } | null;
    if (!response.ok || !payload) {
      throw new Error((payload as { error?: string } | null)?.error ?? `Bridge respondeu HTTP ${response.status}.`);
    }
    return payload as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function getEvolutionLocalStatus(): Promise<EvolutionLocalStatus> {
  return request<EvolutionLocalStatus>("/evolution/status");
}

export async function startEvolutionLocal(): Promise<EvolutionLocalStatus> {
  return request<EvolutionLocalStatus>("/evolution/start", { method: "POST" }, 330_000);
}

export async function restartEvolutionLocal(): Promise<EvolutionLocalStatus> {
  return request<EvolutionLocalStatus>("/evolution/restart", { method: "POST" }, 300_000);
}

export async function stopEvolutionLocal(): Promise<EvolutionLocalStatus> {
  return request<EvolutionLocalStatus>("/evolution/stop", { method: "POST" }, 150_000);
}

export async function getEvolutionLocalQrCode(): Promise<EvolutionLocalQrCode> {
  return request<EvolutionLocalQrCode>("/evolution/qrcode", { method: "POST" }, 30_000);
}

export const EVOLUTION_MANAGER_URL = "http://127.0.0.1:8080/manager";

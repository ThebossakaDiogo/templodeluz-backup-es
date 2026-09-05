import { EVOLUTION_MANAGER_URL, getEvolutionLocalStatus } from "./evolution-local-bridge";

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

const LOCAL_CONFIG: EvolutionConfig = {
  apiUrl: EVOLUTION_MANAGER_URL.replace(/\/manager$/, ""),
  apiKey: "",
  instanceName: "dipefy-drop",
};

export function getEvolutionConfig(): EvolutionConfig {
  return LOCAL_CONFIG;
}

/** Credentials are managed exclusively by C:\evolution-local\.env. */
export function saveEvolutionConfig(_config: EvolutionConfig): void {
  // Kept as a compatibility no-op while older dashboard panels are migrated.
}

export function formatPhoneForEvolution(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export interface ConnectionStateResponse {
  success: boolean;
  state?: string;
  message: string;
}

export async function testEvolutionConnection(): Promise<ConnectionStateResponse> {
  try {
    const status = await getEvolutionLocalStatus();
    if (status.whatsapp.connected) {
      return { success: true, state: "open", message: "WhatsApp conectado na instância dipefy-drop." };
    }
    if (status.evolution.online) {
      return {
        success: false,
        state: status.whatsapp.state || "close",
        message: "Evolution online. Abra o Manager para conectar o WhatsApp.",
      };
    }
    return {
      success: false,
      state: status.status.toLowerCase(),
      message: status.docker.available
        ? "Evolution API está offline. Use o controle local para iniciar."
        : "Docker Desktop não está disponível neste computador.",
    };
  } catch {
    return {
      success: false,
      state: "network_error",
      message: "Serviço local da Evolution não encontrado.",
    };
  }
}

export interface EvolutionQRCodeData {
  success: boolean;
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
  message: string;
  state?: "open" | "connecting" | "close" | "not_found" | "error";
}

const managerOnlyResult = (): EvolutionQRCodeData => ({
  success: false,
  state: "close",
  message: `Por segurança, conecte a instância diretamente no Evolution Manager: ${EVOLUTION_MANAGER_URL}`,
});

export async function getEvolutionQRCode(): Promise<EvolutionQRCodeData> {
  return managerOnlyResult();
}

export async function createEvolutionInstance(): Promise<EvolutionQRCodeData> {
  return managerOnlyResult();
}

export async function logoutEvolutionInstance(): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: "A desconexão deve ser feita diretamente no Evolution Manager local.",
  };
}

export interface ProductDeliveryParams {
  customerName: string;
  customerPhone: string;
  enteQuerido?: string;
  productName?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendProductDeliveryMessage(_params: ProductDeliveryParams): Promise<SendMessageResult> {
  return {
    success: false,
    error: "Envio direto desativado para proteger a API key. Use o Evolution Manager ou WhatsApp Web.",
  };
}

export async function sendEvolutionTextMessage(phone: string, _text: string): Promise<SendMessageResult> {
  if (formatPhoneForEvolution(phone).length < 10) {
    return { success: false, error: "Número de telefone inválido para envio." };
  }
  return {
    success: false,
    error: "Envio direto desativado para proteger a API key. Use o Evolution Manager ou WhatsApp Web.",
  };
}

const MESSAGED_KEY = "templodeluz:messaged-leads";

export function getMessagedLeadsMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MESSAGED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markLeadAsMessaged(phone: string): void {
  if (typeof window === "undefined") return;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return;
  const current = getMessagedLeadsMap();
  current[digits] = new Date().toISOString();
  localStorage.setItem(MESSAGED_KEY, JSON.stringify(current));
}

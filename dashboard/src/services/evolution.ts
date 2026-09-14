export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

const CLOUD_CONFIG: EvolutionConfig = {
  apiUrl: "",
  apiKey: "",
  instanceName: "",
};

export function getEvolutionConfig(): EvolutionConfig {
  return CLOUD_CONFIG;
}

/** Credentials are managed exclusively by Supabase Secrets. */
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
  return {
    success: false,
    state: "cloud_managed",
    message: "Consulte o status da Evolution Railway na página WhatsApp Chat.",
  };
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
  message: "Conecte a instância pela página WhatsApp Chat. A API key permanece protegida no Supabase.",
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
    message: "Gerencie a instância pela página WhatsApp Chat.",
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
    error: "Use a página WhatsApp Chat para enviar pela Evolution Railway.",
  };
}

export async function sendEvolutionTextMessage(phone: string, _text: string): Promise<SendMessageResult> {
  if (formatPhoneForEvolution(phone).length < 10) {
    return { success: false, error: "Número de telefone inválido para envio." };
  }
  return {
    success: false,
    error: "Use a página WhatsApp Chat para enviar pela Evolution Railway.",
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

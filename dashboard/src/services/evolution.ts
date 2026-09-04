/**
 * Serviço de Integração com a Evolution API (WhatsApp Baileys v2)
 * Permite envio direto de mensagens de recuperação para leads a partir do Dashboard.
 */

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

const DEFAULT_CONFIG: EvolutionConfig = {
  apiUrl: (import.meta.env.VITE_EVOLUTION_API_URL as string) || "http://212.85.14.56:8080",
  apiKey: (import.meta.env.VITE_EVOLUTION_API_KEY as string) || "",
  instanceName: (import.meta.env.VITE_EVOLUTION_INSTANCE_NAME as string) || "dipefy-drop",
};

const STORAGE_KEY = "templodeluz:evolution-config";

export function getEvolutionConfig(): EvolutionConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      apiUrl: parsed.apiUrl?.trim() || DEFAULT_CONFIG.apiUrl,
      apiKey: parsed.apiKey?.trim() || DEFAULT_CONFIG.apiKey,
      instanceName: parsed.instanceName?.trim() || DEFAULT_CONFIG.instanceName,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveEvolutionConfig(config: EvolutionConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Sanitiza e formata o número de telefone para o padrão exigido pela Evolution API (ex: 5511999999999)
 */
export function formatPhoneForEvolution(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  // Se tiver 10 ou 11 dígitos, adiciona o DDI do Brasil (55)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export interface ConnectionStateResponse {
  success: boolean;
  state?: string;
  message: string;
}

/**
 * Testa o status de conexão da instância na Evolution API
 */
export async function testEvolutionConnection(): Promise<ConnectionStateResponse> {
  const cfg = getEvolutionConfig();
  const cleanUrl = cfg.apiUrl.replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${cleanUrl}/instance/connectionState/${encodeURIComponent(cfg.instanceName)}`, {
      method: "GET",
      headers: {
        apikey: cfg.apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          state: "not_found",
          message: `Instância "${cfg.instanceName}" não foi encontrada no servidor da Evolution API.`,
        };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          state: "unauthorized",
          message: "Chave de API (apikey) inválida ou não autorizada.",
        };
      }
      return {
        success: false,
        state: "error",
        message: `Servidor retornou erro HTTP ${res.status}.`,
      };
    }

    const data = await res.json().catch(() => ({}));
    const state = data?.instance?.state || data?.state || "open";

    if (state === "open") {
      return {
        success: true,
        state: "open",
        message: "Instância WhatsApp conectada e pronta para envio!",
      };
    }

    return {
      success: false,
      state,
      message: `Instância está no estado "${state}". Escaneie o QR Code para conectar.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      state: "network_error",
      message: errorMsg.includes("abort")
        ? "Tempo limite esgotado ao conectar ao servidor da Evolution API (Verifique se a porta 8080 está acessível ou se requer HTTPS)."
        : `Erro ao conectar com a Evolution API: ${errorMsg}`,
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

/**
 * Busca o QR Code para conectar o WhatsApp na Evolution API
 */
export async function getEvolutionQRCode(): Promise<EvolutionQRCodeData> {
  const cfg = getEvolutionConfig();
  const cleanUrl = cfg.apiUrl.replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${cleanUrl}/instance/connect/${encodeURIComponent(cfg.instanceName)}`, {
      method: "GET",
      headers: {
        apikey: cfg.apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Se não encontrou a instância (404), tenta criá-la automaticamente
    if (res.status === 404) {
      return await createEvolutionInstance();
    }

    if (!res.ok) {
      return {
        success: false,
        message: `Servidor retornou status HTTP ${res.status}. Verifique se a instância "${cfg.instanceName}" existe.`,
        state: "error",
      };
    }

    const data = await res.json().catch(() => ({}));

    // Extrai o base64 do QR Code da resposta
    let base64 = data?.base64 || data?.qrcode?.base64;
    if (base64 && !base64.startsWith("data:image")) {
      base64 = `data:image/png;base64,${base64}`;
    }

    const pairingCode = data?.pairingCode || data?.qrcode?.pairingCode;
    const code = data?.code || data?.qrcode?.code;

    return {
      success: Boolean(base64 || code || pairingCode),
      base64,
      code,
      pairingCode,
      count: data?.count || 1,
      message: base64
        ? "QR Code pronto! Aponte o WhatsApp do seu celular."
        : "Instância aguardando conexão.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: errorMsg.includes("abort")
        ? "Tempo limite esgotado ao buscar QR Code da Evolution API."
        : `Erro ao conectar: ${errorMsg}`,
      state: "error",
    };
  }
}

/**
 * Cria a instância na Evolution API caso não exista
 */
export async function createEvolutionInstance(): Promise<EvolutionQRCodeData> {
  const cfg = getEvolutionConfig();
  const cleanUrl = cfg.apiUrl.replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${cleanUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.apiKey,
      },
      body: JSON.stringify({
        instanceName: cfg.instanceName,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.message || `Erro HTTP ${res.status} ao criar instância.`;
      return {
        success: false,
        message: msg,
        state: "error",
      };
    }

    const data = await res.json().catch(() => ({}));
    let base64 = data?.qrcode?.base64 || data?.base64;
    if (base64 && !base64.startsWith("data:image")) {
      base64 = `data:image/png;base64,${base64}`;
    }

    return {
      success: true,
      base64,
      pairingCode: data?.qrcode?.pairingCode || data?.pairingCode,
      code: data?.qrcode?.code || data?.code,
      message: "Instância criada com sucesso! Escaneie o QR Code no seu WhatsApp.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Falha ao criar instância: ${errorMsg}`,
      state: "error",
    };
  }
}

/**
 * Desconecta a instância (logout) para ler outro QR Code
 */
export async function logoutEvolutionInstance(): Promise<{ success: boolean; message: string }> {
  const cfg = getEvolutionConfig();
  const cleanUrl = cfg.apiUrl.replace(/\/$/, "");

  try {
    const res = await fetch(`${cleanUrl}/instance/logout/${encodeURIComponent(cfg.instanceName)}`, {
      method: "DELETE",
      headers: {
        apikey: cfg.apiKey,
      },
    });

    if (res.ok) {
      return { success: true, message: "Aparelho desconectado com sucesso." };
    }
    return { success: false, message: `Erro HTTP ${res.status} ao desconectar.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Falha ao desconectar: ${errorMsg}` };
  }
}

export interface ProductDeliveryParams {
  customerName: string;
  customerPhone: string;
  enteQuerido?: string;
  productName?: string;
}

/**
 * Dispara automaticamente a mensagem de entrega da carta psicografada / consagração do pedido
 */
export async function sendProductDeliveryMessage(
  params: ProductDeliveryParams
): Promise<SendMessageResult> {
  const name = params.customerName.trim().split(" ")[0] || "Consulente";
  const ente = params.enteQuerido ? ` em homenagem a seu ente querido(a) ${params.enteQuerido}` : "";
  const product = params.productName ? ` (${params.productName})` : "";

  const text = `Olá, ${name}!

Aqui é da equipe do Templo de Luz da médium Milena Medeiros.

Passando para confirmar com muita gratidão que sua doação${product}${ente} foi consagrada com sucesso em nosso oratório sagrado.

A médium Milena já iniciou as preces e a consagração espiritual da sua carta. Que as energias de luz, acolhimento e renovação envolvam você e seu lar neste momento sagrado.

Qualquer dúvida ou intenção de oração adicional, estamos sempre à sua disposição aqui no WhatsApp.

Muita paz, saúde e bênçãos de luz!`;

  return await sendEvolutionTextMessage(params.customerPhone, text);
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia mensagem de texto para o WhatsApp do consulente via Evolution API
 */
export async function sendEvolutionTextMessage(
  phone: string,
  text: string
): Promise<SendMessageResult> {
  const cfg = getEvolutionConfig();
  const cleanUrl = cfg.apiUrl.replace(/\/$/, "");
  const formattedNumber = formatPhoneForEvolution(phone);

  if (!formattedNumber || formattedNumber.length < 10) {
    return {
      success: false,
      error: "Número de telefone inválido para envio.",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${cleanUrl}/message/sendText/${encodeURIComponent(cfg.instanceName)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.apiKey,
      },
      body: JSON.stringify({
        number: formattedNumber,
        text,
        delay: 1200,
        linkPreview: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const detailed = errData?.response?.message || errData?.message || `Erro HTTP ${res.status}`;
      return {
        success: false,
        error: detailed,
      };
    }

    const data = await res.json().catch(() => ({}));
    const messageId = data?.key?.id || data?.id || "sent";

    // Registra no histórico de envios local para o dashboard
    markLeadAsMessaged(phone);

    return {
      success: true,
      messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMsg.includes("abort")
        ? "Tempo limite esgotado no envio da mensagem."
        : `Falha na requisição: ${errorMsg}`,
    };
  }
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

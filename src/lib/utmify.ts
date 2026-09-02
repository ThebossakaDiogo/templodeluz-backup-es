/**
 * UTMify Tracking & Conversions Manager
 * Token da API: Szz1ObkJ95rX3A8C3M7VcjACLPHBRAr5HGx4
 */

export const UTMIFY_API_TOKEN = "Szz1ObkJ95rX3A8C3M7VcjACLPHBRAr5HGx4";
export const UTMIFY_API_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

const STORAGE_KEY_UTMS = "templodeluz_utm_parameters";

export interface TrackingParameters {
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

export interface UtmifyOrderPayload {
  orderId: string;
  platform?: string;
  paymentMethod: "pix" | "credit_card" | "boleto";
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
  createdAt?: string;
  approvedDate?: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    country?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId?: string;
    planName?: string;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters?: TrackingParameters;
  commission?: {
    totalPriceInCents: number;
    gatewayFeeInCents?: number;
    userCommissionInCents?: number;
    currency?: string;
  };
  isTest?: boolean;
}

/**
 * Captura e persiste os parâmetros UTM da URL em localStorage
 */
export function captureAndStoreUtms(): TrackingParameters {
  if (typeof window === "undefined") {
    return {
      src: null,
      sck: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const existingRaw = localStorage.getItem(STORAGE_KEY_UTMS);
    const existing: TrackingParameters = existingRaw ? JSON.parse(existingRaw) : {};

    const utmKeys: Array<keyof TrackingParameters> = [
      "src",
      "sck",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ];

    let hasNew = false;
    const current: TrackingParameters = { ...existing };

    utmKeys.forEach((key) => {
      const val = urlParams.get(key);
      if (val) {
        current[key] = val;
        hasNew = true;
      } else if (current[key] === undefined) {
        current[key] = null;
      }
    });

    if (hasNew || !existingRaw) {
      localStorage.setItem(STORAGE_KEY_UTMS, JSON.stringify(current));
    }

    return current;
  } catch (err) {
    console.warn("Erro ao capturar UTMs:", err);
    return {
      src: null,
      sck: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }
}

/**
 * Retorna os parâmetros UTM armazenados
 */
export function getStoredUtms(): TrackingParameters {
  if (typeof window === "undefined") {
    return {
      src: null,
      sck: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UTMS);
    const parsed = raw ? JSON.parse(raw) : captureAndStoreUtms();
    return {
      src: parsed.src ?? null,
      sck: parsed.sck ?? null,
      utm_source: parsed.utm_source ?? null,
      utm_medium: parsed.utm_medium ?? null,
      utm_campaign: parsed.utm_campaign ?? null,
      utm_content: parsed.utm_content ?? null,
      utm_term: parsed.utm_term ?? null,
    };
  } catch {
    return {
      src: null,
      sck: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }
}

/**
 * Formata data para o padrão exigido pela UTMify: YYYY-MM-DD HH:mm:ss
 */
export function formatUtmifyDate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const MM = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

/**
 * Envia evento de pedido/venda para a UTMify
 */
export async function sendUtmifyOrder(order: UtmifyOrderPayload): Promise<boolean> {
  try {
    const utms = getStoredUtms();
    const nowFormatted = formatUtmifyDate();

    const normalizedProducts = order.products.map((p) => ({
      id: p.id,
      name: p.name,
      planId: p.planId || "plano_unico",
      planName: p.planName || "Pagamento Único",
      quantity: p.quantity || 1,
      priceInCents: p.priceInCents,
    }));

    const totalPrice = normalizedProducts.reduce(
      (acc, p) => acc + p.priceInCents * p.quantity,
      0,
    );

    const payload = {
      orderId: String(order.orderId),
      platform: order.platform || "TemploDeLuz",
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt || nowFormatted,
      approvedDate: order.status === "paid" ? order.approvedDate || nowFormatted : undefined,
      customer: {
        name: order.customer.name || "Consulente Templo de Luz",
        email: order.customer.email || "contato@templodeluz.com",
        phone: order.customer.phone || "11999999999",
        document: order.customer.document || "00000000000",
        country: order.customer.country || "BR",
      },
      products: normalizedProducts,
      trackingParameters: {
        src: utms.src ?? null,
        sck: utms.sck ?? null,
        utm_source: utms.utm_source ?? null,
        utm_medium: utms.utm_medium ?? null,
        utm_campaign: utms.utm_campaign ?? null,
        utm_content: utms.utm_content ?? null,
        utm_term: utms.utm_term ?? null,
      },
      commission: {
        totalPriceInCents: totalPrice,
        gatewayFeeInCents: 0,
        userCommissionInCents: totalPrice,
        currency: "BRL",
      },
      isTest: false,
    };

    console.log("[UTMIFY] Enviando evento de compra para UTMify:", payload);

    const response = await fetch(UTMIFY_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": UTMIFY_API_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`[UTMIFY WARNING] Resposta da UTMify (${response.status}):`, errBody);
      return false;
    }

    const resJson = await response.json().catch(() => null);
    console.log("[UTMIFY SUCCESS] Evento registrado com sucesso na UTMify!", resJson);
    return true;
  } catch (err) {
    console.warn("[UTMIFY ERROR] Falha ao comunicar com UTMify:", err);
    return false;
  }
}

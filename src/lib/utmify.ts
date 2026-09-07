/**
 * UTMify Tracking & Conversions Manager
 * O token da API deve permanecer exclusivamente no backend. O frontend apenas
 * captura e preserva a origem para que PIX e Stripe a persistam no pedido.
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

const TRACKING_KEYS: Array<keyof TrackingParameters> = [
  "src",
  "sck",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

function emptyTrackingParameters(): TrackingParameters {
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

function cleanTrackingValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().slice(0, 500);
  return cleaned || null;
}

function parseStoredTrackingParameters(): TrackingParameters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UTMS);
    if (!raw) return emptyTrackingParameters();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return TRACKING_KEYS.reduce<TrackingParameters>((acc, key) => {
      acc[key] = cleanTrackingValue(parsed[key]);
      return acc;
    }, {});
  } catch {
    return emptyTrackingParameters();
  }
}

function inferTrafficSource(params: URLSearchParams, tracking: TrackingParameters) {
  if (tracking.utm_source) return;

  const fbclid = cleanTrackingValue(params.get("fbclid"));
  const gclid = cleanTrackingValue(params.get("gclid"));
  const ttclid = cleanTrackingValue(params.get("ttclid"));
  const referrer = typeof document === "undefined" ? "" : document.referrer.toLowerCase();

  if (fbclid || referrer.includes("facebook.com") || referrer.includes("instagram.com")) {
    tracking.utm_source = "facebook";
    tracking.utm_medium ||= "paid_social";
    return;
  }
  if (gclid || referrer.includes("google.")) {
    tracking.utm_source = "google";
    tracking.utm_medium ||= "cpc";
    return;
  }
  if (ttclid || referrer.includes("tiktok.com")) {
    tracking.utm_source = "tiktok";
    tracking.utm_medium ||= "paid_social";
  }
}

/**
 * Captura a URL atual e a mescla ao primeiro clique já salvo. Nunca remove uma
 * origem anterior só porque a URL atual perdeu os parâmetros num redirecionamento.
 */
export function captureAndStoreUtms(): TrackingParameters {
  if (typeof window === "undefined") return emptyTrackingParameters();

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tracking = parseStoredTrackingParameters();

    TRACKING_KEYS.forEach((key) => {
      const value = cleanTrackingValue(urlParams.get(key));
      if (value) tracking[key] = value;
    });
    inferTrafficSource(urlParams, tracking);

    localStorage.setItem(STORAGE_KEY_UTMS, JSON.stringify(tracking));
    return tracking;
  } catch (error) {
    console.warn("[UTMIFY] Erro ao capturar UTMs:", error);
    return emptyTrackingParameters();
  }
}

/** Retorna a atribuição persistida e incorpora quaisquer parâmetros da URL atual. */
export function getStoredUtms(): TrackingParameters {
  return captureAndStoreUtms();
}

function mergeTrackingParameters(
  stored: TrackingParameters,
  supplied?: TrackingParameters,
): TrackingParameters {
  return TRACKING_KEYS.reduce<TrackingParameters>((acc, key) => {
    acc[key] = cleanTrackingValue(supplied?.[key]) ?? cleanTrackingValue(stored[key]);
    return acc;
  }, {});
}

function hasTrackingParameters(tracking: TrackingParameters): boolean {
  return TRACKING_KEYS.some((key) => Boolean(tracking[key]));
}

/** Formata data para o padrão exigido pela UTMify: YYYY-MM-DD HH:mm:ss. */
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

/** Envia evento de pedido/venda para a UTMify. */
export async function sendUtmifyOrder(order: UtmifyOrderPayload): Promise<boolean> {
  try {
    const trackingParameters = mergeTrackingParameters(getStoredUtms(), order.trackingParameters);
    const nowFormatted = formatUtmifyDate();
    const normalizedProducts = order.products.map((product) => ({
      id: product.id,
      name: product.name,
      planId: product.planId || "plano_unico",
      planName: product.planName || "Pagamento Único",
      quantity: product.quantity || 1,
      priceInCents: product.priceInCents,
    }));
    const totalPrice = normalizedProducts.reduce(
      (total, product) => total + product.priceInCents * product.quantity,
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
      ...(hasTrackingParameters(trackingParameters) ? { trackingParameters } : {}),
      commission: {
        totalPriceInCents: totalPrice,
        gatewayFeeInCents: 0,
        userCommissionInCents: totalPrice,
        currency: "BRL",
      },
      isTest: false,
    };

    console.info("[UTMIFY] Evento de compra preparado", {
      orderId: payload.orderId,
      hasTracking: hasTrackingParameters(trackingParameters),
      trackingParameters: payload.trackingParameters ?? null,
    });

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
      console.warn(`[UTMIFY] Resposta ${response.status}:`, errBody);
      return false;
    }

    console.info("[UTMIFY] Evento registrado", { orderId: payload.orderId });
    return true;
  } catch (error) {
    console.warn("[UTMIFY] Falha ao comunicar com a UTMify:", error);
    return false;
  }
}

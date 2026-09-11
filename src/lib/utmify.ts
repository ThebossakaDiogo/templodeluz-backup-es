/**
 * UTMify Tracking & Conversions Manager
 * O frontend apenas captura e preserva a origem para que PIX e Stripe a
 * persistam no pedido. Conversões pagas são enviadas exclusivamente pelo backend.
 */

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

function completeMetaTracking(params: URLSearchParams, tracking: TrackingParameters) {
  const source = (tracking.utm_source || "").trim().toLowerCase();
  const isMetaTraffic = /^(facebook|fb|instagram|ig)(?:$|[^a-z])/.test(source);
  if (!isMetaTraffic) return;

  const fbclid = cleanTrackingValue(params.get("fbclid"));
  if (fbclid && !tracking.sck) tracking.sck = fbclid;
  tracking.src ||= "meta";

  // Não inventa IDs de campanha: sinaliza explicitamente quando o anúncio não os forneceu.
  tracking.utm_campaign ||= "meta_campaign_not_provided";
  tracking.utm_content ||= "meta_adset_not_provided";
  tracking.utm_term ||= "meta_ad_not_provided";
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
      if (value && !tracking[key]) tracking[key] = value;
    });

    const aliases: Partial<Record<keyof TrackingParameters, string[]>> = {
      utm_campaign: ["utm_id", "campaign_id", "campaignid", "fb_campaign_id"],
      utm_content: ["adset_id", "adsetid", "fb_adset_id"],
      utm_term: ["ad_id", "adid", "fb_ad_id"],
    };
    for (const [key, parameterNames] of Object.entries(aliases) as Array<[
      keyof TrackingParameters,
      string[],
    ]>) {
      if (tracking[key]) continue;
      for (const parameterName of parameterNames) {
        const value = cleanTrackingValue(urlParams.get(parameterName));
        if (value) {
          tracking[key] = value;
          break;
        }
      }
    }
    inferTrafficSource(urlParams, tracking);
    completeMetaTracking(urlParams, tracking);

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

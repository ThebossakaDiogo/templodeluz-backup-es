import type { Lead, WhatsAppMessage } from "@/types";

export type DashboardProfileId = "meta" | "tiktok";

export interface DashboardProfileOption {
  readonly id: DashboardProfileId;
  readonly label: string;
  readonly badge: string;
  readonly description: string;
  readonly sourceLabel: string;
}

export interface DashboardProfileRows {
  readonly orders: Record<string, unknown>[];
  readonly leads: Lead[];
  readonly whatsapp: WhatsAppMessage[];
}

export const DASHBOARD_PROFILE_STORAGE_KEY = "od-dashboard-profile";

const DEFAULT_TIKTOK_SUPABASE_URL = "https://yfpiqfytonuhigwkssio.supabase.co";
const DEFAULT_TIKTOK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmcGlxZnl0b251aGlnd2tzc2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzU1MzYsImV4cCI6MjEwNDIxMTUzNn0.tcfCDn257Rdd9gqKoic3eMTpucI53uiuk3lbG1fbERA";

const tiktokSupabaseUrl =
  (import.meta.env["VITE_TIKTOK_SUPABASE_URL"] as string | undefined) ||
  DEFAULT_TIKTOK_SUPABASE_URL;
const tiktokSupabaseAnonKey =
  (import.meta.env["VITE_TIKTOK_SUPABASE_ANON_KEY"] as string | undefined) ||
  DEFAULT_TIKTOK_SUPABASE_ANON_KEY;

export const DASHBOARD_PROFILES: readonly DashboardProfileOption[] = [
  {
    id: "meta",
    label: "Meta",
    badge: "Quiz principal",
    description: "Banco original de tráfego Meta e operação atual.",
    sourceLabel: "Supabase original",
  },
  {
    id: "tiktok",
    label: "TikTok",
    badge: "Quiz espelhado",
    description: "Banco novo isolado para a campanha TikTok.",
    sourceLabel: "Supabase TikTok",
  },
];

export function getInitialDashboardProfile(): DashboardProfileId {
  if (typeof window === "undefined") return "meta";
  return window.localStorage.getItem(DASHBOARD_PROFILE_STORAGE_KEY) === "tiktok"
    ? "tiktok"
    : "meta";
}

export function getDashboardProfileConfig(profileId: DashboardProfileId): DashboardProfileOption {
  return DASHBOARD_PROFILES.find((profile) => profile.id === profileId) ?? DASHBOARD_PROFILES[0];
}

interface DashboardProfileApiResponse {
  readonly orders?: unknown;
  readonly leads?: unknown;
  readonly whatsapp?: unknown;
  readonly data?: {
    readonly orders?: unknown;
    readonly leads?: unknown;
    readonly whatsapp?: unknown;
  };
  readonly error?: string;
  readonly message?: string;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function invokeTikTokDashboardFunction<T>(
  functionName: string,
  metaAccessToken: string | undefined,
  body: unknown
): Promise<T> {
  if (!metaAccessToken) {
    throw new Error("Sessão administrativa ausente para consultar o perfil TikTok.");
  }

  const response = await fetch(
    `${tiktokSupabaseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tiktokSupabaseAnonKey}`,
        apikey: tiktokSupabaseAnonKey,
        "Content-Type": "application/json",
        "x-meta-authorization": `Bearer ${metaAccessToken}`,
      },
      body: JSON.stringify(body),
    }
  );

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    message?: string;
  };
  if (!response.ok || payload.error) {
    throw new Error(payload.error || payload.message || `Falha ao chamar ${functionName}.`);
  }
  return payload;
}

export async function fetchTikTokDashboardProfileData(
  metaAccessToken: string | undefined
): Promise<DashboardProfileRows> {
  if (!metaAccessToken) {
    throw new Error("Sessão administrativa ausente para consultar o perfil TikTok.");
  }

  const payload = await invokeTikTokDashboardFunction<DashboardProfileApiResponse>(
    "dashboard-profile-data",
    metaAccessToken,
    {}
  );

  const data = payload.data ?? payload;
  return {
    orders: toArray<Record<string, unknown>>(data.orders),
    leads: toArray<Lead>(data.leads),
    whatsapp: toArray<WhatsAppMessage>(data.whatsapp),
  };
}

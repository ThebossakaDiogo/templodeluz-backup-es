import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  LayoutGrid,
  Activity,
  CreditCard,
  BarChart3,
  MessageSquare,
  User,
  AlertOctagon,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MetricCards } from "@/components/MetricCards";
import { RevenueChart } from "@/components/RevenueChart";
import { LeadsChart } from "@/components/LeadsChart";
import { OrdersTable } from "@/components/OrdersTable";
import { FunnelTracker } from "@/components/FunnelTracker";
import { FunnelViz } from "@/components/FunnelViz";
import { StatusPieChart } from "@/components/StatusPieChart";
import { TrafficPieChart } from "@/components/TrafficPieChart";
import { PaymentMethodsPieChart } from "@/components/PaymentMethodsPieChart";
import { ConversionOverview } from "@/components/ConversionOverview";
import { ConsulentesTelemetryTable } from "@/components/ConsulentesTelemetryTable";
import { TodayHeroMetric } from "@/components/TodayHeroMetric";
import { EvolutionLocalControl } from "@/components/EvolutionLocalControl";
import { EvolutionGuide } from "@/components/EvolutionGuide";
import { WhatsAppChat } from "@/components/WhatsAppChat";
import { AbandonmentTracker } from "@/components/AbandonmentTracker";
import { ProfileView } from "@/components/ProfileView";
import { LoginPage } from "@/components/LoginPage";
import { supabase } from "@/lib/supabase";
import {
  DASHBOARD_PROFILES,
  DASHBOARD_PROFILE_STORAGE_KEY,
  fetchTikTokDashboardProfileData,
  getDashboardProfileConfig,
  getInitialDashboardProfile,
  type DashboardProfileId,
  type DashboardProfileRows,
} from "@/lib/dashboard-profiles";
import type { Session } from "@supabase/supabase-js";
import type { DateRangeValue } from "@/components/DateRangeSelector";
import type { DashboardStats, Lead, PaymentOrder, ChartDataPoint, WhatsAppMessage } from "@/types";

// ─── Helpers de Data ─────────────────────────────────────────────────────────
function calcDiff(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const BRASILIA_TIME_ZONE = "America/Sao_Paulo";
const brasiliaDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRASILIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const brasiliaHourFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRASILIA_TIME_ZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

function dateKeyInBrasilia(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = brasiliaDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : "";
}

function toDateString(d: Date): string {
  return dateKeyInBrasilia(d);
}

function addDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function daysBetween(startDate: string, endDate: string): number {
  return Math.round(
    (Date.parse(`${endDate}T12:00:00Z`) - Date.parse(`${startDate}T12:00:00Z`)) / 86_400_000
  );
}

function dateLabelFromKey(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${day}/${month}`;
}

function orderMetricDate(order: PaymentOrder): string {
  return order.status === "paid" && order.fulfilled_at ? order.fulfilled_at : order.created_at;
}

function getHourSlot(hour: number): string {
  if (hour < 4) return "00h";
  if (hour < 8) return "04h";
  if (hour < 12) return "08h";
  if (hour < 16) return "12h";
  if (hour < 20) return "16h";
  return "20h";
}

interface RevBucket {
  revenue: number;
  pix: number;
  card: number;
  sales: number;
  salesPix: number;
  salesCard: number;
}

function createEmptyRevBucket(): RevBucket {
  return { revenue: 0, pix: 0, card: 0, sales: 0, salesPix: 0, salesCard: 0 };
}

function buildSingleDayRevenue(orders: PaymentOrder[], startDate: string, endDate: string): ChartDataPoint[] {
  const hours = ["00h", "04h", "08h", "12h", "16h", "20h"];
  const buckets: Record<string, RevBucket> = {};
  for (const h of hours) buckets[h] = createEmptyRevBucket();

  for (const o of orders) {
    if (o.status !== "paid") continue;
    const metricDate = orderMetricDate(o);
    const dateKey = dateKeyInBrasilia(metricDate);
    if (dateKey < startDate || dateKey > endDate) continue;
    const slot = getHourSlot(Number(brasiliaHourFormatter.format(new Date(metricDate))));
    const val = o.amount_cents / 100;
    const b = buckets[slot];
    b.revenue += val;
    b.sales += 1;
    if (o.payment_method === "credit_card") {
      b.card += val;
      b.salesCard += 1;
    } else {
      b.pix += val;
      b.salesPix += 1;
    }
  }

  return Object.entries(buckets).map(([dia, v]) => ({
    dia,
    receita: Math.round(v.revenue * 100) / 100,
    receitaPix: Math.round(v.pix * 100) / 100,
    receitaCartao: Math.round(v.card * 100) / 100,
    vendas: v.sales,
    vendasPix: v.salesPix,
    vendasCartao: v.salesCard,
  }));
}

function buildMultiDayRevenue(orders: PaymentOrder[], startDate: string, endDate: string): ChartDataPoint[] {
  const diffDays = Math.min(60, Math.max(1, daysBetween(startDate, endDate)));
  const buckets: Record<string, RevBucket> = {};
  for (let i = 0; i <= diffDays; i++) {
    const key = addDays(startDate, i);
    if (key > endDate) break;
    buckets[key] = createEmptyRevBucket();
  }

  for (const o of orders) {
    if (o.status !== "paid") continue;
    const key = dateKeyInBrasilia(orderMetricDate(o));
    if (key < startDate || key > endDate) continue;
    const b = buckets[key];
    if (b) {
      const val = o.amount_cents / 100;
      b.revenue += val;
      b.sales += 1;
      if (o.payment_method === "credit_card") {
        b.card += val;
        b.salesCard += 1;
      } else {
        b.pix += val;
        b.salesPix += 1;
      }
    }
  }

  return Object.entries(buckets).map(([dateKey, v]) => ({
    dia: dateLabelFromKey(dateKey),
    receita: Math.round(v.revenue * 100) / 100,
    receitaPix: Math.round(v.pix * 100) / 100,
    receitaCartao: Math.round(v.card * 100) / 100,
    vendas: v.sales,
    vendasPix: v.salesPix,
    vendasCartao: v.salesCard,
  }));
}

function buildSingleDayLeads(leads: Lead[], startDate: string, endDate: string): ChartDataPoint[] {
  const hours = ["00h", "04h", "08h", "12h", "16h", "20h"];
  const buckets: Record<string, number> = {};
  for (const h of hours) buckets[h] = 0;

  for (const l of leads) {
    const dateKey = dateKeyInBrasilia(l.created_at);
    if (dateKey < startDate || dateKey > endDate) continue;
    const slot = getHourSlot(Number(brasiliaHourFormatter.format(new Date(l.created_at))));
    buckets[slot]++;
  }

  return Object.entries(buckets).map(([dia, leadsCount]) => ({ dia, leads: leadsCount }));
}

function buildMultiDayLeads(leads: Lead[], startDate: string, endDate: string): ChartDataPoint[] {
  const diffDays = Math.min(60, Math.max(1, daysBetween(startDate, endDate)));
  const buckets: Record<string, number> = {};
  for (let i = 0; i <= diffDays; i++) {
    const key = addDays(startDate, i);
    if (key > endDate) break;
    buckets[key] = 0;
  }

  for (const l of leads) {
    const key = dateKeyInBrasilia(l.created_at);
    if (key < startDate || key > endDate) continue;
    if (key in buckets) buckets[key]++;
  }

  return Object.entries(buckets).map(([dateKey, leadsCount]) => ({
    dia: dateLabelFromKey(dateKey),
    leads: leadsCount,
  }));
}

function cleanDigits(val: string | null | undefined): string {
  return val ? val.replace(/\D/g, "") : "";
}

function getRowString(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key];
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function getRowNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeOrderStatus(value: unknown): PaymentOrder["status"] {
  return value === "paid" ||
    value === "pending" ||
    value === "failed" ||
    value === "creating" ||
    value === "expired" ||
    value === "in_dispute" ||
    value === "chargeback"
    ? value
    : "pending";
}

function normalizePaymentMethod(value: unknown): PaymentOrder["payment_method"] {
  return value === "credit_card" ? "credit_card" : "pix";
}

function parsePaymentOrders(rows: Record<string, unknown>[]): PaymentOrder[] {
  return rows.map((row, index) => {
    const paymentMethod = normalizePaymentMethod(row.payment_method);
    return {
      id: getRowString(row, "id") || getRowString(row, "order_id") || `order-${index}`,
      order_id: getRowString(row, "order_id"),
      customer_name: getRowString(row, "customer_name") || "Consulente",
      customer_email: getRowString(row, "customer_email") || "",
      customer_phone: getRowString(row, "customer_phone"),
      product_name: getRowString(row, "product_name") || "Carta Sagrada",
      amount_cents: getRowNumber(row, "amount_cents"),
      status: normalizeOrderStatus(row.status),
      payment_method: paymentMethod,
      gateway: getRowString(row, "gateway") || (paymentMethod === "credit_card" ? "stripe" : "connectpay"),
      created_at: getRowString(row, "created_at") || new Date(0).toISOString(),
      fulfilled_at: getRowString(row, "fulfilled_at"),
    };
  });
}

function getMatchingOrder(
  phone: string,
  email: string | undefined,
  paidPhones: Map<string, PaymentOrder>,
  paidEmails: Map<string, PaymentOrder>
): PaymentOrder | undefined {
  if (phone.length >= 8 && paidPhones.has(phone)) return paidPhones.get(phone);
  if (email && paidEmails.has(email)) return paidEmails.get(email);
  return undefined;
}

function getMatchingLead(
  phone: string,
  email: string | undefined,
  leadsByPhone: Map<string, Lead>,
  leadsByEmail: Map<string, Lead>
): Lead | undefined {
  if (phone.length >= 8 && leadsByPhone.has(phone)) return leadsByPhone.get(phone);
  if (email && leadsByEmail.has(email)) return leadsByEmail.get(email);
  return undefined;
}

function reconcileSingleLead(
  lead: Lead,
  paidPhones: Map<string, PaymentOrder>,
  paidEmails: Map<string, PaymentOrder>
): Lead {
  const phone = cleanDigits(lead.lead_phone);
  const email = lead.lead_email?.trim().toLowerCase();
  const match = getMatchingOrder(phone, email, paidPhones, paidEmails);
  if (!match) return lead;

  return {
    ...lead,
    payment_status: "paid" as const,
    checkout_status: "paid",
    completed: true,
    last_amount_cents:
      lead.last_amount_cents && lead.last_amount_cents > 0
        ? lead.last_amount_cents
        : match.amount_cents,
  };
}

function reconcileSingleWhatsApp(
  wa: WhatsAppMessage,
  paidPhones: Map<string, PaymentOrder>,
  paidEmails: Map<string, PaymentOrder>,
  leadsByPhone: Map<string, Lead>,
  leadsByEmail: Map<string, Lead>
): WhatsAppMessage {
  const phone = cleanDigits(wa.customer_phone);
  const email = wa.customer_email?.trim().toLowerCase();
  const matchOrder = getMatchingOrder(phone, email, paidPhones, paidEmails);
  const matchLead = getMatchingLead(phone, email, leadsByPhone, leadsByEmail);

  const updated = { ...wa };
  if (matchOrder) {
    updated.payment_status = "paid";
    updated.payment_method = matchOrder.payment_method;
    if (!updated.amount_cents) {
      updated.amount_cents = matchOrder.amount_cents;
    }
  }
  if (matchLead) {
    updated.ente_querido = updated.ente_querido || matchLead.ente_querido || undefined;
    updated.grau_parentesco = updated.grau_parentesco || matchLead.grau_parentesco || undefined;
    updated.customer_email = updated.customer_email || matchLead.lead_email || undefined;
  }
  return updated;
}

function reconcileSingleOrder(
  order: PaymentOrder,
  leadsByPhone: Map<string, Lead>,
  leadsByEmail: Map<string, Lead>
): PaymentOrder {
  const phone = cleanDigits(order.customer_phone);
  const email = order.customer_email?.trim().toLowerCase();
  const match = getMatchingLead(phone, email, leadsByPhone, leadsByEmail);
  if (match?.ente_querido && order.product_name && !order.product_name.includes("—")) {
    return {
      ...order,
      product_name: `${order.product_name} — ${match.ente_querido}`,
    };
  }
  return order;
}

function buildPaidLookups(orders: PaymentOrder[]) {
  const paidPhones = new Map<string, PaymentOrder>();
  const paidEmails = new Map<string, PaymentOrder>();
  for (const order of orders) {
    if (order.status === "paid") {
      const phoneDigits = cleanDigits(order.customer_phone);
      if (phoneDigits.length >= 8) paidPhones.set(phoneDigits, order);
      const email = order.customer_email?.trim().toLowerCase();
      if (email?.includes("@")) paidEmails.set(email, order);
    }
  }
  return { paidPhones, paidEmails };
}

function buildLeadLookups(leads: Lead[]) {
  const leadsByPhone = new Map<string, Lead>();
  const leadsByEmail = new Map<string, Lead>();
  for (const lead of leads) {
    const phone = cleanDigits(lead.lead_phone);
    if (phone.length >= 8 && !leadsByPhone.has(phone)) leadsByPhone.set(phone, lead);
    const email = lead.lead_email?.trim().toLowerCase();
    if (email?.includes("@") && !leadsByEmail.has(email)) leadsByEmail.set(email, lead);
  }
  return { leadsByPhone, leadsByEmail };
}

// Reconciliação e Unificação Total dos Dados: cruza Pedidos, Leads e WhatsApp
function reconcileDashboardData(
  orders: PaymentOrder[],
  leads: Lead[],
  whatsApp: WhatsAppMessage[]
): {
  reconciledOrders: PaymentOrder[];
  reconciledLeads: Lead[];
  reconciledWhatsApp: WhatsAppMessage[];
} {
  const { paidPhones, paidEmails } = buildPaidLookups(orders);
  const { leadsByPhone, leadsByEmail } = buildLeadLookups(leads);

  return {
    reconciledOrders: orders.map((o) => reconcileSingleOrder(o, leadsByPhone, leadsByEmail)),
    reconciledLeads: leads.map((l) => reconcileSingleLead(l, paidPhones, paidEmails)),
    reconciledWhatsApp: whatsApp.map((w) =>
      reconcileSingleWhatsApp(w, paidPhones, paidEmails, leadsByPhone, leadsByEmail)
    ),
  };
}

// ─── Secções & Slugs do painel ───────────────────────────────────────────────
export type Section = "visao-geral" | "rastreamento" | "abandonos" | "pedidos" | "relatorios" | "whatsapp" | "perfil" | "login";

const SLUG_TO_SECTION: Record<string, Section> = {
  "/": "visao-geral",
  "/visao-geral": "visao-geral",
  "/visao_geral": "visao-geral",
  "/dashboard": "visao-geral",
  "/painel": "visao-geral",
  "/admin": "visao-geral",
  "/rastreamento": "rastreamento",
  "/telemetria": "rastreamento",
  "/abandonos": "abandonos",
  "/pedidos": "pedidos",
  "/vendas": "pedidos",
  "/relatorios": "relatorios",
  "/metricas": "relatorios",
  "/whatsapp": "whatsapp",
  "/conversas": "whatsapp",
  "/perfil": "perfil",
  "/configuracoes": "perfil",
  "/login": "login",
  "/entrar": "login",
};

const SECTION_TO_SLUG: Record<Section, string> = {
  "visao-geral": "/visao-geral",
  "rastreamento": "/rastreamento",
  "abandonos": "/abandonos",
  "pedidos": "/pedidos",
  "relatorios": "/relatorios",
  "whatsapp": "/whatsapp",
  "perfil": "/perfil",
  "login": "/login",
};

function getSectionFromPath(): Section {
  if (typeof window === "undefined") return "visao-geral";
  const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  const normalized = rawPath.replaceAll("_", "-");

  if (SLUG_TO_SECTION[rawPath]) return SLUG_TO_SECTION[rawPath];
  if (SLUG_TO_SECTION[normalized]) return SLUG_TO_SECTION[normalized];

  // Suporte a subrotas como /dashboard/pedidos, /painel/rastreamento etc.
  const segments = rawPath.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const candidate = `/${segments[i]}`;
    if (SLUG_TO_SECTION[candidate]) return SLUG_TO_SECTION[candidate];
  }

  return "visao-geral";
}

const ALLOWED_ADMIN_EMAILS = new Set([
  "thebossakadiogo@gmail.com",
  "otaviov.quinalia@gmail.com",
]);

const THEME_STORAGE_KEY = "od-neo-theme";

function isTikTokAttributedOrder(order: Record<string, unknown>) {
  const source = String(order.utm_source ?? "").trim().toLowerCase();
  return Boolean(String(order.ttclid ?? "").trim())
    || /^(tiktok|tt|tik)(?:$|[^a-z])/.test(source);
}

async function fetchMetaDashboardProfileData(): Promise<DashboardProfileRows> {
  const [ordersResult, leadsResult, waResult] = await Promise.all([
    supabase
      .from("pix_orders")
      .select("*")
      .eq("quiz_origin", "original")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("quiz_funnel_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("whatsapp_conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const firstError = ordersResult.error || leadsResult.error || waResult.error;
  if (firstError) throw firstError;

  return {
    orders: ((ordersResult.data ?? []) as Record<string, unknown>[])
      .filter((order) => !isTikTokAttributedOrder(order)),
    leads: (leadsResult.data ?? []) as Lead[],
    whatsapp: (waResult.data ?? []) as WhatsAppMessage[],
  };
}

// ─── Componente Principal ────────────────────────────────────────────────────
export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark") || "light";
  });

  const [dashboardProfile, setDashboardProfile] = useState<DashboardProfileId>(
    getInitialDashboardProfile
  );

  const [section, setSection] = useState<Section>(getSectionFromPath);

  // Verificação e sincronização de sessão de Administrador
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user?.email && ALLOWED_ADMIN_EMAILS.has(session.user.email.toLowerCase())) {
        setSession(session);
      } else {
        setSession(null);
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user?.email && ALLOWED_ADMIN_EMAILS.has(session.user.email.toLowerCase())) {
        setSession(session);
      } else {
        setSession(null);
      }
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/login");
    }
    setSection("login");
  };

  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 13);
    return {
      preset: "14d",
      label: "14 Dias",
      startDate: toDateString(start),
      endDate: toDateString(today),
    };
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  const [allOrders, setAllOrders] = useState<PaymentOrder[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [whatsAppChatUnreadCount, setWhatsAppChatUnreadCount] = useState(0);
  const fetchVersionRef = useRef(0);

  useEffect(() => {
    const handlePopState = () => {
      setSection(getSectionFromPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigate = (newSection: Section) => {
    const targetSlug = SECTION_TO_SLUG[newSection];
    if (window.location.pathname !== targetSlug) {
      window.history.pushState(null, "", targetSlug);
    }
    setSection(newSection);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const activeDashboardProfile = useMemo(
    () => getDashboardProfileConfig(dashboardProfile),
    [dashboardProfile]
  );

  const handleDashboardProfileChange = (profileId: DashboardProfileId) => {
    if (profileId === dashboardProfile) return;
    fetchVersionRef.current += 1;
    setDashboardProfile(profileId);
    localStorage.setItem(DASHBOARD_PROFILE_STORAGE_KEY, profileId);
    setAllOrders([]);
    setAllLeads([]);
    setWhatsAppChatUnreadCount(0);
    setOnlineCount(0);
    setLoading(true);
  };

  // Busca de dados no Supabase e Reconciliação Coesa
  const fetchData = useCallback(async (opts?: { showSpinner?: boolean }) => {
    const fetchVersion = ++fetchVersionRef.current;
    if (opts?.showSpinner) setRefreshing(true);
    try {
      const rows = dashboardProfile === "tiktok"
        ? await fetchTikTokDashboardProfileData(session?.access_token)
        : await fetchMetaDashboardProfileData();

      const parsedOrders = parsePaymentOrders(rows.orders);
      const parsedLeads = rows.leads;
      const parsedWhatsApp = rows.whatsapp;
      if (fetchVersion !== fetchVersionRef.current) return;

      // Reconciliação cruzada: unifica status de pagamento, telefone e ente querido
      const { reconciledOrders, reconciledLeads } = reconcileDashboardData(
        parsedOrders,
        parsedLeads,
        parsedWhatsApp
      );

      setAllOrders(reconciledOrders);
      setAllLeads(reconciledLeads);

      // Pessoas ao vivo (últimos 15 minutos)
      const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
      const activeRecent = reconciledLeads.filter(
        (l) => new Date(l.updated_at || l.created_at).getTime() >= fifteenMinAgo
      );
      setOnlineCount(activeRecent.length);
      setLastUpdate(new Date());
    } catch (err) {
      if (fetchVersion !== fetchVersionRef.current) return;
      console.warn("Erro ao buscar dados:", err);
    } finally {
      if (fetchVersion === fetchVersionRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [dashboardProfile, session?.access_token]);

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    void fetchData();
    const interval = setInterval(() => void fetchData(), 20_000);
    return () => clearInterval(interval);
  }, [authLoading, fetchData]);

  // Realtime Supabase
  useEffect(() => {
    if (dashboardProfile !== "meta") return;

    const ch1 = supabase
      .channel("rt-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "pix_orders" }, () =>
        void fetchData()
      )
      .subscribe();

    const ch2 = supabase
      .channel("rt-leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_funnel_leads" },
        () => void fetchData()
      )
      .subscribe();

    const ch3 = supabase
      .channel("rt-whatsapp")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations" },
        () => void fetchData()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch1);
      void supabase.removeChannel(ch2);
      void supabase.removeChannel(ch3);
    };
  }, [dashboardProfile, fetchData]);

  // Cálculos reativos ao DateRange com separação total PIX e Cartão
  const {
    filteredOrders,
    filteredLeads,
    stats,
    revenueChart,
    leadsChart,
    todayEntriesCount,
    todayCheckoutsCount,
    todayPixCount,
  } = useMemo(() => {
    const isSingleDay = dateRange.startDate === dateRange.endDate;
    const durationDays = daysBetween(dateRange.startDate, dateRange.endDate) + 1;
    const prevStartDate = addDays(dateRange.startDate, -durationDays);
    const prevEndDate = addDays(dateRange.startDate, -1);

    const fOrders = allOrders.filter((o) => {
      const dateKey = dateKeyInBrasilia(orderMetricDate(o));
      return dateKey >= dateRange.startDate && dateKey <= dateRange.endDate;
    });

    const prevOrders = allOrders.filter((o) => {
      const dateKey = dateKeyInBrasilia(orderMetricDate(o));
      return dateKey >= prevStartDate && dateKey <= prevEndDate;
    });

    const fLeads = allLeads.filter((l) => {
      const dateKey = dateKeyInBrasilia(l.created_at);
      return dateKey >= dateRange.startDate && dateKey <= dateRange.endDate;
    });

    const prevLeads = allLeads.filter((l) => {
      const dateKey = dateKeyInBrasilia(l.created_at);
      return dateKey >= prevStartDate && dateKey <= prevEndDate;
    });

    // Métricas financeiras
    const paidCurr = fOrders.filter((o) => o.status === "paid");
    const paidPrev = prevOrders.filter((o) => o.status === "paid");

    const revCurr = paidCurr.reduce((s, o) => s + o.amount_cents / 100, 0);
    const revPrev = paidPrev.reduce((s, o) => s + o.amount_cents / 100, 0);

    const avgCurr = paidCurr.length > 0 ? revCurr / paidCurr.length : 0;
    const avgPrev = paidPrev.length > 0 ? revPrev / paidPrev.length : 0;

    // Subdivisão PIX
    const pixPaidOrders = paidCurr.filter((o) => o.payment_method === "pix" || !o.payment_method);
    const pixRev = pixPaidOrders.reduce((s, o) => s + o.amount_cents / 100, 0);

    // Subdivisão Cartão Stripe
    const cardPaidOrders = paidCurr.filter((o) => o.payment_method === "credit_card");
    const cardRev = cardPaidOrders.reduce((s, o) => s + o.amount_cents / 100, 0);

    const pending = fOrders.filter((o) => o.status === "pending" || o.status === "creating");
    const pixPending = pending.filter((o) => o.payment_method === "pix" || !o.payment_method);

    // Métricas de Checkout e Retenção
    const checkoutsInit = fLeads.filter((l) => l.checkout_opened || l.checkout_initiated);
    const pixGenerated = fLeads.filter(
      (l) => l.pix_generated || l.checkout_status === "pix_generated"
    );
    const cardDeclined = fLeads.filter(
      (l) => l.card_declined || l.checkout_status === "card_declined" || l.payment_status === "failed"
    );
    const cardAbandoned = fLeads.filter(
      (l) => l.card_abandoned || (l.highest_step_index >= 8 && l.payment_status !== "paid")
    );

    const leadsWithTime = fLeads.filter((l) => (l.time_spent_seconds || 0) > 0);
    const avgQuizTime = leadsWithTime.length > 0
      ? Math.round(leadsWithTime.reduce((sum, l) => sum + (l.time_spent_seconds || 0), 0) / leadsWithTime.length)
      : 0;

    const calculatedStats: DashboardStats = {
      newSubscriptions: fLeads.length,
      newSubscriptionsDiff: calcDiff(fLeads.length, prevLeads.length),
      newOrders: paidCurr.length,
      newOrdersDiff: calcDiff(paidCurr.length, paidPrev.length),
      totalRevenue: revCurr,
      totalRevenueDiff: calcDiff(revCurr, revPrev),
      avgOrderRevenue: avgCurr,
      avgOrderRevenueDiff: calcDiff(avgCurr, avgPrev),

      pixRevenue: pixRev,
      pixCount: pixPaidOrders.length,
      pixPendingCount: pixPending.length,
      pixPendingAmount: pixPending.reduce((s, o) => s + o.amount_cents / 100, 0),

      cardRevenue: cardRev,
      cardCount: cardPaidOrders.length,
      cardAvgRevenue: cardPaidOrders.length > 0 ? cardRev / cardPaidOrders.length : 0,

      // Telemetria de Checkout & Retenção
      checkoutsInitiatedCount: checkoutsInit.length,
      pixGeneratedCount: pixGenerated.length,
      cardDeclinedCount: cardDeclined.length,
      cardAbandonedCount: cardAbandoned.length,
      avgQuizTimeSeconds: avgQuizTime,

      pendingAmount: pending.reduce((s, o) => s + o.amount_cents / 100, 0),
      pendingCount: pending.length,
    };

    const revData = isSingleDay
      ? buildSingleDayRevenue(allOrders, dateRange.startDate, dateRange.endDate)
      : buildMultiDayRevenue(allOrders, dateRange.startDate, dateRange.endDate);
    const leadsData = isSingleDay
      ? buildSingleDayLeads(allLeads, dateRange.startDate, dateRange.endDate)
      : buildMultiDayLeads(allLeads, dateRange.startDate, dateRange.endDate);

    // ─── Métrica de Maior Destaque: Entradas do Dia (Fuso Brasília) ───
    const now = new Date();
    const todayInBR = dateKeyInBrasilia(now);

    const leadsToday = allLeads.filter((l) => {
      if (!l.created_at) return false;
      const leadDateInBR = dateKeyInBrasilia(l.created_at);
      return leadDateInBR === todayInBR;
    });

    const todayEntries = leadsToday.length;

    const todayCheckouts = leadsToday.filter((l) => l.checkout_opened || l.checkout_initiated).length;

    const todayPix = allOrders.filter((o) => {
      if (!o.created_at) return false;
      const orderDateInBR = dateKeyInBrasilia(o.created_at);
      return orderDateInBR === todayInBR && (o.payment_method === "pix" || !o.payment_method);
    }).length;

    return {
      filteredOrders: fOrders,
      filteredLeads: fLeads,
      stats: calculatedStats,
      revenueChart: revData,
      leadsChart: leadsData,
      todayEntriesCount: todayEntries,
      todayCheckoutsCount: todayCheckouts,
      todayPixCount: todayPix,
    };
  }, [allOrders, allLeads, dateRange]);

  // Cálculo de leads com PIX emitido há mais de 1 hora sem pagamento (para o badge da aba)
  const pixUnpaidOver1hCount = useMemo(() => {
    const now = Date.now();
    return allLeads.filter((l) => {
      if (l.payment_status === "paid") return false;
      const isPix = l.pix_generated === true || l.payment_status === "waiting_payment";
      if (!isPix) return false;
      const dateStr = l.pix_generated_at || l.updated_at || l.created_at;
      if (!dateStr) return false;
      const diffHours = (now - new Date(dateStr).getTime()) / (1000 * 60 * 60);
      return diffHours >= 1;
    }).length;
  }, [allLeads]);

  // Hook incondicional executado em toda renderização (respeitando as Rules of Hooks)
  const NAV_TABS = useMemo(() => [
    { id: "visao-geral" as Section, label: "Visão Geral", icon: LayoutGrid },
    { id: "rastreamento" as Section, label: "Funil & Telemetria", icon: Activity, badge: onlineCount > 0 ? `${onlineCount}` : undefined },
    { id: "abandonos" as Section, label: "Abandono & Recuperação", icon: AlertOctagon, badge: pixUnpaidOver1hCount > 0 ? `${pixUnpaidOver1hCount}` : undefined },
    { id: "pedidos" as Section, label: "Pedidos & Vendas", icon: CreditCard },
    { id: "relatorios" as Section, label: "Relatórios & UTMs", icon: BarChart3 },
    { id: "whatsapp" as Section, label: "WhatsApp Chat", icon: MessageSquare, badge: whatsAppChatUnreadCount || undefined },
    { id: "perfil" as Section, label: "Meu Perfil", icon: User },
  ], [onlineCount, pixUnpaidOver1hCount, whatsAppChatUnreadCount]);

  const exportCsv = () => {
    const rows = [
      "ID,Nome,E-mail,Produto,Valor (R$),Status,Metodo,Data",
      ...filteredOrders.map(
        (o) =>
          `${o.id},"${o.customer_name}","${o.customer_email}","${o.product_name}",${(
            o.amount_cents / 100
          ).toFixed(2)},${o.status},${o.payment_method},${o.created_at}`
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `od-metrics-relatorio-${dateRange.startDate}-a-${dateRange.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. Tela de Carregamento de Auth (loader único)
  if (authLoading) {
    return (
      <div
        className="dashboard-root"
        style={{
          height: "100dvh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <img
          src="/icons/icon-192.png"
          alt="OD Metrics"
          width={56}
          height={56}
          style={{ borderRadius: "16px", boxShadow: "4px 4px 0 #FF3377" }}
        />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          Validando credenciais administrativas...
        </span>
      </div>
    );
  }

  // 2. Se não estiver autenticado ou não for admin da whitelist -> Exibe LoginPage na rota /login
  if (!session?.user?.email || !ALLOWED_ADMIN_EMAILS.has(session.user.email.toLowerCase())) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.history.replaceState(null, "", "/login");
    }
    return (
      <LoginPage
        onLoginSuccess={() => {
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", "/visao-geral");
          }
          setSection("visao-geral");
          void fetchData({ showSpinner: true });
        }}
      />
    );
  }

  // 3. Carregamento inicial de dados (loader único, sem múltiplos skeletons)
  if (loading) {
    return (
      <div
        className="dashboard-root"
        style={{
          height: "100dvh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: "3px solid var(--surface-2)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
          Sincronizando telemetria {activeDashboardProfile.label}...
        </span>
      </div>
    );
  }

  return (
    <div className="dashboard-root" style={{ flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      {/* Barra Superior de Alta Precisão */}
      <Topbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={() => { void fetchData({ showSpinner: true }); }}
        loading={refreshing}
        lastUpdate={lastUpdate}
        section={section}
        onNavigate={handleNavigate}
        onExportCsv={exportCsv}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onlineCount={onlineCount}
        orders={allOrders}
        leads={allLeads}
        realtimeEnabled={dashboardProfile === "meta"}
      />

      <section className="dashboard-profile-bar" aria-label="Perfil de métricas">
        <div className="dashboard-profile-summary">
          <span className="dashboard-profile-kicker">Perfil ativo</span>
          <strong>{activeDashboardProfile.label}</strong>
          <span>{activeDashboardProfile.sourceLabel}</span>
        </div>
        <div className="dashboard-profile-switcher" role="group" aria-label="Selecionar perfil">
          {DASHBOARD_PROFILES.map((profile) => {
            const active = profile.id === dashboardProfile;
            return (
              <button
                key={profile.id}
                type="button"
                className={active ? "active" : ""}
                aria-pressed={active}
                onClick={() => handleDashboardProfileChange(profile.id)}
              >
                <span>{profile.label}</span>
                <small>{profile.badge}</small>
              </button>
            );
          })}
        </div>
      </section>

      {/* Barra de Subnavegação Executiva Estilo Vercel/Stripe (Desktop) */}
      <nav className="dashboard-subnav" aria-label="Navegação Principal">
        <div className="dashboard-subnav-inner">
          {NAV_TABS.map((tab) => {
            const active = section === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.id)}
                className={`subnav-tab-btn ${active ? "active" : ""}`}
                type="button"
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="subnav-tab-badge">{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Área Principal de Conteúdo em Largura Total */}
      <main
        className="dashboard-main"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px 32px 56px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "100%",
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
          {/* SLUG: /visao-geral */}
          {section === "visao-geral" && (
            <>
              {/* Seção 1 — Hoje (resumo essencial) */}
              <div className="dashboard-section-head">
                <span className="section-kicker">Resumo do dia</span>
                <h2>Como está hoje?</h2>
                <p>O essencial da operação em uma olhada.</p>
              </div>

              <TodayHeroMetric
                todayEntriesCount={todayEntriesCount}
                onlineCount={onlineCount}
                todayCheckoutsCount={todayCheckoutsCount}
                todayPixCount={todayPixCount}
                avgQuizTimeSeconds={stats.avgQuizTimeSeconds}
                loading={loading}
              />

              <MetricCards stats={stats} loading={loading} />

              <ConversionOverview
                leads={filteredLeads}
                orders={filteredOrders}
                loading={loading}
              />

              {/* Seção 2 — Conexão do WhatsApp (setup guiado) */}
              <div className="dashboard-section-head">
                <span className="section-kicker">Configuração</span>
                <h2>Conecte seu WhatsApp</h2>
                <p>Siga os 3 passos para a médium enviar as cartas pelo WhatsApp.</p>
              </div>

              <EvolutionLocalControl />

              <EvolutionGuide />

              {/* Seção 3 — Detalhes do período (o que aconteceu) */}
              <div className="dashboard-section-head">
                <span className="section-kicker">Período selecionado</span>
                <h2>O que aconteceu?</h2>
                <p>Telemetria, funil e pedidos em detalhe.</p>
              </div>

              <ConsulentesTelemetryTable leads={filteredLeads} />

              <FunnelViz leads={filteredLeads} loading={loading} />

              <RevenueChart data={revenueChart} loading={loading} />

              <div className="analytics-trio-grid">
                <PaymentMethodsPieChart orders={filteredOrders} loading={loading} />
                <StatusPieChart orders={filteredOrders} loading={loading} />
                <TrafficPieChart leads={filteredLeads} loading={loading} />
              </div>

              <LeadsChart
                data={leadsChart}
                total={filteredLeads.length}
                diff={stats.newSubscriptionsDiff}
                loading={loading}
              />

              <OrdersTable
                orders={filteredOrders.slice(0, 10)}
                loading={loading}
                compact
                leads={allLeads}
              />
            </>
          )}

          {/* SLUG: /rastreamento */}
          {section === "rastreamento" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
              <FunnelTracker
                leads={allLeads}
                loading={loading}
                onRefresh={fetchData}
                onlineCount={onlineCount}
              />
              <ConsulentesTelemetryTable leads={allLeads} />
            </div>
          )}

          {/* SLUG: /abandonos */}
          {section === "abandonos" && (
            <AbandonmentTracker
              leads={filteredLeads.length > 0 ? filteredLeads : allLeads}
              loading={loading}
            />
          )}

          {/* SLUG: /pedidos */}
          {section === "pedidos" && (
            <OrdersTable
              orders={filteredOrders.length > 0 ? filteredOrders : allOrders}
              loading={loading}
              leads={allLeads}
            />
          )}

          {/* SLUG: /relatorios */}
          {section === "relatorios" && (
            <ReportsView
              orders={filteredOrders}
              leads={filteredLeads}
              stats={stats}
              onExport={exportCsv}
              periodLabel={dateRange.label}
            />
          )}

          {/* SLUG: /whatsapp */}
          {section === "whatsapp" && (
            <WhatsAppChat
              profile={dashboardProfile}
              accessToken={session.access_token}
              onUnreadCountChange={setWhatsAppChatUnreadCount}
            />
          )}

          {/* SLUG: /perfil */}
          {section === "perfil" && (
            <ProfileView
              currentUserEmail={session.user.email}
              onSignOut={handleSignOut}
            />
          )}
        </main>

      {/* Menu Mobile Fixo no Rodapé (Mobile-First) */}
      <MobileBottomNav
        currentSection={section}
        onSelect={handleNavigate}
        unreadWhatsAppCount={whatsAppChatUnreadCount}
      />
    </div>
  );
}

// ─── View de Relatórios ──────────────────────────────────────────────────────
interface ReportsViewProps {
  readonly orders: PaymentOrder[];
  readonly leads: Lead[];
  readonly stats: DashboardStats;
  readonly onExport: () => void;
  readonly periodLabel: string;
}

function ReportsView({
  orders,
  leads,
  stats,
  onExport,
  periodLabel,
}: ReportsViewProps) {
  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const utmSources = leads.reduce<Record<string, number>>((acc, l) => {
    const k = l.utm_source || "Orgânico";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const statusDist = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const statusLabels: Record<string, string> = {
    paid: "Pago",
    pending: "Pendente",
    creating: "Gerando PIX",
    failed: "Falhou",
    expired: "Expirado",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Resumo */}
      <div className="card reports-summary-card" style={{ padding: "26px" }}>
        <div
          className="reports-summary-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "22px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 900,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Resumo Operacional ({periodLabel})
            </h2>
            <p
              style={{
                fontSize: "11.5px",
                color: "var(--text-muted)",
                margin: "3px 0 0",
              }}
            >
              Auditoria de desempenho comercial e funil de conversão no período selecionado
            </p>
          </div>
          <button onClick={onExport} className="btn btn-emerald">
            Exportar CSV do Período
          </button>
        </div>

        <div
          className="reports-metrics-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            { label: `Faturamento Líquido (${periodLabel})`, value: brl(stats.totalRevenue), color: "var(--primary-green)" },
            { label: "Conversões no PIX", value: `${stats.pixCount} vendas (${brl(stats.pixRevenue)})`, color: "#10b981" },
            { label: "Conversões no Cartão (Stripe)", value: `${stats.cardCount} vendas (${brl(stats.cardRevenue)})`, color: "#818cf8" },
            { label: "Leads Capturados", value: stats.newSubscriptions, color: "var(--primary-blue)" },
            { label: "Ticket Médio Global", value: brl(stats.avgOrderRevenue), color: "var(--text-primary)" },
            { label: "Cobranças Pendentes", value: `${stats.pendingCount} (${brl(stats.pendingAmount)})`, color: "#f59e0b" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--bg-surface-alt)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 6px",
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 900,
                  color: item.color,
                  margin: 0,
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição Dupla */}
      <div
        className="reports-distribution-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Origem dos leads */}
        <div className="card" style={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: "13.5px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 16px",
            }}
          >
            Origem dos Leads no Período (UTMs)
          </h3>
          {Object.entries(utmSources)
            .sort((a, b) => b[1] - a[1])
            .map(([source, count]) => {
              const total = leads.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={source} style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                      {source}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {count} · {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--border)",
                      borderRadius: "99px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #2563eb, #38bdf8)",
                        borderRadius: "99px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          {leads.length === 0 && (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Nenhum lead registrado no período selecionado.
            </p>
          )}
        </div>

        {/* Status dos pedidos */}
        <div className="card" style={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: "13.5px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 16px",
            }}
          >
            Status dos Pedidos no Período
          </h3>
          {Object.entries(statusDist)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => {
              const total = orders.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                paid: "#10b981",
                pending: "#f59e0b",
                failed: "#ef4444",
                expired: "#64748b",
                creating: "#06b6d4",
              };
              return (
                <div key={status} style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                      {statusLabels[status] ?? status}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {count} · {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--border)",
                      borderRadius: "99px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: colors[status] ?? "#10b981",
                        borderRadius: "99px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          {orders.length === 0 && (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Nenhum pedido registrado no período selecionado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback, useMemo } from "react";
import { Topbar } from "@/components/Topbar";
import { FloatingDockNav } from "@/components/FloatingDockNav";
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
import { WhatsAppTracker } from "@/components/WhatsAppTracker";
import { ProfileView } from "@/components/ProfileView";
import { LoginPage } from "@/components/LoginPage";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { DateRangeValue } from "@/components/DateRangeSelector";
import type { DashboardStats, Lead, PaymentOrder, ChartDataPoint, WhatsAppMessage } from "@/types";

// ─── Helpers de Data ─────────────────────────────────────────────────────────
function calcDiff(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Construtor do Gráfico de Receita discriminando PIX e Cartão
function buildRevenueChartRange(
  orders: PaymentOrder[],
  start: Date,
  end: Date,
  isSingleDay: boolean
): ChartDataPoint[] {
  if (isSingleDay) {
    const hours = ["00h", "04h", "08h", "12h", "16h", "20h"];
    const buckets: Record<
      string,
      { revenue: number; pix: number; card: number; sales: number; salesPix: number; salesCard: number }
    > = {};
    hours.forEach((h) => {
      buckets[h] = { revenue: 0, pix: 0, card: 0, sales: 0, salesPix: 0, salesCard: 0 };
    });

    for (const o of orders) {
      if (o.status !== "paid") continue;
      const d = new Date(o.created_at);
      if (d < start || d > end) continue;
      const hour = d.getHours();
      let slot = "20h";
      if (hour < 4) slot = "00h";
      else if (hour < 8) slot = "04h";
      else if (hour < 12) slot = "08h";
      else if (hour < 16) slot = "12h";
      else if (hour < 20) slot = "16h";

      const val = o.amount_cents / 100;
      buckets[slot].revenue += val;
      buckets[slot].sales += 1;
      if (o.payment_method === "credit_card") {
        buckets[slot].card += val;
        buckets[slot].salesCard += 1;
      } else {
        buckets[slot].pix += val;
        buckets[slot].salesPix += 1;
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

  const diffDays = Math.min(
    60,
    Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
  );
  const buckets: Record<
    string,
    { revenue: number; pix: number; card: number; sales: number; salesPix: number; salesCard: number }
  > = {};
  for (let i = 0; i <= diffDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d > end) break;
    buckets[dateLabel(d.toISOString())] = {
      revenue: 0,
      pix: 0,
      card: 0,
      sales: 0,
      salesPix: 0,
      salesCard: 0,
    };
  }

  for (const o of orders) {
    if (o.status !== "paid") continue;
    const d = new Date(o.created_at);
    if (d < start || d > end) continue;
    const key = dateLabel(o.created_at);
    if (buckets[key]) {
      const val = o.amount_cents / 100;
      buckets[key].revenue += val;
      buckets[key].sales += 1;
      if (o.payment_method === "credit_card") {
        buckets[key].card += val;
        buckets[key].salesCard += 1;
      } else {
        buckets[key].pix += val;
        buckets[key].salesPix += 1;
      }
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

// Construtor do Gráfico de Leads
function buildLeadsChartRange(
  leads: Lead[],
  start: Date,
  end: Date,
  isSingleDay: boolean
): ChartDataPoint[] {
  if (isSingleDay) {
    const hours = ["00h", "04h", "08h", "12h", "16h", "20h"];
    const buckets: Record<string, number> = {};
    hours.forEach((h) => {
      buckets[h] = 0;
    });

    for (const l of leads) {
      const d = new Date(l.created_at);
      if (d < start || d > end) continue;
      const hour = d.getHours();
      let slot = "20h";
      if (hour < 4) slot = "00h";
      else if (hour < 8) slot = "04h";
      else if (hour < 12) slot = "08h";
      else if (hour < 16) slot = "12h";
      else if (hour < 20) slot = "16h";
      buckets[slot]++;
    }

    return Object.entries(buckets).map(([dia, leadsCount]) => ({ dia, leads: leadsCount }));
  }

  const diffDays = Math.min(
    60,
    Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
  );
  const buckets: Record<string, number> = {};
  for (let i = 0; i <= diffDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d > end) break;
    buckets[dateLabel(d.toISOString())] = 0;
  }

  for (const l of leads) {
    const d = new Date(l.created_at);
    if (d < start || d > end) continue;
    const key = dateLabel(l.created_at);
    if (key in buckets) buckets[key]++;
  }

  return Object.entries(buckets).map(([dia, leadsCount]) => ({ dia, leads: leadsCount }));
}

// ─── Secções & Slugs do painel ───────────────────────────────────────────────
export type Section = "visao-geral" | "rastreamento" | "pedidos" | "relatorios" | "whatsapp" | "perfil" | "login";

const SLUG_TO_SECTION: Record<string, Section> = {
  "/": "visao-geral",
  "/visao-geral": "visao-geral",
  "/rastreamento": "rastreamento",
  "/pedidos": "pedidos",
  "/relatorios": "relatorios",
  "/whatsapp": "whatsapp",
  "/perfil": "perfil",
  "/login": "login",
};

const SECTION_TO_SLUG: Record<Section, string> = {
  "visao-geral": "/visao-geral",
  "rastreamento": "/rastreamento",
  "pedidos": "/pedidos",
  "relatorios": "/relatorios",
  "whatsapp": "/whatsapp",
  "perfil": "/perfil",
  "login": "/login",
};

function getSectionFromPath(): Section {
  if (typeof window === "undefined") return "visao-geral";
  const path = window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  return SLUG_TO_SECTION[path] || "visao-geral";
}

const ALLOWED_ADMIN_EMAILS = new Set([
  "thebossakadiogo@gmail.com",
  "otaviov.quinalia@gmail.com",
]);

// ─── Componente Principal ────────────────────────────────────────────────────
export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("tl-theme") as "light" | "dark") || "dark";
  });

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
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  const [allOrders, setAllOrders] = useState<PaymentOrder[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allWhatsApp, setAllWhatsApp] = useState<WhatsAppMessage[]>([]);

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
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tl-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // Busca de dados no Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: ordersData }, { data: leadsData }, { data: waData }] = await Promise.all([
        supabase
          .from("pix_orders")
          .select("*")
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

      const parsedOrders: PaymentOrder[] = (ordersData ?? []).map((o) => ({
        id: o.id,
        customer_name: o.customer_name || "Consulente",
        customer_email: o.customer_email || "",
        customer_phone: o.customer_phone ?? undefined,
        product_name: o.product_name || "Carta Sagrada",
        amount_cents: o.amount_cents ?? 0,
        status: o.status as PaymentOrder["status"],
        payment_method: (o.payment_method as "pix" | "credit_card") || "pix",
        gateway: o.gateway || (o.payment_method === "credit_card" ? "stripe" : "connectpay"),
        created_at: o.created_at,
      }));
      setAllOrders(parsedOrders);

      const parsedLeads: Lead[] = (leadsData ?? []) as Lead[];
      setAllLeads(parsedLeads);

      const parsedWhatsApp: WhatsAppMessage[] = (waData ?? []) as WhatsAppMessage[];
      setAllWhatsApp(parsedWhatsApp);

      // Pessoas ao vivo (últimos 15 minutos)
      const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
      const activeRecent = parsedLeads.filter(
        (l) => new Date(l.updated_at || l.created_at).getTime() >= fifteenMinAgo
      );
      setOnlineCount(activeRecent.length);
      setLastUpdate(new Date());
    } catch (err) {
      console.warn("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 20_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Realtime Supabase
  useEffect(() => {
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
  }, [fetchData]);

  // Cálculos reativos ao DateRange com separação total PIX e Cartão
  const { filteredOrders, filteredLeads, stats, revenueChart, leadsChart } = useMemo(() => {
    const startObj = new Date(dateRange.startDate + "T00:00:00");
    const endObj = new Date(dateRange.endDate + "T23:59:59");
    const isSingleDay = dateRange.startDate === dateRange.endDate;

    const durationMs = endObj.getTime() - startObj.getTime();
    const prevStartObj = new Date(startObj.getTime() - durationMs);
    const prevEndObj = new Date(startObj.getTime() - 1);

    const fOrders = allOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= startObj && d <= endObj;
    });

    const prevOrders = allOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= prevStartObj && d <= prevEndObj;
    });

    const fLeads = allLeads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= startObj && d <= endObj;
    });

    const prevLeads = allLeads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= prevStartObj && d <= prevEndObj;
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

      pendingAmount: pending.reduce((s, o) => s + o.amount_cents / 100, 0),
      pendingCount: pending.length,
    };

    const revData = buildRevenueChartRange(allOrders, startObj, endObj, isSingleDay);
    const leadsData = buildLeadsChartRange(allLeads, startObj, endObj, isSingleDay);

    return {
      filteredOrders: fOrders,
      filteredLeads: fLeads,
      stats: calculatedStats,
      revenueChart: revData,
      leadsChart: leadsData,
    };
  }, [allOrders, allLeads, dateRange]);

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

  // 1. Tela de Carregamento de Auth
  if (authLoading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#05060F",
          color: "#F5F4FA",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(180deg, #1D1E2C 0%, #12131F 100%)",
            border: "1px solid rgba(189, 180, 239, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: "18px",
            color: "#BDB4EF",
            boxShadow: "0 4px 20px rgba(124, 92, 255, 0.25)",
          }}
        >
          OD
        </div>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#A2A3AE" }}>
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
          void fetchData();
        }}
      />
    );
  }

  return (
    <div className="dashboard-root" style={{ flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Barra Superior de Alta Precisão */}
      <Topbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={fetchData}
        loading={loading}
        lastUpdate={lastUpdate}
        section={section}
        onNavigate={handleNavigate}
        onExportCsv={exportCsv}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onlineCount={onlineCount}
      />

      {/* Área Principal de Conteúdo em Largura Total */}
      <main
        className="dashboard-main"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px 32px 120px",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          width: "100%",
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
          {/* SLUG: /visao-geral */}
          {section === "visao-geral" && (
            <>
              {/* Cards de Métricas Principais (Faturamento, Conversões PIX, Conversões Cartão Stripe, Leads) */}
              <MetricCards stats={stats} loading={loading} />

              {/* Barra de Conversão & Saúde da Operação no Período */}
              <ConversionOverview
                leads={filteredLeads}
                orders={filteredOrders}
                loading={loading}
              />

              {/* FUNIL DE CONVERSÃO 3D EM LARGURA TOTAL (PAINEL PRINCIPAL ESTILO STAKENT) */}
              <FunnelViz leads={filteredLeads.length > 0 ? filteredLeads : allLeads} loading={loading} />

              {/* Gráfico de Receita Full Width com Curvas PIX vs Cartão */}
              <RevenueChart data={revenueChart} loading={loading} />

              {/* TRIO DE GRÁFICOS ANALÍTICOS: Métodos (PIX vs Cartão), Status e Origem UTM */}
              <div className="analytics-trio-grid">
                <PaymentMethodsPieChart orders={filteredOrders} loading={loading} />
                <StatusPieChart orders={filteredOrders} loading={loading} />
                <TrafficPieChart leads={filteredLeads} loading={loading} />
              </div>

              {/* Volume Diário de Leads */}
              <LeadsChart
                data={leadsChart}
                total={filteredLeads.length}
                diff={stats.newSubscriptionsDiff}
                loading={loading}
              />

              {/* Tabela de Pedidos com Badges e Filtro por PIX / Cartão */}
              <OrdersTable orders={filteredOrders.slice(0, 10)} loading={loading} compact />
            </>
          )}

          {/* SLUG: /rastreamento */}
          {section === "rastreamento" && (
            <FunnelTracker
              leads={allLeads}
              loading={loading}
              onRefresh={fetchData}
              onlineCount={onlineCount}
            />
          )}

          {/* SLUG: /pedidos */}
          {section === "pedidos" && (
            <OrdersTable orders={filteredOrders.length > 0 ? filteredOrders : allOrders} loading={loading} />
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
            <WhatsAppTracker
              messages={allWhatsApp}
              loading={loading}
              onRefresh={fetchData}
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

      {/* Menu de Rodapé Flutuante Ultra-Premium (Floating Dock) */}
      <FloatingDockNav
        section={section}
        onSelect={handleNavigate}
        onlineCount={onlineCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentUserEmail={session.user.email}
        onSignOut={handleSignOut}
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
      <div className="card" style={{ padding: "26px" }}>
        <div
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
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
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
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
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

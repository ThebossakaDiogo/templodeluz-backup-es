import { useEffect, useState, useCallback, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { MetricCards } from "./components/MetricCards";
import { RevenueChart } from "./components/RevenueChart";
import { LeadsChart } from "./components/LeadsChart";
import { OrdersTable } from "./components/OrdersTable";
import { FunnelTracker } from "./components/FunnelTracker";
import { FunnelViz } from "./components/FunnelViz";
import { StatusPieChart } from "./components/StatusPieChart";
import { TrafficPieChart } from "./components/TrafficPieChart";
import { ConversionOverview } from "./components/ConversionOverview";
import { supabase } from "./lib/supabase";
import type { DateRangeValue } from "./components/DateRangeSelector";
import type { DashboardStats, Lead, PaymentOrder, ChartDataPoint } from "./types";

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

// Construtor do Gráfico de Receita baseado no intervalo
function buildRevenueChartRange(
  orders: PaymentOrder[],
  start: Date,
  end: Date,
  isSingleDay: boolean
): ChartDataPoint[] {
  if (isSingleDay) {
    const hours = ["00h", "04h", "08h", "12h", "16h", "20h"];
    const buckets: Record<string, { revenue: number; sales: number }> = {};
    hours.forEach((h) => {
      buckets[h] = { revenue: 0, sales: 0 };
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
      buckets[slot].revenue += o.amount_cents / 100;
      buckets[slot].sales += 1;
    }

    return Object.entries(buckets).map(([dia, v]) => ({
      dia,
      receita: Math.round(v.revenue * 100) / 100,
      vendas: v.sales,
    }));
  }

  const diffDays = Math.min(
    60,
    Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
  );
  const buckets: Record<string, { revenue: number; sales: number }> = {};
  for (let i = 0; i <= diffDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d > end) break;
    buckets[dateLabel(d.toISOString())] = { revenue: 0, sales: 0 };
  }

  for (const o of orders) {
    if (o.status !== "paid") continue;
    const d = new Date(o.created_at);
    if (d < start || d > end) continue;
    const key = dateLabel(o.created_at);
    if (buckets[key]) {
      buckets[key].revenue += o.amount_cents / 100;
      buckets[key].sales += 1;
    }
  }

  return Object.entries(buckets).map(([dia, v]) => ({
    dia,
    receita: Math.round(v.revenue * 100) / 100,
    vendas: v.sales,
  }));
}

// Construtor do Gráfico de Leads baseado no intervalo
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
export type Section = "visao-geral" | "rastreamento" | "pedidos" | "relatorios";

const SLUG_TO_SECTION: Record<string, Section> = {
  "/": "visao-geral",
  "/visao-geral": "visao-geral",
  "/rastreamento": "rastreamento",
  "/pedidos": "pedidos",
  "/relatorios": "relatorios",
};

const SECTION_TO_SLUG: Record<Section, string> = {
  "visao-geral": "/visao-geral",
  "rastreamento": "/rastreamento",
  "pedidos": "/pedidos",
  "relatorios": "/relatorios",
};

function getSectionFromPath(): Section {
  if (typeof window === "undefined") return "visao-geral";
  const path = window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  return SLUG_TO_SECTION[path] || "visao-geral";
}

// ─── Componente Principal ────────────────────────────────────────────────────
export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("tl-theme") as "light" | "dark") || "dark";
  });

  // Estado de Rota por Slug
  const [section, setSection] = useState<Section>(getSectionFromPath);

  // Estado de Filtro de Calendário
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

  // Sincroniza histórico de navegação por Slug (popstate)
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
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tl-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // ─── Busca de dados no Supabase ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: ordersData }, { data: leadsData }] = await Promise.all([
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
      ]);

      const parsedOrders: PaymentOrder[] = (ordersData ?? []).map((o) => ({
        id: o.id,
        customer_name: o.customer_name || "Consulente",
        customer_email: o.customer_email || "",
        customer_phone: o.customer_phone ?? undefined,
        product_name: o.product_name || "Carta Sagrada",
        amount_cents: o.amount_cents ?? 0,
        status: o.status as PaymentOrder["status"],
        payment_method: "pix" as const,
        created_at: o.created_at,
      }));
      setAllOrders(parsedOrders);

      const parsedLeads: Lead[] = (leadsData ?? []) as Lead[];
      setAllLeads(parsedLeads);

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

    return () => {
      void supabase.removeChannel(ch1);
      void supabase.removeChannel(ch2);
    };
  }, [fetchData]);

  // ─── Cálculos reativos ao DateRange (Hoje, Personalizado, etc) ─────────────
  const { filteredOrders, filteredLeads, stats, revenueChart, leadsChart } = useMemo(() => {
    const startObj = new Date(dateRange.startDate + "T00:00:00");
    const endObj = new Date(dateRange.endDate + "T23:59:59");
    const isSingleDay = dateRange.startDate === dateRange.endDate;

    // Período anterior correspondente para cálculo de crescimento % (Diff)
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

    const pending = fOrders.filter((o) => o.status === "pending" || o.status === "creating");

    const calculatedStats: DashboardStats = {
      newSubscriptions: fLeads.length,
      newSubscriptionsDiff: calcDiff(fLeads.length, prevLeads.length),
      newOrders: paidCurr.length,
      newOrdersDiff: calcDiff(paidCurr.length, paidPrev.length),
      avgOrderRevenue: avgCurr,
      avgOrderRevenueDiff: calcDiff(avgCurr, avgPrev),
      totalRevenue: revCurr,
      totalRevenueDiff: calcDiff(revCurr, revPrev),
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

  // Exportar CSV do período selecionado
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
    a.download = `templo-de-luz-relatorio-${dateRange.startDate}-a-${dateRange.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-root)" }}>
      <Sidebar section={section} onSelect={handleNavigate} onlineCount={onlineCount} />

      <div style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onRefresh={fetchData}
          loading={loading}
          lastUpdate={lastUpdate}
          section={section}
          onExportCsv={exportCsv}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onlineCount={onlineCount}
        />

        <main
          style={{
            flex: 1,
            height: "calc(100vh - 64px)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "26px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            minWidth: 0,
          }}
        >
          {/* SLUG: /visao-geral */}
          {section === "visao-geral" && (
            <>
              {/* Cards de Métricas Principais Dinâmicos com base no Período */}
              <MetricCards stats={stats} loading={loading} />

              {/* Barra de Conversão & Saúde da Operação no Período */}
              <ConversionOverview
                leads={filteredLeads}
                orders={filteredOrders}
                loading={loading}
              />

              {/* Gráfico de Receita Full Width (Horas para Hoje, Dias para Multi-dias) */}
              <RevenueChart data={revenueChart} loading={loading} />

              {/* FUNIL DE CONVERSÃO 3D EM LARGURA TOTAL (ESPAÇOSO E CONFORTÁVEL) */}
              <FunnelViz leads={filteredLeads.length > 0 ? filteredLeads : allLeads} loading={loading} />

              {/* DUPLO GRÁFICO PIZZA (Status & Origem de Tráfego do Período) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px" }}>
                <StatusPieChart orders={filteredOrders} loading={loading} />
                <TrafficPieChart leads={filteredLeads} loading={loading} />
              </div>

              {/* Volume de Leads do Período */}
              <LeadsChart
                data={leadsChart}
                total={filteredLeads.length}
                diff={stats.newSubscriptionsDiff}
                loading={loading}
              />

              {/* Tabela de Pedidos do Período */}
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
        </main>
      </div>
    </div>
  );
}

// ─── View de Relatórios ──────────────────────────────────────────────────────
function ReportsView({
  orders,
  leads,
  stats,
  onExport,
  periodLabel,
}: {
  orders: PaymentOrder[];
  leads: Lead[];
  stats: DashboardStats;
  onExport: () => void;
  periodLabel: string;
}) {
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
            { label: "Vendas Confirmadas", value: stats.newOrders, color: "var(--primary-green)" },
            { label: "Leads Capturados", value: stats.newSubscriptions, color: "var(--primary-blue)" },
            { label: "Ticket Médio", value: brl(stats.avgOrderRevenue), color: "var(--text-primary)" },
            { label: "Cobranças Pendentes", value: stats.pendingCount, color: "#d97706" },
            { label: "Volume Pendente", value: brl(stats.pendingAmount), color: "#f59e0b" },
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
                  fontSize: "22px",
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

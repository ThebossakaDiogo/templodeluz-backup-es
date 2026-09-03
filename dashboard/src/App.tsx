import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { MetricCards } from "./components/MetricCards";
import { RevenueChart } from "./components/RevenueChart";
import { LeadsChart } from "./components/LeadsChart";
import { OrdersTable } from "./components/OrdersTable";
import { FunnelTracker } from "./components/FunnelTracker";
import { FunnelViz } from "./components/FunnelViz";
import { StatusPieChart } from "./components/StatusPieChart";
import { supabase } from "./lib/supabase";
import type { DashboardStats, Lead, PaymentOrder, ChartDataPoint } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────
function calcDiff(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildRevenueChart(orders: PaymentOrder[], days = 14): ChartDataPoint[] {
  const now = new Date();
  const buckets: Record<string, { revenue: number; sales: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets[dateLabel(d.toISOString())] = { revenue: 0, sales: 0 };
  }
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  for (const o of orders) {
    if (o.status !== "paid") continue;
    const d = new Date(o.created_at);
    if (d < cutoff) continue;
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

function buildLeadsChart(leads: Lead[], days = 14): ChartDataPoint[] {
  const now = new Date();
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets[dateLabel(d.toISOString())] = 0;
  }
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  for (const l of leads) {
    const d = new Date(l.created_at);
    if (d < cutoff) continue;
    const key = dateLabel(l.created_at);
    if (key in buckets) buckets[key]++;
  }
  return Object.entries(buckets).map(([dia, leads]) => ({ dia, leads }));
}

// ─── Secções do painel ───────────────────────────────────────────────────────
export type Section = "visao-geral" | "rastreamento" | "pedidos" | "relatorios";

// ─── Componente principal ────────────────────────────────────────────────────
export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("tl-theme") as "light" | "dark") || "dark";
  });
  const [section, setSection] = useState<Section>("visao-geral");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    newSubscriptions: 0,
    newSubscriptionsDiff: 0,
    newOrders: 0,
    newOrdersDiff: 0,
    avgOrderRevenue: 0,
    avgOrderRevenueDiff: 0,
    totalRevenue: 0,
    totalRevenueDiff: 0,
    pendingAmount: 0,
    pendingCount: 0,
  });

  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [revenueChart, setRevenueChart] = useState<ChartDataPoint[]>([]);
  const [leadsChart, setLeadsChart] = useState<ChartDataPoint[]>([]);

  // Aplica tema no HTML
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tl-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  // ─── Busca de dados ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: ordersData }, { data: leadsData }] = await Promise.all([
        supabase
          .from("pix_orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("quiz_funnel_leads")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      const now = new Date();
      const p30 = new Date(now); p30.setDate(p30.getDate() - 30);
      const p60 = new Date(now); p60.setDate(p60.getDate() - 60);

      // Pedidos
      const allOrders: PaymentOrder[] = (ordersData ?? []).map((o) => ({
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
      setOrders(allOrders);

      // Leads
      const allLeads: Lead[] = (leadsData ?? []) as Lead[];
      setLeads(allLeads);

      // Métricas com períodos reais
      const paidCurr = allOrders.filter(
        (o) => o.status === "paid" && new Date(o.created_at) >= p30
      );
      const paidPrev = allOrders.filter(
        (o) =>
          o.status === "paid" &&
          new Date(o.created_at) >= p60 &&
          new Date(o.created_at) < p30
      );
      const revCurr = paidCurr.reduce((s, o) => s + o.amount_cents / 100, 0);
      const revPrev = paidPrev.reduce((s, o) => s + o.amount_cents / 100, 0);
      const avgCurr = paidCurr.length > 0 ? revCurr / paidCurr.length : 0;
      const avgPrev = paidPrev.length > 0 ? revPrev / paidPrev.length : 0;
      const leadsCurr = allLeads.filter((l) => new Date(l.created_at) >= p30);
      const leadsPrev = allLeads.filter(
        (l) => new Date(l.created_at) >= p60 && new Date(l.created_at) < p30
      );
      const pending = allOrders.filter(
        (o) => o.status === "pending" || o.status === "creating"
      );

      setStats({
        newSubscriptions: allLeads.length,
        newSubscriptionsDiff: calcDiff(leadsCurr.length, leadsPrev.length),
        newOrders: allOrders.filter((o) => o.status === "paid").length,
        newOrdersDiff: calcDiff(paidCurr.length, paidPrev.length),
        avgOrderRevenue: avgCurr,
        avgOrderRevenueDiff: calcDiff(avgCurr, avgPrev),
        totalRevenue: revCurr,
        totalRevenueDiff: calcDiff(revCurr, revPrev),
        pendingAmount: pending.reduce((s, o) => s + o.amount_cents / 100, 0),
        pendingCount: pending.length,
      });

      setRevenueChart(buildRevenueChart(allOrders, 14));
      setLeadsChart(buildLeadsChart(allLeads, 14));
      setLastUpdate(new Date());
    } catch (err) {
      console.warn("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregamento inicial + polling 30s
  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 30_000);
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

  // Exportar CSV
  const exportCsv = () => {
    const rows = [
      "ID,Nome,E-mail,Produto,Valor (R$),Status,Metodo,Data",
      ...orders.map(
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
    a.download = `templo-de-luz-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar section={section} onSelect={setSection} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onRefresh={fetchData}
          loading={loading}
          lastUpdate={lastUpdate}
          section={section}
          onExportCsv={exportCsv}
        />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Visão Geral */}
          {section === "visao-geral" && (
            <>
              <MetricCards stats={stats} loading={loading} />

              {/* Gráfico de receita ocupa toda a largura */}
              <RevenueChart data={revenueChart} loading={loading} />

              {/* Funil + Pizza + Leads em grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px" }}>
                <FunnelViz leads={leads} loading={loading} />
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <StatusPieChart orders={orders} loading={loading} />
                  <LeadsChart
                    data={leadsChart}
                    total={leads.length}
                    diff={stats.newSubscriptionsDiff}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Últimos pedidos compacto */}
              <OrdersTable orders={orders.slice(0, 8)} loading={loading} compact />
            </>
          )}

          {/* Rastreamento ao Vivo */}
          {section === "rastreamento" && (
            <FunnelTracker leads={leads} loading={loading} onRefresh={fetchData} />
          )}

          {/* Pedidos */}
          {section === "pedidos" && (
            <OrdersTable orders={orders} loading={loading} />
          )}

          {/* Relatórios */}
          {section === "relatorios" && (
            <ReportsView
              orders={orders}
              leads={leads}
              stats={stats}
              onExport={exportCsv}
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
}: {
  orders: PaymentOrder[];
  leads: Lead[];
  stats: DashboardStats;
  onExport: () => void;
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
      <div className="card" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Resumo do Período
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                margin: "4px 0 0",
              }}
            >
              Últimos 30 dias vs. período anterior
            </p>
          </div>
          <button onClick={onExport} className="btn btn-ruby">
            Exportar CSV
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
            { label: "Faturamento (30d)", value: brl(stats.totalRevenue) },
            { label: "Vendas confirmadas", value: stats.newOrders },
            { label: "Total de leads", value: stats.newSubscriptions },
            { label: "Ticket médio", value: brl(stats.avgOrderRevenue) },
            { label: "PIX pendentes", value: stats.pendingCount },
            { label: "Valor pendente", value: brl(stats.pendingAmount) },
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
                  fontSize: "11px",
                  fontWeight: 600,
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
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição */}
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
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 16px",
            }}
          >
            Origem dos Leads
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
                      height: "5px",
                      background: "var(--border)",
                      borderRadius: "99px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--accent)",
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
              Nenhum lead registrado ainda.
            </p>
          )}
        </div>

        {/* Status dos pedidos */}
        <div className="card" style={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 16px",
            }}
          >
            Status dos Pedidos
          </h3>
          {Object.entries(statusDist)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => {
              const total = orders.length || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                paid: "var(--success)",
                pending: "var(--warning)",
                failed: "var(--danger)",
                expired: "var(--text-muted)",
                creating: "var(--accent)",
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
                      height: "5px",
                      background: "var(--border)",
                      borderRadius: "99px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: colors[status] ?? "var(--accent)",
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
              Nenhum pedido registrado ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

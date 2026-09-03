import {
  DollarSign,
  Users,
  CreditCard,
  QrCode,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { DashboardStats } from "@/types";

interface MetricCardsProps {
  stats: DashboardStats;
  loading: boolean;
}

function formatBRL(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

export function MetricCards({ stats, loading }: MetricCardsProps) {
  const cards = [
    {
      id: "total",
      label: "Faturamento Total Unificado",
      sub: "PIX + Cartão de Crédito",
      value: formatBRL(stats.totalRevenue),
      diff: stats.totalRevenueDiff,
      icon: DollarSign,
      iconBg: "rgba(16, 185, 129, 0.15)",
      iconBorder: "rgba(16, 185, 129, 0.35)",
      iconColor: "var(--primary-green)",
      accentBorder: "rgba(16, 185, 129, 0.4)",
      extraInfo: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", fontSize: "11px" }}>
          <span style={{ color: "var(--primary-green)", fontWeight: 700 }}>
            PIX: {formatBRL(stats.pixRevenue)}
          </span>
          <span style={{ color: "var(--text-muted)" }}>•</span>
          <span style={{ color: "#818cf8", fontWeight: 700 }}>
            Cartão: {formatBRL(stats.cardRevenue)}
          </span>
        </div>
      ),
    },
    {
      id: "pix",
      label: "Conversões no PIX",
      sub: "Instantâneo via Banco Central",
      value: formatBRL(stats.pixRevenue),
      diff: null,
      icon: QrCode,
      iconBg: "rgba(16, 185, 129, 0.15)",
      iconBorder: "rgba(16, 185, 129, 0.35)",
      iconColor: "#10b981",
      accentBorder: "rgba(16, 185, 129, 0.3)",
      extraInfo: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", fontSize: "11px" }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 style={{ width: "12px", height: "12px", color: "#10b981" }} />
            {stats.pixCount} {stats.pixCount === 1 ? "venda paga" : "vendas pagas"}
          </span>
          <span style={{ color: "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock style={{ width: "12px", height: "12px" }} />
            {stats.pixPendingCount} pendente{stats.pixPendingCount !== 1 ? "s" : ""}
          </span>
        </div>
      ),
    },
    {
      id: "card",
      label: "Conversões no Cartão (Stripe)",
      sub: "Processamento seguro de crédito",
      value: formatBRL(stats.cardRevenue),
      diff: null,
      icon: CreditCard,
      iconBg: "rgba(99, 102, 241, 0.15)",
      iconBorder: "rgba(99, 102, 241, 0.35)",
      iconColor: "#818cf8",
      accentBorder: "rgba(99, 102, 241, 0.35)",
      extraInfo: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", fontSize: "11px" }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 style={{ width: "12px", height: "12px", color: "#818cf8" }} />
            {stats.cardCount} {stats.cardCount === 1 ? "venda aprovada" : "vendas aprovadas"}
          </span>
          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
            Ticket Médio: {formatBRL(stats.cardAvgRevenue)}
          </span>
        </div>
      ),
    },
    {
      id: "leads",
      label: "Total de Leads & Funil",
      sub: "Consulentes capturados no quiz",
      value: stats.newSubscriptions.toLocaleString("pt-BR"),
      diff: stats.newSubscriptionsDiff,
      icon: Users,
      iconBg: "rgba(37, 99, 235, 0.15)",
      iconBorder: "rgba(37, 99, 235, 0.35)",
      iconColor: "var(--primary-blue)",
      accentBorder: "rgba(37, 99, 235, 0.3)",
      extraInfo: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", fontSize: "11px" }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
            Vendas Totais: {stats.newOrders}
          </span>
          <span style={{ color: "var(--primary-green)", fontWeight: 800 }}>
            {stats.newSubscriptions > 0
              ? `${((stats.newOrders / stats.newSubscriptions) * 100).toFixed(1)}% conv.`
              : "0% conv."}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="metric-cards-grid">
      {cards.map((c) => (
        <div
          key={c.id}
          className="card"
          style={{
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.2s ease",
          }}
        >
          {/* Topo do Card */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: c.iconBg,
                  border: `1px solid ${c.iconBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: c.iconColor,
                  flexShrink: 0,
                  boxShadow: `0 0 12px ${c.iconBg}`,
                }}
              >
                <c.icon style={{ width: "18px", height: "18px" }} />
              </div>

              {c.diff !== null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background:
                      c.diff >= 0
                        ? "rgba(16, 185, 129, 0.14)"
                        : "rgba(239, 68, 68, 0.14)",
                    color: c.diff >= 0 ? "var(--primary-green)" : "#ef4444",
                    border: `1px solid ${
                      c.diff >= 0
                        ? "rgba(16, 185, 129, 0.3)"
                        : "rgba(239, 68, 68, 0.3)"
                    }`,
                  }}
                >
                  {c.diff >= 0 ? (
                    <TrendingUp style={{ width: "11px", height: "11px" }} />
                  ) : (
                    <TrendingDown style={{ width: "11px", height: "11px" }} />
                  )}
                  <span>{c.diff >= 0 ? `+${c.diff}%` : `${c.diff}%`}</span>
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "block",
              }}
            >
              {c.label}
            </span>

            <div style={{ marginTop: "4px" }}>
              {loading ? (
                <div
                  className="skeleton"
                  style={{ height: "30px", width: "70%", borderRadius: "6px" }}
                />
              ) : (
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  {c.value}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: "10.5px",
                color: "var(--text-muted)",
                display: "block",
                marginTop: "3px",
                fontWeight: 500,
              }}
            >
              {c.sub}
            </span>
          </div>

          {/* Divisor e Detalhes de Conversão Específicos */}
          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              marginTop: "14px",
              paddingTop: "4px",
            }}
          >
            {c.extraInfo}
          </div>
        </div>
      ))}
    </div>
  );
}

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
      label: "Faturamento Total",
      sub: "PIX + Cartão de Crédito",
      value: formatBRL(stats.totalRevenue),
      diff: stats.totalRevenueDiff,
      icon: DollarSign,
      iconGrad: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      iconShadow: "0 4px 14px rgba(16, 185, 129, 0.28)",
      extraInfo: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", fontSize: "11.5px" }}>
          <span style={{ color: "var(--primary-green)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary-green)", display: "inline-block" }} />
            PIX: {formatBRL(stats.pixRevenue)}
          </span>
          <span style={{ color: "var(--text-muted)" }}>•</span>
          <span style={{ color: "#3b82f6", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
            Cartão: {formatBRL(stats.cardRevenue)}
          </span>
        </div>
      ),
    },
    {
      id: "pix",
      label: "Conversões no PIX",
      sub: "Instantâneo Banco Central",
      value: formatBRL(stats.pixRevenue),
      diff: null,
      icon: QrCode,
      iconGrad: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
      iconShadow: "0 4px 14px rgba(6, 182, 212, 0.28)",
      extraInfo: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", fontSize: "11.5px" }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 style={{ width: "13px", height: "13px", color: "#10b981" }} />
            {stats.pixCount} {stats.pixCount === 1 ? "venda paga" : "vendas pagas"}
          </span>
          <span style={{ color: stats.pixPendingCount > 0 ? "#f59e0b" : "var(--text-muted)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock style={{ width: "13px", height: "13px" }} />
            {stats.pixPendingCount} pendente{stats.pixPendingCount !== 1 ? "s" : ""}
          </span>
        </div>
      ),
    },
    {
      id: "card",
      label: "Cartão de Crédito",
      sub: "Processamento Stripe",
      value: formatBRL(stats.cardRevenue),
      diff: null,
      icon: CreditCard,
      iconGrad: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      iconShadow: "0 4px 14px rgba(59, 130, 246, 0.28)",
      extraInfo: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", fontSize: "11.5px" }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 style={{ width: "13px", height: "13px", color: "#3b82f6" }} />
            {stats.cardCount} {stats.cardCount === 1 ? "venda aprovada" : "vendas aprovadas"}
          </span>
          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
            TM: {formatBRL(stats.cardAvgRevenue)}
          </span>
        </div>
      ),
    },
    {
      id: "leads",
      label: "Total de Leads & Funil",
      sub: "Consulentes no quiz",
      value: stats.newSubscriptions.toLocaleString("pt-BR"),
      diff: stats.newSubscriptionsDiff,
      icon: Users,
      iconGrad: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
      iconShadow: "0 4px 14px rgba(139, 92, 246, 0.28)",
      extraInfo: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", fontSize: "11.5px" }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
            Vendas: {stats.newOrders}
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
            padding: "18px 20px",
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
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              {/* Ícone FinTech Circular de Luxo */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: c.iconGrad,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                  boxShadow: c.iconShadow,
                }}
              >
                <c.icon style={{ width: "17px", height: "17px" }} strokeWidth={2.3} />
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
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(239, 68, 68, 0.12)",
                    color: c.diff >= 0 ? "var(--primary-green)" : "#ef4444",
                    border: `1px solid ${
                      c.diff >= 0
                        ? "rgba(16, 185, 129, 0.25)"
                        : "rgba(239, 68, 68, 0.25)"
                    }`,
                  }}
                >
                  {c.diff >= 0 ? (
                    <TrendingUp style={{ width: "11px", height: "11px" }} strokeWidth={2.4} />
                  ) : (
                    <TrendingDown style={{ width: "11px", height: "11px" }} strokeWidth={2.4} />
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
                letterSpacing: "0.04em",
                display: "block",
              }}
            >
              {c.label}
            </span>

            <div style={{ marginTop: "4px" }}>
              {loading ? (
                <div
                  className="skeleton"
                  style={{ height: "28px", width: "65%", borderRadius: "6px" }}
                />
              ) : (
                <span
                  style={{
                    fontSize: "23px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.025em",
                    lineHeight: 1.15,
                    fontFamily: "'Space Grotesk', sans-serif",
                    display: "block",
                  }}
                >
                  {c.value}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                display: "block",
                marginTop: "2px",
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
              marginTop: "12px",
              paddingTop: "2px",
            }}
          >
            {c.extraInfo}
          </div>
        </div>
      ))}
    </div>
  );
}

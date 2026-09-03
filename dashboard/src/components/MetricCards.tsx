import { TrendingUp, TrendingDown, Minus, Users, ShoppingBag, Clock, DollarSign } from "lucide-react";
import type { DashboardStats } from "@/types";

interface MetricCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

interface CardConfig {
  label: string;
  description: string;
  value: string;
  diff?: number;
  icon: typeof Users;
  iconClass: string;
  valueColor?: string;
  accentGlow: string;
}

export function MetricCards({ stats, loading }: MetricCardsProps) {
  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(v);

  const cards: CardConfig[] = [
    {
      label: "Total de Leads",
      description: "Entradas registradas no quiz",
      value: stats.newSubscriptions.toLocaleString("pt-BR"),
      diff: stats.newSubscriptionsDiff,
      icon: Users,
      iconClass: "icon-navy",
      valueColor: "#ffffff",
      accentGlow: "rgba(37, 99, 235, 0.15)",
    },
    {
      label: "Vendas Confirmadas",
      description: "PIX pagos no gateway",
      value: stats.newOrders.toLocaleString("pt-BR"),
      diff: stats.newOrdersDiff,
      icon: ShoppingBag,
      iconClass: "icon-emerald",
      valueColor: "#34d399",
      accentGlow: "rgba(16, 185, 129, 0.18)",
    },
    {
      label: "PIX Pendentes",
      description: `${stats.pendingCount} cobrança${stats.pendingCount !== 1 ? "s" : ""} aguardando`,
      value: brl(stats.pendingAmount),
      icon: Clock,
      iconClass: "icon-amber",
      valueColor: "#fbbf24",
      accentGlow: "rgba(245, 158, 11, 0.15)",
    },
    {
      label: "Faturamento (30d)",
      description: "Volume financeiro liquidado",
      value: brl(stats.totalRevenue),
      diff: stats.totalRevenueDiff,
      icon: DollarSign,
      iconClass: "icon-emerald",
      valueColor: "#ffffff",
      accentGlow: "rgba(16, 185, 129, 0.25)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
      }}
    >
      {cards.map((card, i) => {
        const Icon = card.icon;
        const hasDiff = card.diff !== undefined;
        const positive = (card.diff ?? 0) > 0;
        const negative = (card.diff ?? 0) < 0;

        return (
          <div
            key={card.label}
            className="card fade-up"
            style={{
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              animationDelay: `${i * 50}ms`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow de fundo sofisticado */}
            <div
              style={{
                position: "absolute",
                top: "-30px",
                right: "-30px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${card.accentGlow} 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            {/* Linha Superior: Ícone + Badge Diff */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className={card.iconClass}>
                <Icon style={{ width: "19px", height: "19px" }} />
              </div>

              {hasDiff && !loading && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: positive ? "#34d399" : negative ? "#f87171" : "var(--text-muted)",
                    background: positive
                      ? "rgba(16, 185, 129, 0.12)"
                      : negative
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${positive ? "rgba(16, 185, 129, 0.28)" : negative ? "rgba(239, 68, 68, 0.28)" : "var(--border)"}`,
                    borderRadius: "6px",
                    padding: "3px 8px",
                  }}
                >
                  {positive ? (
                    <TrendingUp style={{ width: "12px", height: "12px" }} />
                  ) : negative ? (
                    <TrendingDown style={{ width: "12px", height: "12px" }} />
                  ) : (
                    <Minus style={{ width: "12px", height: "12px" }} />
                  )}
                  {positive ? "+" : ""}{card.diff}%
                </div>
              )}
            </div>

            {/* Valores com Alto Contraste */}
            <div>
              {loading ? (
                <>
                  <div className="skeleton" style={{ height: "34px", width: "120px", marginBottom: "6px" }} />
                  <div className="skeleton" style={{ height: "12px", width: "80px" }} />
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      color: card.valueColor ?? "var(--text-primary)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.05,
                    }}
                  >
                    {card.value}
                  </div>
                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "var(--text-muted)",
                      marginTop: "6px",
                      fontWeight: 600,
                    }}
                  >
                    {card.label}
                  </div>
                </>
              )}
            </div>

            {/* Descrição Inferior */}
            <div
              style={{
                paddingTop: "12px",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              {card.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}

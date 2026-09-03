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
  neonClass: string;
  neonColor: string;
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
      description: "Entradas no quiz",
      value: stats.newSubscriptions.toLocaleString("pt-BR"),
      diff: stats.newSubscriptionsDiff,
      icon: Users,
      neonClass: "neon-blue",
      neonColor: "#00b4ff",
    },
    {
      label: "Vendas Confirmadas",
      description: "PIX pagos",
      value: stats.newOrders.toLocaleString("pt-BR"),
      diff: stats.newOrdersDiff,
      icon: ShoppingBag,
      neonClass: "neon-green",
      neonColor: "#00e5a0",
    },
    {
      label: "PIX Pendentes",
      description: `${stats.pendingCount} cobrança${stats.pendingCount !== 1 ? "s" : ""} aguardando`,
      value: brl(stats.pendingAmount),
      icon: Clock,
      neonClass: "neon-amber",
      neonColor: "#f59e0b",
    },
    {
      label: "Faturamento (30d)",
      description: "Receita confirmada",
      value: brl(stats.totalRevenue),
      diff: stats.totalRevenueDiff,
      icon: DollarSign,
      neonClass: "neon-purple",
      neonColor: "#a855f7",
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
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              animationDelay: `${i * 60}ms`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow de fundo decorativo */}
            <div
              style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${card.neonColor}0A 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            {/* Topo: ícone + diff */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className={`neon-icon ${card.neonClass}`}>
                <Icon style={{ width: "18px", height: "18px" }} />
              </div>

              {hasDiff && !loading && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: positive ? "#00e5a0" : negative ? "#ef4444" : "var(--text-muted)",
                    background: positive
                      ? "rgba(0,229,160,0.08)"
                      : negative
                      ? "rgba(239,68,68,0.08)"
                      : "transparent",
                    border: `1px solid ${positive ? "rgba(0,229,160,0.2)" : negative ? "rgba(239,68,68,0.2)" : "transparent"}`,
                    borderRadius: "6px",
                    padding: "2px 7px",
                  }}
                >
                  {positive ? (
                    <TrendingUp style={{ width: "11px", height: "11px" }} />
                  ) : negative ? (
                    <TrendingDown style={{ width: "11px", height: "11px" }} />
                  ) : (
                    <Minus style={{ width: "11px", height: "11px" }} />
                  )}
                  {positive ? "+" : ""}{card.diff}%
                </div>
              )}
            </div>

            {/* Valor */}
            <div>
              {loading ? (
                <>
                  <div className="skeleton" style={{ height: "32px", width: "110px", marginBottom: "6px" }} />
                  <div className="skeleton" style={{ height: "11px", width: "80px" }} />
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    {card.value}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginTop: "5px",
                      fontWeight: 500,
                    }}
                  >
                    {card.label}
                  </div>
                </>
              )}
            </div>

            {/* Barra de detalhe */}
            <div
              style={{
                paddingTop: "12px",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "10.5px",
                color: "var(--text-muted)",
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

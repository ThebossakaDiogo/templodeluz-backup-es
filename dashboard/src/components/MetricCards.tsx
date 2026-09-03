import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DashboardStats } from "@/types";

interface MetricCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

interface CardProps {
  label: string;
  description: string;
  value: string | number;
  diff?: number;
  diffLabel?: string;
  loading?: boolean;
  valueColor?: string;
}

function MetricCard({
  label,
  description,
  value,
  diff,
  diffLabel = "vs. período anterior",
  loading,
  valueColor,
}: CardProps) {
  const hasDiff = diff !== undefined;

  return (
    <div
      className="card"
      style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "10.5px",
            color: "var(--text-muted)",
            margin: "2px 0 0",
            fontWeight: 400,
          }}
        >
          {description}
        </p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: "34px", width: "120px" }} />
      ) : (
        <span
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: valueColor ?? "var(--text-primary)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </span>
      )}

      {hasDiff && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: 600,
            color:
              loading
                ? "var(--text-muted)"
                : diff! > 0
                ? "var(--success)"
                : diff! < 0
                ? "var(--danger)"
                : "var(--text-muted)",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "10px",
          }}
        >
          {loading ? (
            <div className="skeleton" style={{ height: "12px", width: "80px" }} />
          ) : (
            <>
              {diff! > 0 ? (
                <TrendingUp style={{ width: "13px", height: "13px" }} />
              ) : diff! < 0 ? (
                <TrendingDown style={{ width: "13px", height: "13px" }} />
              ) : (
                <Minus style={{ width: "13px", height: "13px" }} />
              )}
              <span>
                {diff! > 0 ? "+" : ""}
                {diff}% {diffLabel}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MetricCards({ stats, loading }: MetricCardsProps) {
  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(v);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
      }}
    >
      <MetricCard
        label="Total de Leads"
        description="Entradas no quiz"
        value={loading ? "—" : stats.newSubscriptions.toLocaleString("pt-BR")}
        diff={stats.newSubscriptionsDiff}
        loading={loading}
      />
      <MetricCard
        label="Vendas Confirmadas"
        description="PIX pagos no gateway"
        value={loading ? "—" : stats.newOrders.toLocaleString("pt-BR")}
        diff={stats.newOrdersDiff}
        loading={loading}
      />
      <MetricCard
        label="PIX Pendentes"
        description={`${stats.pendingCount} cobranças aguardando`}
        value={loading ? "—" : brl(stats.pendingAmount)}
        loading={loading}
        valueColor="var(--warning)"
        diffLabel=""
      />
      <MetricCard
        label="Faturamento (30 dias)"
        description="Receita de vendas pagas"
        value={loading ? "—" : brl(stats.totalRevenue)}
        diff={stats.totalRevenueDiff}
        loading={loading}
        valueColor="var(--success)"
      />
    </div>
  );
}

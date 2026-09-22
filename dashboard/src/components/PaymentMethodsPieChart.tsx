import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { QrCode, CreditCard, PieChart as PieIcon } from "lucide-react";
import type { PaymentOrder } from "@/types";

interface PaymentMethodsPieChartProps {
  readonly orders: readonly PaymentOrder[];
  readonly loading?: boolean;
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

interface PaymentMethodsTooltipProps {
  readonly active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly payload?: readonly any[];
  readonly totalAmountCents: number;
}

function PaymentMethodsTooltip({ active, payload, totalAmountCents }: PaymentMethodsTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const pct = totalAmountCents > 0 ? Math.round(((item.value * 100) / totalAmountCents) * 100) : 0;
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${item.color}`,
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
        <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>{item.name}</strong>
      </div>
      <div style={{ fontSize: "13px", fontWeight: 900, color: item.color }}>
        {formatBRL(item.value * 100)} ({pct}%)
      </div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
        {item.count} {item.count === 1 ? "transação aprovada" : "transações aprovadas"}
      </div>
    </div>
  );
}

export const PaymentMethodsPieChart = memo(function PaymentMethodsPieChart({ orders, loading }: PaymentMethodsPieChartProps) {
  const paidOrders = orders.filter((o) => o.status === "paid");

  // Separação rigorosa entre PIX e Cartão
  const pixOrders = paidOrders.filter((o) => o.payment_method === "pix" || !o.payment_method);
  const cardOrders = paidOrders.filter((o) => o.payment_method === "credit_card");

  const pixAmountCents = pixOrders.reduce((sum, o) => sum + o.amount_cents, 0);
  const cardAmountCents = cardOrders.reduce((sum, o) => sum + o.amount_cents, 0);
  const totalAmountCents = pixAmountCents + cardAmountCents;

  const data = [
    {
      name: "PIX (Banco Central)",
      value: pixAmountCents / 100,
      count: pixOrders.length,
      color: "#9D1CBB",
      icon: QrCode,
    },
    {
      name: "Cartão de Crédito (Stripe)",
      value: cardAmountCents / 100,
      count: cardOrders.length,
      color: "#C4BAFF",
      icon: CreditCard,
    },
  ];

  const hasData = totalAmountCents > 0 || paidOrders.length > 0;

  return (
    <div
      className="card"
      style={{
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-strong)",
            }}
          >
            <PieIcon style={{ width: "15px", height: "15px" }} strokeWidth={1.8} />
          </div>
          <div>
            <h3 style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
              Método de Pagamento (PIX vs Cartão)
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0", fontWeight: 400 }}>
              Onde cada consulente realizou a doação
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "999px",
            padding: "2px 8px",
          }}
        >
          {paidOrders.length} {paidOrders.length === 1 ? "venda paga" : "vendas pagas"}
        </span>
      </div>

      {/* Gráfico Donut */}
      <div style={{ height: "170px", width: "100%", position: "relative" }}>
        {(() => {
          if (loading) {
            return <div className="skeleton" style={{ height: "100%", width: "100%", borderRadius: "12px" }} />;
          }
          if (!hasData) {
            return (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                <span>Nenhum pagamento liquidado no período</span>
                <span style={{ fontSize: "11px" }}>As doações via PIX ou Stripe aparecerão aqui</span>
              </div>
            );
          }
          return (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<PaymentMethodsTooltip totalAmountCents={totalAmountCents} />} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* Legenda & Detalhes por Método */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
        {data.map((item) => {
          const pct = totalAmountCents > 0 ? Math.round(((item.value * 100) / totalAmountCents) * 100) : 0;
          return (
            <div
              key={item.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "var(--bg-surface-alt)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    background: `${item.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: item.color,
                  }}
                >
                  <item.icon style={{ width: "12px", height: "12px" }} />
                </div>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                    {item.count} transaç{item.count === 1 ? "ão" : "ões"}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 900, color: item.color, display: "block" }}>
                  {formatBRL(item.value * 100)}
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)" }}>
                  {pct}% do total
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

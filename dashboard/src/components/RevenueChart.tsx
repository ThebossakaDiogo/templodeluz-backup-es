import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, QrCode, CreditCard } from "lucide-react";
import type { ChartDataPoint } from "@/types";

interface RevenueChartProps {
  data: ChartDataPoint[];
  loading: boolean;
}

function formatBRL(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const totalRevenue = data.reduce((s, d) => s + (d.receita ?? 0), 0);
  const totalPix = data.reduce((s, d) => s + (d.receitaPix ?? 0), 0);
  const totalCard = data.reduce((s, d) => s + (d.receitaCartao ?? 0), 0);
  const totalSales = data.reduce((s, d) => s + (d.vendas ?? 0), 0);

  return (
    <div
      className="card revenue-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        minWidth: 0,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Evolução de Receita (PIX vs Cartão)
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--accent-strong)",
                background: "var(--accent-soft-bg)",
                border: "1px solid var(--accent-border)",
                padding: "2px 8px",
                borderRadius: "999px",
              }}
            >
              <TrendingUp style={{ width: "12px", height: "12px" }} />
              Volume Consolidado
            </div>
          </div>
          <p
            style={{
              fontSize: "11.5px",
              color: "var(--text-muted)",
              margin: "2px 0 0",
              fontWeight: 400,
            }}
          >
            Faturamento liquidado discriminado por método de pagamento em tempo real
          </p>
        </div>

        {/* Resumo e Legenda */}
        <div className="revenue-summary" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Legenda PIX */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#8A79FF" }} />
            <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>PIX:</span>
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatBRL(totalPix)}</strong>
          </div>

          {/* Legenda Cartão Stripe */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#C4BAFF" }} />
            <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Cartão:</span>
            <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatBRL(totalCard)}</strong>
          </div>

          <div style={{ width: "1px", height: "20px", background: "var(--border-subtle)" }} />

          <div style={{ textAlign: "right" }}>
            <span
              className="font-numeric"
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "var(--text-primary)",
                display: "block",
                lineHeight: 1.1,
              }}
            >
              {formatBRL(totalRevenue)}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 400,
              }}
            >
              {totalSales} {totalSales === 1 ? "venda no total" : "vendas no total"}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="revenue-chart-wrap" style={{ height: "260px", width: "100%", minWidth: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="skeleton" style={{ height: "100%", width: "100%", borderRadius: "12px" }} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pixGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--info)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--info)" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                vertical={false}
              />
              <XAxis
                dataKey="dia"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `R$${v}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload as ChartDataPoint;
                    return (
                      <div
                        style={{
                          background: "var(--surface-card)",
                          border: "1px solid var(--border-strong)",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          boxShadow: "var(--shadow-card)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            margin: "0 0 6px",
                            borderBottom: "1px solid var(--border-subtle)",
                            paddingBottom: "4px",
                          }}
                        >
                          {label}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                            <span style={{ color: "#8A79FF", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                              <QrCode style={{ width: "12px", height: "12px" }} /> PIX:
                            </span>
                            <strong style={{ color: "var(--text-primary)" }}>
                              {formatBRL(row.receitaPix ?? 0)} ({row.vendasPix ?? 0} vendas)
                            </strong>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                            <span style={{ color: "#C4BAFF", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                              <CreditCard style={{ width: "12px", height: "12px" }} /> Cartão Stripe:
                            </span>
                            <strong style={{ color: "var(--text-primary)" }}>
                              {formatBRL(row.receitaCartao ?? 0)} ({row.vendasCartao ?? 0} vendas)
                            </strong>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginTop: "4px", paddingTop: "4px", borderTop: "1px solid var(--border-subtle)" }}>
                            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Total do Período:</span>
                            <strong style={{ color: "var(--success)", fontSize: "12.5px" }}>
                              {formatBRL(row.receita ?? 0)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Área do Cartão Stripe */}
              <Area
                type="monotone"
                dataKey="receitaCartao"
                name="Cartão Stripe"
                stroke="var(--info)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cardGradient)"
              />

              {/* Área do PIX */}
              <Area
                type="monotone"
                dataKey="receitaPix"
                name="PIX"
                stroke="var(--success)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#pixGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Evolução de Receita & Vendas (PIX vs Cartão)
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--primary-green)",
                background: "rgba(16, 185, 129, 0.12)",
                padding: "2px 8px",
                borderRadius: "6px",
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
              margin: "3px 0 0",
              fontWeight: 500,
            }}
          >
            Faturamento liquidado discriminado por método de pagamento em tempo real
          </p>
        </div>

        {/* Resumo e Legenda */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Legenda PIX */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#10b981" }} />
            <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>PIX:</span>
            <strong style={{ color: "#10b981" }}>{formatBRL(totalPix)}</strong>
          </div>

          {/* Legenda Cartão Stripe */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#6366f1" }} />
            <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>Cartão:</span>
            <strong style={{ color: "#818cf8" }}>{formatBRL(totalCard)}</strong>
          </div>

          <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 900,
                color: "var(--text-primary)",
                display: "block",
                lineHeight: 1,
              }}
            >
              {formatBRL(totalRevenue)}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              {totalSales} {totalSales === 1 ? "venda no total" : "vendas no total"}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div style={{ height: "230px", width: "100%", minWidth: 0, overflow: "hidden" }}>
        {loading ? (
          <div
            className="skeleton"
            style={{ height: "100%", width: "100%", borderRadius: "10px" }}
          />
        ) : (
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {/* Gradiente PIX */}
                <linearGradient id="pixGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>

                {/* Gradiente Cartão Stripe */}
                <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-subtle)"
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
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          padding: "12px 16px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            margin: "0 0 8px",
                            borderBottom: "1px solid var(--border-subtle)",
                            paddingBottom: "4px",
                          }}
                        >
                          Data / Horário: {label}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11.5px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                            <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                              <QrCode style={{ width: "12px", height: "12px" }} /> PIX:
                            </span>
                            <strong style={{ color: "var(--text-primary)" }}>
                              {formatBRL(row.receitaPix ?? 0)} ({row.vendasPix ?? 0} vendas)
                            </strong>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                            <span style={{ color: "#818cf8", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                              <CreditCard style={{ width: "12px", height: "12px" }} /> Cartão Stripe:
                            </span>
                            <strong style={{ color: "var(--text-primary)" }}>
                              {formatBRL(row.receitaCartao ?? 0)} ({row.vendasCartao ?? 0} vendas)
                            </strong>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginTop: "4px", paddingTop: "4px", borderTop: "1px solid var(--border-subtle)" }}>
                            <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>Total do Período:</span>
                            <strong style={{ color: "var(--primary-green)", fontSize: "12.5px" }}>
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
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cardGradient)"
              />

              {/* Área do PIX */}
              <Area
                type="monotone"
                dataKey="receitaPix"
                name="PIX"
                stroke="#10b981"
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

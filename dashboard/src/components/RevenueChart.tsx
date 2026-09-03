import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartDataPoint } from "@/types";

interface RevenueChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0c1527",
        border: "1px solid rgba(16, 185, 129, 0.4)",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(16, 185, 129, 0.2)",
        fontSize: "12px",
      }}
    >
      <p style={{ color: "#94a3b8", fontWeight: 700, marginBottom: "6px", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginTop: "4px" }}>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
          <span style={{ color: "#f8fafc", fontWeight: 800 }}>
            {p.name === "Receita (R$)" ? brl(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const hasData = data.some((d) => (d.receita ?? 0) > 0);

  return (
    <div className="card" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
      {/* Sutil halo esmeralda/safira de fundo */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Evolução de Receita & Vendas
          </h3>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>
            Volume faturado e quantidade de transações PIX liquidadas
          </p>
        </div>
        {loading && (
          <span
            style={{
              fontSize: "10px",
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "99px",
              padding: "3px 10px",
              fontWeight: 700,
            }}
          >
            Sincronizando...
          </span>
        )}
      </div>

      {!hasData && !loading ? (
        <div
          style={{
            height: "250px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: "28px", opacity: 0.3, color: "#10b981" }}>❖</div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Aguardando primeiras transações
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            Os pagamentos confirmados serão desenhados aqui em tempo real
          </p>
        </div>
      ) : (
        <div style={{ height: "250px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceitaEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradVendasCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}    />
                </linearGradient>
                <filter id="glowEmerald">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 } as React.SVGProps<SVGTextElement>}
              />
              <YAxis
                yAxisId="receita"
                orientation="left"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 } as React.SVGProps<SVGTextElement>}
                tickFormatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`}
              />
              <YAxis
                yAxisId="vendas"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 } as React.SVGProps<SVGTextElement>}
                allowDecimals={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "14px", color: "#cbd5e1" }}
              />
              <Area
                yAxisId="receita"
                type="monotone"
                dataKey="receita"
                name="Receita (R$)"
                stroke="#10b981"
                strokeWidth={2.8}
                fill="url(#gradReceitaEmerald)"
                dot={false}
                activeDot={{ r: 5, fill: "#34d399", stroke: "rgba(16, 185, 129, 0.4)", strokeWidth: 5 }}
                filter="url(#glowEmerald)"
              />
              <Area
                yAxisId="vendas"
                type="monotone"
                dataKey="vendas"
                name="Vendas (qtd)"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#gradVendasCyan)"
                dot={false}
                activeDot={{ r: 4, fill: "#38bdf8", stroke: "rgba(6, 182, 212, 0.4)", strokeWidth: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

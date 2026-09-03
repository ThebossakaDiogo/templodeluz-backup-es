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
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        fontSize: "12px",
      }}
    >
      <p style={{ color: "var(--text-muted)", fontWeight: 700, marginBottom: "6px", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginTop: "3px" }}>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>
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
    <div className="card" style={{ padding: "22px", position: "relative", overflow: "hidden" }}>
      {/* Glow decorativo */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "160px",
          height: "160px",
          background: "radial-gradient(circle, rgba(0,180,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Receita por Dia
          </h3>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 400 }}>
            Últimos 14 dias · Apenas vendas confirmadas
          </p>
        </div>
        {loading && (
          <span
            style={{
              fontSize: "10px",
              color: "#00b4ff",
              background: "rgba(0,180,255,0.08)",
              border: "1px solid rgba(0,180,255,0.2)",
              borderRadius: "99px",
              padding: "3px 10px",
              fontWeight: 700,
            }}
          >
            Atualizando...
          </span>
        )}
      </div>

      {!hasData && !loading ? (
        <div
          style={{
            height: "240px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: "28px", opacity: 0.2 }}>—</div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
            Nenhuma venda registrada ainda
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            As vendas confirmadas aparecerão aqui em tempo real
          </p>
        </div>
      ) : (
        <div style={{ height: "240px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#00b4ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00b4ff" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0}   />
                </linearGradient>
                <filter id="glowBlue">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Inter" } as React.SVGProps<SVGTextElement>}
              />
              <YAxis
                yAxisId="receita"
                orientation="left"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Inter" } as React.SVGProps<SVGTextElement>}
                tickFormatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`}
              />
              <YAxis
                yAxisId="vendas"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Inter" } as React.SVGProps<SVGTextElement>}
                allowDecimals={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px", color: "var(--text-secondary)" }}
              />
              <Area
                yAxisId="receita"
                type="monotone"
                dataKey="receita"
                name="Receita (R$)"
                stroke="#00b4ff"
                strokeWidth={2.5}
                fill="url(#gradReceita)"
                dot={false}
                activeDot={{ r: 5, fill: "#00b4ff", stroke: "rgba(0,180,255,0.3)", strokeWidth: 4 }}
                filter="url(#glowBlue)"
              />
              <Area
                yAxisId="vendas"
                type="monotone"
                dataKey="vendas"
                name="Vendas (qtd)"
                stroke="#a855f7"
                strokeWidth={2}
                fill="url(#gradVendas)"
                dot={false}
                activeDot={{ r: 4, fill: "#a855f7", stroke: "rgba(168,85,247,0.3)", strokeWidth: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

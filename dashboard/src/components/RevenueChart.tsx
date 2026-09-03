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

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const hasData = data.some((d) => (d.receita ?? 0) > 0);

  return (
    <div className="card" style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Receita por Dia
          </h3>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              margin: "3px 0 0",
            }}
          >
            Últimos 14 dias · Apenas vendas confirmadas (PIX pago)
          </p>
        </div>
        {loading && (
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              background: "var(--bg-surface-alt)",
              border: "1px solid var(--border)",
              borderRadius: "99px",
              padding: "3px 10px",
              fontWeight: 600,
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
            gap: "6px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Nenhuma venda registrada ainda
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            As vendas confirmadas aparecerão aqui em tempo real
          </p>
        </div>
      ) : (
        <div style={{ height: "240px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--text-muted)" } as React.SVGProps<SVGTextElement>}
              />
              <YAxis
                yAxisId="receita"
                orientation="left"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--text-muted)" } as React.SVGProps<SVGTextElement>}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`
                }
              />
              <YAxis
                yAxisId="vendas"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--text-muted)" } as React.SVGProps<SVGTextElement>}
                allowDecimals={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  boxShadow: "var(--shadow-card)",
                  fontSize: "11px",
                  color: "var(--text-primary)",
                }}
                labelStyle={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}
                formatter={(value: number, name: string) =>
                  name === "Receita (R$)" ? [brl(value), name] : [value, name]
                }
              />
              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{
                  fontSize: "11px",
                  paddingTop: "10px",
                  color: "var(--text-secondary)",
                }}
              />
              <Area
                yAxisId="receita"
                type="monotone"
                dataKey="receita"
                name="Receita (R$)"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gradReceita)"
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
              <Area
                yAxisId="vendas"
                type="monotone"
                dataKey="vendas"
                name="Vendas (qtd)"
                stroke="#10b981"
                strokeWidth={1.5}
                fill="url(#gradVendas)"
                dot={false}
                activeDot={{ r: 3, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

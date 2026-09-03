import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ChartDataPoint } from "@/types";

interface LeadsChartProps {
  data: ChartDataPoint[];
  total: number;
  diff: number;
  loading?: boolean;
}

const PALETTE = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#06b6d4"];

export function LeadsChart({ data, total, diff, loading }: LeadsChartProps) {
  const hasData = data.some((d) => (d.leads ?? 0) > 0);

  const DiffIcon =
    diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor =
    diff > 0 ? "var(--success)" : diff < 0 ? "var(--danger)" : "var(--text-muted)";

  return (
    <div
      className="card"
      style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}
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
          Leads do Quiz
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginTop: "6px",
          }}
        >
          {loading ? (
            <div className="skeleton" style={{ height: "30px", width: "80px" }} />
          ) : (
            <span
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {total.toLocaleString("pt-BR")}
            </span>
          )}
        </div>

        {!loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 600,
              color: diffColor,
              marginTop: "4px",
            }}
          >
            <DiffIcon style={{ width: "12px", height: "12px" }} />
            {diff > 0 ? "+" : ""}{diff}% vs. período anterior
          </div>
        )}

        <p
          style={{
            fontSize: "10.5px",
            color: "var(--text-muted)",
            margin: "4px 0 0",
          }}
        >
          Últimos 14 dias · Entradas no funil
        </p>
      </div>

      <div style={{ flex: 1, minHeight: "140px" }}>
        {!hasData && !loading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            Nenhum lead ainda.<br />
            Aparecerão aqui em tempo real.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <XAxis
                dataKey="dia"
                hide={data.length > 10}
                tick={{ fontSize: 9, fill: "var(--text-muted)" } as React.SVGProps<SVGTextElement>}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-card)",
                  fontSize: "11px",
                  color: "var(--text-primary)",
                }}
                formatter={(value: number) => [value, "Leads"]}
              />
              <Bar dataKey="leads" radius={[3, 3, 0, 0]} maxBarSize={22}>
                {data.map((_entry, i) => (
                  <Cell key={`cell-${i}`} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

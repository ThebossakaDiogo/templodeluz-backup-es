import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ChartDataPoint } from "@/types";

interface LeadsChartProps {
  data: ChartDataPoint[];
  total: number;
  diff: number;
  loading?: boolean;
}

export function LeadsChart({ data, total, diff, loading }: LeadsChartProps) {
  const hasData = data.some((d) => (d.leads ?? 0) > 0);

  const DiffIcon =
    diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const diffColor =
    diff > 0 ? "#34d399" : diff < 0 ? "#f87171" : "var(--text-muted)";

  return (
    <div
      className="card"
      style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          Volume de Leads
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginTop: "6px",
          }}
        >
          {loading ? (
            <div className="skeleton" style={{ height: "32px", width: "80px" }} />
          ) : (
            <span
              style={{
                fontSize: "26px",
                fontWeight: 900,
                color: "#ffffff",
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
              fontWeight: 700,
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
            fontWeight: 500,
          }}
        >
          Distribuição diária de entradas
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
              fontSize: "11.5px",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            Nenhum lead registrado no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
              barCategoryGap="28%"
            >
              <defs>
                <linearGradient id="barEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="dia"
                hide={data.length > 10}
                tick={{ fontSize: 9.5, fill: "#94a3b8" } as React.SVGProps<SVGTextElement>}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0c1527",
                  border: "1px solid rgba(16,185,129,0.4)",
                  borderRadius: "8px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  fontSize: "11px",
                  color: "#f8fafc",
                }}
                formatter={(value: number) => [`${value} leads`, "Entradas"]}
              />
              <Bar dataKey="leads" radius={[4, 4, 0, 0]} maxBarSize={22} fill="url(#barEmeraldGrad)">
                {data.map((_entry, i) => (
                  <Cell key={`cell-${i}`} style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

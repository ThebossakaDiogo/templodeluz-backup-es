import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PaymentOrder } from "@/types";

interface StatusPieChartProps {
  orders: PaymentOrder[];
  loading?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; glow: string }
> = {
  paid:     { label: "Pago",          color: "#00e5a0", glow: "rgba(0,229,160,0.4)"   },
  pending:  { label: "Pendente",      color: "#f59e0b", glow: "rgba(245,158,11,0.4)"  },
  creating: { label: "Gerando PIX",   color: "#00b4ff", glow: "rgba(0,180,255,0.4)"   },
  failed:   { label: "Falhou",        color: "#ef4444", glow: "rgba(239,68,68,0.4)"   },
  expired:  { label: "Expirado",      color: "#475569", glow: "rgba(71,85,105,0.4)"   },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />
        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{name}</span>
      </div>
      <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>
        {value} pedido{value !== 1 ? "s" : ""} · {p.pct}%
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 8px" }}>
      {payload?.map((entry: { color: string; value: string; payload: { count: number; pct: number } }) => (
        <div key={entry.value} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: entry.color,
                boxShadow: `0 0 6px ${entry.color}80`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
              {entry.value}
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-primary)" }}>
            {entry.payload.count} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({entry.payload.pct}%)</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function StatusPieChart({ orders, loading }: StatusPieChartProps) {
  // Agrupa por status
  const counts = Object.keys(STATUS_CONFIG).reduce<Record<string, number>>(
    (acc, key) => {
      acc[key] = orders.filter((o) => o.status === key).length;
      return acc;
    },
    {}
  );

  const total = orders.length || 1;
  const data = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label ?? status,
      value: count,
      count,
      pct: Math.round((count / total) * 100),
      color: STATUS_CONFIG[status]?.color ?? "#64748b",
    }));

  return (
    <div
      className="card"
      style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Distribuição de Pedidos
        </h3>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
          Por status de pagamento
        </p>
      </div>

      {loading || orders.length === 0 ? (
        <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", padding: "0 16px" }}>
              <div className="skeleton" style={{ height: "160px", borderRadius: "50%", width: "160px", margin: "0 auto" }} />
            </div>
          ) : (
            <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
              Nenhum pedido ainda.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Donut */}
          <div style={{ width: "160px", height: "160px", flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {data.map((entry) => (
                    <filter key={entry.name} id={`glow-${entry.name}`}>
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      style={{ filter: `drop-shadow(0 0 6px ${entry.color}80)` }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda personalizada */}
          <div style={{ flex: 1 }}>
            <CustomLegend
              payload={data.map((d) => ({
                value: d.name,
                color: d.color,
                payload: { count: d.count, pct: d.pct },
              }))}
            />
          </div>
        </div>
      )}

      {/* Total */}
      {!loading && orders.length > 0 && (
        <div
          style={{
            paddingTop: "12px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Total de pedidos</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>
            {orders.length}
          </span>
        </div>
      )}
    </div>
  );
}

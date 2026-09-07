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
  { label: string; color: string }
> = {
  paid:     { label: "Confirmado (Pago)", color: "#10b981" },
  pending:  { label: "PIX Pendente",      color: "#f59e0b" },
  creating: { label: "Gerando Cobrança",  color: "#06b6d4" },
  failed:   { label: "Falhou / Cancelado",color: "#ef4444" },
  expired:  { label: "PIX Expirado",      color: "#64748b" },
  in_dispute: { label: "Em disputa",      color: "#f97316" },
  chargeback: { label: "Estornado",       color: "#be123c" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-strong)",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "var(--shadow-card)",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
      </div>
      <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
        {value} pedido{value !== 1 ? "s" : ""} · {p.pct}%
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "0 4px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
      {payload?.map((entry: { color: string; value: string; payload: { count: number; pct: number } }) => (
        <div key={entry.value} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
              {entry.value}
            </span>
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-primary)" }}>
            {entry.payload.count} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({entry.payload.pct}%)</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function StatusPieChart({ orders, loading }: StatusPieChartProps) {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Status das Transações
          </h3>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              color: "#38bdf8",
              background: "rgba(37, 99, 235, 0.12)",
              border: "1px solid rgba(37, 99, 235, 0.3)",
              borderRadius: "99px",
              padding: "2px 8px",
            }}
          >
            Gateway
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>
          Proporção por estado de liquidação
        </p>
      </div>

      {loading || orders.length === 0 ? (
        <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {loading ? (
            <div className="skeleton" style={{ height: "130px", borderRadius: "50%", width: "130px" }} />
          ) : (
            <p style={{ fontSize: "11.5px", color: "var(--text-muted)", textAlign: "center" }}>
              Nenhum pedido registrado ainda.
            </p>
          )}
        </div>
      ) : (
        <div className="pie-content-layout" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Donut Chart */}
          <div style={{ width: "140px", height: "140px", flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      style={{ filter: `drop-shadow(0 0 5px ${entry.color}60)` }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda */}
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

      {!loading && orders.length > 0 && (
        <div
          style={{
            paddingTop: "12px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Total de cobranças auditadas</span>
          <span style={{ color: "#f8fafc", fontWeight: 800 }}>
            {orders.length}
          </span>
        </div>
      )}
    </div>
  );
}

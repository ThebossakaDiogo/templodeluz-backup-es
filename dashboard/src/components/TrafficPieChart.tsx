import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Lead } from "@/types";

interface TrafficPieChartProps {
  leads: Lead[];
  loading?: boolean;
}

const CHANNEL_COLORS: Record<string, string> = {
  "facebook":   "#2563eb", // Azul Royal
  "instagram":  "#06b6d4", // Ciano Elétrico
  "google":     "#10b981", // Verde Esmeralda
  "whatsapp":   "#34d399", // Verde Menta
  "organico":   "#64748b", // Ardósia Prata
  "direto":     "#38bdf8", // Azul Céu
  "outros":     "#94a3b8", // Cinza Claro
};

function normalizeSource(source: string | null): string {
  if (!source) return "organico";
  const s = source.toLowerCase();
  if (s.includes("face") || s.includes("fb")) return "facebook";
  if (s.includes("insta") || s.includes("ig")) return "instagram";
  if (s.includes("goog")) return "google";
  if (s.includes("whats") || s.includes("wpp")) return "whatsapp";
  if (s.includes("dir") || s.includes("link")) return "direto";
  return "outros";
}

const SOURCE_LABELS: Record<string, string> = {
  facebook:  "Facebook Ads",
  instagram: "Instagram Ads",
  google:    "Google / Busca",
  whatsapp:  "WhatsApp / Link",
  direto:    "Acesso Direto",
  organico:  "Orgânico",
  outros:    "Outras Fontes",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div
      style={{
        background: "#0b1528",
        border: "1px solid #1e293b",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />
        <span style={{ fontWeight: 700, color: "#f8fafc" }}>{name}</span>
      </div>
      <div style={{ color: "#94a3b8", fontWeight: 600 }}>
        {value} lead{value !== 1 ? "s" : ""} · {p.pct}% do tráfego
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "0 4px" }}>
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
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#cbd5e1" }}>
              {entry.value}
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#f8fafc" }}>
            {entry.payload.count} <span style={{ color: "#64748b", fontWeight: 500 }}>({entry.payload.pct}%)</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrafficPieChart({ leads, loading }: TrafficPieChartProps) {
  // Agrupa leads por canal normalizado
  const counts: Record<string, number> = {};

  for (const lead of leads) {
    const channel = normalizeSource(lead.utm_source);
    counts[channel] = (counts[channel] || 0) + 1;
  }

  const total = leads.length || 1;
  const data = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([channel, count]) => ({
      name: SOURCE_LABELS[channel] ?? channel,
      value: count,
      count,
      pct: Math.round((count / total) * 100),
      color: CHANNEL_COLORS[channel] ?? "#94a3b8",
    }));

  return (
    <div
      className="card"
      style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Origem de Tráfego (UTMs)
          </h3>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "99px",
              padding: "2px 8px",
            }}
          >
            Canais
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>
          Distribuição dos canais de captação
        </p>
      </div>

      {loading || leads.length === 0 ? (
        <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {loading ? (
            <div className="skeleton" style={{ height: "130px", borderRadius: "50%", width: "130px" }} />
          ) : (
            <p style={{ fontSize: "11.5px", color: "var(--text-muted)", textAlign: "center" }}>
              Nenhum lead registrado para classificar canais.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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

          {/* Legenda de Canais */}
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

      {!loading && leads.length > 0 && (
        <div
          style={{
            paddingTop: "12px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Total de leads mapeados</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>
            {leads.length}
          </span>
        </div>
      )}
    </div>
  );
}

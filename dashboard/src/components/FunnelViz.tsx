import type { Lead } from "@/types";

interface FunnelVizProps {
  leads: Lead[];
  loading?: boolean;
}

const ETAPAS = [
  { index: 1, name: "intro",    label: "Início do Quiz",        color: "#00b4ff", glow: "rgba(0,180,255,0.4)"   },
  { index: 2, name: "ente",     label: "Nome do Ente Querido",  color: "#3b82f6", glow: "rgba(59,130,246,0.4)"  },
  { index: 3, name: "relacao",  label: "Vínculo Familiar",      color: "#6366f1", glow: "rgba(99,102,241,0.4)"  },
  { index: 4, name: "tempo",    label: "Tempo e Sentimento",    color: "#8b5cf6", glow: "rgba(139,92,246,0.4)"  },
  { index: 5, name: "mensagem", label: "Mensagem e Intenção",   color: "#a855f7", glow: "rgba(168,85,247,0.4)"  },
  { index: 6, name: "confirma", label: "Confirmação dos Dados", color: "#d946ef", glow: "rgba(217,70,239,0.4)"  },
  { index: 7, name: "loading",  label: "Preparação da Carta",   color: "#f472b6", glow: "rgba(244,114,182,0.4)" },
  { index: 8, name: "result",   label: "Checkout e Doação",     color: "#00e5a0", glow: "rgba(0,229,160,0.4)"   },
];

export function FunnelViz({ leads, loading }: FunnelVizProps) {
  const stepCounts = ETAPAS.map((etapa) => ({
    ...etapa,
    count: leads.filter(
      (l) =>
        l.current_step_index === etapa.index ||
        l.current_step_name === etapa.name
    ).length,
    reached: leads.filter(
      (l) =>
        l.highest_step_index >= etapa.index
    ).length,
  }));

  const maxReached = Math.max(...stepCounts.map((s) => s.reached), 1);
  const firstCount = stepCounts[0]?.reached || 1;

  return (
    <div
      className="card"
      style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "20px" }}
    >
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Funil de Conversão
        </h3>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
          Leads que alcançaram cada etapa do quiz
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "36px", borderRadius: "8px" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {stepCounts.map((etapa, idx) => {
            const widthPct = Math.round((etapa.reached / maxReached) * 100);
            const convPct = idx === 0 ? 100 : Math.round((etapa.reached / firstCount) * 100);

            return (
              <div key={etapa.index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Número da etapa */}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: etapa.color,
                    width: "20px",
                    textAlign: "center",
                    flexShrink: 0,
                    filter: `drop-shadow(0 0 4px ${etapa.glow})`,
                  }}
                >
                  {etapa.index}
                </span>

                {/* Barra do funil */}
                <div style={{ flex: 1, position: "relative" }}>
                  {/* Track */}
                  <div
                    style={{
                      height: "34px",
                      background: "var(--border-subtle)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Fill */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${widthPct}%`,
                        background: `linear-gradient(90deg, ${etapa.color}30, ${etapa.color}60)`,
                        borderRadius: "8px",
                        borderRight: `2px solid ${etapa.color}`,
                        boxShadow: `inset 0 0 0 1px ${etapa.color}20, 0 0 8px ${etapa.glow}`,
                        transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    />
                    {/* Label */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {etapa.label}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: etapa.count > 0 ? etapa.color : "var(--text-muted)",
                          filter: etapa.count > 0 ? `drop-shadow(0 0 4px ${etapa.glow})` : "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {etapa.reached} leads
                      </span>
                    </div>
                  </div>
                </div>

                {/* Taxa de conversão */}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: convPct > 50 ? etapa.color : "var(--text-muted)",
                    width: "36px",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {convPct}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Resumo de conversão */}
      {!loading && leads.length > 0 && (
        <div
          style={{
            paddingTop: "14px",
            borderTop: "1px solid var(--border-subtle)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
          }}
        >
          {[
            {
              label: "Iniciaram",
              value: stepCounts[0]?.reached ?? 0,
              color: "#00b4ff",
            },
            {
              label: "Chegaram ao checkout",
              value: stepCounts[7]?.reached ?? 0,
              color: "#00e5a0",
            },
            {
              label: "Taxa final",
              value: `${stepCounts[0]?.reached > 0
                ? Math.round(((stepCounts[7]?.reached ?? 0) / stepCounts[0].reached) * 100)
                : 0}%`,
              color: "#a855f7",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--bg-surface-alt)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "10px 12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: stat.color,
                  filter: `drop-shadow(0 0 6px ${stat.color}60)`,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

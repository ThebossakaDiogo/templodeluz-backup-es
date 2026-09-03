import type { Lead } from "@/types";

interface FunnelVizProps {
  leads: Lead[];
  loading?: boolean;
}

const ETAPAS = [
  { index: 1, name: "intro",    label: "Início do Quiz",        color: "#2563eb", glow: "rgba(37,99,235,0.4)"   },
  { index: 2, name: "ente",     label: "Nome do Ente Querido",  color: "#0284c7", glow: "rgba(2,132,199,0.4)"   },
  { index: 3, name: "relacao",  label: "Vínculo Familiar",      color: "#0284c7", glow: "rgba(2,132,199,0.4)"   },
  { index: 4, name: "tempo",    label: "Tempo e Sentimento",    color: "#06b6d4", glow: "rgba(6,182,212,0.4)"   },
  { index: 5, name: "mensagem", label: "Mensagem e Intenção",   color: "#06b6d4", glow: "rgba(6,182,212,0.4)"   },
  { index: 6, name: "confirma", label: "Confirmação dos Dados", color: "#14b8a6", glow: "rgba(20,184,166,0.4)"  },
  { index: 7, name: "loading",  label: "Preparação da Carta",   color: "#34d399", glow: "rgba(52,211,153,0.4)"  },
  { index: 8, name: "result",   label: "Checkout e Doação",     color: "#10b981", glow: "rgba(16,185,129,0.4)"  },
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
      style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}
    >
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Funil de Conversão do Quiz
        </h3>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>
          Progressão dos consulentes até a página de doação / checkout
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "38px", borderRadius: "8px" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {stepCounts.map((etapa, idx) => {
            const widthPct = Math.round((etapa.reached / maxReached) * 100);
            const convPct = idx === 0 ? 100 : Math.round((etapa.reached / firstCount) * 100);

            return (
              <div key={etapa.index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Badge do número da etapa com estilo Emerald/Navy */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: etapa.index === 8 ? "rgba(16,185,129,0.2)" : "rgba(37,99,235,0.15)",
                    border: `1px solid ${etapa.index === 8 ? "rgba(16,185,129,0.4)" : "rgba(37,99,235,0.3)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: etapa.index === 8 ? "#34d399" : "#38bdf8",
                    flexShrink: 0,
                  }}
                >
                  {etapa.index}
                </div>

                {/* Barra do Funil */}
                <div style={{ flex: 1, position: "relative" }}>
                  <div
                    style={{
                      height: "36px",
                      background: "var(--bg-surface-alt)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Fill Gradient Azul -> Esmeralda */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${widthPct}%`,
                        background: `linear-gradient(90deg, rgba(37,99,235,0.2) 0%, ${etapa.color}60 100%)`,
                        borderRadius: "8px",
                        borderRight: `2px solid ${etapa.color}`,
                        boxShadow: `0 0 10px ${etapa.glow}`,
                        transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />

                    {/* Texto sobre a barra */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 14px",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#ffffff",
                        }}
                      >
                        {etapa.label}
                      </span>
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 800,
                          color: etapa.reached > 0 ? "#ffffff" : "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {etapa.reached} <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)" }}>leads</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* % de conversão da etapa */}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: convPct > 50 ? "#34d399" : "var(--text-muted)",
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

      {/* Resumo Navy/Emerald no rodapé */}
      {!loading && leads.length > 0 && (
        <div
          style={{
            paddingTop: "16px",
            borderTop: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
          }}
        >
          {[
            {
              label: "Iniciaram o Quiz",
              value: stepCounts[0]?.reached ?? 0,
              color: "#38bdf8",
            },
            {
              label: "Alcançaram Checkout",
              value: stepCounts[7]?.reached ?? 0,
              color: "#34d399",
            },
            {
              label: "Taxa de Conversão",
              value: `${stepCounts[0]?.reached > 0
                ? Math.round(((stepCounts[7]?.reached ?? 0) / stepCounts[0].reached) * 100)
                : 0}%`,
              color: "#10b981",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--bg-surface-alt)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 900,
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 600 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

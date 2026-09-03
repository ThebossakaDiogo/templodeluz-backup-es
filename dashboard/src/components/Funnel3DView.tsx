import { useState } from "react";
import type { Lead } from "@/types";
import { Users, Filter } from "lucide-react";

interface Funnel3DViewProps {
  leads: Lead[];
  loading?: boolean;
}

interface FunnelStage {
  index: number;
  name: string;
  label: string;
  sub: string;
  colorGradStart: string;
  colorGradMid: string;
  colorGradEnd: string;
  colorHighlight: string;
  glowColor: string;
  accent: string;
}

const ETAPAS_3D: FunnelStage[] = [
  {
    index: 1,
    name: "intro",
    label: "Início do Quiz",
    sub: "Abertura do fluxo e primeiro clique",
    colorGradStart: "#fb7185",
    colorGradMid: "#e11d48",
    colorGradEnd: "#881337",
    colorHighlight: "#ffe4e6",
    glowColor: "rgba(225, 29, 72, 0.35)",
    accent: "#e11d48",
  },
  {
    index: 2,
    name: "ente",
    label: "Nome do Ente Querido",
    sub: "Homenagem ao ente falecido",
    colorGradStart: "#fb923c",
    colorGradMid: "#ea580c",
    colorGradEnd: "#7c2d12",
    colorHighlight: "#ffedd5",
    glowColor: "rgba(234, 88, 12, 0.35)",
    accent: "#ea580c",
  },
  {
    index: 3,
    name: "relacao",
    label: "Vínculo Familiar",
    sub: "Grau de parentesco declarado",
    colorGradStart: "#facc15",
    colorGradMid: "#ca8a04",
    colorGradEnd: "#713f12",
    colorHighlight: "#fef9c3",
    glowColor: "rgba(202, 138, 4, 0.35)",
    accent: "#ca8a04",
  },
  {
    index: 4,
    name: "tempo",
    label: "Tempo e Sentimento",
    sub: "Data da partida e conexão afetiva",
    colorGradStart: "#a3e635",
    colorGradMid: "#65a30d",
    colorGradEnd: "#365314",
    colorHighlight: "#ecfccb",
    glowColor: "rgba(101, 163, 13, 0.35)",
    accent: "#65a30d",
  },
  {
    index: 5,
    name: "mensagem",
    label: "Mensagem e Intenção",
    sub: "Temas de oração e conforto espiritual",
    colorGradStart: "#2dd4bf",
    colorGradMid: "#0d9488",
    colorGradEnd: "#134e4a",
    colorHighlight: "#ccfbf1",
    glowColor: "rgba(13, 148, 136, 0.35)",
    accent: "#0d9488",
  },
  {
    index: 6,
    name: "confirma",
    label: "Confirmação dos Dados",
    sub: "Identificação completa do consulente",
    colorGradStart: "#38bdf8",
    colorGradMid: "#0284c7",
    colorGradEnd: "#0c4a6e",
    colorHighlight: "#e0f2fe",
    glowColor: "rgba(2, 132, 199, 0.35)",
    accent: "#0284c7",
  },
  {
    index: 7,
    name: "loading",
    label: "Preparação da Carta",
    sub: "Psicografia e sintonização espiritual",
    colorGradStart: "#818cf8",
    colorGradMid: "#4f46e5",
    colorGradEnd: "#312e81",
    colorHighlight: "#e0e7ff",
    glowColor: "rgba(79, 70, 229, 0.35)",
    accent: "#4f46e5",
  },
  {
    index: 8,
    name: "result",
    label: "Altar & Doação (Checkout)",
    sub: "Geração do PIX e consagração final",
    colorGradStart: "#c084fc",
    colorGradMid: "#9333ea",
    colorGradEnd: "#581c87",
    colorHighlight: "#f3e8ff",
    glowColor: "rgba(147, 51, 234, 0.4)",
    accent: "#9333ea",
  },
];

export function Funnel3DView({ leads }: Funnel3DViewProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const stageStats = ETAPAS_3D.map((stage) => {
    const reached = leads.filter((l) => l.highest_step_index >= stage.index).length;
    const current = leads.filter(
      (l) => l.current_step_index === stage.index || l.current_step_name === stage.name
    ).length;
    return {
      ...stage,
      reached,
      current,
    };
  });

  const totalStarted = stageStats[0]?.reached || Math.max(leads.length, 1);
  const totalConverted = stageStats[7]?.reached || 0;
  const globalConversionRate =
    totalStarted > 0 ? ((totalConverted / totalStarted) * 100).toFixed(1) : "0.0";

  // Dimensões refinadas e amplas do funil 3D
  const svgW = 460;
  const svgH = 500;
  const centerX = svgW / 2;
  const numStages = ETAPAS_3D.length;
  const topY = 16;
  const stageH = 42;
  const gap = 5;

  return (
    <div
      className="card funnel-card-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Cabeçalho do Card Espaçoso */}
      <div
        className="funnel-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary-green)",
                flexShrink: 0,
              }}
            >
              <Filter style={{ width: "17px", height: "17px" }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Funil de Conversão 3D
              </h2>
              <p
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-muted)",
                  margin: "1px 0 0",
                  fontWeight: 500,
                }}
              >
                Progressão passo a passo dos consulentes
              </p>
            </div>
          </div>
        </div>

        {/* Badges de Resumo Executivo */}
        <div className="funnel-header-cards">
          <div
            className="funnel-stat-card"
            style={{
              background: "var(--bg-surface-alt)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 700,
                color: "var(--text-muted)",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Entradas
            </span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "var(--text-primary)",
              }}
            >
              {totalStarted} <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)" }}>leads</span>
            </span>
          </div>

          <div
            className="funnel-stat-card"
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              borderRadius: "10px",
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 700,
                color: "var(--primary-green)",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Doações
            </span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "var(--primary-green)",
              }}
            >
              {totalConverted} <span style={{ fontSize: "10px", fontWeight: 700 }}>pagos</span>
            </span>
          </div>

          <div
            className="funnel-stat-card"
            style={{
              background: "rgba(37, 99, 235, 0.12)",
              border: "1px solid rgba(37, 99, 235, 0.35)",
              borderRadius: "10px",
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 700,
                color: "var(--primary-blue)",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Taxa Global
            </span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "var(--primary-blue)",
              }}
            >
              {globalConversionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Cone 3D à Esquerda e Lista de Etapas à Direita */}
      <div className="funnel-3d-grid">
        {/* COLUNA 1: FUNIL CÔNICO 3D ESCULPIDO COM ALVO CONCÊNTRICO */}
        <div
          className="funnel-cone-container"
          style={{
            position: "relative",
            background: "var(--bg-surface-alt)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "16px 8px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.03)",
            overflow: "hidden",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: "100%", height: "auto", overflow: "hidden", display: "block" }}
          >
            <defs>
              {/* Filtro de Sombra Suave Profunda */}
              <filter id="softGlow3D" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow
                  dx="0"
                  dy="8"
                  stdDeviation="7"
                  floodOpacity="0.4"
                  floodColor="#000000"
                />
              </filter>

              {/* Gradientes Cilíndricos Convexos com Reflexo Real de Luz */}
              {stageStats.map((st) => (
                <linearGradient
                  id={`funnelGrad-${st.index}`}
                  key={st.index}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={st.colorGradStart} />
                  <stop offset="25%" stopColor={st.colorHighlight} stopOpacity="0.75" />
                  <stop offset="55%" stopColor={st.colorGradMid} />
                  <stop offset="85%" stopColor={st.colorGradEnd} />
                  <stop offset="100%" stopColor="#050a14" />
                </linearGradient>
              ))}

              {/* Gradientes de Elipse de Topo */}
              {stageStats.map((st) => (
                <linearGradient
                  id={`funnelTopGrad-${st.index}`}
                  key={`top-${st.index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={st.colorHighlight} stopOpacity="0.9" />
                  <stop offset="40%" stopColor={st.colorGradStart} />
                  <stop offset="100%" stopColor={st.colorGradMid} />
                </linearGradient>
              ))}

              {/* Alvo Concêntrico Suave */}
              <radialGradient id="targetPlateGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--bg-surface)" />
                <stop offset="70%" stopColor="var(--border)" />
                <stop offset="100%" stopColor="var(--border-subtle)" />
              </radialGradient>
              <radialGradient id="targetBullseyeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="60%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#3b0764" />
              </radialGradient>
            </defs>

            {/* BASE DO FUNIL: ALVO CONCÊNTRICO 3D (TARGET DE FECHAMENTO) */}
            <g transform={`translate(0, ${topY + numStages * (stageH + gap) + 12})`}>
              {/* Plataforma externa */}
              <ellipse
                cx={centerX}
                cy="32"
                rx="145"
                ry="24"
                fill="url(#targetPlateGrad)"
                stroke="var(--border)"
                strokeWidth="1.5"
                opacity="0.9"
              />
              {/* Anel 1 */}
              <ellipse
                cx={centerX}
                cy="32"
                rx="110"
                ry="18"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="2"
                opacity="0.3"
              />
              {/* Anel 2 */}
              <ellipse
                cx={centerX}
                cy="32"
                rx="78"
                ry="12"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2.5"
                opacity="0.45"
              />
              {/* Anel 3 */}
              <ellipse
                cx={centerX}
                cy="32"
                rx="48"
                ry="8"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                opacity="0.85"
              />
              {/* Centro de Conversão (Bullseye Violeta) */}
              <ellipse
                cx={centerX}
                cy="32"
                rx="24"
                ry="4"
                fill="url(#targetBullseyeGrad)"
                stroke="#c084fc"
                strokeWidth="1.5"
              />
              {/* Feixes do alvo */}
              <line
                x1={centerX - 145}
                y1="32"
                x2={centerX + 145}
                y2="32"
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <line
                x1={centerX}
                y1="8"
                x2={centerX}
                y2="56"
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
            </g>

            {/* CAMADAS DO FUNIL EM CONE CILÍNDRICO */}
            {stageStats.map((st, idx) => {
              const factorTop = idx / numStages;
              const factorBottom = (idx + 1) / numStages;

              const maxW = 370;
              const minW = 66;

              const wTop = maxW - factorTop * (maxW - minW);
              const wBottom = maxW - factorBottom * (maxW - minW);

              const yTop = topY + idx * (stageH + gap);
              const yBottom = yTop + stageH;

              const xTopLeft = centerX - wTop / 2;
              const xTopRight = centerX + wTop / 2;
              const xBottomLeft = centerX - wBottom / 2;
              const xBottomRight = centerX + wBottom / 2;

              const curveDepth = 12;
              const isHovered = hoveredIdx === st.index;
              const pctGlobal =
                totalStarted > 0 ? Math.round((st.reached / totalStarted) * 100) : 0;

              return (
                <g
                  key={st.index}
                  onMouseEnter={() => setHoveredIdx(st.index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: "pointer" }}
                  filter={isHovered ? "url(#softGlow3D)" : undefined}
                >
                  {/* Face Frontal da Fatia Cônica */}
                  <path
                    d={`
                      M ${xTopLeft} ${yTop}
                      Q ${centerX} ${yTop + curveDepth} ${xTopRight} ${yTop}
                      L ${xBottomRight} ${yBottom}
                      Q ${centerX} ${yBottom + curveDepth} ${xBottomLeft} ${yBottom}
                      Z
                    `}
                    fill={`url(#funnelGrad-${st.index})`}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth={isHovered ? "2.5" : "1"}
                    style={{
                      transform: isHovered ? "scale(1.025)" : "scale(1)",
                      transformOrigin: `${centerX}px ${yTop + stageH / 2}px`,
                      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />

                  {/* Anel Superior Oval (Vidro 3D) */}
                  <path
                    d={`
                      M ${xTopLeft} ${yTop}
                      Q ${centerX} ${yTop + curveDepth} ${xTopRight} ${yTop}
                      Q ${centerX} ${yTop - curveDepth * 0.55} ${xTopLeft} ${yTop}
                      Z
                    `}
                    fill={`url(#funnelRing-${st.index})`}
                    opacity="0.95"
                  />

                  {/* Linha de reflexo branco no topo */}
                  <path
                    d={`M ${centerX - wTop * 0.28} ${yTop + curveDepth * 0.45} Q ${centerX} ${yTop + curveDepth * 0.65} ${centerX + wTop * 0.28} ${yTop + curveDepth * 0.45}`}
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Badge de Número da Etapa e Porcentagem no Centro */}
                  <g
                    transform={`translate(${centerX}, ${yTop + stageH / 2 + 5})`}
                    style={{ pointerEvents: "none" }}
                  >
                    {/* Pílula com fundo escuro e borda fina */}
                    <rect
                      x={st.index >= 7 ? "-25" : "-28"}
                      y="-10"
                      width={st.index >= 7 ? "50" : "56"}
                      height="20"
                      rx="10"
                      fill="rgba(5, 10, 20, 0.82)"
                      stroke={isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
                      strokeWidth={isHovered ? "1.5" : "1"}
                    />

                    {/* Círculo com o número da etapa */}
                    <circle
                      cx={st.index >= 7 ? "-13" : "-15"}
                      cy="0"
                      r={st.index >= 7 ? "6.5" : "7.5"}
                      fill={st.accent}
                    />
                    <text
                      x={st.index >= 7 ? "-13" : "-15"}
                      y="3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={st.index >= 7 ? "8.5" : "9.5"}
                      fontWeight="900"
                      style={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                      }}
                    >
                      {st.index}
                    </text>

                    {/* Porcentagem em Destaque */}
                    <text
                      x={st.index >= 7 ? "9" : "10"}
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={st.index >= 7 ? "9.5" : "10.5"}
                      fontWeight="900"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        letterSpacing: "-0.02em",
                        textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                      }}
                    >
                      {pctGlobal}%
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* COLUNA 2: PAINEL ANALÍTICO ESPAÇOSO (AMPLO RESPIRO) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {stageStats.map((st) => {
            const isHovered = hoveredIdx === st.index;
            const pctGlobal =
              totalStarted > 0 ? Math.round((st.reached / totalStarted) * 100) : 0;

            return (
              <div
                key={st.index}
                onMouseEnter={() => setHoveredIdx(st.index)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="funnel-stage-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  background: isHovered ? "var(--bg-surface-alt)" : "var(--bg-surface)",
                  border: `1px solid ${isHovered ? st.accent : "var(--border)"}`,
                  boxShadow: isHovered
                    ? `0 6px 20px ${st.glowColor}, 0 0 0 1px ${st.accent}`
                    : "var(--shadow-card)",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                  minWidth: 0,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* Número e Título */}
                <div className="funnel-stage-info" style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: isHovered ? st.accent : `rgba(255,255,255,0.06)`,
                      border: `1px solid ${st.accent}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 900,
                      color: isHovered ? "#ffffff" : st.accent,
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {st.index}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        className="funnel-stage-title"
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 800,
                          color: "var(--text-primary)",
                        }}
                      >
                        {st.label}
                      </span>
                      {st.index === 8 && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: "#9333ea",
                            background: "rgba(147, 51, 234, 0.15)",
                            padding: "2px 7px",
                            borderRadius: "5px",
                            border: "1px solid rgba(147, 51, 234, 0.35)",
                            flexShrink: 0,
                          }}
                        >
                          Conversão
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        display: "block",
                        marginTop: "1px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {st.sub}
                    </span>
                  </div>
                </div>

                {/* Métricas e Barra de Retenção */}
                <div
                  className="funnel-stage-metrics"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    flexShrink: 0,
                  }}
                >
                  {/* Presença ao vivo nesta etapa */}
                  {st.current > 0 && (
                    <div
                      className="desktop-only-control"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "var(--primary-green)",
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: "6px",
                        padding: "3px 8px",
                      }}
                    >
                      <Users style={{ width: "11px", height: "11px" }} />
                      {st.current} ao vivo
                    </div>
                  )}

                  {/* Micro barra de retenção com largura ampla */}
                  <div className="funnel-stage-bar" style={{ width: "80px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div
                      style={{
                        height: "6px",
                        background: "var(--border)",
                        borderRadius: "99px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pctGlobal}%`,
                          height: "100%",
                          background: st.accent,
                          borderRadius: "99px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Contagem e % */}
                  <div className="funnel-stage-count" style={{ textAlign: "right", minWidth: "70px" }}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 900,
                        color: "var(--text-primary)",
                        display: "block",
                        lineHeight: 1.1,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {st.reached} <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)" }}>leads</span>
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: isHovered ? "#ffffff" : st.accent,
                        background: "rgba(255, 255, 255, 0.08)",
                        border: `1px solid ${isHovered ? st.accent : "rgba(255, 255, 255, 0.12)"}`,
                        padding: "1px 7px",
                        borderRadius: "6px",
                        display: "inline-block",
                        marginTop: "3px",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {pctGlobal}% retido
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

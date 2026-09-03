import { useState } from "react";
import type { Lead } from "@/types";
import { Users, Filter, BarChart3, Box, CheckCircle2 } from "lucide-react";

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

// ─── Paleta Celestial & Alta Conversão (Harmonia Luxuosa) ──────────────────────
const ETAPAS_3D: FunnelStage[] = [
  {
    index: 1,
    name: "intro",
    label: "Início do Quiz",
    sub: "Abertura do fluxo e primeiro clique",
    colorGradStart: "#38bdf8",
    colorGradMid: "#0284c7",
    colorGradEnd: "#0369a1",
    colorHighlight: "#e0f2fe",
    glowColor: "rgba(2, 132, 199, 0.35)",
    accent: "#0284c7",
  },
  {
    index: 2,
    name: "ente",
    label: "Nome do Ente Querido",
    sub: "Homenagem ao ente falecido",
    colorGradStart: "#60a5fa",
    colorGradMid: "#2563eb",
    colorGradEnd: "#1d4ed8",
    colorHighlight: "#dbeafe",
    glowColor: "rgba(37, 99, 235, 0.35)",
    accent: "#2563eb",
  },
  {
    index: 3,
    name: "relacao",
    label: "Vínculo Familiar",
    sub: "Grau de parentesco declarado",
    colorGradStart: "#818cf8",
    colorGradMid: "#4f46e5",
    colorGradEnd: "#3730a3",
    colorHighlight: "#e0e7ff",
    glowColor: "rgba(79, 70, 229, 0.35)",
    accent: "#4f46e5",
  },
  {
    index: 4,
    name: "tempo",
    label: "Tempo e Sentimento",
    sub: "Data da partida e conexão afetiva",
    colorGradStart: "#a78bfa",
    colorGradMid: "#7c3aed",
    colorGradEnd: "#5b21b6",
    colorHighlight: "#ede9fe",
    glowColor: "rgba(124, 58, 237, 0.35)",
    accent: "#7c3aed",
  },
  {
    index: 5,
    name: "mensagem",
    label: "Mensagem e Intenção",
    sub: "Temas de oração e intenção espiritual",
    colorGradStart: "#c084fc",
    colorGradMid: "#9333ea",
    colorGradEnd: "#6b21a8",
    colorHighlight: "#f3e8ff",
    glowColor: "rgba(147, 51, 234, 0.35)",
    accent: "#9333ea",
  },
  {
    index: 6,
    name: "confirma",
    label: "Confirmação dos Dados",
    sub: "Identificação completa do consulente",
    colorGradStart: "#e879f9",
    colorGradMid: "#c026d3",
    colorGradEnd: "#86198f",
    colorHighlight: "#fae8ff",
    glowColor: "rgba(192, 38, 211, 0.35)",
    accent: "#c026d3",
  },
  {
    index: 7,
    name: "loading",
    label: "Preparação da Carta",
    sub: "Psicografia e sintonização espiritual",
    colorGradStart: "#2dd4bf",
    colorGradMid: "#0d9488",
    colorGradEnd: "#115e59",
    colorHighlight: "#ccfbf1",
    glowColor: "rgba(13, 148, 136, 0.35)",
    accent: "#0d9488",
  },
  {
    index: 8,
    name: "result",
    label: "Altar & Doação (Checkout)",
    sub: "Geração do PIX e consagração final",
    colorGradStart: "#34d399",
    colorGradMid: "#059669",
    colorGradEnd: "#064e3b",
    colorHighlight: "#d1fae5",
    glowColor: "rgba(16, 185, 129, 0.45)",
    accent: "#10b981",
  },
];

export function Funnel3DView({ leads }: Funnel3DViewProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"stages" | "cone">("stages");

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

  // Dimensões refinadas da escultura 3D
  const svgW = 460;
  const svgH = 340;
  const centerX = svgW / 2;
  const numStages = ETAPAS_3D.length;
  const topY = 14;
  const stageH = 26;
  const gap = 4;

  return (
    <div
      className="card funnel-card-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Cabeçalho do Card */}
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
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
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
                Funil de Conversão & Retenção
              </h2>
              <p
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-muted)",
                  margin: "1px 0 0",
                  fontWeight: 500,
                }}
              >
                Jornada dos consulentes pelas 8 etapas do quiz
              </p>
            </div>
          </div>
        </div>

        {/* 3 Badges de Resumo Executivo */}
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
              }}
            >
              Entradas
            </span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "var(--text-primary)",
                fontFamily: "'Space Grotesk', sans-serif",
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
                color: "#10b981",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Doações
            </span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "#10b981",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {totalConverted} <span style={{ fontSize: "10px", fontWeight: 700 }}>pagos</span>
            </span>
          </div>

          <div
            className="funnel-stat-card"
            style={{
              background: "rgba(2, 132, 199, 0.12)",
              border: "1px solid rgba(2, 132, 199, 0.35)",
              borderRadius: "10px",
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 700,
                color: "#0284c7",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Taxa Global
            </span>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                color: "#0284c7",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {globalConversionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Alternador de Abas para Smartphone (Otimização Mobile) */}
      <div className="funnel-mobile-tabs">
        <button
          onClick={() => setMobileTab("stages")}
          className={`funnel-tab-btn ${mobileTab === "stages" ? "active" : ""}`}
        >
          <BarChart3 style={{ width: "14px", height: "14px" }} />
          Etapas & Retenção ({stageStats.length})
        </button>
        <button
          onClick={() => setMobileTab("cone")}
          className={`funnel-tab-btn ${mobileTab === "cone" ? "active" : ""}`}
        >
          <Box style={{ width: "14px", height: "14px" }} />
          Escultura 3D
        </button>
      </div>

      {/* Grid Principal: Cone 3D à Esquerda e Lista de Etapas à Direita */}
      <div className={`funnel-3d-grid mobile-show-${mobileTab}`}>
        {/* COLUNA 1: FUNIL CÔNICO 3D ESCULPIDO COM PROPORÇÃO COMPACTA */}
        <div
          className="funnel-cone-container"
          style={{
            position: "relative",
            background: "var(--bg-surface-alt)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "16px 10px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.03)",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: "100%", height: "auto", overflow: "hidden", display: "block" }}
          >
            <defs>
              {/* Filtro de Sombra Suave Profunda */}
              <filter id="softGlow3D" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="4"
                  floodOpacity="0.3"
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
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="60%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </radialGradient>
            </defs>

            {/* BASE DO FUNIL: ALVO CONCÊNTRICO 3D (TARGET DE FECHAMENTO) */}
            <g transform={`translate(0, ${topY + numStages * (stageH + gap) + 8})`}>
              {/* Plataforma externa */}
              <ellipse
                cx={centerX}
                cy="26"
                rx="140"
                ry="20"
                fill="url(#targetPlateGrad)"
                stroke="var(--border)"
                strokeWidth="1.5"
                opacity="0.9"
              />
              {/* Anel 1 */}
              <ellipse
                cx={centerX}
                cy="26"
                rx="105"
                ry="15"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="1.5"
                opacity="0.3"
              />
              {/* Anel 2 */}
              <ellipse
                cx={centerX}
                cy="26"
                rx="72"
                ry="10"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                opacity="0.45"
              />
              {/* Anel 3 */}
              <ellipse
                cx={centerX}
                cy="26"
                rx="44"
                ry="7"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                opacity="0.85"
              />
              {/* Centro de Conversão (Bullseye Esmeralda da Conclusão) */}
              <ellipse
                cx={centerX}
                cy="26"
                rx="22"
                ry="4"
                fill="url(#targetBullseyeGrad)"
                stroke="#34d399"
                strokeWidth="1.5"
              />
              {/* Feixes do alvo */}
              <line
                x1={centerX - 140}
                y1="26"
                x2={centerX + 140}
                y2="26"
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <line
                x1={centerX}
                y1="6"
                x2={centerX}
                y2="46"
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
            </g>

            {/* CAMADAS DO FUNIL EM CONE CILÍNDRICO */}
            {stageStats.map((st, idx) => {
              const factorTop = idx / numStages;
              const factorBottom = (idx + 1) / numStages;

              const maxW = 360;
              const minW = 64;

              const wTop = maxW - factorTop * (maxW - minW);
              const wBottom = maxW - factorBottom * (maxW - minW);

              const yTop = topY + idx * (stageH + gap);
              const yBottom = yTop + stageH;

              const xTopLeft = centerX - wTop / 2;
              const xTopRight = centerX + wTop / 2;
              const xBottomLeft = centerX - wBottom / 2;
              const xBottomRight = centerX + wBottom / 2;

              const curveDepth = 8;
              const isHovered = hoveredIdx === st.index;

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
                      L ${xTopRight} ${yTop}
                      L ${xBottomRight} ${yBottom}
                      Q ${centerX} ${yBottom + curveDepth} ${xBottomLeft} ${yBottom}
                      Z
                    `}
                    fill={`url(#funnelGrad-${st.index})`}
                    opacity={isHovered ? 1 : 0.94}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="1"
                  />

                  {/* Elipse Superior 3D com Brilho Refletido */}
                  <ellipse
                    cx={centerX}
                    cy={yTop}
                    rx={wTop / 2}
                    ry={curveDepth}
                    fill={`url(#funnelTopGrad-${st.index})`}
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="1.2"
                  />

                  {/* Emblema Numérico Central da Etapa */}
                  <g transform={`translate(${centerX}, ${yTop + stageH / 2})`}>
                    <circle
                      r={st.index === 8 ? "10" : "9"}
                      fill="rgba(8, 14, 28, 0.85)"
                      stroke={isHovered ? "#ffffff" : st.accent}
                      strokeWidth="1.5"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill="#ffffff"
                      fontSize={st.index === 8 ? "9.5" : "10"}
                      fontWeight="900"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {st.index}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* COLUNA 2: PAINEL ANALÍTICO COM CARDS FLUIDOS & BARRA INTEGRADA */}
        <div className="funnel-stages-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {stageStats.map((st, idx) => {
            const isHovered = hoveredIdx === st.index;
            const pctGlobal =
              totalStarted > 0 ? Math.round((st.reached / totalStarted) * 100) : 0;
            const prevStage = idx > 0 ? stageStats[idx - 1] : null;
            const dropRate =
              prevStage && prevStage.reached > 0
                ? Math.round(((prevStage.reached - st.reached) / prevStage.reached) * 100)
                : 0;

            return (
              <div
                key={st.index}
                onMouseEnter={() => setHoveredIdx(st.index)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="stage-card-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: isHovered ? "var(--bg-surface-alt)" : "var(--bg-surface)",
                  border: `1px solid ${isHovered ? st.accent : "var(--border)"}`,
                  boxShadow: isHovered
                    ? `0 4px 16px ${st.glowColor}`
                    : "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease",
                  cursor: "pointer",
                }}
              >
                {/* Linha 1: Número, Nome da Etapa e Contagem em Destaque */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                    {/* Badge do Número */}
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "8px",
                        background: isHovered ? st.accent : `rgba(255, 255, 255, 0.05)`,
                        border: `1px solid ${st.accent}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 900,
                        color: isHovered ? "#ffffff" : st.accent,
                        flexShrink: 0,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {st.index}
                    </div>

                    {/* Título e Subtítulo */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {st.label}
                        </span>
                        {st.index === 8 && (
                          <span
                            style={{
                              fontSize: "9.5px",
                              fontWeight: 800,
                              color: "#10b981",
                              background: "rgba(16, 185, 129, 0.15)",
                              padding: "2px 6px",
                              borderRadius: "5px",
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <CheckCircle2 style={{ width: "10px", height: "10px" }} /> Conversão
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Número de Consulentes e % */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 900,
                        color: "var(--text-primary)",
                        fontFamily: "'Space Grotesk', sans-serif",
                        display: "block",
                        lineHeight: 1.1,
                      }}
                    >
                      {st.reached} <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)" }}>leads</span>
                    </span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        color: st.accent,
                      }}
                    >
                      {pctGlobal}% retido
                    </span>
                  </div>
                </div>

                {/* Linha 2: Barra de Retenção Visual 100% Fluida */}
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div
                    style={{
                      height: "5px",
                      background: "var(--border)",
                      borderRadius: "99px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pctGlobal}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${st.colorGradStart} 0%, ${st.accent} 100%)`,
                        borderRadius: "99px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Linha 3: Subtítulo e Indicador de Perda ou Presença ao Vivo */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", fontSize: "10.5px" }}>
                  <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {st.sub}
                  </span>

                  {idx > 0 && dropRate > 0 && (
                    <span style={{ color: "var(--text-muted)", flexShrink: 0, fontSize: "10px", fontWeight: 600 }}>
                      -{dropRate}% nesta etapa
                    </span>
                  )}

                  {st.current > 0 && (
                    <span
                      style={{
                        color: "#10b981",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        flexShrink: 0,
                      }}
                    >
                      <Users style={{ width: "10px", height: "10px" }} />
                      {st.current} ao vivo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

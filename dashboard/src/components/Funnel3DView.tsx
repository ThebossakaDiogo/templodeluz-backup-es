import { useState } from "react";
import type { Lead } from "@/types";
import { Users, Filter, Clock, Sparkles } from "lucide-react";

interface Funnel3DViewProps {
  leads: Lead[];
  loading?: boolean;
}

interface FunnelStage {
  index: number;
  name: string;
  label: string;
  sub: string;
  accent: string;
  accentDark: string;
  gradStart: string;
  gradEnd: string;
  glowColor: string;
}

// Paleta Elegante e Harmonizada com a Marca OD Metrics PRO (Ciano -> Lavanda -> Ultravioleta -> Esmeralda)
const ETAPAS_3D: FunnelStage[] = [
  {
    index: 1,
    name: "intro",
    label: "Início do Quiz",
    sub: "Abertura do fluxo e primeiro clique",
    accent: "#38BDF8",
    accentDark: "#0369A1",
    gradStart: "#38BDF8",
    gradEnd: "#0284C7",
    glowColor: "rgba(56, 189, 248, 0.35)",
  },
  {
    index: 2,
    name: "ente",
    label: "Nome do Ente Querido",
    sub: "Homenagem ao ente falecido",
    accent: "#22D3EE",
    accentDark: "#0E7490",
    gradStart: "#22D3EE",
    gradEnd: "#0891B2",
    glowColor: "rgba(34, 211, 238, 0.35)",
  },
  {
    index: 3,
    name: "relacao",
    label: "Vínculo Familiar",
    sub: "Grau de parentesco declarado",
    accent: "#818CF8",
    accentDark: "#4338CA",
    gradStart: "#818CF8",
    gradEnd: "#4F46E5",
    glowColor: "rgba(129, 140, 248, 0.35)",
  },
  {
    index: 4,
    name: "tempo",
    label: "Tempo e Sentimento",
    sub: "Data da partida e conexão afetiva",
    accent: "#8A79FF",
    accentDark: "#4F3CC9",
    gradStart: "#8A79FF",
    gradEnd: "#6D58EF",
    glowColor: "rgba(138, 121, 255, 0.35)",
  },
  {
    index: 5,
    name: "mensagem",
    label: "Mensagem e Intenção",
    sub: "Temas de oração e conforto espiritual",
    accent: "#7C5CFF",
    accentDark: "#4724CD",
    gradStart: "#7C5CFF",
    gradEnd: "#5B36E0",
    glowColor: "rgba(124, 92, 255, 0.4)",
  },
  {
    index: 6,
    name: "confirma",
    label: "Confirmação dos Dados",
    sub: "Identificação completa do consulente",
    accent: "#A855F7",
    accentDark: "#6B21A8",
    gradStart: "#A855F7",
    gradEnd: "#7E22CE",
    glowColor: "rgba(168, 85, 247, 0.35)",
  },
  {
    index: 7,
    name: "loading",
    label: "Preparação da Carta",
    sub: "Psicografia e sintonização espiritual",
    accent: "#C084FC",
    accentDark: "#7E22CE",
    gradStart: "#C084FC",
    gradEnd: "#9333EA",
    glowColor: "rgba(192, 132, 252, 0.35)",
  },
  {
    index: 8,
    name: "result",
    label: "Altar & Doação (Checkout)",
    sub: "Geração do PIX e consagração final",
    accent: "#2EDB6F",
    accentDark: "#0D7A3E",
    gradStart: "#2EDB6F",
    gradEnd: "#10B981",
    glowColor: "rgba(46, 219, 111, 0.45)",
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

  // Dimensões do Funil Espacial Isométrico
  const svgW = 440;
  const svgH = 490;
  const centerX = svgW / 2;
  const numStages = ETAPAS_3D.length;
  const topY = 24;
  const stageH = 43;
  const gap = 6;

  const activeStage = hoveredIdx !== null ? stageStats.find((s) => s.index === hoveredIdx) : null;

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
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "18px",
        padding: "22px 24px",
      }}
    >
      {/* ─── 1. Header do Painel Principal ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Telemetria Espacial em Tempo Real
            </span>
            <Clock style={{ width: "11px", height: "11px", color: "var(--text-muted)" }} />
          </div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Funil de Conversão & Retenção 3D
          </h3>
        </div>

        {/* Resumo Executivo Superior */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="funnel-header-cards">
            <div
              className="funnel-stat-card"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "5px 12px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "9.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                Entradas
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                {totalStarted} <span style={{ fontSize: "9.5px", fontWeight: 500, color: "var(--text-muted)" }}>leads</span>
              </span>
            </div>

            <div
              className="funnel-stat-card"
              style={{
                background: "rgba(46, 219, 111, 0.12)",
                border: "1px solid rgba(46, 219, 111, 0.3)",
                borderRadius: "8px",
                padding: "5px 12px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "9.5px", fontWeight: 600, color: "#2EDB6F", textTransform: "uppercase", display: "block" }}>
                Doações
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#2EDB6F" }}>
                {totalConverted} <span style={{ fontSize: "9.5px", fontWeight: 600 }}>pagos</span>
              </span>
            </div>

            <div
              className="funnel-stat-card"
              style={{
                background: "var(--accent-soft-bg)",
                border: "1px solid var(--accent-border)",
                borderRadius: "8px",
                padding: "5px 12px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "9.5px", fontWeight: 600, color: "var(--accent-strong)", textTransform: "uppercase", display: "block" }}>
                Taxa Global
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-strong)" }}>
                {globalConversionRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Bloco de Destaque com Métricas Monumentais ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "18px",
          background: "var(--surface-1)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
          padding: "16px 20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                background: "var(--accent-soft-bg)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-strong)",
              }}
            >
              <Filter style={{ width: "11px", height: "11px" }} />
            </div>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              Quiz Espírita — Carta Sagrada Psicografada
            </span>
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 700,
                color: "#2EDB6F",
                background: "rgba(46, 219, 111, 0.12)",
                padding: "1px 7px",
                borderRadius: "999px",
                border: "1px solid rgba(46, 219, 111, 0.25)",
              }}
            >
              8 Estágios Ativos
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Taxa de Retenção & Conversão Global do Funil
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {globalConversionRate}%
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              dos consulentes que iniciam geram doação
            </span>
          </div>
        </div>

        {/* HUD de Inspeção Flutuante no Hover */}
        {activeStage ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 16px",
              borderRadius: "10px",
              background: "var(--surface-card)",
              border: `1px solid ${activeStage.accent}`,
              boxShadow: `0 4px 16px ${activeStage.glowColor}`,
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: activeStage.accent,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              {activeStage.index}
            </div>
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
                {activeStage.label}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>
                {activeStage.reached} leads · {totalStarted > 0 ? Math.round((activeStage.reached / totalStarted) * 100) : 0}% retido
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: "11.5px",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles style={{ width: "13px", height: "13px", color: "var(--accent-strong)" }} />
            <span>Passe o mouse sobre os estágios para inspecionar</span>
          </div>
        )}
      </div>

      {/* ─── 3. Grade Principal: Funil Espacial Isométrico + Painel Analítico ─── */}
      <div className="funnel-3d-grid" style={{ display: "grid", gridTemplateColumns: "440px 1fr", gap: "28px", alignItems: "center" }}>
        {/* COLUNA 1: FUNIL ESPACIAL ISOMÉTRICO MODERNO (ANTIGRAVITY DESIGN) */}
        <div className="funnel-cone-container" style={{ position: "relative", margin: "0 auto" }}>
          <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ display: "block", overflow: "visible" }}
          >
            <defs>
              {/* Feixe Vertical de Luz Neon (Photon Laser Beam) */}
              <linearGradient id="laserBeamGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#7C5CFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#2EDB6F" stopOpacity="0.8" />
              </linearGradient>

              {/* Plataforma Base Holográfica */}
              <linearGradient id="basePlatformGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--surface-3)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--surface-1)" stopOpacity="0.95" />
              </linearGradient>

              {/* Filtro de Glow Neon 3D */}
              <filter id="spatialGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Gradientes Individuais das Camadas */}
              {stageStats.map((st) => (
                <linearGradient
                  key={`grad-${st.index}`}
                  id={`funnelTierGrad-${st.index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor={st.gradStart} stopOpacity="0.92" />
                  <stop offset="100%" stopColor={st.gradEnd} stopOpacity="0.85" />
                </linearGradient>
              ))}
            </defs>

            {/* Feixe de Luz Central Conectando os Estágios */}
            <line
              x1={centerX}
              y1={topY}
              x2={centerX}
              y2={topY + numStages * (stageH + gap) + 15}
              stroke="url(#laserBeamGrad)"
              strokeWidth="3"
              strokeDasharray="4 3"
              opacity="0.75"
            />

            {/* Plataforma Base Holográfica (Target Final) */}
            <g transform={`translate(0, ${topY + numStages * (stageH + gap) + 10})`}>
              <ellipse
                cx={centerX}
                cy="26"
                rx="110"
                ry="18"
                fill="url(#basePlatformGrad)"
                stroke="var(--border-subtle)"
                strokeWidth="1.5"
              />
              <ellipse
                cx={centerX}
                cy="26"
                rx="70"
                ry="11"
                fill="none"
                stroke="var(--accent-strong)"
                strokeWidth="1.5"
                opacity="0.4"
              />
              <ellipse
                cx={centerX}
                cy="26"
                rx="32"
                ry="6"
                fill="rgba(46, 219, 111, 0.25)"
                stroke="#2EDB6F"
                strokeWidth="1.5"
              />
            </g>

            {/* Camadas Isométricas do Funil */}
            {stageStats.map((st, idx) => {
              const factorTop = idx / numStages;
              const factorBottom = (idx + 1) / numStages;

              const maxW = 360;
              const minW = 80;

              const wTop = maxW - factorTop * (maxW - minW);
              const wBottom = maxW - factorBottom * (maxW - minW);

              const yTop = topY + idx * (stageH + gap);
              const yBottom = yTop + stageH;

              const xTopLeft = centerX - wTop / 2;
              const xTopRight = centerX + wTop / 2;
              const xBottomLeft = centerX - wBottom / 2;
              const xBottomRight = centerX + wBottom / 2;

              const curveDepth = 10;
              const isHovered = hoveredIdx === st.index;
              const pctGlobal =
                totalStarted > 0 ? Math.round((st.reached / totalStarted) * 100) : 0;

              return (
                <g
                  key={st.index}
                  onMouseEnter={() => setHoveredIdx(st.index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                  filter={isHovered ? "url(#spatialGlow)" : undefined}
                >
                  {/* Face Frontal em Perspectiva Isométrica */}
                  <path
                    d={`
                      M ${xTopLeft} ${yTop}
                      Q ${centerX} ${yTop + curveDepth} ${xTopRight} ${yTop}
                      L ${xBottomRight} ${yBottom}
                      Q ${centerX} ${yBottom + curveDepth} ${xBottomLeft} ${yBottom}
                      Z
                    `}
                    fill={`url(#funnelTierGrad-${st.index})`}
                    stroke={isHovered ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
                    strokeWidth={isHovered ? "2.5" : "1"}
                    opacity={isHovered ? 1 : 0.88}
                  />

                  {/* Elipse Superior (Topo em Vidro) */}
                  <ellipse
                    cx={centerX}
                    cy={yTop}
                    rx={wTop / 2}
                    ry={curveDepth / 1.5}
                    fill={st.gradStart}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                    opacity="0.9"
                  />

                  {/* Badge Holográfico Central com Porcentagem Nítida */}
                  <g transform={`translate(${centerX}, ${yTop + stageH / 2})`}>
                    {/* Placa de Fundo Escura para Contraste Infalível */}
                    <rect
                      x="-38"
                      y="-11"
                      width="76"
                      height="22"
                      rx="11"
                      fill="rgba(13, 15, 21, 0.82)"
                      stroke={isHovered ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
                      strokeWidth={isHovered ? "1.5" : "1"}
                    />

                    {/* Número do Estágio */}
                    <circle cx="-24" cy="0" r="6.5" fill={st.accent} />
                    <text
                      x="-24"
                      y="3"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="800"
                    >
                      {st.index}
                    </text>

                    {/* Porcentagem em Branco Nítido Sobre a Placa Escura */}
                    <text
                      x="10"
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="800"
                      style={{ letterSpacing: "-0.01em" }}
                    >
                      {pctGlobal}%
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* COLUNA 2: LISTA DE ESTÁGIOS COM CONTRASTE DE ALTO NÍVEL NO MODO CLARO */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                  padding: "11px 16px",
                  borderRadius: "12px",
                  background: isHovered ? "var(--surface-hover)" : "var(--surface-1)",
                  border: isHovered ? `1px solid ${st.accent}` : "1px solid var(--border-subtle)",
                  boxShadow: isHovered ? `0 4px 18px ${st.glowColor}` : "none",
                  transition: "all 0.16s ease",
                  cursor: "pointer",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* Número do Estágio e Título */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      background: isHovered ? st.accent : "var(--surface-3)",
                      border: `1px solid ${st.accent}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: isHovered ? "#FFFFFF" : "var(--text-primary)",
                      flexShrink: 0,
                      transition: "all 0.16s ease",
                    }}
                  >
                    {st.index}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {st.label}
                      </span>
                      {st.index === 8 && (
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 700,
                            color: "#2EDB6F",
                            background: "rgba(46, 219, 111, 0.12)",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            border: "1px solid rgba(46, 219, 111, 0.3)",
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

                {/* Métricas e Pílula com Contraste Absoluto */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                  {/* Pessoas ativas nesta etapa */}
                  {st.current > 0 && (
                    <div
                      className="desktop-only-control"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#2EDB6F",
                        background: "rgba(46, 219, 111, 0.12)",
                        border: "1px solid rgba(46, 219, 111, 0.3)",
                        borderRadius: "6px",
                        padding: "2px 7px",
                      }}
                    >
                      <Users style={{ width: "10px", height: "10px" }} />
                      <span>{st.current} ao vivo</span>
                    </div>
                  )}

                  {/* Barra de Retenção */}
                  <div className="funnel-stage-bar" style={{ width: "70px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div
                      style={{
                        height: "5px",
                        background: "var(--surface-3)",
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

                  {/* Contagem de Leads e Pílula de % (NUNCA CLARA NO MODO CLARO) */}
                  <div style={{ textAlign: "right", minWidth: "75px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        display: "block",
                        lineHeight: 1.1,
                      }}
                    >
                      {st.reached}{" "}
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>
                        leads
                      </span>
                    </span>

                    {/* Pílula de % com Alto Contraste: Texto Escuro no Modo Claro */}
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        background: isHovered ? "var(--accent-soft-bg)" : "var(--surface-3)",
                        border: isHovered ? `1px solid ${st.accent}` : "1px solid var(--border-subtle)",
                        padding: "1px 6px",
                        borderRadius: "5px",
                        display: "inline-block",
                        marginTop: "3px",
                        transition: "all 0.16s ease",
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

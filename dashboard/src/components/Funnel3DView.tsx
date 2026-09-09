import { useState, useMemo, useEffect } from "react";
import type { Lead } from "@/types";
import { Sparkles, Percent } from "lucide-react";

interface Funnel3DViewProps {
  leads: Lead[];
  loading?: boolean;
}

interface FunnelStageConfig {
  index: number;
  name: string;
  shortLabel: string;
  label: string;
  sub: string;
  accent: string;
  accentDark: string;
  gradStart: string;
  gradEnd: string;
  glowColor: string;
}

// Paleta Elegante Estilo Claude (Terracota Quente -> Âmbar -> Coral Queimado -> Esmeralda Checkout)
const ETAPAS_3D: FunnelStageConfig[] = [
  {
    index: 1,
    name: "intro",
    shortLabel: "Início",
    label: "Início do Quiz",
    sub: "Abertura do fluxo e primeiro clique",
    accent: "#F97316",
    accentDark: "#C2410C",
    gradStart: "#FB923C",
    gradEnd: "#EA580C",
    glowColor: "rgba(249, 115, 22, 0.35)",
  },
  {
    index: 2,
    name: "ente",
    shortLabel: "Ente Querido",
    label: "Nome do Ente Querido",
    sub: "Homenagem ao ente falecido",
    accent: "#F56522",
    accentDark: "#C2410C",
    gradStart: "#F97316",
    gradEnd: "#EA580C",
    glowColor: "rgba(245, 101, 34, 0.35)",
  },
  {
    index: 3,
    name: "relacao",
    shortLabel: "Vínculo",
    label: "Vínculo Familiar",
    sub: "Grau de parentesco declarado",
    accent: "#EA580C",
    accentDark: "#9A3412",
    gradStart: "#EA580C",
    gradEnd: "#D96B43",
    glowColor: "rgba(234, 88, 12, 0.35)",
  },
  {
    index: 4,
    name: "tempo",
    shortLabel: "Sentimento",
    label: "Tempo e Sentimento",
    sub: "Data da partida e conexão afetiva",
    accent: "#D96B43",
    accentDark: "#9A3412",
    gradStart: "#D96B43",
    gradEnd: "#C85A32",
    glowColor: "rgba(217, 107, 67, 0.35)",
  },
  {
    index: 5,
    name: "mensagem",
    shortLabel: "Mensagem",
    label: "Mensagem e Intenção",
    sub: "Temas de oração e conforto espiritual",
    accent: "#C85A32",
    accentDark: "#85260C",
    gradStart: "#C85A32",
    gradEnd: "#B84A28",
    glowColor: "rgba(200, 90, 50, 0.35)",
  },
  {
    index: 6,
    name: "confirma",
    shortLabel: "Identificação",
    label: "Confirmação dos Dados",
    sub: "Identificação completa do consulente",
    accent: "#B84A28",
    accentDark: "#7C2D12",
    gradStart: "#B84A28",
    gradEnd: "#A03B1E",
    glowColor: "rgba(184, 74, 40, 0.35)",
  },
  {
    index: 7,
    name: "loading",
    shortLabel: "Carta",
    label: "Preparação da Carta",
    sub: "Psicografia e sintonização espiritual",
    accent: "#A03B1E",
    accentDark: "#601D0C",
    gradStart: "#A03B1E",
    gradEnd: "#8C2F15",
    glowColor: "rgba(160, 59, 30, 0.35)",
  },
  {
    index: 8,
    name: "result",
    shortLabel: "Checkout",
    label: "Altar & Doação (Checkout)",
    sub: "Geração do PIX e consagração final",
    accent: "#10B981",
    accentDark: "#047857",
    gradStart: "#34D399",
    gradEnd: "#059669",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
];

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function Funnel3DView({ leads }: Funnel3DViewProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [metricMode, setMetricMode] = useState<"retention" | "step">("retention");
  const [now, setNow] = useState(() => Date.now());

  // Atualização estável em tempo real a cada 30 segundos (impede gargalos de re-render ao scrollar)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Identificação de Leads em Tempo Real (Atividade estrita nos últimos 10 minutos)
  const liveLeads = useMemo(() => {
    return leads.filter((l) => {
      const ts = new Date(l.updated_at || l.created_at).getTime();
      return !isNaN(ts) && now - ts <= TEN_MINUTES_MS;
    });
  }, [leads, now]);

  const totalLive = liveLeads.length;

  // Cálculo rigoroso de telemetria por etapa
  const stageStats = useMemo(() => {
    const totalCount = leads.length;

    return ETAPAS_3D.map((stage, idx) => {
      // Leads que alcançaram ou ultrapassaram esta etapa
      const reached =
        stage.index === 1
          ? Math.max(totalCount, leads.filter((l) => (l.highest_step_index || 1) >= 1).length)
          : leads.filter((l) => (l.highest_step_index || 1) >= stage.index).length;

      // Leads que estão atualmente navegando NESTA ETAPA AGORA (tempo real estrito)
      const liveNow = liveLeads.filter((l) => {
        const currentIdx = l.current_step_index || 1;
        return currentIdx === stage.index || (l.current_step_name === stage.name && !l.current_step_index);
      }).length;

      // Estágio anterior para taxa de passagem (passo a passo)
      const prevReached =
        idx === 0
          ? reached
          : stage.index === 2
          ? Math.max(totalCount, leads.filter((l) => (l.highest_step_index || 1) >= 1).length)
          : leads.filter((l) => (l.highest_step_index || 1) >= stage.index - 1).length;

      // Taxa de retenção sobre o início
      const totalStarted =
        Math.max(totalCount, leads.filter((l) => (l.highest_step_index || 1) >= 1).length, 1);
      const retentionPct = totalStarted > 0 ? (reached / totalStarted) * 100 : 0;

      // Taxa de avanço em relação ao passo anterior
      const stepConversionPct =
        idx === 0 ? 100 : prevReached > 0 ? (reached / prevReached) * 100 : 0;

      // Queda / Abandono nesta etapa
      const dropCount = idx === 0 ? 0 : Math.max(0, prevReached - reached);
      const dropPct = prevReached > 0 ? (dropCount / prevReached) * 100 : 0;

      return {
        ...stage,
        reached,
        liveNow,
        prevReached,
        retentionPct,
        stepConversionPct,
        dropCount,
        dropPct,
      };
    });
  }, [leads, liveLeads]);

  const totalStarted = stageStats[0]?.reached || Math.max(leads.length, 1);
  const totalConverted = stageStats[7]?.reached || 0;
  const globalConversionRate =
    totalStarted > 0 ? ((totalConverted / totalStarted) * 100).toFixed(1) : "0.0";

  // Dimensões do Funil Espacial Isométrico
  const svgW = 460;
  const svgH = 500;
  const centerX = svgW / 2;
  const numStages = ETAPAS_3D.length;
  const topY = 24;
  const stageH = 43;
  const gap = 7;

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
        contain: "content",
        isolation: "isolate",
      }}
    >
      {/* ─── 1. Header do Painel Principal ─── */}
      <div
        className="funnel-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "16px",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 700,
                color: totalLive > 0 ? "#10B981" : "var(--text-muted)",
                background: totalLive > 0 ? "rgba(16, 185, 129, 0.12)" : "var(--surface-3)",
                border: totalLive > 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-subtle)",
                borderRadius: "999px",
                padding: "2px 8px",
              }}
            >
              {totalLive > 0 && <span className="pulse-emerald" style={{ width: "6px", height: "6px" }} />}
              {totalLive === 1 ? "1 consulente ao vivo agora" : `${totalLive} consulentes ao vivo agora`}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>· Atualização em tempo real</span>
          </div>

          <h3
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Funil de Conversão & Retenção 3D
          </h3>
        </div>

        {/* 4 Cards de Métricas Rápidas */}
        <div className="funnel-header-cards">
          <div
            className="funnel-stat-card"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "6px 12px",
              textAlign: "center",
              minWidth: "75px",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
              Entradas
            </span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
              {totalStarted}
            </span>
          </div>

          <div
            className="funnel-stat-card"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "6px 12px",
              textAlign: "center",
              minWidth: "75px",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
              Checkout
            </span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#2EDB6F" }}>
              {totalConverted}
            </span>
          </div>

          <div
            className="funnel-stat-card"
            style={{
              background: "rgba(46, 219, 111, 0.1)",
              border: "1px solid rgba(46, 219, 111, 0.3)",
              borderRadius: "10px",
              padding: "6px 12px",
              textAlign: "center",
              minWidth: "80px",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#2EDB6F", textTransform: "uppercase", display: "block" }}>
              Conv. Global
            </span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#2EDB6F" }}>
              {globalConversionRate}%
            </span>
          </div>

          <div
            className="funnel-stat-card"
            style={{
              background: totalLive > 0 ? "rgba(16, 185, 129, 0.12)" : "var(--surface-1)",
              border: totalLive > 0 ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "6px 12px",
              textAlign: "center",
              minWidth: "75px",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 700, color: totalLive > 0 ? "var(--primary-green)" : "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
              Ao Vivo
            </span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: totalLive > 0 ? "var(--primary-green)" : "var(--text-muted)" }}>
              {totalLive}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. Barra de Controle & HUD de Inspeção ─── */}
      <div
        className="funnel-controls-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: "var(--surface-1)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
          padding: "14px 18px",
        }}
      >
        {/* Toggle para Desmistificar as Porcentagens */}
        <div className="funnel-toggle-wrapper" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
            <Percent style={{ width: "13px", height: "13px", color: "var(--accent-strong)" }} />
            Exibir Porcentagem por:
          </span>

          <div
            className="funnel-toggle-buttons"
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "9px",
              padding: "3px",
              gap: "3px",
            }}
          >
            <button
              type="button"
              className="funnel-toggle-btn"
              onClick={() => setMetricMode("retention")}
              style={{
                fontSize: "11px",
                fontWeight: metricMode === "retention" ? 800 : 600,
                padding: "5px 12px",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                background: metricMode === "retention" ? "var(--accent-strong)" : "transparent",
                color: metricMode === "retention" ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <span className="funnel-btn-text-full">Retenção Geral (% do Início)</span>
              <span className="funnel-btn-text-compact">Retenção Geral</span>
            </button>

            <button
              type="button"
              className="funnel-toggle-btn"
              onClick={() => setMetricMode("step")}
              style={{
                fontSize: "11px",
                fontWeight: metricMode === "step" ? 800 : 600,
                padding: "5px 12px",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                background: metricMode === "step" ? "var(--accent-strong)" : "transparent",
                color: metricMode === "step" ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <span className="funnel-btn-text-full">Avanço Passo a Passo (% da Etapa)</span>
              <span className="funnel-btn-text-compact">Passo a Passo</span>
            </button>
          </div>
        </div>

        {/* HUD de Inspeção Flutuante ao passar o mouse com altura rigorosamente estável */}
        <div
          className="funnel-hud-container"
          style={{
            height: "44px",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {activeStage ? (
            <div
              className="funnel-hud-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "6px 14px",
                borderRadius: "10px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-strong)",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.28)",
                height: "44px",
                minHeight: "44px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "6px",
                  background: activeStage.accent,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "12px",
                  flexShrink: 0,
                }}
              >
                {activeStage.index}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", display: "block", lineHeight: 1.2 }}>
                  {activeStage.label}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", marginTop: "2px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {activeStage.reached} leads
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  <span style={{ fontWeight: 700, color: "var(--accent-strong)" }}>
                    {activeStage.retentionPct.toFixed(1)}% do início
                  </span>
                  {activeStage.index > 1 && (
                    <>
                      <span style={{ color: "var(--text-muted)" }}>·</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: activeStage.stepConversionPct >= 90 ? "#2EDB6F" : "#F59E0B",
                        }}
                      >
                        {activeStage.stepConversionPct.toFixed(1)}% de avanço
                      </span>
                    </>
                  )}
                  {activeStage.liveNow > 0 && (
                    <>
                      <span style={{ color: "var(--text-muted)" }}>·</span>
                      <span style={{ fontWeight: 800, color: "#10B981", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                        {activeStage.liveNow} ativo(s) agora
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="funnel-hud-card"
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "10px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                height: "44px",
                minHeight: "44px",
                boxSizing: "border-box",
              }}
            >
              <Sparkles style={{ width: "13px", height: "13px", color: "var(--accent-strong)" }} />
              <span>Passe o mouse ou toque sobre qualquer estágio para ver raio-X</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. Grade Principal: Funil 3D + Painel Analítico ─── */}
      <div
        className="funnel-3d-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "460px 1fr",
          gap: "28px",
          alignItems: "center",
        }}
      >
        {/* COLUNA 1: FUNIL ISOMÉTRICO 3D COM PLACAS INFORMATIVAS */}
        <div
          className="funnel-cone-container"
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            position: "relative",
            margin: "0 auto",
            contain: "layout paint",
            willChange: "transform",
            width: "100%",
            maxWidth: `${svgW}px`,
          }}
        >
          <svg
            width="100%"
            viewBox={`0 0 ${svgW} ${svgH}`}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: "block",
              width: "100%",
              maxWidth: `${svgW}px`,
              height: "auto",
              overflow: "visible",
              touchAction: "pan-y",
            }}
          >
            <defs>
              {/* Feixe Central de Luz Neon Estilo Claude */}
              <linearGradient id="laserBeamGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#D96B43" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
              </linearGradient>

              {/* Plataforma Base */}
              <linearGradient id="basePlatformGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--surface-3)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--surface-1)" stopOpacity="0.95" />
              </linearGradient>

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

            {/* Feixe de Luz Central (Blindado com pointerEvents none para não roubar eventos de mouse) */}
            <line
              x1={centerX}
              y1={topY}
              x2={centerX}
              y2={topY + numStages * (stageH + gap) + 15}
              stroke="url(#laserBeamGrad)"
              strokeWidth="3"
              strokeDasharray="4 3"
              opacity="0.75"
              style={{ pointerEvents: "none" }}
            />

            {/* Plataforma Base Holográfica */}
            <g
              transform={`translate(0, ${topY + numStages * (stageH + gap) + 10})`}
              style={{ pointerEvents: "none" }}
            >
              <ellipse
                cx={centerX}
                cy="26"
                rx="115"
                ry="19"
                fill="url(#basePlatformGrad)"
                stroke="var(--border-subtle)"
                strokeWidth="1.5"
              />
              <ellipse
                cx={centerX}
                cy="26"
                rx="72"
                ry="11"
                fill="none"
                stroke="var(--accent-strong)"
                strokeWidth="1.5"
                opacity="0.4"
              />
              <ellipse
                cx={centerX}
                cy="26"
                rx="34"
                ry="6"
                fill="rgba(217, 107, 67, 0.25)"
                stroke="#D96B43"
                strokeWidth="1.5"
              />
            </g>

            {/* Camadas Isométricas do Funil */}
            {stageStats.map((st, idx) => {
              const factorTop = idx / numStages;
              const factorBottom = (idx + 1) / numStages;

              const maxW = 380;
              const minW = 90;

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

              // Porcentagem a exibir de acordo com a métrica ativa
              const displayPctNum =
                metricMode === "retention" ? st.retentionPct : st.stepConversionPct;
              const displayPctStr =
                st.index === 1
                  ? "100%"
                  : displayPctNum >= 99.9
                  ? "100%"
                  : `${displayPctNum.toFixed(1)}%`;

              return (
                <g
                  key={st.index}
                  onMouseEnter={() => setHoveredIdx(st.index)}
                  style={{
                    cursor: "pointer",
                    transform: isHovered ? "scale(1.03)" : "scale(1)",
                    transformOrigin: `${centerX}px ${yTop + stageH / 2}px`,
                    transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease",
                  }}
                >
                  {/* Área de Toque/Hover Estável com Margem de Segurança Anti-Vibração */}
                  <path
                    d={`
                      M ${xTopLeft - 4} ${yTop - 3}
                      L ${xTopRight + 4} ${yTop - 3}
                      L ${xBottomRight + 4} ${yBottom + 3}
                      L ${xBottomLeft - 4} ${yBottom + 3}
                      Z
                    `}
                    fill="transparent"
                    style={{ pointerEvents: "all" }}
                  />

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
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1"
                    opacity={isHovered ? 1 : 0.88}
                  />

                  {/* Elipse Superior (Borda em Vidro) */}
                  <ellipse
                    cx={centerX}
                    cy={yTop}
                    rx={wTop / 2}
                    ry={curveDepth / 1.5}
                    fill={st.gradStart}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                    opacity={isHovered ? 1 : 0.9}
                    style={{ pointerEvents: "none" }}
                  />

                  {/* Placa Holográfica Central com Rótulo e Porcentagem Nítida */}
                  <g
                    transform={`translate(${centerX}, ${yTop + stageH / 2})`}
                    style={{ pointerEvents: "none" }}
                  >
                    {/* Placa de Fundo Escura para Contraste Absoluto */}
                    <rect
                      x="-68"
                      y="-12"
                      width="136"
                      height="24"
                      rx="12"
                      fill="rgba(14, 14, 17, 0.92)"
                      stroke={isHovered ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
                      strokeWidth={isHovered ? "1.5" : "1"}
                    />

                    {/* Número da Etapa */}
                    <circle cx="-50" cy="0" r="7" fill={st.accent} />
                    <text
                      x="-50"
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="800"
                    >
                      {st.index}
                    </text>

                    {/* Nome Curto da Etapa */}
                    <text
                      x="-14"
                      y="3.5"
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="9.5"
                      fontWeight="700"
                    >
                      {st.shortLabel}
                    </text>

                    {/* Porcentagem em Destaque */}
                    <text
                      x="34"
                      y="4"
                      textAnchor="middle"
                      fill={st.index === 8 ? "#10B981" : "#FFFFFF"}
                      fontSize="11"
                      fontWeight="900"
                      style={{ letterSpacing: "-0.01em" }}
                    >
                      {displayPctStr}
                    </text>

                    {/* Indicador se houver consulentes AO VIVO nesta etapa agora */}
                    {st.liveNow > 0 && (
                      <circle
                        cx="58"
                        cy="-6"
                        r="3.5"
                        fill="#10B981"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* COLUNA 2: LISTA DE ESTÁGIOS COM TELEMETRIA EM TEMPO REAL */}
        <div
          className="funnel-stages-list"
          onMouseLeave={() => setHoveredIdx(null)}
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          {stageStats.map((st) => {
            const isHovered = hoveredIdx === st.index;

            const displayPctNum =
              metricMode === "retention" ? st.retentionPct : st.stepConversionPct;
            const displayPctStr =
              st.index === 1
                ? "100%"
                : displayPctNum >= 99.9
                ? "100%"
                : `${displayPctNum.toFixed(1)}%`;

            return (
              <div
                key={st.index}
                onMouseEnter={() => setHoveredIdx(st.index)}
                className="funnel-stage-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 16px",
                  borderRadius: "12px",
                  background: isHovered ? "var(--surface-hover)" : "var(--surface-1)",
                  border: isHovered ? "1px solid var(--border-strong)" : "1px solid var(--border-subtle)",
                  boxShadow: isHovered ? "0 8px 24px rgba(0, 0, 0, 0.3)" : "none",
                  transform: isHovered ? "scale(1.018)" : "scale(1)",
                  transformOrigin: "center",
                  position: "relative",
                  zIndex: isHovered ? 5 : 1,
                  transition: "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                  cursor: "pointer",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* Número do Estágio e Título */}
                <div className="funnel-stage-info" style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                  <div
                    className="funnel-stage-badge"
                    style={{
                      width: "32px",
                      height: "32px",
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

                  <div className="funnel-stage-text-col" style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span
                        className="funnel-stage-title"
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
                          className="funnel-stage-conv-tag"
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
                      className="funnel-stage-sub"
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

                {/* Métricas e Indicador de Tempo Real Estrito */}
                <div className="funnel-stage-metrics" style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                  {/* Badge de Tempo Real: Apenas se houver consulentes navegando nesta tela agora */}
                  {st.liveNow > 0 && (
                    <div
                      className="funnel-stage-live-badge"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#10B981",
                        background: "rgba(16, 185, 129, 0.14)",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        borderRadius: "6px",
                        padding: "2px 7px",
                      }}
                    >
                      <span className="pulse-emerald" style={{ width: "5px", height: "5px" }} />
                      <span className="funnel-live-label-desktop">{st.liveNow} ao vivo</span>
                      <span className="funnel-live-label-mobile">{st.liveNow}</span>
                    </div>
                  )}

                  {/* Barra de Retenção Visual */}
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
                          width: `${Math.min(100, Math.max(0, displayPctNum))}%`,
                          height: "100%",
                          background: st.accent,
                          borderRadius: "99px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Contagem de Leads e Pílula de Porcentagem Nítida */}
                  <div className="funnel-stage-count" style={{ textAlign: "right", minWidth: "85px" }}>
                    <span
                      className="funnel-stage-count-num"
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

                    <span
                      className="funnel-stage-pct-pill"
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        color: isHovered ? "var(--accent-strong)" : "var(--text-primary)",
                        background: isHovered ? "var(--accent-soft-bg)" : "var(--surface-3)",
                        border: "1px solid var(--border-subtle)",
                        padding: "1px 6px",
                        borderRadius: "5px",
                        display: "inline-block",
                        marginTop: "3px",
                        transition: "all 0.16s ease",
                      }}
                    >
                      {displayPctStr}{" "}
                      <span className="funnel-stage-pct-label" style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-muted)" }}>
                        {metricMode === "retention" ? "retido" : "avanço"}
                      </span>
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

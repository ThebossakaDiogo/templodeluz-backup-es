import { Zap, Clock, QrCode, Sparkles, Activity } from "lucide-react";

interface TodayHeroMetricProps {
  todayEntriesCount: number;
  onlineCount: number;
  todayCheckoutsCount: number;
  todayPixCount: number;
  avgQuizTimeSeconds: number;
  loading?: boolean;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function TodayHeroMetric({
  todayEntriesCount,
  onlineCount,
  todayCheckoutsCount,
  todayPixCount,
  avgQuizTimeSeconds,
  loading = false,
}: TodayHeroMetricProps) {
  return (
    <div
      className="card today-hero-card"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "20px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Luz ambiente de fundo (Glow espacial) */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124, 92, 255, 0.15) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 70%)",
          filter: "blur(30px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ─── Topo do Card: Badge de Destaque & Status Ao Vivo ─── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Badge de Destaque Máximo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "linear-gradient(90deg, rgba(124, 92, 255, 0.2) 0%, rgba(56, 189, 248, 0.15) 100%)",
              border: "1px solid rgba(124, 92, 255, 0.35)",
              color: "var(--accent-strong)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles style={{ width: "12px", height: "12px" }} />
            <span>Métrica Principal do Dia</span>
          </div>

          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Telemetria contínua do fluxo do quiz espírita
          </span>
        </div>

        {/* Indicador de Consulentes Online AGORA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 14px",
            borderRadius: "999px",
            background: "rgba(46, 219, 111, 0.10)",
            border: "1px solid rgba(46, 219, 111, 0.30)",
          }}
        >
          <span
            className="pulse-emerald"
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#2EDB6F",
              boxShadow: "0 0 8px #2EDB6F",
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#2EDB6F" }}>
            {onlineCount === 1 ? "1 consulente ao vivo agora" : `${onlineCount} consulentes ao vivo agora`}
          </span>
        </div>
      </div>

      {/* ─── Centro do Card: Grande Número Monumental & Métricas Satélites ─── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1.2fr 2fr",
          gap: "28px",
          alignItems: "center",
        }}
        className="today-hero-grid"
      >
        {/* Bloco 1: O NÚMERO DE MAIOR DESTAQUE DO DASHBOARD */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "16px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "var(--accent-soft-bg)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-strong)",
              }}
            >
              <Activity style={{ width: "15px", height: "15px" }} />
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Entradas Hoje no Quiz
            </span>
          </div>

          {/* O Número Monumental */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
            <span
              className="font-numeric"
              style={{
                fontSize: "48px",
                fontWeight: 900,
                color: "var(--text-primary)",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {loading ? "..." : todayEntriesCount}
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-muted)",
              }}
            >
              {todayEntriesCount === 1 ? "consulente" : "consulentes"}
            </span>
          </div>

          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            Total de pessoas que abriram o quiz desde as 00:00h de hoje (Horário de Brasília).
          </p>
        </div>

        {/* Bloco 2: Métricas Satélites da Jornada de Hoje */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "14px",
          }}
          className="today-satellites-grid"
        >
          {/* Satélite 1: Checkouts Iniciados Hoje */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap style={{ width: "13px", height: "13px", color: "var(--accent-strong)" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                Chegaram ao Checkout
              </span>
            </div>
            <span
              className="font-numeric"
              style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}
            >
              {loading ? "..." : todayCheckoutsCount}
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              {todayEntriesCount > 0
                ? `${Math.round((todayCheckoutsCount / todayEntriesCount) * 100)}% de avanço`
                : "Aguardando fluxo"}
            </span>
          </div>

          {/* Satélite 2: PIX Gerados Hoje */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <QrCode style={{ width: "13px", height: "13px", color: "#2EDB6F" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                PIX Gerados Hoje
              </span>
            </div>
            <span
              className="font-numeric"
              style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}
            >
              {loading ? "..." : todayPixCount}
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              Cobranças criadas no dia
            </span>
          </div>

          {/* Satélite 3: Tempo Médio de Atenção */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock style={{ width: "13px", height: "13px", color: "#8A79FF" }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                Tempo Médio no Quiz
              </span>
            </div>
            <span
              className="font-numeric"
              style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}
            >
              {loading ? "..." : formatTime(avgQuizTimeSeconds)}
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
              Engajamento dos consulentes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

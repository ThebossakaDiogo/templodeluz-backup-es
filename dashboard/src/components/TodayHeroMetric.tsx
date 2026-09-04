import { Zap, Clock, QrCode, Activity } from "lucide-react";

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
  const checkoutRate = todayEntriesCount > 0
    ? Math.round((todayCheckoutsCount / todayEntriesCount) * 100)
    : 0;

  return (
    <div
      className="card today-hero-card"
      style={{
        padding: "18px 22px",
        borderRadius: "14px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ─── Topo: Título da Telemetria + Status Ao Vivo ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)",
            }}
          >
            <Activity style={{ width: "15px", height: "15px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Telemetria Operacional do Dia
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Acompanhamento de fluxo de consulentes em tempo real (desde as 00h de Brasília)
            </span>
          </div>
        </div>

        {/* Badge Pulsante Online */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "4px 12px",
            borderRadius: "999px",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.22)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 6px #10B981",
            }}
          />
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#10B981" }}>
            {onlineCount === 1 ? "1 consulente online agora" : `${onlineCount} consulentes online agora`}
          </span>
        </div>
      </div>

      {/* ─── Grid de 4 Indicadores Operacionais Simétricos ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Bloco 1: Entradas no Quiz */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>
              Entradas Hoje
            </span>
            <Activity style={{ width: "13px", height: "13px", color: "var(--accent-primary)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              className="font-numeric"
              style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              {loading ? "—" : todayEntriesCount}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>consulentes</span>
          </div>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
            Iniciaram o quiz hoje
          </span>
        </div>

        {/* Bloco 2: Checkouts Iniciados */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>
              Chegaram ao Checkout
            </span>
            <Zap style={{ width: "13px", height: "13px", color: "#F59E0B" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              className="font-numeric"
              style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              {loading ? "—" : todayCheckoutsCount}
            </span>
            <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600 }}>
              {checkoutRate}% avanço
            </span>
          </div>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
            Concluíram as perguntas
          </span>
        </div>

        {/* Bloco 3: PIX Gerados Hoje */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>
              PIX Gerados Hoje
            </span>
            <QrCode style={{ width: "13px", height: "13px", color: "#10B981" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              className="font-numeric"
              style={{ fontSize: "24px", fontWeight: 700, color: "#10B981", letterSpacing: "-0.02em" }}
            >
              {loading ? "—" : todayPixCount}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>cobranças</span>
          </div>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
            Emitidas no gateway
          </span>
        </div>

        {/* Bloco 4: Tempo Médio de Sessão */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>
              Tempo Médio no Quiz
            </span>
            <Clock style={{ width: "13px", height: "13px", color: "#6366F1" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              className="font-numeric"
              style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
            >
              {loading ? "—" : formatTime(avgQuizTimeSeconds)}
            </span>
          </div>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
            Engajamento por consulente
          </span>
        </div>
      </div>
    </div>
  );
}

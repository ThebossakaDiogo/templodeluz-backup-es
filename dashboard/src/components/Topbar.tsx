import { Sun, Moon, RefreshCw, Download } from "lucide-react";
import type { Section } from "../App";

interface TopbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdate: Date | null;
  section: Section;
  onExportCsv: () => void;
}

const SECTION_LABELS: Record<Section, string> = {
  "visao-geral":  "Visão Geral",
  "rastreamento": "Rastreamento ao Vivo",
  "pedidos":      "Pedidos",
  "relatorios":   "Relatórios",
};

const SECTION_DESCRIPTIONS: Record<Section, string> = {
  "visao-geral":  "Métricas, gráficos de receita e funil de conversão",
  "rastreamento": "Leads navegando pelo funil em tempo real",
  "pedidos":      "Histórico completo de cobranças e pagamentos PIX",
  "relatorios":   "Distribuição, origem de tráfego e exportação",
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function Topbar({
  theme,
  onToggleTheme,
  onRefresh,
  loading,
  lastUpdate,
  section,
  onExportCsv,
}: TopbarProps) {
  return (
    <header
      style={{
        height: "60px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "16px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Título */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {SECTION_LABELS[section]}
          </h1>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, fontWeight: 400 }}>
          {SECTION_DESCRIPTIONS[section]}
        </p>
      </div>

      {/* Status ao vivo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          color: "var(--text-muted)",
          background: "var(--bg-surface-alt)",
          border: "1px solid var(--border)",
          borderRadius: "99px",
          padding: "5px 12px",
        }}
      >
        <div className={loading ? undefined : "pulse-dot"}
          style={loading ? {
            width: "7px", height: "7px", borderRadius: "50%",
            background: "#f59e0b",
            boxShadow: "0 0 8px rgba(245,158,11,0.6)",
          } : undefined}
        />
        <span style={{ fontWeight: 600 }}>
          {loading
            ? "Atualizando..."
            : lastUpdate
            ? `Atualizado às ${formatTime(lastUpdate)}`
            : "Aguardando dados..."}
        </span>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {(section === "pedidos" || section === "relatorios") && (
          <button onClick={onExportCsv} className="btn">
            <Download style={{ width: "13px", height: "13px" }} />
            Exportar CSV
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn"
          title="Atualizar agora"
          style={{ padding: "7px 11px" }}
        >
          <RefreshCw
            style={{
              width: "13px",
              height: "13px",
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>

        <button
          onClick={onToggleTheme}
          className="btn"
          title={theme === "light" ? "Tema escuro" : "Tema claro"}
          style={{ padding: "7px 11px" }}
        >
          {theme === "light" ? (
            <Moon style={{ width: "13px", height: "13px" }} />
          ) : (
            <Sun style={{ width: "13px", height: "13px" }} />
          )}
        </button>
      </div>
    </header>
  );
}

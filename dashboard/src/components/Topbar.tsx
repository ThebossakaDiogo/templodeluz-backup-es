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
  "visao-geral":  "Resumo das métricas principais e gráficos de desempenho",
  "rastreamento": "Leads navegando pelo funil em tempo real",
  "pedidos":      "Histórico completo de cobranças PIX e pagamentos",
  "relatorios":   "Distribuição, origem e exportação de dados",
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
        height: "64px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      {/* Título da seção */}
      <div style={{ flex: 1 }}>
        <h1
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {SECTION_LABELS[section]}
        </h1>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            margin: "1px 0 0",
            fontWeight: 400,
          }}
        >
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
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: loading ? "var(--warning)" : "var(--success)",
            animation: "pulse 2s infinite",
          }}
        />
        {loading
          ? "Atualizando..."
          : lastUpdate
          ? `Atualizado às ${formatTime(lastUpdate)}`
          : "Aguardando dados..."}
      </div>

      {/* Ações */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Exportar */}
        {(section === "pedidos" || section === "relatorios") && (
          <button onClick={onExportCsv} className="btn">
            <Download style={{ width: "13px", height: "13px" }} />
            Exportar CSV
          </button>
        )}

        {/* Atualizar */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn"
          title="Atualizar dados agora"
          style={{ padding: "6px 10px" }}
        >
          <RefreshCw
            style={{
              width: "13px",
              height: "13px",
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>

        {/* Tema */}
        <button
          onClick={onToggleTheme}
          className="btn"
          title={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
          style={{ padding: "6px 10px" }}
        >
          {theme === "light" ? (
            <Moon style={{ width: "13px", height: "13px" }} />
          ) : (
            <Sun style={{ width: "13px", height: "13px" }} />
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}

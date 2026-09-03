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
  "pedidos":      "Histórico de Pedidos",
  "relatorios":   "Relatórios & Métricas",
};

const SECTION_DESCRIPTIONS: Record<Section, string> = {
  "visao-geral":  "Métricas principais, receita e conversão em tempo real",
  "rastreamento": "Jornada dos leads no quiz e checkout passo a passo",
  "pedidos":      "Auditoria de pagamentos e cobranças PIX geradas",
  "relatorios":   "Origem de tráfego, UTMs e exportação de relatórios",
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
        height: "64px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: "16px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Título e Descrição */}
      <div style={{ flex: 1 }}>
        <h1
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {SECTION_LABELS[section]}
        </h1>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            margin: "2px 0 0",
            fontWeight: 500,
          }}
        >
          {SECTION_DESCRIPTIONS[section]}
        </p>
      </div>

      {/* Indicador de Status com Ponto Ruby */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          color: "var(--text-secondary)",
          background: "var(--bg-surface-alt)",
          border: "1px solid var(--border)",
          borderRadius: "99px",
          padding: "6px 14px",
        }}
      >
        <div className={loading ? undefined : "pulse-ruby"}
          style={loading ? {
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#f59e0b",
            boxShadow: "0 0 10px rgba(245,158,11,0.7)",
          } : undefined}
        />
        <span style={{ fontWeight: 600 }}>
          {loading
            ? "Sincronizando..."
            : lastUpdate
            ? `Atualizado às ${formatTime(lastUpdate)}`
            : "Conectado ao Supabase"}
        </span>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {(section === "pedidos" || section === "relatorios") && (
          <button onClick={onExportCsv} className="btn btn-ruby">
            <Download style={{ width: "13px", height: "13px" }} />
            Exportar CSV
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn"
          title="Atualizar dados agora"
          style={{ padding: "7px 12px" }}
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
          title={theme === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
          style={{ padding: "7px 12px" }}
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

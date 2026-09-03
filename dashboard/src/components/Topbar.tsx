import { Sun, Moon, RefreshCw, Download, Users } from "lucide-react";
import { DateRangeSelector, type DateRangeValue } from "./DateRangeSelector";
import type { Section } from "../App";

interface TopbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdate: Date | null;
  section: Section;
  onExportCsv: () => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (val: DateRangeValue) => void;
  onlineCount: number;
}

const SECTION_LABELS: Record<Section, string> = {
  "visao-geral":  "Visão Geral & Gráficos",
  "rastreamento": "Rastreamento do Quiz ao Vivo",
  "pedidos":      "Auditoria de Pedidos (PIX & Cartão)",
  "relatorios":   "Relatórios de Canais & UTMs",
};

const SECTION_DESCRIPTIONS: Record<Section, string> = {
  "visao-geral":  "Métricas de faturamento unificado, PIX vs Cartão Stripe e telemetria",
  "rastreamento": "Etapa exata de cada consulente no funil e pessoas navegando agora",
  "pedidos":      "Auditoria em tempo real de doações pagas, pendentes e gateways",
  "relatorios":   "Desempenho por fonte de tráfego, campanha e exportação consolidada",
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
  dateRange,
  onDateRangeChange,
  onlineCount,
}: TopbarProps) {
  return (
    <header
      style={{
        height: "64px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        gap: "14px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Título e Descrição da Seção */}
      <div style={{ minWidth: "190px" }}>
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
            fontSize: "10.5px",
            color: "var(--text-muted)",
            margin: "2px 0 0",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "320px",
          }}
        >
          {SECTION_DESCRIPTIONS[section]}
        </p>
      </div>

      {/* Bloco Central e Controles da Direita */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
        {/* CONTADOR DE PESSOAS AO VIVO NO FUNIL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(16, 185, 129, 0.14)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: "99px",
            padding: "5px 12px",
            boxShadow: "0 0 12px rgba(16, 185, 129, 0.12)",
            flexShrink: 0,
          }}
        >
          <div className="pulse-emerald" />
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Users style={{ width: "12px", height: "12px", color: "var(--primary-green)" }} />
            <span style={{ fontSize: "11.5px", fontWeight: 900, color: "var(--text-primary)" }}>
              {onlineCount}
            </span>
            <span style={{ fontSize: "10.5px", fontWeight: 800, color: "var(--primary-green)" }}>
              {onlineCount === 1 ? "ao vivo" : "ao vivo"}
            </span>
          </div>
        </div>

        {/* SELETOR DE CALENDÁRIO COM HOJE E PERSONALIZADO */}
        {section === "visao-geral" && (
          <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
        )}

        {/* Indicador de Atualização */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: "var(--text-secondary)",
            background: "var(--bg-surface-alt)",
            border: "1px solid var(--border)",
            borderRadius: "99px",
            padding: "5px 11px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {loading ? "Sync..." : lastUpdate ? `Sync ${formatTime(lastUpdate)}` : "Ativo"}
          </span>
        </div>

        {/* Ações */}
        <button
          onClick={onExportCsv}
          className="btn btn-emerald"
          style={{ padding: "6px 12px", fontSize: "11.5px" }}
        >
          <Download style={{ width: "12px", height: "12px" }} />
          Exportar
        </button>

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

        <button
          onClick={onToggleTheme}
          className="btn"
          title={theme === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
          style={{ padding: "6px 10px" }}
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

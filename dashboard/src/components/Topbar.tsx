import { Sun, Moon, RefreshCw, Download, Calendar, Users } from "lucide-react";
import type { Section } from "../App";

interface TopbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdate: Date | null;
  section: Section;
  onExportCsv: () => void;
  periodFilter: number;
  onPeriodChange: (days: number) => void;
  onlineCount: number;
}

const SECTION_LABELS: Record<Section, string> = {
  "visao-geral":  "Visão Geral & Gráficos",
  "rastreamento": "Rastreamento do Quiz ao Vivo",
  "pedidos":      "Auditoria & Pedidos do Gateway",
  "relatorios":   "Relatórios de Canais & UTMs",
};

const SECTION_DESCRIPTIONS: Record<Section, string> = {
  "visao-geral":  "Monitoramento de receita, pizza de canais e saúde da conversão",
  "rastreamento": "Etapa exata de cada consulente no funil e pessoas ao vivo",
  "pedidos":      "Extrato de transações PIX geradas, pagas e pendentes",
  "relatorios":   "Desempenho por fonte de tráfego, campanha e exportação",
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
  periodFilter,
  onPeriodChange,
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

      {/* CONTADOR DE PESSOAS AO VIVO NO FUNIL (DESTAQUE) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          borderRadius: "99px",
          padding: "5px 14px",
          boxShadow: "0 0 14px rgba(16, 185, 129, 0.15)",
        }}
      >
        <div className="pulse-emerald" />
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Users style={{ width: "13px", height: "13px", color: "#34d399" }} />
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff" }}>
            {onlineCount}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#34d399" }}>
            {onlineCount === 1 ? "pessoa ao vivo no funil" : "pessoas ao vivo no funil"}
          </span>
        </div>
      </div>

      {/* Filtro Rápido de Período (Visão Geral) */}
      {section === "visao-geral" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-surface-alt)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "2px",
            gap: "2px",
          }}
        >
          <div style={{ padding: "0 6px", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <Calendar style={{ width: "12px", height: "12px" }} />
          </div>
          {[
            { label: "7D", days: 7 },
            { label: "14D", days: 14 },
            { label: "30D", days: 30 },
          ].map((item) => {
            const active = periodFilter === item.days;
            return (
              <button
                key={item.days}
                onClick={() => onPeriodChange(item.days)}
                style={{
                  fontSize: "11px",
                  fontWeight: active ? 800 : 600,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: active ? "#10b981" : "transparent",
                  color: active ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.15s ease",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Indicador de Atualização */}
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
        <span style={{ fontWeight: 600 }}>
          {loading
            ? "Sincronizando..."
            : lastUpdate
            ? `Sync ${formatTime(lastUpdate)}`
            : "Supabase Conectado"}
        </span>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={onExportCsv} className="btn btn-emerald">
          <Download style={{ width: "13px", height: "13px" }} />
          Exportar CSV
        </button>

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

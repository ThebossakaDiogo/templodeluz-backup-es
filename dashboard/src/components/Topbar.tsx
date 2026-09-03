import { Sun, Moon, RefreshCw, Download, Users, Menu } from "lucide-react";
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
  onOpenMenu?: () => void;
}

const SECTION_LABELS: Record<Section, string> = {
  "visao-geral":  "Visão Geral & Gráficos",
  "rastreamento": "Rastreamento do Quiz ao Vivo",
  "pedidos":      "Auditoria de Pedidos (PIX & Cartão)",
  "relatorios":   "Relatórios de Canais & UTMs",
  "whatsapp":     "WhatsApp Tracker & Conversas",
  "perfil":       "Meu Perfil & Segurança",
  "login":        "Acesso Administrativo",
};

const SECTION_DESCRIPTIONS: Record<Section, string> = {
  "visao-geral":  "PIX vs Cartão · Funil de Conversão · Telemetria",
  "rastreamento": "Funil de consulentes ao vivo · Etapas em tempo real",
  "pedidos":      "Doações PIX & Cartão · Auditoria de gateways",
  "relatorios":   "Tráfego · Campanhas · Exportação consolidada",
  "whatsapp":     "Conversas · Formas de pagamento · Metrificação",
  "perfil":       "Conta · Credenciais · Segurança",
  "login":        "Autenticação segura",
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
  onOpenMenu,
}: TopbarProps) {
  return (
    <header className="dashboard-topbar">
      {/* ─── Linha 1: Cabeçalho Superior Universal ─── */}
      <div className="topbar-main-row">
        {/* Lado Esquerdo: Hambúrguer Mobile + Logo OD METRICS / Título */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="mobile-menu-trigger btn"
              style={{ padding: "6px 8px", borderRadius: "8px", flexShrink: 0 }}
              title="Abrir Menu"
            >
              <Menu style={{ width: "18px", height: "18px" }} />
            </button>
          )}

          {/* Logo compacto no mobile */}
          <div className="mobile-logo-badge" style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1c1917",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: "11px",
                boxShadow: "0 0 14px rgba(245, 158, 11, 0.35)",
              }}
            >
              OD
            </div>
          </div>

          <div style={{ minWidth: 0, flex: "0 1 auto", maxWidth: "260px" }}>
            <h1
              style={{
                fontSize: "13.5px",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {SECTION_LABELS[section]}
            </h1>
            <p
              className="desktop-only-control"
              style={{
                fontSize: "10.5px",
                color: "var(--text-muted)",
                margin: "1px 0 0",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {SECTION_DESCRIPTIONS[section]}
            </p>
          </div>
        </div>

        {/* Lado Direito: Controles Rápidos */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {/* Contador de Pessoas Ao Vivo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "99px",
              padding: "4px 8px",
              boxShadow: "0 0 10px rgba(245, 158, 11, 0.15)",
            }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }} />
            <Users style={{ width: "11px", height: "11px", color: "#f59e0b" }} />
            <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--text-primary)" }}>
              {onlineCount}
            </span>
            <span className="desktop-only-control" style={{ fontSize: "10px", fontWeight: 800, color: "#f59e0b" }}>
              ao vivo
            </span>
          </div>

          {/* Seletor de Datas no Desktop */}
          {section === "visao-geral" && (
            <div className="desktop-date-selector">
              <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
            </div>
          )}

          {/* Indicador de Atualização no Desktop */}
          <div
            className="desktop-only-control"
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

          {/* Botão Exportar no Desktop */}
          <button
            onClick={onExportCsv}
            className="btn btn-emerald desktop-only-control"
            style={{ padding: "6px 12px", fontSize: "11.5px" }}
          >
            <Download style={{ width: "12px", height: "12px" }} />
            Exportar
          </button>

          {/* Botão Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn"
            title="Atualizar dados agora"
            style={{ padding: "6px 8px", borderRadius: "8px" }}
          >
            <RefreshCw
              style={{
                width: "13px",
                height: "13px",
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>

          {/* Botão Tema */}
          <button
            onClick={onToggleTheme}
            className="btn"
            title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
            style={{ padding: "6px 8px", borderRadius: "8px" }}
          >
            {theme === "light" ? (
              <Moon style={{ width: "13px", height: "13px" }} />
            ) : (
              <Sun style={{ width: "13px", height: "13px" }} />
            )}
          </button>
        </div>
      </div>

      {/* ─── Linha 2: Barra de Datas Deslizante no Mobile ─── */}
      {section === "visao-geral" && (
        <div className="mobile-date-subbar">
          <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
        </div>
      )}
    </header>
  );
}

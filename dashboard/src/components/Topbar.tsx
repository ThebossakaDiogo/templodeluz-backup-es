import { useState } from "react";
import { Sun, Moon, RefreshCw, Download, Users, Menu, Bell, Search, ShieldCheck, ChevronDown } from "lucide-react";
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
  "visao-geral":  "Visão Geral",
  "rastreamento": "Rastreamento",
  "pedidos":      "Auditoria de Pedidos",
  "relatorios":   "Relatórios & UTMs",
  "whatsapp":     "WhatsApp Tracker",
  "perfil":       "Meu Perfil",
  "login":        "Acesso",
};

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
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <header
      className="dashboard-topbar"
      style={{
        height: "64px",
        background: "#0D0F15",
        borderBottom: "1px solid #1E202B",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        zIndex: 100,
      }}
    >
      {/* ─── LADO ESQUERDO: Perfil do Administrador + Status Ao Vivo ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
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

        {/* Pill de Usuário Administrador (Inspirado no perfil @ryan997 da referência) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#12131D",
            border: "1px solid #232534",
            borderRadius: "999px",
            padding: "4px 10px 4px 5px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1F2133, #323550)",
              border: "1px solid #3E4260",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 600,
              color: "#BDB4EF",
            }}
          >
            D
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "#8A8D9F", fontWeight: 400 }}>
              @theboss
            </span>
            <span
              style={{
                fontSize: "8.5px",
                fontWeight: 700,
                color: "#2EDB6F",
                background: "rgba(46, 219, 111, 0.12)",
                padding: "1px 4px",
                borderRadius: "3px",
              }}
            >
              PRO
            </span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#F5F4FA" }}>
              Diogo
            </span>
          </div>
          <ChevronDown style={{ width: "11px", height: "11px", color: "#707281" }} />
        </div>

        {/* Botão de Status Operacional (Inspirado no botão 'Deposit' com cadeado da referência) */}
        <div
          className="desktop-only-control"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#161722",
            border: "1px solid #282A38",
            borderRadius: "999px",
            padding: "5px 12px",
            fontSize: "11.5px",
            fontWeight: 500,
            color: "#F5F4FA",
          }}
        >
          <div className="pulse-emerald" />
          <ShieldCheck style={{ width: "13px", height: "13px", color: "#2EDB6F" }} />
          <span>Telemetria Ao Vivo</span>
          <span style={{ fontSize: "10px", color: "#BDB4EF", background: "rgba(189, 180, 239, 0.12)", padding: "1px 6px", borderRadius: "99px", marginLeft: "2px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
            <Users style={{ width: "10px", height: "10px" }} />
            {onlineCount} ativos
          </span>
        </div>

        {/* Badge da Seção Atual */}
        <span
          className="desktop-only-control"
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "#A7A9B5",
            background: "#12131D",
            border: "1px solid #232534",
            padding: "3px 9px",
            borderRadius: "999px",
          }}
        >
          {SECTION_LABELS[section]}
        </span>
      </div>

      {/* ─── LADO DIREITO: Notificações, Busca, Filtro de Data e Ações ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {/* Notificações com Badge (Inspirado no sininho com '2' da referência) */}
        <div
          style={{
            position: "relative",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#12131D",
            border: "1px solid #232534",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#A2A3AE",
            cursor: "pointer",
          }}
          title="Notificações do Sistema"
        >
          <Bell style={{ width: "14px", height: "14px" }} />
          <span
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              background: "#7C5CFF",
              color: "#ffffff",
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #0D0F15",
            }}
          >
            2
          </span>
        </div>

        {/* Input de Busca Compacto (Inspirado no 'Search...' da referência) */}
        <div className="desktop-only-control" style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: "9px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "12px",
              height: "12px",
              color: "#707281",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              fontSize: "11.5px",
              padding: "5px 10px 5px 27px",
              borderRadius: "8px",
              border: "1px solid #232534",
              background: "#12131D",
              color: "#F5F4FA",
              width: "140px",
              outline: "none",
              fontFamily: "inherit",
              transition: "width 0.2s ease, border-color 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.width = "180px";
              e.currentTarget.style.borderColor = "rgba(189, 180, 239, 0.4)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.width = "140px";
              e.currentTarget.style.borderColor = "#232534";
            }}
          />
        </div>

        {/* Seletor de Período / Datas no Desktop */}
        {section === "visao-geral" && (
          <div className="desktop-date-selector">
            <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
          </div>
        )}

        {/* Botão Exportar CSV */}
        <button
          onClick={onExportCsv}
          className="btn desktop-only-control"
          style={{ height: "32px", padding: "0 10px", fontSize: "11.5px", gap: "5px" }}
          title="Exportar dados do período em CSV"
        >
          <Download style={{ width: "12px", height: "12px", color: "#A2A3AE" }} />
          Exportar
        </button>

        {/* Botão Refresh / Sync */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn"
          title={lastUpdate ? `Última sincronização: ${lastUpdate.toLocaleTimeString("pt-BR")}. Clique para atualizar.` : "Atualizar dados agora"}
          style={{ width: "32px", height: "32px", padding: 0, borderRadius: "8px" }}
        >
          <RefreshCw
            style={{
              width: "12px",
              height: "12px",
              color: "#A2A3AE",
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>

        {/* Alternador de Tema Discreto */}
        <button
          onClick={onToggleTheme}
          className="btn"
          title={`Alternar para modo ${theme === "light" ? "escuro" : "claro"}`}
          style={{ width: "32px", height: "32px", padding: 0, borderRadius: "8px" }}
        >
          {theme === "light" ? (
            <Moon style={{ width: "12px", height: "12px" }} />
          ) : (
            <Sun style={{ width: "12px", height: "12px" }} />
          )}
        </button>
      </div>

      {/* ─── Linha 2: Barra de Datas no Mobile ─── */}
      {section === "visao-geral" && (
        <div className="mobile-date-subbar">
          <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
        </div>
      )}
    </header>
  );
}

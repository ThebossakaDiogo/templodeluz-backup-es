import { useState } from "react";
import {
  Sun,
  Moon,
  RefreshCw,
  Download,
  Users,
  Search,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { DateRangeSelector, type DateRangeValue } from "./DateRangeSelector";
import { NotificationCenter } from "./NotificationCenter";
import type { Section } from "../App";

import type { PaymentOrder, Lead } from "@/types";

interface TopbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdate: Date | null;
  section: Section;
  onNavigate?: (section: Section) => void;
  onExportCsv: () => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (val: DateRangeValue) => void;
  onlineCount: number;
  orders?: PaymentOrder[];
  leads?: Lead[];
}

const SECTION_LABELS: Record<Section, string> = {
  "visao-geral":  "Visão Geral",
  "rastreamento": "Funil & Telemetria",
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
  onNavigate,
  onExportCsv,
  dateRange,
  onDateRangeChange,
  onlineCount,
  orders = [],
  leads = [],
}: TopbarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <header
      className="dashboard-topbar"
      style={{
        height: "68px",
        minHeight: "68px",
        background: "var(--topbar-bg, rgba(13, 15, 21, 0.88))",
        backdropFilter: "blur(24px) saturate(190%)",
        WebkitBackdropFilter: "blur(24px) saturate(190%)",
        borderBottom: "1px solid var(--border-subtle, #1E202B)",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "18px",
        zIndex: 100,
        position: "sticky",
        top: 0,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ─── LADO ESQUERDO: Marca OD METRICS + Seletor de Modo + Status Ao Vivo ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
        {/* Logo OD METRICS Minimalista */}
        <div
          onClick={() => onNavigate && onNavigate("visao-geral")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "var(--surface-3, #161722)",
              border: "1px solid var(--accent-border, rgba(189, 180, 239, 0.35))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary, #BDB4EF)",
              fontWeight: 700,
              fontSize: "12px",
              boxShadow: "0 2px 8px rgba(124, 92, 255, 0.18)",
            }}
          >
            OD
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                OD Metrics
              </span>
              <span style={{ fontSize: "9px", color: "var(--accent-strong)", fontWeight: 600 }}>PRO</span>
            </div>
          </div>
        </div>

        <div style={{ width: "1px", height: "18px", background: "var(--border-subtle)" }} className="desktop-only-control" />

        {/* Pílula de Status Operacional Ao Vivo */}
        <div
          className="desktop-only-control"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "999px",
            padding: "4px 11px",
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          <div className="pulse-emerald" />
          <ShieldCheck style={{ width: "12px", height: "12px", color: "#2EDB6F" }} />
          <span>Telemetria Ao Vivo</span>
          <span
            style={{
              fontSize: "10px",
              color: "var(--accent-primary)",
              background: "var(--accent-soft-bg)",
              padding: "1px 6px",
              borderRadius: "99px",
              marginLeft: "2px",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <Users style={{ width: "9px", height: "9px" }} />
            {onlineCount}
          </span>
        </div>

        {/* Badge da Seção Atual */}
        <span
          className="desktop-only-control"
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            padding: "3px 9px",
            borderRadius: "999px",
          }}
        >
          {SECTION_LABELS[section]}
        </span>
      </div>

      {/* ─── LADO DIREITO: Busca, Notificações Funcionais, Filtro de Data e Ações ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {/* Input de Busca Compacto */}
        <div className="desktop-only-control" style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: "9px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "12px",
              height: "12px",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Buscar consulente, UTM, pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              fontSize: "11.5px",
              padding: "5px 10px 5px 27px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              width: "150px",
              outline: "none",
              transition: "width 0.2s ease, border-color 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.width = "210px";
              e.currentTarget.style.borderColor = "var(--accent-strong)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.width = "150px";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          />
        </div>

        {/* Central de Notificações com Dropdown Popover (Dados Reais) */}
        <NotificationCenter
          onNavigate={onNavigate}
          onlineCount={onlineCount}
          orders={orders}
          leads={leads}
        />

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
          style={{ height: "34px", padding: "0 11px", fontSize: "11.5px", gap: "5px" }}
          title="Exportar dados do período em CSV"
        >
          <Download style={{ width: "12px", height: "12px", color: "var(--text-secondary)" }} />
          Exportar
        </button>

        {/* Botão Refresh / Sync com Tooltip Informativo */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn"
          title={lastUpdate ? `Última sincronização: ${lastUpdate.toLocaleTimeString("pt-BR")}. Clique para atualizar.` : "Atualizar dados agora"}
          style={{ width: "34px", height: "34px", padding: 0, borderRadius: "9px" }}
        >
          <RefreshCw
            style={{
              width: "12px",
              height: "12px",
              color: "var(--text-secondary)",
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>

        {/* Alternador de Tema Claro / Escuro */}
        <button
          onClick={onToggleTheme}
          className="btn"
          title={`Alternar para modo ${theme === "light" ? "escuro" : "claro"}`}
          style={{ width: "34px", height: "34px", padding: 0, borderRadius: "9px" }}
        >
          {theme === "light" ? (
            <Moon style={{ width: "13px", height: "13px", color: "var(--text-secondary)" }} />
          ) : (
            <Sun style={{ width: "13px", height: "13px", color: "var(--text-secondary)" }} />
          )}
        </button>

        {/* Pill de Usuário Administrador */}
        <div
          onClick={() => onNavigate && onNavigate("perfil")}
          className="desktop-only-control"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "999px",
            padding: "4px 10px 4px 4px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "var(--accent-strong)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            D
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-primary)" }}>
            Diogo
          </span>
          <ChevronDown style={{ width: "11px", height: "11px", color: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Barra de Datas no Mobile */}
      {section === "visao-geral" && (
        <div className="mobile-date-subbar">
          <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
        </div>
      )}
    </header>
  );
}

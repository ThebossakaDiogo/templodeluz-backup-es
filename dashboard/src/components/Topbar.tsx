import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  RefreshCw,
  Download,
  Users,
  Search,
  ShieldCheck,
  ChevronDown,
  Smartphone,
} from "lucide-react";
import { DateRangeSelector, type DateRangeValue } from "./DateRangeSelector";
import { NotificationCenter } from "./NotificationCenter";
import { EvolutionQRModal } from "./EvolutionQRModal";
import { testEvolutionConnection } from "@/services/evolution";
import type { Section } from "../App";
import type { PaymentOrder, Lead } from "@/types";

interface TopbarProps {
  readonly theme: "light" | "dark";
  readonly onToggleTheme: () => void;
  readonly onRefresh: () => void;
  readonly loading: boolean;
  readonly lastUpdate: Date | null;
  readonly section: Section;
  readonly onNavigate?: (section: Section) => void;
  readonly onExportCsv: () => void;
  readonly dateRange: DateRangeValue;
  readonly onDateRangeChange: (val: DateRangeValue) => void;
  readonly onlineCount: number;
  readonly orders?: readonly PaymentOrder[];
  readonly leads?: readonly Lead[];
}

const SECTION_LABELS: Record<Section, string> = {
  "visao-geral":  "Visão Geral",
  "rastreamento": "Funil & Telemetria",
  "abandonos":    "Métricas de Abandono",
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
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean | null>(null);

  useEffect(() => {
    testEvolutionConnection().then((res) => {
      setIsWhatsAppConnected(res.success && res.state === "open");
    });
  }, []);

  return (
    <>
      <header
        className="dashboard-topbar"
      style={{
        height: "60px",
        minHeight: "60px",
        background: "var(--topbar-bg)",
        backdropFilter: "blur(24px) saturate(190%)",
        WebkitBackdropFilter: "blur(24px) saturate(190%)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        zIndex: 100,
        position: "sticky",
        top: 0,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ─── LADO ESQUERDO: Marca OD METRICS + Status Ao Vivo ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {/* Logo OD METRICS Acessível */}
        <button
          type="button"
          onClick={() => onNavigate?.("visao-geral")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
          aria-label="Ir para a Visão Geral"
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--surface-2)",
              border: "1px solid var(--border-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            OD
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                OD Metrics
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: "#10B981",
                  fontWeight: 700,
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "1px 5px",
                  borderRadius: "4px",
                }}
              >
                PRO
              </span>
            </div>
          </div>
        </button>

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
          <ShieldCheck style={{ width: "12px", height: "12px", color: "#10B981" }} />
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

        {/* Pílula de Status WhatsApp Evolution API */}
        <button
          type="button"
          onClick={() => setIsQRModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: isWhatsAppConnected ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
            border: isWhatsAppConnected ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "999px",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: 600,
            color: isWhatsAppConnected ? "#10B981" : "#F59E0B",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          title={isWhatsAppConnected ? "WhatsApp Conectado na Evolution API. Clique para gerenciar ou testar." : "WhatsApp Não Conectado. Clique para escanear QR Code."}
        >
          <Smartphone style={{ width: "12px", height: "12px" }} />
          <span>{isWhatsAppConnected ? "WhatsApp Ativo" : "Conectar WhatsApp"}</span>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isWhatsAppConnected ? "#10B981" : "#F59E0B",
              boxShadow: isWhatsAppConnected ? "0 0 6px rgba(16, 185, 129, 0.7)" : "none",
              display: "inline-block",
            }}
          />
        </button>

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

      {/* ─── LADO DIREITO: Busca, Datas, Notificações e Ações (Linha única no mobile e desktop) ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {/* Input de Busca Compacto (Desktop) */}
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

        {/* Seletor de Período / Datas (Desktop e Mobile integrados) */}
        {section === "visao-geral" && (
          <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
        )}

        {/* Central de Notificações com Dropdown Popover */}
        <NotificationCenter
          onNavigate={onNavigate}
          onlineCount={onlineCount}
          orders={orders as PaymentOrder[]}
          leads={leads as Lead[]}
        />

        {/* Botão Exportar CSV (Desktop) */}
        <button
          type="button"
          onClick={onExportCsv}
          className="btn desktop-only-control"
          style={{ height: "32px", padding: "0 10px", fontSize: "11.5px", gap: "5px" }}
          title="Exportar dados do período em CSV"
        >
          <Download style={{ width: "12px", height: "12px", color: "var(--text-secondary)" }} />
          Exportar
        </button>

        {/* Botão Refresh / Sync */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="btn"
          title={lastUpdate ? `Última sincronização: ${lastUpdate.toLocaleTimeString("pt-BR")}. Clique para atualizar.` : "Atualizar dados agora"}
          style={{ width: "32px", height: "32px", padding: 0, borderRadius: "8px" }}
          aria-label="Atualizar dados"
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
          type="button"
          onClick={onToggleTheme}
          className="btn"
          title={`Alternar para modo ${theme === "light" ? "escuro" : "claro"}`}
          style={{ width: "32px", height: "32px", padding: 0, borderRadius: "8px" }}
          aria-label="Alternar tema"
        >
          {theme === "light" ? (
            <Moon style={{ width: "13px", height: "13px", color: "var(--text-secondary)" }} />
          ) : (
            <Sun style={{ width: "13px", height: "13px", color: "var(--text-secondary)" }} />
          )}
        </button>

        {/* Pílula de Usuário Administrador (Desktop) */}
        <button
          type="button"
          onClick={() => onNavigate?.("perfil")}
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
            fontFamily: "inherit",
          }}
          aria-label="Abrir Meu Perfil"
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "var(--surface-3)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
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
        </button>
      </div>
    </header>

    {/* Modal Interativo de Conexão WhatsApp / QR Code */}
    <EvolutionQRModal
      isOpen={isQRModalOpen}
      onClose={() => setIsQRModalOpen(false)}
      onConnectionChange={(connected) => setIsWhatsAppConnected(connected)}
    />
  </>
  );
}

import { useState, useEffect, type MouseEvent as ReactMouseEvent } from "react";
import {
  Sun,
  Moon,
  RefreshCw,
  Download,
  Users,
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
  readonly onToggleTheme: (event: ReactMouseEvent<HTMLButtonElement>) => void;
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
  readonly realtimeEnabled?: boolean;
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
  realtimeEnabled = true,
}: TopbarProps) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean | null>(null);

  useEffect(() => {
    testEvolutionConnection().then((res) => {
      setIsWhatsAppConnected(res.success && res.state === "open");
    });
  }, []);

  const showDateRange = section === "visao-geral" || section === "pedidos" || section === "relatorios";

  return (
    <>
      <header className="dashboard-topbar">
      {/* ─── LADO ESQUERDO: Marca OD METRICS + Status Ao Vivo ─── */}
      <div className="topbar-main-row">
        {/* Logo OD METRICS Acessível */}
        <button
          type="button"
          onClick={() => onNavigate?.("visao-geral")}
          className="topbar-brand-button"
          aria-label="Ir para a Visão Geral"
        >
          <img
            src="/icons/icon-192.png"
            alt=""
            className="topbar-brand-logo"
            width={34}
            height={34}
          />
          <div className="topbar-brand-text">OD Metrics</div>
          <span className="topbar-pro-badge">
            PRO
          </span>
        </button>

        <div className="topbar-divider desktop-only-control" />

        {/* Pílula de Status Operacional Ao Vivo */}
        <div className="topbar-live-pill desktop-only-control">
          <div className="pulse-emerald" />
          <ShieldCheck className="topbar-icon" />
          <span>Telemetria Ao Vivo</span>
          <span className="topbar-online-count">
            <Users className="topbar-icon icon-xs" />
            {onlineCount}
          </span>
        </div>

        {/* Pílula de Status WhatsApp Evolution API */}
        <button
          type="button"
          onClick={() => setIsQRModalOpen(true)}
          className="topbar-whatsapp-control"
          title={isWhatsAppConnected ? "WhatsApp Conectado na Evolution API. Clique para gerenciar ou testar." : "WhatsApp Não Conectado. Clique para escanear QR Code."}
        >
          <Smartphone className="topbar-icon" />
          <span>{isWhatsAppConnected ? "WhatsApp Ativo" : "Conectar WhatsApp"}</span>
          <span className={`topbar-whatsapp-dot ${isWhatsAppConnected ? "online" : "offline"}`} />
        </button>

        {/* Badge da Seção Atual */}
        <span className="topbar-section-badge desktop-only-control">
          {SECTION_LABELS[section]}
        </span>
      </div>

      {/* ─── LADO DIREITO: Busca, Datas, Notificações e Ações (Linha única no mobile e desktop) ─── */}
      <div className="topbar-action-group">

        {/* Seletor de Período / Datas (Desktop e Mobile integrados) */}
        {showDateRange && (
          <div className="desktop-date-selector">
            <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
          </div>
        )}

        {/* Central de Notificações com Dropdown Popover */}
        <NotificationCenter
          onNavigate={onNavigate}
          onlineCount={onlineCount}
          orders={orders as PaymentOrder[]}
          leads={leads as Lead[]}
          realtimeEnabled={realtimeEnabled}
        />

        {/* Botão Exportar CSV (Desktop) */}
        <button
          type="button"
          onClick={onExportCsv}
          className="btn desktop-only-control topbar-export"
          title="Exportar dados do período em CSV"
        >
          <Download className="topbar-icon" />
          Exportar
        </button>

        {/* Botão Refresh / Sync */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="btn topbar-icon-btn"
          title={lastUpdate ? `Última sincronização: ${lastUpdate.toLocaleTimeString("pt-BR")}. Clique para atualizar.` : "Atualizar dados agora"}
          aria-label="Atualizar dados"
        >
          <RefreshCw
            className={`topbar-icon ${loading ? "spinning" : ""}`}
          />
        </button>

        {/* Alternador de Tema Claro / Escuro */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="btn topbar-icon-btn"
          title={`Alternar para modo ${theme === "light" ? "escuro" : "claro"}`}
          aria-label="Alternar tema"
        >
          {theme === "light" ? (
            <Moon className="topbar-icon" />
          ) : (
            <Sun className="topbar-icon" />
          )}
        </button>

        {/* Pílula de Usuário Administrador (Desktop) */}
        <button
          type="button"
          onClick={() => onNavigate?.("perfil")}
          className="topbar-user-pill desktop-only-control"
          aria-label="Abrir Meu Perfil"
        >
          <div className="topbar-user-avatar">
            D
          </div>
          <span className="topbar-user-name">Diogo</span>
          <ChevronDown className="topbar-icon" />
        </button>
      </div>
        {showDateRange && (
          <div className="mobile-date-subbar">
            <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />
          </div>
        )}
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

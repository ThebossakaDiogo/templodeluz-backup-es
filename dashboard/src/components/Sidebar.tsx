import type { Section } from "../App";
import {
  LayoutGrid,
  TrendingUp,
  Activity,
  CreditCard,
  FileBarChart2,
  LogOut,
  MessageCircle,
  X,
  User,
  Shield,
} from "lucide-react";
import { PwaInstallPrompt } from "./PwaInstallPrompt";

interface SidebarProps {
  readonly section: Section;
  readonly onSelect: (section: Section) => void;
  readonly onlineCount: number;
  readonly currentUserEmail?: string;
  readonly onSignOut?: () => void;
  readonly isOpenMobile?: boolean;
  readonly onCloseMobile?: () => void;
}

const ITEMS: {
  id: Section;
  slug: string;
  label: string;
  sub: string;
  Icon: typeof LayoutGrid;
  accent: string;
}[] = [
  {
    id: "visao-geral",
    slug: "/visao-geral",
    label: "Visão Geral",
    sub: "Métricas & Pizza Charts",
    Icon: LayoutGrid,
    accent: "#f59e0b", // Gold Imperial
  },
  {
    id: "anuncios",
    slug: "/anuncios",
    label: "Gastos & Lucro",
    sub: "Ad Spend, Receita & ROI",
    Icon: TrendingUp,
    accent: "#10b981", // Emerald Verde
  },
  {
    id: "rastreamento",
    slug: "/rastreamento",
    label: "Rascunhos ao vivo",
    sub: "Campos salvos em tempo real",
    Icon: Activity,
    accent: "#fbbf24", // Amber Solar
  },
  {
    id: "pedidos",
    slug: "/pedidos",
    label: "Pedidos",
    sub: "Histórico & Gateway",
    Icon: CreditCard,
    accent: "#eab308", // Pure Gold
  },
  {
    id: "relatorios",
    slug: "/relatorios",
    label: "Relatórios",
    sub: "Canais & Exportação",
    Icon: FileBarChart2,
    accent: "#d97706", // Deep Amber
  },
  {
    id: "whatsapp",
    slug: "/whatsapp",
    label: "WhatsApp Tracker",
    sub: "Mensagens & Métodos",
    Icon: MessageCircle,
    accent: "#22c55e", // WhatsApp Green
  },
  {
    id: "perfil",
    slug: "/perfil",
    label: "Meu Perfil",
    sub: "Alterar Senha & Acesso",
    Icon: User,
    accent: "#a855f7", // Purple Neon
  },
];

export function Sidebar({
  section,
  onSelect,
  onlineCount,
  currentUserEmail,
  onSignOut,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop para mobile */}
      {isOpenMobile && (
        <button
          type="button"
          onClick={onCloseMobile}
          className="mobile-sidebar-backdrop"
          aria-label="Fechar menu lateral"
        />
      )}
      <aside
        className={`dashboard-sidebar ${isOpenMobile ? "mobile-open" : ""}`}
      >
        {/* Cabeçalho do App: Logo OD & Marca */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img
              src="/icons/icon-192.png"
              alt=""
              width={36}
              height={36}
              className="sidebar-brand-logo"
            />
            <div>
              <div className="sidebar-brand-text">
                {"OD Metrics "}
                <span className="sidebar-brand-reg">®</span>
              </div>
              <span className="sidebar-brand-sub">
                Inteligência & Tracking
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="mobile-close-btn"
              aria-label="Fechar menu"
            >
              <X />
            </button>
          )}
        </div>

        {/* Dual Pill Switcher (Inspirado no Staking / Stablecoin da referência) */}
        <div className="sidebar-switcher-wrap">
          <div className="sidebar-switcher">
            <button
              className="sidebar-switcher-btn active"
            >
              Produção
            </button>
            <button
              className="sidebar-switcher-btn"
            >
              Sandbox
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {ITEMS.map(({ id, slug, label, Icon }) => {
            const active = section === id;
            return (
              <button
                type="button"
                key={id}
                className={`sidebar-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  onSelect(id);
                  onCloseMobile?.();
                }}
              >
                {/* Ícone */}
                <Icon
                  className="sidebar-nav-item-icon"
                  strokeWidth={active ? 2.0 : 1.7}
                />

                <span className="sidebar-nav-item-title">
                  {label}
                </span>

                {/* Slug ou Badge da rota */}
                <span className="sidebar-nav-item-badge">
                  {slug}
                </span>
              </button>
            );
          })}

          {/* Divisor */}
          <div className="sidebar-divider" />

          {/* Bloco "Telemetria Ativa" (Inspirado no Active Staking 6 da referência) */}
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Telemetria Ativa</span>
            <span className="sidebar-status-badge">
              {onlineCount}
            </span>
          </div>

          {/* Mini ativos em monitoramento */}
          <div className="sidebar-mini-list">
            <div className="sidebar-mini-item">
              <span className="sidebar-mini-dot green" />
              <div className="sidebar-mini-info">
                <span className="sidebar-mini-title">Quiz Templo de Luz</span>
                <span className="sidebar-mini-sub">Funil 8 Etapas</span>
              </div>
            </div>

            <div className="sidebar-mini-item">
              <span className="sidebar-mini-dot purple" />
              <div className="sidebar-mini-info">
                <span className="sidebar-mini-title">Gateways de Pagamento</span>
                <span className="sidebar-mini-sub">PIX Oficial & Stripe</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Card de Rodapé da Sidebar (Inspirado no "Activate Super" da referência) */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">
            <Shield strokeWidth={1.8} />
          </div>
          <div className="sidebar-footer-text">
            <span className="sidebar-footer-title">OD Shield Ativo</span>
            <span className="sidebar-footer-sub">Telemetria Segura</span>
          </div>
        </div>

        {/* Botão de Instalação PWA */}
        <div className="sidebar-pwa-wrap">
          <PwaInstallPrompt />
        </div>

        {/* Perfil do Administrador Logado & Sair */}
        {currentUserEmail && (
          <div className="sidebar-user-card">
            <button
              type="button"
              className="sidebar-user-click"
              onClick={() => {
                onSelect("perfil");
                onCloseMobile?.();
              }}
            >
              <div className="sidebar-user-avatar">
                {currentUserEmail[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">
                  {currentUserEmail.split("@")[0]}
                </span>
              </div>
            </button>

            <button
              onClick={onSignOut}
              title="Encerrar Sessão"
              className="sidebar-sign-out"
            >
              <LogOut />
            </button>
          </div>
        )}

        {/* Rodapé Version */}
        <div className="sidebar-version">
          <span className="sidebar-version-text">OD METRICS · v2.0</span>
        </div>
      </aside>
    </>
  );
}

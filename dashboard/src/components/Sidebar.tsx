import type { Section } from "../App";
import {
  LayoutGrid,
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
  section: Section;
  onSelect: (section: Section) => void;
  onlineCount: number;
  currentUserEmail?: string;
  onSignOut?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
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
    id: "rastreamento",
    slug: "/rastreamento",
    label: "Rastreamento",
    sub: "Funil & Pessoas Ao Vivo",
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
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 1000,
          }}
          className="mobile-sidebar-backdrop"
        />
      )}
      <aside
        className={`dashboard-sidebar ${isOpenMobile ? "mobile-open" : ""}`}
        style={{
          width: "224px",
          minWidth: "224px",
          height: "100vh",
          maxHeight: "100vh",
          background: "#060710",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #1E202B",
          position: "sticky",
          top: 0,
          left: 0,
          overflowY: "auto",
          overflowX: "hidden",
          flexShrink: 0,
          zIndex: 1001,
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Cabeçalho do App: Logo OD & Marca */}
        <div
          style={{
            padding: "18px 16px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "linear-gradient(180deg, #1D1E2C 0%, #12131F 100%)",
                border: "1px solid rgba(189, 180, 239, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "12.5px",
                color: "#BDB4EF",
                boxShadow: "0 2px 8px rgba(124, 92, 255, 0.2)",
              }}
            >
              OD
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span
                  style={{
                    fontFamily: "inherit",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#F5F4FA",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.1,
                  }}
                >
                  OD Metrics
                </span>
                <span style={{ fontSize: "9px", color: "#707281" }}>®</span>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  color: "#707281",
                  fontWeight: 400,
                  display: "block",
                  marginTop: "2px",
                }}
              >
                Inteligência & Tracking
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="mobile-close-btn"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "7px",
                width: "26px",
                height: "26px",
                color: "#A2A3AE",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X style={{ width: "13px", height: "13px" }} />
            </button>
          )}
        </div>

        {/* Dual Pill Switcher (Inspirado no Staking / Stablecoin da referência) */}
        <div style={{ padding: "0 12px 14px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2px",
              background: "#0D0E16",
              border: "1px solid #232532",
              borderRadius: "9px",
              padding: "2px",
            }}
          >
            <button
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#F5F4FA",
                background: "#232534",
                border: "none",
                borderRadius: "7px",
                padding: "4px 0",
                cursor: "pointer",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              Produção
            </button>
            <button
              style={{
                fontSize: "11px",
                fontWeight: 400,
                color: "#707281",
                background: "transparent",
                border: "none",
                borderRadius: "7px",
                padding: "4px 0",
                cursor: "pointer",
              }}
            >
              Sandbox
            </button>
          </div>
        </div>

        {/* Navegação por Slugs */}
        <nav style={{ flex: 1, padding: "0 10px" }}>
          {ITEMS.map(({ id, slug, label, Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                onClick={() => {
                  onSelect(id);
                  onCloseMobile?.();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: active ? "1px solid #282A38" : "1px solid transparent",
                  cursor: "pointer",
                  background: active ? "#171925" : "transparent",
                  textAlign: "left",
                  transition: "all 0.12s ease",
                  marginBottom: "2px",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#11121C";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }
                }}
              >
                {/* Ícone */}
                <Icon
                  style={{
                    width: "14px",
                    height: "14px",
                    color: active ? "#BDB4EF" : "#747786",
                    flexShrink: 0,
                  }}
                  strokeWidth={active ? 2.0 : 1.7}
                />

                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#F5F4FA" : "#8A8D9B",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                  }}
                >
                  {label}
                </span>

                {/* Slug ou Badge da rota */}
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 500,
                    color: active ? "#BDB4EF" : "#4A4C5A",
                    fontFamily: "monospace",
                  }}
                >
                  {slug}
                </span>
              </button>
            );
          })}

          {/* Divisor */}
          <div style={{ height: "1px", background: "#1C1D29", margin: "14px 4px 12px" }} />

          {/* Bloco "Telemetria Ativa" (Inspirado no Active Staking 6 da referência) */}
          <div style={{ padding: "0 4px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#8E909F" }}>
              Telemetria Ativa
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#BDB4EF",
                background: "rgba(189, 180, 239, 0.12)",
                padding: "1px 6px",
                borderRadius: "999px",
              }}
            >
              {onlineCount}
            </span>
          </div>

          {/* Mini ativos em monitoramento */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 8px",
                borderRadius: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2EDB6F" }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "11px", color: "#F5F4FA", display: "block", fontWeight: 500, lineHeight: 1.1 }}>
                  Quiz Templo de Luz
                </span>
                <span style={{ fontSize: "9.5px", color: "#707281" }}>Funil 8 Etapas</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 8px",
                borderRadius: "6px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#8A79FF" }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "11px", color: "#F5F4FA", display: "block", fontWeight: 500, lineHeight: 1.1 }}>
                  Gateways de Pagamento
                </span>
                <span style={{ fontSize: "9.5px", color: "#707281" }}>PIX Oficial & Stripe</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Card de Rodapé da Sidebar (Inspirado no "Activate Super" da referência) */}
        <div
          style={{
            margin: "0 10px 10px",
            padding: "10px 12px",
            background: "linear-gradient(180deg, #11121C 0%, #0C0D15 100%)",
            border: "1px solid #232532",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "9px",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              background: "rgba(189, 180, 239, 0.12)",
              border: "1px solid rgba(189, 180, 239, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#BDB4EF",
              flexShrink: 0,
            }}
          >
            <Shield style={{ width: "13px", height: "13px" }} strokeWidth={1.8} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "#F5F4FA", display: "block", lineHeight: 1.1 }}>
              OD Shield Ativo
            </span>
            <span style={{ fontSize: "10px", color: "#707281", display: "block", marginTop: "1px" }}>
              Telemetria Segura
            </span>
          </div>
        </div>

        {/* Botão de Instalação PWA */}
        <div style={{ margin: "0 10px 10px" }}>
          <PwaInstallPrompt />
        </div>

        {/* Perfil do Administrador Logado & Sair */}
        {currentUserEmail && (
          <div
            style={{
              margin: "0 10px 12px",
              padding: "7px 10px",
              background: "#0D0E17",
              border: "1px solid #232532",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div
              onClick={() => {
                onSelect("perfil");
                onCloseMobile?.();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minWidth: 0,
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1E1F2D, #2B2C3E)",
                  border: "1px solid #383A4E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#BDB4EF",
                  flexShrink: 0,
                }}
              >
                {currentUserEmail[0]?.toUpperCase() ?? "A"}
              </div>
              <div style={{ minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#F5F4FA",
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentUserEmail.split("@")[0]}
                </span>
              </div>
            </div>

            <button
              onClick={onSignOut}
              title="Encerrar Sessão"
              style={{
                background: "transparent",
                border: "none",
                color: "#707281",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                borderRadius: "5px",
              }}
            >
              <LogOut style={{ width: "13px", height: "13px" }} />
            </button>
          </div>
        )}

        {/* Rodapé Version */}
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "transparent",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "9.5px", color: "#4E5060", fontWeight: 400 }}>
            OD METRICS · v2.0
          </span>
        </div>
      </aside>
    </>
  );
}

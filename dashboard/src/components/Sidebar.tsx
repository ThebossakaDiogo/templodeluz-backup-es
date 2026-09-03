import type { Section } from "../App";
import {
  LayoutGrid,
  Activity,
  CreditCard,
  FileBarChart2,
  LogOut,
  MessageCircle,
} from "lucide-react";

interface SidebarProps {
  section: Section;
  onSelect: (section: Section) => void;
  onlineCount: number;
  currentUserEmail?: string;
  onSignOut?: () => void;
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
    accent: "#10b981", // Emerald
  },
  {
    id: "rastreamento",
    slug: "/rastreamento",
    label: "Rastreamento",
    sub: "Funil & Pessoas Ao Vivo",
    Icon: Activity,
    accent: "#06b6d4", // Cyan
  },
  {
    id: "pedidos",
    slug: "/pedidos",
    label: "Pedidos",
    sub: "Histórico & Gateway",
    Icon: CreditCard,
    accent: "#38bdf8", // Sky Blue
  },
  {
    id: "relatorios",
    slug: "/relatorios",
    label: "Relatórios",
    sub: "Canais & Exportação",
    Icon: FileBarChart2,
    accent: "#34d399", // Mint
  },
  {
    id: "whatsapp",
    slug: "/whatsapp",
    label: "WhatsApp Tracker",
    sub: "Mensagens & Métodos",
    Icon: MessageCircle,
    accent: "#22c55e", // WhatsApp Green
  },
];

export function Sidebar({ section, onSelect, onlineCount, currentUserEmail, onSignOut }: SidebarProps) {
  return (
    <aside
      style={{
        width: "245px",
        minWidth: "245px",
        height: "100vh",
        maxHeight: "100vh",
        background: "#050a14",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #16233b",
        position: "sticky",
        top: 0,
        left: 0,
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Glow de fundo */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "-50px",
          width: "180px",
          height: "180px",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo OD METRICS */}
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid #142036",
          display: "flex",
          alignItems: "center",
          gap: "11px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #06b6d4 100%)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(16, 185, 129, 0.4)",
            flexShrink: 0,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 900,
            fontSize: "14px",
            color: "#ffffff",
            letterSpacing: "-0.05em",
          }}
        >
          OD
        </div>
        <div>
          <span
            style={{
              display: "block",
              fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
              fontSize: "15px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            OD <span style={{ color: "#10b981" }}>METRICS</span>
          </span>
          <span
            style={{
              fontSize: "9.5px",
              color: "#94a3b8",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "block",
              marginTop: "2px",
            }}
          >
            Inteligência & Tracking
          </span>
        </div>
      </div>

      {/* Navegação por Slugs */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        <p
          style={{
            fontSize: "9.5px",
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            padding: "0 10px",
            marginBottom: "8px",
          }}
        >
          Páginas (Rotas Únicas)
        </p>

        {ITEMS.map(({ id, slug, label, sub, Icon, accent }) => {
          const active = section === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                width: "100%",
                padding: "10px 10px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: active
                  ? "linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.04) 100%)"
                  : "transparent",
                textAlign: "left",
                transition: "all 0.15s ease",
                marginBottom: "4px",
                position: "relative",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }
              }}
            >
              {/* Barra lateral ativa */}
              {active && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "7px",
                    bottom: "7px",
                    width: "3px",
                    borderRadius: "99px",
                    background: accent,
                    boxShadow: `0 0 10px ${accent}`,
                  }}
                />
              )}

              {/* Ícone */}
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? "rgba(16, 185, 129, 0.18)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "rgba(16, 185, 129, 0.35)" : "#16233b"}`,
                  boxShadow: active ? "0 0 12px rgba(16, 185, 129, 0.25)" : "none",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                <Icon
                  style={{
                    width: "16px",
                    height: "16px",
                    color: active ? accent : "#94a3b8",
                    filter: active ? `drop-shadow(0 0 4px ${accent})` : "none",
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: active ? 800 : 500,
                      color: active ? "#ffffff" : "#cbd5e1",
                    }}
                  >
                    {label}
                  </span>
                  {/* Slug da rota */}
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: active ? accent : "#475569",
                      background: "rgba(255,255,255,0.04)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                    }}
                  >
                    {slug}
                  </span>
                </div>
                <span
                  style={{
                    display: "block",
                    fontSize: "10px",
                    color: active ? "#6ee7b7" : "#64748b",
                    marginTop: "1px",
                  }}
                >
                  {sub}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Card de Pessoas ao Vivo na base da Sidebar */}
      <div
        style={{
          margin: "12px",
          padding: "12px 14px",
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div className="pulse-emerald" />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#34d399" }}>
            Monitoramento Ao Vivo
          </span>
        </div>
        <div style={{ fontSize: "13px", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
          {onlineCount} {onlineCount === 1 ? "usuário ativo" : "usuários ativos"}
        </div>
        <span style={{ fontSize: "10px", color: "#94a3b8" }}>
          Navegando no quiz neste instante
        </span>
      </div>

      {/* Perfil do Administrador Logado & Sair */}
      {currentUserEmail && (
        <div
          style={{
            margin: "0 12px 10px",
            padding: "10px 12px",
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#030712",
                fontWeight: 900,
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              {currentUserEmail.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span
                  style={{
                    fontSize: "8.5px",
                    fontWeight: 800,
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "#34d399",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    borderRadius: "4px",
                    padding: "1px 4px",
                  }}
                >
                  ADMIN
                </span>
              </div>
              <span
                style={{
                  display: "block",
                  fontSize: "10px",
                  color: "#cbd5e1",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "115px",
                }}
                title={currentUserEmail}
              >
                {currentUserEmail}
              </span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            title="Sair / Desconectar"
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239, 68, 68, 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            <LogOut style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      )}

      {/* Rodapé */}
      <div
        style={{
          padding: "12px 18px",
          borderTop: "1px solid #142036",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
          OD METRICS · Sistema Operacional v2.49
        </span>
      </div>
    </aside>
  );
}

import { LayoutGrid, MessageCircle, Activity, CreditCard, Menu } from "lucide-react";
import type { Section } from "@/App";

interface MobileBottomNavProps {
  currentSection: Section;
  onSelect: (section: Section) => void;
  onOpenMenu: () => void;
  unreadWhatsAppCount?: number;
}

export function MobileBottomNav({
  currentSection,
  onSelect,
  onOpenMenu,
  unreadWhatsAppCount = 0,
}: MobileBottomNavProps) {
  const navItems = [
    {
      id: "visao-geral" as Section,
      label: "Visão Geral",
      Icon: LayoutGrid,
    },
    {
      id: "whatsapp" as Section,
      label: "WhatsApp",
      Icon: MessageCircle,
      badge: unreadWhatsAppCount > 0 ? unreadWhatsAppCount : undefined,
    },
    {
      id: "rastreamento" as Section,
      label: "Funil Vivo",
      Icon: Activity,
    },
    {
      id: "pedidos" as Section,
      label: "Pedidos",
      Icon: CreditCard,
    },
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "auto",
        minHeight: "58px",
        paddingTop: "6px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 16px))",
        background: "rgba(5, 10, 20, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 99999,
        paddingLeft: "8px",
        paddingRight: "8px",
      }}
    >
      {navItems.map((item) => {
        const active = currentSection === item.id;
        const Icon = item.Icon;

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 4px",
              minHeight: "48px", // Touch target confortável
              position: "relative",
              color: active ? "#10b981" : "#8292a8",
              transition: "all 0.2s ease",
            }}
          >
            {/* Indicador de Seleção Luminoso no Topo */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  width: "20px",
                  height: "3px",
                  borderRadius: "99px",
                  background: "linear-gradient(90deg, #10b981, #06b6d4)",
                  boxShadow: "0 0 10px #10b981",
                }}
              />
            )}

            <div style={{ position: "relative" }}>
              <Icon style={{ width: "20px", height: "20px" }} />
              {item.badge !== undefined && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-8px",
                    background: "#10b981",
                    color: "#03060d",
                    fontSize: "9px",
                    fontWeight: 900,
                    borderRadius: "99px",
                    padding: "1px 5px",
                    boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: "10.5px",
                fontWeight: active ? 800 : 600,
                letterSpacing: "-0.01em",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Botão Menu Mais (Abre Drawer Lateral) */}
      <button
        onClick={onOpenMenu}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px 4px",
          minHeight: "48px",
          color: "#8292a8",
          transition: "all 0.2s ease",
        }}
      >
        <Menu style={{ width: "20px", height: "20px" }} />
        <span style={{ fontSize: "10.5px", fontWeight: 600, letterSpacing: "-0.01em" }}>
          Mais
        </span>
      </button>
    </nav>
  );
}

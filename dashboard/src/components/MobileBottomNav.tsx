import { LayoutGrid, MessageCircle, Activity, CreditCard, Menu } from "lucide-react";
import type { Section } from "@/App";

interface MobileBottomNavProps {
  readonly currentSection: Section;
  readonly onSelect: (section: Section) => void;
  readonly onOpenMenu: () => void;
  readonly unreadWhatsAppCount?: number;
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
        minHeight: "56px",
        paddingTop: "4px",
        paddingBottom: "max(10px, env(safe-area-inset-bottom, 14px))",
        background: "var(--bg-surface)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.06)",
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
              gap: "2px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 2px",
              minHeight: "48px",
              position: "relative",
              color: active ? "var(--primary-green)" : "var(--text-muted)",
              transition: "all 0.18s ease",
            }}
          >
            {/* Ícone com Pill Suave no Ativo */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3px 12px",
                borderRadius: "10px",
                background: active ? "rgba(245, 158, 11, 0.15)" : "transparent",
                transition: "all 0.18s ease",
              }}
            >
              <Icon style={{ width: "19px", height: "19px" }} strokeWidth={active ? 2.4 : 1.9} />
              {item.badge !== undefined && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "2px",
                    background: "#f59e0b",
                    color: "#1c1917",
                    fontSize: "9px",
                    fontWeight: 900,
                    borderRadius: "99px",
                    padding: "1px 5px",
                    boxShadow: "0 2px 6px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: "10px",
                fontWeight: active ? 800 : 500,
                letterSpacing: "-0.01em",
                marginTop: "1px",
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

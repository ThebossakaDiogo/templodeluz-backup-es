import { useState } from "react";
import {
  LayoutGrid,
  Activity,
  CreditCard,
  BarChart3,
  MessageSquare,
  User,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Section } from "../App";

interface FloatingDockNavProps {
  section: Section;
  onSelect: (section: Section) => void;
  onlineCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  currentUserEmail?: string;
  onSignOut: () => void;
}

interface DockItem {
  id: Section;
  label: string;
  icon: typeof LayoutGrid;
  badge?: string | number;
}

export function FloatingDockNav({
  section,
  onSelect,
  onlineCount,
  theme,
  onToggleTheme,
  onSignOut,
}: FloatingDockNavProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const navItems: DockItem[] = [
    { id: "visao-geral",  label: "Visão Geral", icon: LayoutGrid },
    { id: "rastreamento", label: "Funil & Telemetria", icon: Activity, badge: onlineCount > 0 ? `${onlineCount}` : undefined },
    { id: "pedidos",      label: "Pedidos & Vendas", icon: CreditCard },
    { id: "relatorios",   label: "Relatórios & UTMs", icon: BarChart3 },
    { id: "whatsapp",     label: "WhatsApp Chat", icon: MessageSquare },
    { id: "perfil",       label: "Meu Perfil", icon: User },
  ];

  if (isMinimized) {
    const activeItem = navItems.find((item) => item.id === section) || navItems[0];
    const ActiveIcon = activeItem.icon;

    return (
      <aside className="floating-dock-container" aria-label="Menu de Navegação Principal">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="floating-dock-bar"
          title="Expandir menu de navegação (liberar abas)"
          aria-label="Expandir menu de navegação"
          style={{
            cursor: "pointer",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "9px",
            borderRadius: "999px",
            border: "1px solid var(--accent-border)",
            background: "var(--dock-bg)",
          }}
        >
          <div
            className="dock-icon-tile"
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: "var(--accent-strong)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActiveIcon size={14} strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
            {activeItem.label}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              paddingLeft: "4px",
              color: "var(--text-muted)",
              fontSize: "11px",
            }}
          >
            <span>Expandir</span>
            <ChevronUp size={14} />
          </div>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="floating-dock-container"
      aria-label="Menu de Navegação Principal"
    >
      <div className="floating-dock-bar">
        {/* Itens de Navegação com Tooltips Elegantes */}
        <nav className="dock-nav-group">
          {navItems.map((item) => {
            const isActive = section === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`dock-item-btn ${isActive ? "active" : ""}`}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Ícone Nítido com Tile Iluminado */}
                <div className="dock-icon-tile">
                  <Icon className="dock-icon" strokeWidth={isActive ? 2.0 : 1.7} />
                </div>

                {/* Nome no modo ativo ou texto */}
                <span className="dock-item-label">{item.label}</span>

                {/* Badge Opcional de Atividade */}
                {item.badge && (
                  <span className="dock-badge">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip Flutuante */}
                {hoveredId === item.id && !isActive && (
                  <div className="dock-tooltip">
                    <span>{item.label}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divisor Vertical Fino */}
        <div className="dock-divider" />

        {/* Ações Rápidas na Dock */}
        <div className="dock-actions-group">
          {/* Alternador de Tema */}
          <button
            onClick={onToggleTheme}
            className="dock-action-btn"
            title={`Mudar para modo ${theme === "light" ? "escuro" : "claro"}`}
            aria-label="Alternar tema"
          >
            {theme === "light" ? (
              <Moon className="dock-action-icon" strokeWidth={1.7} />
            ) : (
              <Sun className="dock-action-icon" strokeWidth={1.7} />
            )}
          </button>

          {/* Botão Sair Discreto */}
          <button
            onClick={onSignOut}
            className="dock-action-btn dock-signout"
            title="Encerrar sessão administrativa"
            aria-label="Sair"
          >
            <LogOut className="dock-action-icon" strokeWidth={1.7} />
          </button>

          {/* Botão para Minimizar Dock e Liberar Tela */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="dock-action-btn"
            title="Minimizar menu para liberar espaço de visualização"
            aria-label="Minimizar menu"
            style={{ marginLeft: "2px" }}
          >
            <ChevronDown className="dock-action-icon" strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </aside>
  );
}

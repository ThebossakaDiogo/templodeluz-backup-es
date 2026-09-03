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

  const navItems: DockItem[] = [
    { id: "visao-geral",  label: "Visão Geral", icon: LayoutGrid },
    { id: "rastreamento", label: "Funil & Telemetria", icon: Activity, badge: onlineCount > 0 ? `${onlineCount}` : undefined },
    { id: "pedidos",      label: "Pedidos & Vendas", icon: CreditCard },
    { id: "relatorios",   label: "Relatórios & UTMs", icon: BarChart3 },
    { id: "whatsapp",     label: "WhatsApp Tracker", icon: MessageSquare },
    { id: "perfil",       label: "Meu Perfil", icon: User },
  ];

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
                {/* Ícone */}
                <Icon className="dock-icon" strokeWidth={isActive ? 2.0 : 1.6} />

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
        </div>
      </div>
    </aside>
  );
}

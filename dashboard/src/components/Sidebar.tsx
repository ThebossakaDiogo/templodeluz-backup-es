import type { Section } from "../App";
import {
  LayoutGrid,
  Activity,
  CreditCard,
  FileBarChart2,
} from "lucide-react";

interface SidebarProps {
  section: Section;
  onSelect: (s: Section) => void;
}

const ITEMS: { id: Section; label: string; Icon: typeof LayoutGrid }[] = [
  { id: "visao-geral",  label: "Visão Geral",          Icon: LayoutGrid    },
  { id: "rastreamento", label: "Rastreamento ao Vivo",  Icon: Activity      },
  { id: "pedidos",      label: "Pedidos",               Icon: CreditCard    },
  { id: "relatorios",   label: "Relatórios",            Icon: FileBarChart2 },
];

export function Sidebar({ section, onSelect }: SidebarProps) {
  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        background: "var(--bg-sidebar)",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#f1f5f9",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Templo de Luz
        </span>
        <p
          style={{
            fontSize: "10px",
            color: "#475569",
            margin: "3px 0 0",
            fontWeight: 500,
          }}
        >
          Painel de Controle
        </p>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        <p
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color: "#334155",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "0 10px",
            margin: "0 0 6px",
          }}
        >
          Menu Principal
        </p>
        {ITEMS.map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: active ? "rgba(59,130,246,0.12)" : "transparent",
                color: active ? "#3b82f6" : "#475569",
                fontSize: "13px",
                fontWeight: active ? 600 : 500,
                textAlign: "left",
                transition: "background 0.15s, color 0.15s",
                marginBottom: "2px",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#475569";
                }
              }}
            >
              <Icon
                style={{
                  width: "15px",
                  height: "15px",
                  flexShrink: 0,
                }}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p style={{ fontSize: "10px", color: "#334155", margin: 0 }}>
          médium Milena · Templo de Luz
        </p>
        <p style={{ fontSize: "10px", color: "#1e3a5f", margin: "2px 0 0" }}>
          v1.0 · Dados ao vivo
        </p>
      </div>
    </aside>
  );
}

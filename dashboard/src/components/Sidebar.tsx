import type { Section } from "../App";
import {
  LayoutGrid,
  Activity,
  CreditCard,
  FileBarChart2,
  Flame,
} from "lucide-react";

interface SidebarProps {
  section: Section;
  onSelect: (s: Section) => void;
}

const ITEMS: {
  id: Section;
  label: string;
  sub: string;
  Icon: typeof LayoutGrid;
}[] = [
  {
    id: "visao-geral",
    label: "Visão Geral",
    sub: "Métricas e receita",
    Icon: LayoutGrid,
  },
  {
    id: "rastreamento",
    label: "Rastreamento",
    sub: "Funil e leads ao vivo",
    Icon: Activity,
  },
  {
    id: "pedidos",
    label: "Pedidos",
    sub: "Histórico de PIX",
    Icon: CreditCard,
  },
  {
    id: "relatorios",
    label: "Relatórios",
    sub: "Origem e exportação",
    Icon: FileBarChart2,
  },
];

export function Sidebar({ section, onSelect }: SidebarProps) {
  return (
    <aside
      style={{
        width: "235px",
        minWidth: "235px",
        background: "#08080a",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #1e1e24",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Sutil glow rubi de fundo no topo */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "-50px",
          width: "160px",
          height: "160px",
          background: "radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo Ruby & Branco */}
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid #1a1a20",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #e11d48, #9f1239)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(225,29,72,0.45)",
            flexShrink: 0,
          }}
        >
          <Flame style={{ width: "18px", height: "18px", color: "#ffffff" }} />
        </div>
        <div>
          <span
            style={{
              display: "block",
              fontSize: "13.5px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}
          >
            Templo de Luz
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "#71717a",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Painel Executivo
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, padding: "14px 10px" }}>
        <p
          style={{
            fontSize: "9.5px",
            fontWeight: 700,
            color: "#52525b",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "0 10px",
            marginBottom: "8px",
          }}
        >
          Navegação
        </p>

        {ITEMS.map(({ id, label, sub, Icon }) => {
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
                  ? "linear-gradient(90deg, rgba(225,29,72,0.14) 0%, rgba(225,29,72,0.02) 100%)"
                  : "transparent",
                textAlign: "left",
                transition: "all 0.15s ease",
                marginBottom: "3px",
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
              {/* Barra lateral Ruby ativa */}
              {active && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "7px",
                    bottom: "7px",
                    width: "3px",
                    borderRadius: "99px",
                    background: "#e11d48",
                    boxShadow: "0 0 10px rgba(225,29,72,0.8)",
                  }}
                />
              )}

              {/* Ícone com acabamento Ruby */}
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? "rgba(225,29,72,0.18)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "rgba(225,29,72,0.4)" : "#222228"}`,
                  boxShadow: active ? "0 0 12px rgba(225,29,72,0.3)" : "none",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                <Icon
                  style={{
                    width: "16px",
                    height: "16px",
                    color: active ? "#f43f5e" : "#a1a1aa",
                    filter: active ? "drop-shadow(0 0 4px rgba(225,29,72,0.5))" : "none",
                  }}
                />
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "12.5px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#ffffff" : "#a1a1aa",
                    transition: "color 0.15s",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "10px",
                    color: active ? "#fda4af" : "#71717a",
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

      {/* Rodapé com pulse ruby */}
      <div
        style={{
          padding: "14px 18px",
          borderTop: "1px solid #1a1a20",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="pulse-ruby" />
          <span style={{ fontSize: "10.5px", color: "#a1a1aa", fontWeight: 600 }}>
            Tempo Real · Supabase
          </span>
        </div>
      </div>
    </aside>
  );
}

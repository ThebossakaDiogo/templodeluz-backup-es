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
  neon: string;
  glow: string;
}[] = [
  {
    id: "visao-geral",
    label: "Visão Geral",
    sub: "Métricas e gráficos",
    Icon: LayoutGrid,
    neon: "#00b4ff",
    glow: "rgba(0,180,255,0.3)",
  },
  {
    id: "rastreamento",
    label: "Rastreamento",
    sub: "Funil e leads ao vivo",
    Icon: Activity,
    neon: "#a855f7",
    glow: "rgba(168,85,247,0.3)",
  },
  {
    id: "pedidos",
    label: "Pedidos",
    sub: "Histórico de pagamentos",
    Icon: CreditCard,
    neon: "#00e5a0",
    glow: "rgba(0,229,160,0.3)",
  },
  {
    id: "relatorios",
    label: "Relatórios",
    sub: "Análises e exportação",
    Icon: FileBarChart2,
    neon: "#f472b6",
    glow: "rgba(244,114,182,0.3)",
  },
];

export function Sidebar({ section, onSelect }: SidebarProps) {
  return (
    <aside
      style={{
        width: "230px",
        minWidth: "230px",
        background: "#060c1a",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow de fundo decorativo */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          left: "-60px",
          width: "180px",
          height: "180px",
          background: "radial-gradient(circle, rgba(0,180,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "60px",
          right: "-40px",
          width: "140px",
          height: "140px",
          background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #00b4ff22, #a855f722)",
            border: "1px solid rgba(0,180,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(0,180,255,0.15)",
          }}
        >
          <Flame style={{ width: "16px", height: "16px", color: "#00b4ff" }} />
        </div>
        <div>
          <span
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 800,
              color: "#e8f0ff",
              letterSpacing: "0.02em",
            }}
          >
            Templo de Luz
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "#2a4060",
              fontWeight: 500,
            }}
          >
            Painel de Controle
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px" }}>
        <p
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color: "#1e3a5f",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "0 10px",
            marginBottom: "8px",
          }}
        >
          Navegação
        </p>

        {ITEMS.map(({ id, label, sub, Icon, neon, glow }) => {
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
                  ? `rgba(${neon.replace("#","").match(/.{2}/g)!.map(h=>parseInt(h,16)).join(",")}, 0.08)`
                  : "transparent",
                textAlign: "left",
                transition: "all 0.2s ease",
                marginBottom: "3px",
                position: "relative",
                outline: "none",
              }}
            >
              {/* Linha de ativo */}
              {active && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "6px",
                    bottom: "6px",
                    width: "3px",
                    borderRadius: "99px",
                    background: neon,
                    boxShadow: `0 0 8px ${glow}`,
                  }}
                />
              )}

              {/* Ícone com neon */}
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? `${neon}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? `${neon}30` : "rgba(255,255,255,0.04)"}`,
                  boxShadow: active ? `0 0 10px ${glow}` : "none",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                <Icon
                  style={{
                    width: "15px",
                    height: "15px",
                    color: active ? neon : "#2a4060",
                    filter: active ? `drop-shadow(0 0 4px ${glow})` : "none",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>

              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "12.5px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#e8f0ff" : "#3a5878",
                    transition: "color 0.2s",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "10px",
                    color: active ? "#4a6a8a" : "#1e3050",
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

      {/* Rodapé */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: "10px", color: "#1e3a5f", fontWeight: 600 }}>
            Dados ao vivo · Supabase Realtime
          </span>
        </div>
      </div>
    </aside>
  );
}

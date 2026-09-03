import {
  DollarSign,
  CreditCard,
  QrCode,
  ArrowUpRight,
  Shield,
  Sparkles,
  Lock,
  Clock,
} from "lucide-react";
import type { DashboardStats } from "@/types";

interface MetricCardsProps {
  stats: DashboardStats;
  loading: boolean;
}

function formatBRL(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

export function MetricCards({ stats, loading }: MetricCardsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* ─── Cabeçalho da Seção ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
              Métricas consolidadas em tempo real
            </span>
            <Clock style={{ width: "11px", height: "11px", color: "var(--text-muted)" }} />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                padding: "1px 6px",
                borderRadius: "999px",
              }}
            >
              4 Indicadores
            </span>
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.015em",
            }}
          >
            Visão Geral & Faturamento
          </h2>
        </div>

        {/* Filtros Discretos em Pílulas */}
        <div className="desktop-only-control" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            <span>Período Ativo</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            <span>Todos Gateways</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            <span>Consolidado</span>
          </div>
        </div>
      </div>

      {/* ─── Grid de Cards da Primeira Dobra ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "14px",
        }}
      >
        {/* CARD 1: Faturamento Total */}
        <div
          className="card"
          style={{
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: "180px",
          }}
        >
          <div>
            {/* Topo: Ícone Tile + Categoria + Seta ↗ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "var(--accent-soft-bg)",
                    border: "1px solid var(--accent-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-strong)",
                  }}
                >
                  <DollarSign style={{ width: "15px", height: "15px" }} strokeWidth={1.8} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Volume Geral
                  </span>
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Faturamento Total
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                <ArrowUpRight style={{ width: "11px", height: "11px" }} />
              </div>
            </div>

            {/* Métrica Principal */}
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>
                Receita Liquidada
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "23px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.totalRevenue)}
                </span>
                {stats.totalRevenueDiff !== null && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 600,
                      color: stats.totalRevenueDiff >= 0 ? "var(--success)" : "var(--danger)",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    {stats.totalRevenueDiff >= 0 ? "+" : ""}{stats.totalRevenueDiff}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sparkline Fluido com Badge */}
          <div style={{ position: "relative", width: "100%", height: "42px", marginTop: "8px" }}>
            <svg viewBox="0 0 200 42" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-line-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--chart-line-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,35 Q 45,32 80,22 T 150,14 T 200,6"
                fill="none"
                stroke="var(--chart-line-primary)"
                strokeWidth="1.8"
              />
              <path
                d="M 0,35 Q 45,32 80,22 T 150,14 T 200,6 L 200,42 L 0,42 Z"
                fill="url(#gradTotal)"
              />
              <circle cx="200" cy="6" r="3" fill="var(--accent-primary)" />
              <circle cx="200" cy="6" r="6" fill="var(--chart-line-primary)" opacity="0.4" />
            </svg>
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "10px",
                fontSize: "9.5px",
                fontWeight: 600,
                color: "var(--accent-strong)",
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "999px",
                padding: "1px 6px",
              }}
            >
              PIX + Cartão
            </span>
          </div>
        </div>

        {/* CARD 2: Conversões no PIX */}
        <div
          className="card"
          style={{
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: "180px",
          }}
        >
          <div>
            {/* Topo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "var(--success-soft)",
                    border: "1px solid rgba(46, 219, 111, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--success)",
                  }}
                >
                  <QrCode style={{ width: "15px", height: "15px" }} strokeWidth={1.8} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Banco Central
                  </span>
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Conversões no PIX
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                <ArrowUpRight style={{ width: "11px", height: "11px" }} />
              </div>
            </div>

            {/* Métrica */}
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>
                Volume Liquidado
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "23px",
                    fontWeight: 600,
                    color: "var(--success)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.pixRevenue)}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "var(--success)",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {stats.pixCount} pagos
                </span>
              </div>
            </div>
          </div>

          {/* Sparkline Verde */}
          <div style={{ position: "relative", width: "100%", height: "42px", marginTop: "8px" }}>
            <svg viewBox="0 0 200 42" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="gradPix" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2EDB6F" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2EDB6F" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,32 Q 50,28 95,18 T 155,10 T 200,4"
                fill="none"
                stroke="#2EDB6F"
                strokeWidth="1.8"
              />
              <path
                d="M 0,32 Q 50,28 95,18 T 155,10 T 200,4 L 200,42 L 0,42 Z"
                fill="url(#gradPix)"
              />
              <circle cx="200" cy="4" r="3" fill="#2EDB6F" />
              <circle cx="200" cy="4" r="6" fill="#2EDB6F" opacity="0.4" />
            </svg>
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "10px",
                fontSize: "9.5px",
                fontWeight: 600,
                color: "var(--success)",
                background: "var(--success-soft)",
                border: "1px solid rgba(46, 219, 111, 0.28)",
                borderRadius: "999px",
                padding: "1px 6px",
              }}
            >
              {stats.pixPendingCount} pendentes
            </span>
          </div>
        </div>

        {/* CARD 3: Cartão de Crédito Stripe */}
        <div
          className="card"
          style={{
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: "180px",
          }}
        >
          <div>
            {/* Topo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "var(--accent-soft-bg)",
                    border: "1px solid var(--accent-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-strong)",
                  }}
                >
                  <CreditCard style={{ width: "15px", height: "15px" }} strokeWidth={1.8} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Stripe Gateway
                  </span>
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Cartão de Crédito
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                <ArrowUpRight style={{ width: "11px", height: "11px" }} />
              </div>
            </div>

            {/* Métrica */}
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>
                Volume Aprovado
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "23px",
                    fontWeight: 600,
                    color: "var(--accent-strong)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.cardRevenue)}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "var(--accent-strong)",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {stats.cardCount} aprovados
                </span>
              </div>
            </div>
          </div>

          {/* Sparkline Roxo */}
          <div style={{ position: "relative", width: "100%", height: "42px", marginTop: "8px" }}>
            <svg viewBox="0 0 200 42" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="gradCard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,34 Q 55,30 110,20 T 165,12 T 200,6"
                fill="none"
                stroke="#7C5CFF"
                strokeWidth="1.8"
              />
              <path
                d="M 0,34 Q 55,30 110,20 T 165,12 T 200,6 L 200,42 L 0,42 Z"
                fill="url(#gradCard)"
              />
              <circle cx="200" cy="6" r="3" fill="#C4BAFF" />
              <circle cx="200" cy="6" r="6" fill="#7C5CFF" opacity="0.4" />
            </svg>
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "10px",
                fontSize: "9.5px",
                fontWeight: 600,
                color: "var(--accent-strong)",
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "999px",
                padding: "1px 6px",
              }}
            >
              TM {formatBRL(stats.cardAvgRevenue)}
            </span>
          </div>
        </div>

        {/* CARD 4: Featured Panel Adaptável (Dark & Light) */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "var(--live-banner-bg, linear-gradient(180deg, #101124 0%, #1A1340 50%, #362480 100%))",
            border: "1px solid var(--accent-border)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            minHeight: "180px",
          }}
        >
          {/* Topo */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles style={{ width: "13px", height: "13px", color: "var(--accent-primary)" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.02em" }}>
                  OD METRICS
                </span>
                <span style={{ fontSize: "9px", color: "var(--accent-primary)" }}>®</span>
              </div>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  background: "var(--accent-soft-bg)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: "999px",
                  padding: "2px 7px",
                }}
              >
                PRO
              </span>
            </div>

            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 4px",
                letterSpacing: "-0.01em",
              }}
            >
              Inteligência de Leads & Funil
            </h3>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {stats.newSubscriptions.toLocaleString("pt-BR")} consulentes no quiz · {stats.newOrders} converteram em doações.
            </p>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
            <button
              className="btn btn-primary"
              style={{
                width: "100%",
                height: "32px",
                fontSize: "11.5px",
                borderRadius: "8px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Shield style={{ width: "12px", height: "12px" }} />
              Telemetria Conectada
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                fontSize: "10.5px",
                color: "var(--text-muted)",
                padding: "2px 0",
              }}
            >
              <Lock style={{ width: "10px", height: "10px" }} />
              Auditoria de Ponta a Ponta Ativa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

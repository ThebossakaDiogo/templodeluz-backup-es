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
      {/* ─── Cabeçalho da Seção (Inspirado no 'Top Staking Assets' da referência) ─── */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11.5px", color: "#747786", fontWeight: 400 }}>
              Métricas consolidadas em tempo real
            </span>
            <Clock style={{ width: "11px", height: "11px", color: "#747786" }} />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#A7A9B5",
                background: "#12131D",
                border: "1px solid #232532",
                padding: "1px 6px",
                borderRadius: "999px",
              }}
            >
              4 Indicadores
            </span>
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "#F5F4FA",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Visão Geral & Faturamento
          </h2>
        </div>

        {/* Filtros em Pílulas (Inspirado nos botões 24H, Proof of Stake, Desc da referência) */}
        <div className="desktop-only-control" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#0D0E17",
              border: "1px solid #232532",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              color: "#A7A9B5",
              cursor: "pointer",
            }}
          >
            <span>Período Ativo</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#0D0E17",
              border: "1px solid #232532",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              color: "#A7A9B5",
              cursor: "pointer",
            }}
          >
            <span>Todos Gateways</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#0D0E17",
              border: "1px solid #232532",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              color: "#A7A9B5",
              cursor: "pointer",
            }}
          >
            <span>Consolidado</span>
          </div>
        </div>
      </div>

      {/* ─── Grid de Cards da Primeira Dobra (3 Cards + 1 Featured Panel) ─── */}
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
            background: "#11121A",
            border: "1px solid #232532",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: "185px",
          }}
        >
          <div>
            {/* Topo: Ícone Tile + Categoria + Seta ↗ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "rgba(189, 180, 239, 0.12)",
                    border: "1px solid rgba(189, 180, 239, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#BDB4EF",
                  }}
                >
                  <DollarSign style={{ width: "15px", height: "15px" }} strokeWidth={2.0} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "#747786", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Volume Geral
                  </span>
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#F5F4FA" }}>
                    Faturamento Total
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#161722",
                  border: "1px solid #282A36",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#747786",
                }}
              >
                <ArrowUpRight style={{ width: "11px", height: "11px" }} />
              </div>
            </div>

            {/* Taxa / Métrica Principal */}
            <div>
              <span style={{ fontSize: "10px", color: "#747786", fontWeight: 400 }}>
                Receita Liquidada
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "#F5F4FA",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.totalRevenue)}
                </span>
                {stats.totalRevenueDiff !== null && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 600,
                      color: stats.totalRevenueDiff >= 0 ? "#2EDB6F" : "#F05D66",
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

          {/* Sparkline Fluido Estilo Stakent com Badge Flutuante */}
          <div style={{ position: "relative", width: "100%", height: "45px", marginTop: "10px" }}>
            <svg viewBox="0 0 200 45" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8A79FF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8A79FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,38 Q 45,35 80,24 T 150,15 T 200,6"
                fill="none"
                stroke="#8A79FF"
                strokeWidth="1.8"
              />
              <path
                d="M 0,38 Q 45,35 80,24 T 150,15 T 200,6 L 200,45 L 0,45 Z"
                fill="url(#gradTotal)"
              />
              {/* Ponto Luminoso de Pico */}
              <circle cx="200" cy="6" r="3" fill="#BDB4EF" />
              <circle cx="200" cy="6" r="6" fill="#8A79FF" opacity="0.4" />
            </svg>
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "12px",
                fontSize: "9.5px",
                fontWeight: 600,
                color: "#BDB4EF",
                background: "#161725",
                border: "1px solid #2D2F44",
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
            background: "#11121A",
            border: "1px solid #232532",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: "185px",
          }}
        >
          <div>
            {/* Topo: Ícone Tile + Categoria + Seta ↗ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "rgba(46, 219, 111, 0.12)",
                    border: "1px solid rgba(46, 219, 111, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2EDB6F",
                  }}
                >
                  <QrCode style={{ width: "15px", height: "15px" }} strokeWidth={2.0} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "#747786", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Banco Central
                  </span>
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#F5F4FA" }}>
                    Conversões no PIX
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#161722",
                  border: "1px solid #282A36",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#747786",
                }}
              >
                <ArrowUpRight style={{ width: "11px", height: "11px" }} />
              </div>
            </div>

            {/* Taxa / Métrica Principal */}
            <div>
              <span style={{ fontSize: "10px", color: "#747786", fontWeight: 400 }}>
                Volume Liquidado
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "#2EDB6F",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.pixRevenue)}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "#2EDB6F",
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

          {/* Sparkline Fluido Verde com Badge Flutuante */}
          <div style={{ position: "relative", width: "100%", height: "45px", marginTop: "10px" }}>
            <svg viewBox="0 0 200 45" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="gradPix" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2EDB6F" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2EDB6F" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,34 Q 50,30 95,20 T 155,12 T 200,4"
                fill="none"
                stroke="#2EDB6F"
                strokeWidth="1.8"
              />
              <path
                d="M 0,34 Q 50,30 95,20 T 155,12 T 200,4 L 200,45 L 0,45 Z"
                fill="url(#gradPix)"
              />
              <circle cx="200" cy="4" r="3" fill="#2EDB6F" />
              <circle cx="200" cy="4" r="6" fill="#2EDB6F" opacity="0.4" />
            </svg>
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "12px",
                fontSize: "9.5px",
                fontWeight: 600,
                color: "#2EDB6F",
                background: "rgba(46, 219, 111, 0.12)",
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
            background: "#11121A",
            border: "1px solid #232532",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            minHeight: "185px",
          }}
        >
          <div>
            {/* Topo: Ícone Tile + Categoria + Seta ↗ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "rgba(124, 92, 255, 0.12)",
                    border: "1px solid rgba(124, 92, 255, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#C4BAFF",
                  }}
                >
                  <CreditCard style={{ width: "15px", height: "15px" }} strokeWidth={2.0} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "#747786", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Stripe Gateway
                  </span>
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#F5F4FA" }}>
                    Cartão de Crédito
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#161722",
                  border: "1px solid #282A36",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#747786",
                }}
              >
                <ArrowUpRight style={{ width: "11px", height: "11px" }} />
              </div>
            </div>

            {/* Taxa / Métrica Principal */}
            <div>
              <span style={{ fontSize: "10px", color: "#747786", fontWeight: 400 }}>
                Volume Aprovado
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "24px",
                    fontWeight: 600,
                    color: "#C4BAFF",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.cardRevenue)}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "#C4BAFF",
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

          {/* Sparkline Fluido Roxo/Lavender com Ponto */}
          <div style={{ position: "relative", width: "100%", height: "45px", marginTop: "10px" }}>
            <svg viewBox="0 0 200 45" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="gradCard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,36 Q 55,32 110,22 T 165,14 T 200,8"
                fill="none"
                stroke="#7C5CFF"
                strokeWidth="1.8"
              />
              <path
                d="M 0,36 Q 55,32 110,22 T 165,14 T 200,8 L 200,45 L 0,45 Z"
                fill="url(#gradCard)"
              />
              <circle cx="200" cy="8" r="3" fill="#C4BAFF" />
              <circle cx="200" cy="8" r="6" fill="#7C5CFF" opacity="0.4" />
            </svg>
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "12px",
                fontSize: "9.5px",
                fontWeight: 600,
                color: "#C4BAFF",
                background: "rgba(124, 92, 255, 0.12)",
                border: "1px solid rgba(124, 92, 255, 0.28)",
                borderRadius: "999px",
                padding: "1px 6px",
              }}
            >
              TM {formatBRL(stats.cardAvgRevenue)}
            </span>
          </div>
        </div>

        {/* CARD 4: Featured Panel (Inspirado no 'Liquid Staking Portfolio' da referência) */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "linear-gradient(180deg, #090A1A 0%, #100C2A 48%, #3A238A 100%)",
            border: "1px solid rgba(189, 180, 239, 0.28)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(74, 48, 164, 0.22)",
            minHeight: "185px",
          }}
        >
          {/* Topo: Marca OD METRICS + Badge 'Novo' */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles style={{ width: "13px", height: "13px", color: "#BDB4EF" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#F5F4FA", letterSpacing: "0.02em" }}>
                  OD METRICS
                </span>
                <span style={{ fontSize: "9px", color: "#BDB4EF" }}>®</span>
              </div>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 600,
                  color: "#F5F4FA",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: "999px",
                  padding: "2px 7px",
                }}
              >
                PRO
              </span>
            </div>

            <h3
              style={{
                fontSize: "14.5px",
                fontWeight: 600,
                color: "#F5F4FA",
                margin: "0 0 4px",
                letterSpacing: "-0.01em",
              }}
            >
              Inteligência de Leads & Funil
            </h3>
            <p
              style={{
                fontSize: "11px",
                color: "#BDB4EF",
                margin: 0,
                lineHeight: 1.35,
                opacity: 0.85,
              }}
            >
              {stats.newSubscriptions.toLocaleString("pt-BR")} consulentes iniciaram a jornada · {stats.newOrders} converteram em doações.
            </p>
          </div>

          {/* Botões de Ação da Pílula (Idênticos aos botões 'Connect' e 'Enter' da referência) */}
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
                color: "rgba(255, 255, 255, 0.75)",
                padding: "3px 0",
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

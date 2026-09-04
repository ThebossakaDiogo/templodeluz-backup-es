import {
  DollarSign,
  CreditCard,
  QrCode,
  TrendingUp,
  Clock,
  CheckCircle2,
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
  }).format(val || 0);
}

export function MetricCards({ stats, loading }: MetricCardsProps) {
  const conversionRate = stats.newSubscriptions > 0
    ? ((stats.newOrders / stats.newSubscriptions) * 100).toFixed(1)
    : "0.0";

  const totalPixAttempts = stats.pixCount + stats.pixPendingCount;
  const pixLiquidationRate = totalPixAttempts > 0
    ? Math.round((stats.pixCount / totalPixAttempts) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* ─── Cabeçalho da Seção de KPIs ─── */}
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
              4 Indicadores de Performance
            </span>
          </div>
          <h2
            style={{
              fontSize: "19px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Visão Geral & Faturamento
          </h2>
        </div>

        {/* Badges de Escopo do Filtro */}
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

      {/* ─── Grid dos 4 Cards Simétricos ─── */}
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
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "170px",
            boxSizing: "border-box",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10B981",
                  }}
                >
                  <DollarSign style={{ width: "16px", height: "16px" }} strokeWidth={2} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Volume Geral
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Faturamento Total
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "999px",
                  padding: "2px 7px",
                }}
              >
                PIX + Cartão
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 400 }}>
                Receita Liquidada
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.totalRevenue)}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: stats.totalRevenueDiff >= 0 ? "#10B981" : "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {stats.totalRevenueDiff >= 0 ? `+${stats.totalRevenueDiff}%` : `${stats.totalRevenueDiff}%`}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "10px",
              marginTop: "8px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            <span>{stats.newOrders} pedidos liquidados</span>
            <span>TM {formatBRL(stats.avgOrderRevenue)}</span>
          </div>
        </div>

        {/* CARD 2: Conversões no PIX */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "170px",
            boxSizing: "border-box",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10B981",
                  }}
                >
                  <QrCode style={{ width: "16px", height: "16px" }} strokeWidth={2} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Banco Central & PushinPay
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Conversões no PIX
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#10B981",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.22)",
                  borderRadius: "999px",
                  padding: "2px 7px",
                }}
              >
                {pixLiquidationRate}% pago
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 400 }}>
                Volume Liquidado
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#10B981",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.pixRevenue)}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#10B981",
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "10px",
              marginTop: "8px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            <span>{stats.pixPendingCount} aguardando pagamento</span>
            <span>Retenção: {stats.pixCount}/{totalPixAttempts || 0}</span>
          </div>
        </div>

        {/* CARD 3: Cartão de Crédito Stripe */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "170px",
            boxSizing: "border-box",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6366F1",
                  }}
                >
                  <CreditCard style={{ width: "16px", height: "16px" }} strokeWidth={2} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Stripe Gateway
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Cartão de Crédito
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#6366F1",
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.22)",
                  borderRadius: "999px",
                  padding: "2px 7px",
                }}
              >
                Global
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 400 }}>
                Volume Aprovado
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {loading ? "—" : formatBRL(stats.cardRevenue)}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "10px",
              marginTop: "8px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            <span>Ticket Médio: {formatBRL(stats.cardAvgRevenue)}</span>
            <span>Stripe Connect</span>
          </div>
        </div>

        {/* CARD 4: Taxa de Conversão & Eficiência Global (Substituindo o antigo banner estático!) */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "170px",
            boxSizing: "border-box",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(14, 165, 233, 0.08)",
                    border: "1px solid rgba(14, 165, 233, 0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0EA5E9",
                  }}
                >
                  <TrendingUp style={{ width: "16px", height: "16px" }} strokeWidth={2} />
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
                    Funil & Retenção
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Conversão Global
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#0EA5E9",
                  background: "rgba(14, 165, 233, 0.08)",
                  border: "1px solid rgba(14, 165, 233, 0.22)",
                  borderRadius: "999px",
                  padding: "2px 7px",
                }}
              >
                Lead → Doador
              </span>
            </div>

            <div>
              <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 400 }}>
                Taxa de Sucesso
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                <span
                  className="font-numeric"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {loading ? "—" : `${conversionRate}%`}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                  }}
                >
                  {stats.newOrders} de {stats.newSubscriptions.toLocaleString("pt-BR")} leads
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "10px",
              marginTop: "8px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            <span>Eficiência do tráfego</span>
            <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#10B981" }}>
              <CheckCircle2 style={{ width: "12px", height: "12px" }} />
              Operação ativa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

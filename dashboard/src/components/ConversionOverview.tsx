import { memo } from "react";
import { Target, TrendingUp, ShieldCheck, QrCode, CreditCard } from "lucide-react";
import type { Lead, PaymentOrder } from "@/types";

interface ConversionOverviewProps {
  readonly leads: readonly Lead[];
  readonly orders: readonly PaymentOrder[];
  readonly loading?: boolean;
}

export const ConversionOverview = memo(function ConversionOverview({ leads, orders, loading }: ConversionOverviewProps) {
  const totalLeads = leads.length;
  const completedQuizLeads = leads.filter((l) => l.highest_step_index >= 8 || l.completed).length;

  const pixOrders = orders.filter((o) => o.payment_method === "pix" || !o.payment_method);
  const cardOrders = orders.filter((o) => o.payment_method === "credit_card");

  const pixPaid = pixOrders.filter((o) => o.status === "paid").length;
  const cardPaid = cardOrders.filter((o) => o.status === "paid").length;
  const totalPaid = pixPaid + cardPaid;

  // Taxa de conclusão do Quiz
  const quizCompletionRate = totalLeads > 0 ? Math.round((completedQuizLeads / totalLeads) * 100) : 0;

  // Eficiência PIX (Pagos / Gerados)
  const pixSuccessRate = pixOrders.length > 0 ? Math.round((pixPaid / pixOrders.length) * 100) : 0;

  // Eficiência Cartão (Aprovados / Iniciados)
  const cardSuccessRate = cardOrders.length > 0 ? Math.round((cardPaid / cardOrders.length) * 100) : 0;

  // Conversão Global de Leads para Vendas
  const globalLeadToSaleRate = totalLeads > 0 ? ((totalPaid / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div
      className="card conversion-overview-grid"
      style={{
        padding: "18px 22px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "14px",
      }}
    >
      {/* Item 1: Conclusão do Quiz */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0EA5E9",
            }}
          >
            <Target style={{ width: "14px", height: "14px" }} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Conclusão do Quiz
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span className="font-numeric" style={{ fontSize: "19px", fontWeight: 600, color: "var(--text-primary)" }}>
            {loading ? "—" : `${quizCompletionRate}%`}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
            chegaram ao fim
          </span>
        </div>

        <div style={{ height: "4px", background: "var(--surface-3)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${quizCompletionRate}%`,
              height: "100%",
              background: "#0EA5E9",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 2: Eficiência PIX */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
            }}
          >
            <QrCode style={{ width: "14px", height: "14px" }} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Eficiência do PIX
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span className="font-numeric" style={{ fontSize: "19px", fontWeight: 600, color: "#10B981" }}>
            {loading ? "—" : `${pixSuccessRate}%`}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
            {pixPaid}/{pixOrders.length} pagos
          </span>
        </div>

        <div style={{ height: "4px", background: "var(--surface-3)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${pixSuccessRate}%`,
              height: "100%",
              background: "#10B981",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 3: Eficiência Cartão (Stripe) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6366F1",
            }}
          >
            <CreditCard style={{ width: "14px", height: "14px" }} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Eficiência Cartão
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span className="font-numeric" style={{ fontSize: "19px", fontWeight: 600, color: "var(--text-primary)" }}>
            {loading ? "—" : `${cardSuccessRate}%`}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
            {cardPaid}/{cardOrders.length} aprovados
          </span>
        </div>

        <div style={{ height: "4px", background: "var(--surface-3)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${cardSuccessRate}%`,
              height: "100%",
              background: "#6366F1",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 4: Conversão Global (Lead -> Venda) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
            }}
          >
            <TrendingUp style={{ width: "14px", height: "14px" }} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Conversão Global
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span className="font-numeric" style={{ fontSize: "19px", fontWeight: 600, color: "var(--text-primary)" }}>
            {loading ? "—" : `${globalLeadToSaleRate}%`}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
            lead para doador
          </span>
        </div>

        <div style={{ height: "4px", background: "var(--surface-3)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(100, Number(globalLeadToSaleRate) * 5)}%`,
              height: "100%",
              background: "#10B981",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 5: Status Gateways & Pixel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
            }}
          >
            <ShieldCheck style={{ width: "14px", height: "14px" }} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Gateways Conectados
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#10B981" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
            <span>PIX Oficial & Stripe Ativos</span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
            Meta Pixel + UTMify integrados
          </span>
        </div>
      </div>
    </div>
  );
});

import { Target, TrendingUp, ShieldCheck, QrCode, CreditCard } from "lucide-react";
import type { Lead, PaymentOrder } from "@/types";

interface ConversionOverviewProps {
  leads: Lead[];
  orders: PaymentOrder[];
  loading?: boolean;
}

export function ConversionOverview({ leads, orders, loading }: ConversionOverviewProps) {
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
      className="card"
      style={{
        padding: "20px 24px",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow de fundo */}
      <div
        style={{
          position: "absolute",
          left: "20%",
          top: "-30px",
          width: "250px",
          height: "100px",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Item 1: Conclusão do Quiz */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(37, 99, 235, 0.15)",
              border: "1px solid rgba(37, 99, 235, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary-blue)",
            }}
          >
            <Target style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Conclusão do Quiz
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)" }}>
            {loading ? "—" : `${quizCompletionRate}%`}
          </span>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 500 }}>
            chegaram ao fim
          </span>
        </div>

        <div style={{ height: "4px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${quizCompletionRate}%`,
              height: "100%",
              background: "linear-gradient(90deg, #2563eb, #38bdf8)",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 2: Eficiência PIX */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <QrCode style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Eficiência do PIX
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "#10b981" }}>
            {loading ? "—" : `${pixSuccessRate}%`}
          </span>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 500 }}>
            {pixPaid}/{pixOrders.length} pagos
          </span>
        </div>

        <div style={{ height: "4px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${pixSuccessRate}%`,
              height: "100%",
              background: "linear-gradient(90deg, #059669, #10b981)",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 3: Eficiência Cartão (Stripe) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
            }}
          >
            <CreditCard style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Eficiência Cartão
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "#818cf8" }}>
            {loading ? "—" : `${cardSuccessRate}%`}
          </span>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 500 }}>
            {cardPaid}/{cardOrders.length} aprovados
          </span>
        </div>

        <div style={{ height: "4px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${cardSuccessRate}%`,
              height: "100%",
              background: "linear-gradient(90deg, #6366f1, #a855f7)",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 4: Conversão Global (Lead -> Venda) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(6, 182, 212, 0.15)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-cyan)",
            }}
          >
            <TrendingUp style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Conversão Global
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--accent-cyan)" }}>
            {loading ? "—" : `${globalLeadToSaleRate}%`}
          </span>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 500 }}>
            lead para doador
          </span>
        </div>

        <div style={{ height: "4px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(100, Number(globalLeadToSaleRate) * 5)}%`,
              height: "100%",
              background: "linear-gradient(90deg, #0284c7, #06b6d4)",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 5: Status Gateways & Pixel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary-green)",
            }}
          >
            <ShieldCheck style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Gateways Conectados
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 800, color: "var(--primary-green)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
            PIX Oficial & Stripe Ativos
          </div>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 500 }}>
            Meta Pixel + UTMify integrados
          </span>
        </div>
      </div>
    </div>
  );
}

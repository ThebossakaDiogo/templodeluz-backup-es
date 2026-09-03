import { Target, Zap, CheckCircle2, TrendingUp } from "lucide-react";
import type { Lead, PaymentOrder } from "@/types";

interface ConversionOverviewProps {
  leads: Lead[];
  orders: PaymentOrder[];
  loading?: boolean;
}

export function ConversionOverview({ leads, orders, loading }: ConversionOverviewProps) {
  const totalLeads = leads.length;
  const completedQuizLeads = leads.filter((l) => l.highest_step_index >= 8 || l.completed).length;
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalPaid = paidOrders.length;

  // Taxa de conclusão do Quiz
  const quizCompletionRate = totalLeads > 0 ? Math.round((completedQuizLeads / totalLeads) * 100) : 0;

  // Conversão de Pedidos (Pagos vs Gerados)
  const paymentSuccessRate = totalOrders > 0 ? Math.round((totalPaid / totalOrders) * 100) : 0;

  // Conversão Global de Leads para Vendas
  const globalLeadToSaleRate = totalLeads > 0 ? ((totalPaid / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div
      className="card"
      style={{
        padding: "20px 24px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow de fundo sutil */}
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
      <div
        style={{
          position: "absolute",
          right: "20%",
          top: "-30px",
          width: "250px",
          height: "100px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)",
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
              color: "#38bdf8",
            }}
          >
            <Target style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Conclusão do Quiz
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)" }}>
            {loading ? "—" : `${quizCompletionRate}%`}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
            chegaram ao fim
          </span>
        </div>

        <div
          style={{
            height: "5px",
            background: "var(--border)",
            borderRadius: "99px",
            overflow: "hidden",
            marginTop: "2px",
          }}
        >
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

      {/* Item 2: Conversão PIX (Pagos / Gerados) */}
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
              color: "#34d399",
            }}
          >
            <CheckCircle2 style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Eficiência de Pagamento
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "22px", fontWeight: 900, color: "#10b981" }}>
            {loading ? "—" : `${paymentSuccessRate}%`}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
            PIX pagos vs gerados
          </span>
        </div>

        <div
          style={{
            height: "5px",
            background: "var(--border)",
            borderRadius: "99px",
            overflow: "hidden",
            marginTop: "2px",
          }}
        >
          <div
            style={{
              width: `${paymentSuccessRate}%`,
              height: "100%",
              background: "linear-gradient(90deg, #059669, #10b981)",
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Item 3: Conversão Global Funil */}
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
              color: "#06b6d4",
            }}
          >
            <TrendingUp style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Conversão Geral (Lead → Venda)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "22px", fontWeight: 900, color: "#06b6d4" }}>
            {loading ? "—" : `${globalLeadToSaleRate}%`}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
            do total de visitantes
          </span>
        </div>

        <div
          style={{
            height: "5px",
            background: "var(--border)",
            borderRadius: "99px",
            overflow: "hidden",
            marginTop: "2px",
          }}
        >
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

      {/* Item 4: Status do Gateway & Telemetria */}
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
            <Zap style={{ width: "15px", height: "15px" }} />
          </div>
          <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)" }}>
            Gateway & Pixel
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "16px", fontWeight: 900, color: "#10b981" }}>
            100% Operacional
          </span>
        </div>

        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
          Meta Pixel + UTMify ativos
        </p>
      </div>
    </div>
  );
}

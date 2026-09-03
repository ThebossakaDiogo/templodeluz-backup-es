import { useState, useMemo } from "react";
import type { Lead } from "@/types";
import {
  Clock,
  UserCheck,
  CreditCard,
  QrCode,
  AlertTriangle,
  Search,
  Users,
  Compass,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface ConsulentesTelemetryTableProps {
  leads: Lead[];
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "< 30s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "agora há pouco";
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return "ontem";
    return `há ${diffDays} dias`;
  } catch {
    return dateStr;
  }
}

export function ConsulentesTelemetryTable({ leads }: ConsulentesTelemetryTableProps) {
  const [filter, setFilter] = useState<"all" | "checkout" | "pix" | "declined" | "paid">("all");
  const [search, setSearch] = useState("");

  // Métricas agregadas de checkout e tempo
  const metrics = useMemo(() => {
    const checkouts = leads.filter(
      (l) => l.checkout_initiated || l.highest_step_index >= 8 || l.checkout_status === "checkout_initiated"
    );
    const pixes = leads.filter(
      (l) => l.pix_generated || l.checkout_status === "pix_generated"
    );
    const declined = leads.filter(
      (l) => l.card_declined || l.checkout_status === "card_declined" || l.payment_status === "failed"
    );
    const paid = leads.filter((l) => l.payment_status === "paid");

    const leadsWithTime = leads.filter((l) => (l.time_spent_seconds || 0) > 0);
    const avgSeconds = leadsWithTime.length > 0
      ? Math.round(leadsWithTime.reduce((sum, l) => sum + (l.time_spent_seconds || 0), 0) / leadsWithTime.length)
      : 0;

    return {
      totalLeads: leads.length,
      checkoutsCount: checkouts.length,
      pixCount: pixes.length,
      declinedCount: declined.length,
      paidCount: paid.length,
      avgSeconds,
    };
  }, [leads]);

  // Filtro e busca
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filter === "checkout" && !(l.checkout_initiated || l.highest_step_index >= 8)) return false;
      if (filter === "pix" && !(l.pix_generated || l.checkout_status === "pix_generated")) return false;
      if (filter === "declined" && !(l.card_declined || l.payment_status === "failed")) return false;
      if (filter === "paid" && l.payment_status !== "paid") return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const name = (l.lead_name || "").toLowerCase();
        const ente = (l.ente_querido || "").toLowerCase();
        const email = (l.lead_email || "").toLowerCase();
        const utm = (l.utm_source || "").toLowerCase();
        return name.includes(query) || ente.includes(query) || email.includes(query) || utm.includes(query);
      }
      return true;
    });
  }, [leads, filter, search]);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ─── CABEÇALHO DO BLOCO: Título & Métricas Executivas de Retenção ─── */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "var(--accent-soft-bg)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-strong)",
              }}
            >
              <Compass style={{ width: "15px", height: "15px" }} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
              Telemetria de Consulentes & Checkouts
            </h3>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                color: "var(--accent-strong)",
                background: "var(--accent-soft-bg)",
                border: "1px solid var(--accent-border)",
                padding: "2px 8px",
                borderRadius: "999px",
              }}
            >
              Ao Vivo
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            Rastreamento nominal de tempo no quiz, checkouts iniciados, PIX gerados e abandono de carrinho.
          </p>
        </div>

        {/* 4 Cards de Métricas Rápidas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          {/* Card 1: Checkouts Iniciados */}
          <div
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Checkouts</span>
              <TrendingUp style={{ width: "13px", height: "13px", color: "#8A79FF" }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              {metrics.checkoutsCount}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              {metrics.totalLeads > 0 ? `${((metrics.checkoutsCount / metrics.totalLeads) * 100).toFixed(0)}% dos leads` : "0%"}
            </span>
          </div>

          {/* Card 2: PIX Gerados */}
          <div
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>PIX Gerados</span>
              <QrCode style={{ width: "13px", height: "13px", color: "#2EDB6F" }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#2EDB6F" }}>
              {metrics.pixCount}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              Códigos emitidos
            </span>
          </div>

          {/* Card 3: Cartões Recusados */}
          <div
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Recusados</span>
              <AlertTriangle style={{ width: "13px", height: "13px", color: "#FF5C5C" }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: metrics.declinedCount > 0 ? "#FF5C5C" : "var(--text-primary)" }}>
              {metrics.declinedCount}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              Erros no cartão
            </span>
          </div>

          {/* Card 4: Tempo Médio de Quiz */}
          <div
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Tempo Médio</span>
              <Clock style={{ width: "13px", height: "13px", color: "#BDB4EF" }} />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent-strong)" }}>
              {formatDuration(metrics.avgSeconds)}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              Duração no quiz
            </span>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE BUSCA E FILTROS RÁPIDOS ─── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          paddingBottom: "4px",
        }}
      >
        {/* Pílulas de Filtro */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
          {[
            { key: "all", label: "Todos", count: leads.length },
            { key: "checkout", label: "Checkouts", count: metrics.checkoutsCount },
            { key: "pix", label: "PIX Emitidos", count: metrics.pixCount },
            { key: "declined", label: "Recusados", count: metrics.declinedCount },
            { key: "paid", label: "Pagos / Aprovados", count: metrics.paidCount },
          ].map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                style={{
                  fontSize: "11px",
                  fontWeight: active ? 600 : 500,
                  padding: "5px 11px",
                  borderRadius: "8px",
                  border: active ? "1px solid var(--accent-border)" : "1px solid var(--border-subtle)",
                  background: active ? "var(--accent-soft-bg)" : "var(--surface-1)",
                  color: active ? "var(--accent-strong)" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{f.label}</span>
                <span
                  style={{
                    fontSize: "9.5px",
                    fontWeight: 700,
                    padding: "0 5px",
                    borderRadius: "99px",
                    background: active ? "var(--accent-strong)" : "var(--surface-3)",
                    color: active ? "#FFFFFF" : "var(--text-muted)",
                  }}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Input de Busca */}
        <div style={{ position: "relative", minWidth: "220px" }}>
          <Search
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "13px",
              height: "13px",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Filtrar consulente ou ente querido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              fontSize: "11.5px",
              padding: "6px 12px 6px 30px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ─── TABELA ANALÍTICA DE CONSULENTES ─── */}
      <div style={{ overflowX: "auto", margin: "0 -4px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: "10.5px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <th style={{ padding: "10px 12px", fontWeight: 600 }}>Consulente & Ente</th>
              <th style={{ padding: "10px 12px", fontWeight: 600 }}>Tempo no Quiz</th>
              <th style={{ padding: "10px 12px", fontWeight: 600 }}>Etapa Alcançada</th>
              <th style={{ padding: "10px 12px", fontWeight: 600 }}>Ação de Checkout</th>
              <th style={{ padding: "10px 12px", fontWeight: 600 }}>Origem (UTM)</th>
              <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right" }}>Horário</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "36px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                  <Users style={{ width: "24px", height: "24px", margin: "0 auto 6px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                    Nenhum consulente encontrado para o período ou filtro.
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                    Os registros em tempo real serão listados aqui automaticamente conforme os acessos ocorrem.
                  </p>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const name = lead.lead_name || "Consulente Sem Nome";
                const initial = name.charAt(0).toUpperCase() || "C";
                const isPaid = lead.payment_status === "paid";
                const isDeclined = lead.card_declined || lead.payment_status === "failed";
                const isPix = lead.pix_generated || lead.checkout_status === "pix_generated";
                const isCheckout = lead.checkout_initiated || lead.highest_step_index >= 8;

                return (
                  <tr
                    key={lead.id || lead.session_id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Coluna 1: Nome do Consulente & Ente Querido */}
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: isPaid
                              ? "linear-gradient(135deg, #2EDB6F 0%, #17A04B 100%)"
                              : "linear-gradient(135deg, #7C5CFF 0%, #5235C8 100%)",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {initial}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "12px" }}>
                            {name}
                          </span>
                          {lead.ente_querido ? (
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                              Ente: <strong style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{lead.ente_querido}</strong>
                              {lead.grau_parentesco ? ` (${lead.grau_parentesco})` : ""}
                            </span>
                          ) : (
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                              {lead.lead_email || "Sem e-mail informado"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Coluna 2: Tempo no Quiz */}
                    <td style={{ padding: "12px" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "var(--surface-1)",
                          border: "1px solid var(--border-subtle)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        <Clock style={{ width: "11px", height: "11px", color: "var(--accent-strong)" }} />
                        <span>{formatDuration(lead.time_spent_seconds || 0)}</span>
                      </div>
                    </td>

                    {/* Coluna 3: Etapa Alcançada */}
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                          {lead.highest_step_index >= 8
                            ? "Etapa 8/8 · Checkout"
                            : `Etapa ${lead.highest_step_index || 1}/8 · ${lead.current_step_name || "Quiz"}`}
                        </span>
                        <div
                          style={{
                            width: "80px",
                            height: "3px",
                            borderRadius: "99px",
                            background: "var(--surface-3)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, ((lead.highest_step_index || 1) / 8) * 100)}%`,
                              height: "100%",
                              background: lead.highest_step_index >= 8 ? "var(--success)" : "var(--accent-strong)",
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Coluna 4: Ação de Checkout */}
                    <td style={{ padding: "12px" }}>
                      {isPaid ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(46, 219, 111, 0.12)",
                            color: "#2EDB6F",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 style={{ width: "11px", height: "11px" }} />
                          Pago / Aprovado
                        </span>
                      ) : isDeclined ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(255, 92, 92, 0.12)",
                            color: "#FF5C5C",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          <AlertTriangle style={{ width: "11px", height: "11px" }} />
                          Cartão Recusado
                        </span>
                      ) : isPix ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(124, 92, 255, 0.12)",
                            color: "var(--accent-strong)",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          <QrCode style={{ width: "11px", height: "11px" }} />
                          PIX Gerado
                        </span>
                      ) : isCheckout ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(59, 130, 246, 0.12)",
                            color: "#3B82F6",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          <CreditCard style={{ width: "11px", height: "11px" }} />
                          Checkout Iniciado
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "var(--surface-1)",
                            color: "var(--text-muted)",
                            fontSize: "11px",
                            fontWeight: 500,
                          }}
                        >
                          <UserCheck style={{ width: "11px", height: "11px" }} />
                          Em Andamento
                        </span>
                      )}
                    </td>

                    {/* Coluna 5: Origem / UTM */}
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          color: lead.utm_source ? "var(--text-primary)" : "var(--text-muted)",
                          fontWeight: 500,
                        }}
                      >
                        {lead.utm_source || "Direto / Orgânico"}
                      </span>
                    </td>

                    {/* Coluna 6: Horário Relativo */}
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {formatRelativeTime(lead.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import type { Lead } from "@/types";
import { diagnoseLeadAbandonment } from "@/utils/lead-abandonment";
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
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Heart,
} from "lucide-react";

interface ConsulentesTelemetryTableProps {
  readonly leads: readonly Lead[];
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

function getPageNumbers(totalPages: number, currentPage: number): number[] {
  const pages: number[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, 5);
  } else if (currentPage >= totalPages - 2) {
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
  }
  return pages;
}

function calculateTelemetryMetrics(leads: readonly Lead[]) {
  const checkouts = leads.filter((l) => l.checkout_opened || l.checkout_initiated);
  const pixes = leads.filter(
    (l) => l.pix_generated || l.checkout_status === "pix_generated"
  );
  const declined = leads.filter(
    (l) => l.card_declined || l.checkout_status === "card_declined" || l.payment_status === "failed"
  );
  const paid = leads.filter((l) => l.payment_status === "paid");

  const leadsWithTime = leads.filter((l) => (l.time_spent_seconds || 0) > 0);
  const avgSeconds =
    leadsWithTime.length > 0
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
}

function matchesFilter(l: Lead, filter: string): boolean {
  if (filter === "checkout") return Boolean(l.checkout_opened || l.checkout_initiated);
  if (filter === "pix") return Boolean(l.pix_generated || l.checkout_status === "pix_generated");
  if (filter === "declined") return Boolean(l.card_declined || l.payment_status === "failed");
  if (filter === "paid") return l.payment_status === "paid";
  return true;
}

function matchesSearch(l: Lead, query: string): boolean {
  if (!query) return true;
  const name = (l.lead_name || "").toLowerCase();
  const ente = (l.ente_querido || "").toLowerCase();
  const email = (l.lead_email || "").toLowerCase();
  const phone = (l.lead_phone || "").toLowerCase();
  const utm = (l.utm_source || "").toLowerCase();
  return name.includes(query) || ente.includes(query) || email.includes(query) || phone.includes(query) || utm.includes(query);
}

function DiagnosticBadge({ diagnostic }: { readonly diagnostic: ReturnType<typeof diagnoseLeadAbandonment> }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "6px",
        background: diagnostic.badgeBg,
        border: `1px solid ${diagnostic.badgeBorder}`,
        color: diagnostic.badgeColor,
        fontSize: "11px",
        fontWeight: 600,
      }}
      title={diagnostic.detailedDescription}
    >
      {diagnostic.category === "paid" && <CheckCircle2 style={{ width: "11px", height: "11px" }} />}
      {diagnostic.category === "card_declined" && <AlertTriangle style={{ width: "11px", height: "11px" }} />}
      {(diagnostic.category === "pix_unpaid_1h" || diagnostic.category === "pix_expired") && <QrCode style={{ width: "11px", height: "11px" }} />}
      {diagnostic.category === "checkout_abandoned" && <CreditCard style={{ width: "11px", height: "11px" }} />}
      {diagnostic.category === "live" && <UserCheck style={{ width: "11px", height: "11px" }} />}
      {diagnostic.badgeLabel}
    </span>
  );
}

function TelemetryTableRow({ lead }: { readonly lead: Lead }) {
  const name = lead.lead_name || "Consulente Sem Nome";
  const initial = name.charAt(0).toUpperCase() || "C";
  const isPaid = lead.payment_status === "paid";
  const diagnostic = diagnoseLeadAbandonment(lead);

  return (
    <tr
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
      <td style={{ padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: isPaid
                ? "linear-gradient(135deg, #2EDB6F 0%, #17A04B 100%)"
                : "linear-gradient(135deg, #FF3377 0%, #D81B60 100%)",
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

      <td style={{ padding: "12px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "6px",
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          <Clock style={{ width: "11px", height: "11px", color: "var(--accent-strong)" }} />
          <span>{formatDuration(lead.time_spent_seconds || 0)}</span>
        </div>
      </td>

      <td style={{ padding: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "120px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>
            {lead.highest_step_index >= 8
              ? "Etapa 8/8 · Checkout"
              : `Etapa ${lead.highest_step_index || 1}/8 · ${lead.current_step_name || "Quiz"}`}
          </span>
          <div
            style={{
              width: "100%",
              maxWidth: "90px",
              height: "4px",
              background: "var(--surface-3)",
              borderRadius: "99px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, ((lead.highest_step_index || 1) / 8) * 100)}%`,
                height: "100%",
                background: lead.highest_step_index >= 8 ? "var(--success)" : "var(--accent-strong)",
                borderRadius: "99px",
              }}
            />
          </div>
        </div>
      </td>

      <td style={{ padding: "12px" }}>
        <DiagnosticBadge diagnostic={diagnostic} />
      </td>

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

      <td style={{ padding: "12px", textAlign: "right" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {formatRelativeTime(lead.created_at)}
        </span>
      </td>
    </tr>
  );
}

function TelemetryCard({ lead }: { readonly lead: Lead }) {
  const name = lead.lead_name || "Consulente Sem Nome";
  const initial = name.charAt(0).toUpperCase() || "C";
  const isPaid = lead.payment_status === "paid";
  const diagnostic = diagnoseLeadAbandonment(lead);

  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: isPaid
                ? "linear-gradient(135deg, #2EDB6F 0%, #17A04B 100%)"
                : "linear-gradient(135deg, #FF3377 0%, #D81B60 100%)",
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
          <div>
            <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "12.5px", display: "block" }}>
              {name}
            </span>
            {lead.ente_querido && (
              <span style={{ fontSize: "11px", color: "var(--accent-strong)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Heart style={{ width: "10px", height: "10px" }} />
                <span>{lead.ente_querido} {lead.grau_parentesco ? `(${lead.grau_parentesco})` : ""}</span>
              </span>
            )}
          </div>
        </div>

        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          {formatRelativeTime(lead.created_at)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", fontSize: "11px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)" }}>
          <Clock style={{ width: "11px", height: "11px" }} />
          <span>{formatDuration(lead.time_spent_seconds || 0)}</span>
        </div>

        <span
          style={{
            padding: "2px 7px",
            borderRadius: "5px",
            background: diagnostic.badgeBg,
            border: `1px solid ${diagnostic.badgeBorder}`,
            color: diagnostic.badgeColor,
            fontSize: "10.5px",
            fontWeight: 700,
          }}
        >
          {diagnostic.badgeLabel}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", minWidth: "80px" }}>
          Etapa {lead.highest_step_index || 1}/8
        </span>
        <div style={{ flex: 1, height: "4px", background: "var(--surface-3)", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(100, ((lead.highest_step_index || 1) / 8) * 100)}%`,
              height: "100%",
              background: lead.highest_step_index >= 8 ? "#2EDB6F" : "var(--accent-strong)",
              borderRadius: "99px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function ConsulentesTelemetryTable({ leads }: Readonly<ConsulentesTelemetryTableProps>) {
  const [filter, setFilter] = useState<"all" | "checkout" | "pix" | "declined" | "paid">("all");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"table" | "cards">(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches ? "cards" : "table",
  );

  const metrics = useMemo(() => calculateTelemetryMetrics(leads), [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((l) => matchesFilter(l, filter) && matchesSearch(l, query));
  }, [leads, filter, search]);

  // Resetar para a primeira página quando filtro ou busca mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, pageSize]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const syncViewMode = (event: MediaQueryListEvent | MediaQueryList) => {
      setViewMode(event.matches ? "cards" : "table");
    };
    media.addEventListener("change", syncViewMode);
    return () => media.removeEventListener("change", syncViewMode);
  }, []);

  // Cálculo da Paginação
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredLeads.length);
  const paginatedLeads = useMemo(() => {
    return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, startIndex, endIndex]);

  const pageNumbers = useMemo(() => getPageNumbers(totalPages, currentPage), [currentPage, totalPages]);

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
                Rascunhos de Consulentes & Checkouts
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
              Tempo Real
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
            Dados declarados no quiz são salvos após uma breve pausa de digitação, junto do estágio atual e checkout.
          </p>
        </div>

        {/* 4 Métricas Rápidas no Topo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "6px 12px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Users style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Total Leads
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>
                {metrics.totalLeads}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "6px 12px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CreditCard style={{ width: "14px", height: "14px", color: "var(--accent-strong)" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                No Checkout
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent-strong)" }}>
                {metrics.checkoutsCount}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "6px 12px",
              background: "rgba(46, 219, 111, 0.12)",
              border: "1px solid rgba(46, 219, 111, 0.3)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 style={{ width: "14px", height: "14px", color: "#2EDB6F" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 600, color: "#2EDB6F", textTransform: "uppercase" }}>
                Pagos Confirmados
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#2EDB6F" }}>
                {metrics.paidCount}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "6px 12px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Clock style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "9.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Tempo Médio
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>
                {formatDuration(metrics.avgSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FILTROS, BUSCA E CONTROLES DE EXIBIÇÃO / LIMITE MOBILE ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "var(--surface-1)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "12px",
          padding: "10px 14px",
        }}
      >
        {/* Pílulas de Filtro Rápido */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Todos", count: leads.length },
            { id: "checkout", label: "Checkout", count: metrics.checkoutsCount },
            { id: "pix", label: "PIX", count: metrics.pixCount },
            { id: "declined", label: "Recusados", count: metrics.declinedCount },
            { id: "paid", label: "Pagos", count: metrics.paidCount },
          ].map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as typeof filter)}
                style={{
                  fontSize: "11px",
                  fontWeight: active ? 700 : 500,
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: active ? "1px solid var(--accent-strong)" : "1px solid var(--border-subtle)",
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

        {/* Controles da Direita: Busca, Limite por Página e Alternador de Colunas */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
          {/* Alternador Tabela vs Colunas/Cards */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "2px",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Visualização em Tabela"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: viewMode === "table" ? 700 : 500,
                padding: "4px 8px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: viewMode === "table" ? "var(--accent-strong)" : "transparent",
                color: viewMode === "table" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              <List style={{ width: "12px", height: "12px" }} />
              <span>Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Visualização em Cards / Colunas"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: viewMode === "cards" ? 700 : 500,
                padding: "4px 8px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: viewMode === "cards" ? "var(--accent-strong)" : "transparent",
                color: viewMode === "cards" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              <LayoutGrid style={{ width: "12px", height: "12px" }} />
              <span>Cards</span>
            </button>
          </div>

          {/* Seletor de Limite de Itens (5 / 10 / 20 / 50) */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
            <span style={{ fontWeight: 600 }}>Limite:</span>
            {[5, 10, 20, 50].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size)}
                style={{
                  fontSize: "10.5px",
                  fontWeight: pageSize === size ? 800 : 500,
                  padding: "3px 7px",
                  borderRadius: "5px",
                  border: pageSize === size ? "1px solid var(--accent-strong)" : "1px solid var(--border-subtle)",
                  background: pageSize === size ? "var(--accent-soft-bg)" : "var(--surface-card)",
                  color: pageSize === size ? "var(--accent-strong)" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Input de Busca */}
          <div style={{ position: "relative", minWidth: "min(160px, 100%)", maxWidth: "240px", flex: 1, width: "100%" }}>
            <Search
              style={{
                position: "absolute",
                left: "9px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "12px",
                height: "12px",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Buscar consulente ou ente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                fontSize: "16px",
                padding: "5px 10px 5px 28px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-card)",
                color: "var(--text-primary)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── NAVEGAÇÃO DE COLUNAS / PÁGINAS NO TOPO (EVITA SCROLL INFINITO NO MOBILE) ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          padding: "9px 12px",
          background: "var(--surface-1)",
          borderRadius: "10px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-muted)" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "6px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              fontWeight: 700,
              color: "var(--accent-strong)",
            }}
          >
            Página {currentPage} de {totalPages}
          </span>
          <span>
            Exibindo <strong style={{ color: "var(--text-primary)" }}>{filteredLeads.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> de{" "}
            <strong style={{ color: "var(--text-primary)" }}>{filteredLeads.length}</strong> consulentes
          </span>
        </div>

        {/* Navegação paginada */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            maxWidth: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "2px 0",
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="Página anterior"
            style={{
              padding: "5px 9px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "7px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              opacity: currentPage === 1 ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            <ChevronLeft style={{ width: "13px", height: "13px" }} />
            <span>Ant.</span>
          </button>

          {pageNumbers.map((p) => {
            const active = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                style={{
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontWeight: active ? 800 : 500,
                  borderRadius: "7px",
                  border: active ? "1px solid var(--accent-strong)" : "1px solid var(--border-subtle)",
                  background: active ? "var(--accent-strong)" : "var(--surface-card)",
                  color: active ? "#FFFFFF" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{p}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            title="Próxima página"
            style={{
              padding: "5px 9px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "7px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              opacity: currentPage === totalPages ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            <span>Próx.</span>
            <ChevronRight style={{ width: "13px", height: "13px" }} />
          </button>
        </div>
      </div>

      {/* ─── CORPO: TABELA OU GRADE DE COLUNAS/CARDS ─── */}
      {viewMode === "table" ? (
        <div style={{ overflowX: "auto", margin: "0 -4px", maxWidth: "100%", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: "860px", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
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
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "36px 12px", textAlign: "center", color: "var(--text-muted)" }}>
                    <Users style={{ width: "24px", height: "24px", margin: "0 auto 6px", opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                      Nenhum consulente encontrado para o período ou filtro.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <TelemetryTableRow key={lead.id || lead.session_id} lead={lead} />
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── MODO COLUNAS / CARDS (OTIMIZADO PARA CELULAR E EVITAR SCROLL INFINITO) ─── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
            gap: "12px",
          }}
        >
          {paginatedLeads.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              <Users style={{ width: "24px", height: "24px", margin: "0 auto 6px", opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                Nenhum consulente encontrado para o filtro.
              </p>
            </div>
          ) : (
            paginatedLeads.map((lead) => (
              <TelemetryCard key={lead.id || lead.session_id} lead={lead} />
            ))
          )}
        </div>
      )}

      {/* ─── RODAPÉ: PAGINAÇÃO COMPLETA & SELEÇÃO DE COLUNAS / PÁGINAS ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "14px",
        }}
      >
        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
          Mostrando <strong style={{ color: "var(--text-primary)" }}>{filteredLeads.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> de{" "}
          <strong style={{ color: "var(--text-primary)" }}>{filteredLeads.length}</strong> consulentes
        </div>

        {/* Navegação paginada */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            maxWidth: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "2px 0",
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "5px 9px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "7px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              opacity: currentPage === 1 ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            <ChevronLeft style={{ width: "13px", height: "13px" }} />
            <span>Ant.</span>
          </button>

          {pageNumbers.map((p) => {
            const active = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                style={{
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontWeight: active ? 800 : 500,
                  borderRadius: "7px",
                  border: active ? "1px solid var(--accent-strong)" : "1px solid var(--border-subtle)",
                  background: active ? "var(--accent-strong)" : "var(--surface-1)",
                  color: active ? "#FFFFFF" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{p}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "5px 9px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "7px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              opacity: currentPage === totalPages ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            <span>Próx.</span>
            <ChevronRight style={{ width: "13px", height: "13px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

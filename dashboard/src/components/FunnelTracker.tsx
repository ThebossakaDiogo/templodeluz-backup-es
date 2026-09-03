import { useState } from "react";
import { RefreshCw, X, Search, Sparkles, Users, Radio, Layers, ListFilter } from "lucide-react";
import { Funnel3DView } from "./Funnel3DView";
import type { Lead } from "@/types";

interface FunnelTrackerProps {
  leads: Lead[];
  loading: boolean;
  onRefresh: () => void;
  onlineCount: number;
}

const ETAPAS = [
  { index: 1, name: "intro",    label: "Início do Quiz",        color: "#2563eb" },
  { index: 2, name: "ente",     label: "Nome do Ente Querido",  color: "#0284c7" },
  { index: 3, name: "relacao",  label: "Vínculo Familiar",      color: "#0284c7" },
  { index: 4, name: "tempo",    label: "Tempo e Sentimento",    color: "#06b6d4" },
  { index: 5, name: "mensagem", label: "Mensagem e Intenção",   color: "#06b6d4" },
  { index: 6, name: "confirma", label: "Confirmação dos Dados", color: "#14b8a6" },
  { index: 7, name: "loading",  label: "Preparação da Carta",   color: "#34d399" },
  { index: 8, name: "result",   label: "Checkout e Doação",     color: "#10b981" },
];

const PAYMENT_LABELS: Record<string, string> = {
  paid:            "Pago",
  waiting_payment: "PIX Pendente",
  failed:          "Falhou",
  none:            "Em Navegação",
};

const PAYMENT_BADGES: Record<string, string> = {
  paid:            "badge badge-emerald",
  waiting_payment: "badge badge-pending",
  failed:          "badge badge-failed",
  none:            "badge badge-expired",
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return `${Math.max(1, Math.round(diff))}s atrás`;
  if (diff < 3600) return `${Math.round(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h atrás`;
  return `${Math.round(diff / 86400)}d atrás`;
}

export function FunnelTracker({ leads, loading, onRefresh, onlineCount }: FunnelTrackerProps) {
  const [selected, setSelected] = useState<Lead | null>(null);
  const [search,   setSearch]   = useState("");
  const [viewMode, setViewMode] = useState<"3d" | "list">("3d");

  // Leads ativos nos últimos 15 minutos (ao vivo)
  const recentLeads = leads.filter(
    (l) => new Date(l.updated_at).getTime() >= Date.now() - 15 * 60 * 1000
  );

  const stepCounts = ETAPAS.map((etapa) => ({
    ...etapa,
    count: leads.filter(
      (l) => l.current_step_index === etapa.index || l.current_step_name === etapa.name
    ).length,
    liveCount: recentLeads.filter(
      (l) => l.current_step_index === etapa.index || l.current_step_name === etapa.name
    ).length,
  }));

  const maxCount = Math.max(...stepCounts.map((s) => s.count), 1);

  const filtered = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.lead_name?.toLowerCase().includes(q) ||
      l.lead_phone?.includes(q) ||
      l.ente_querido?.toLowerCase().includes(q) ||
      l.session_id?.includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* BANNER DE DESTAQUE: PESSOAS AO VIVO NO FUNIL (ALTO CONTRASTE CLARO E ESCURO) */}
      <div
        className="card"
        style={{
          padding: "22px 28px",
          background: "var(--live-banner-bg)",
          border: "1px solid var(--live-banner-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "rgba(16, 185, 129, 0.2)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(16, 185, 129, 0.3)",
              flexShrink: 0,
            }}
          >
            <Radio style={{ width: "24px", height: "24px", color: "var(--primary-green)" }} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="pulse-emerald" />
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary-green)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Pessoas Ao Vivo no Funil
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "34px", fontWeight: 900, color: "var(--live-banner-text)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {onlineCount}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
                {onlineCount === 1 ? "consulente navegando agora" : "consulentes navegando agora"}
              </span>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>
              Detecção contínua em tempo real · Atualizado a cada resposta dada no quiz
            </p>
          </div>
        </div>

        {/* Controles do Banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "2px",
            }}
          >
            <button
              onClick={() => setViewMode("3d")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: viewMode === "3d" ? 800 : 600,
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: viewMode === "3d" ? "var(--primary-green)" : "transparent",
                color: viewMode === "3d" ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <Layers style={{ width: "12px", height: "12px" }} />
              Funil 3D
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: viewMode === "list" ? 800 : 600,
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: viewMode === "list" ? "var(--primary-green)" : "transparent",
                color: viewMode === "list" ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <ListFilter style={{ width: "12px", height: "12px" }} />
              Lista de Etapas
            </button>
          </div>

          <button onClick={onRefresh} disabled={loading} className="btn btn-emerald">
            <RefreshCw
              style={{
                width: "13px",
                height: "13px",
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
            Atualizar
          </button>
        </div>
      </div>

      {/* RENDERIZAÇÃO: FUNIL 3D (DESIGN CONFORME A REFERÊNCIA) */}
      {viewMode === "3d" && (
        <Funnel3DView leads={leads} loading={loading} />
      )}

      {/* RENDERIZAÇÃO: LISTA DE ETAPAS (ALTO CONTRASTE CLARO/ESCURO) */}
      {viewMode === "list" && (
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                Distribuição por Etapa do Quiz
              </h3>
              <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "3px 0 0", fontWeight: 500 }}>
                Posicionamento dos consulentes em cada tela do fluxo
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 600 }}>
                Total Histórico: <strong style={{ color: "var(--text-primary)" }}>{leads.length}</strong>
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--primary-green)",
                  background: "rgba(16, 185, 129, 0.14)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  borderRadius: "6px",
                  padding: "3px 9px",
                  fontWeight: 800,
                }}
              >
                {onlineCount} ao vivo
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {stepCounts.map((etapa) => {
              const hasLeads = etapa.count > 0;
              const pct = hasLeads ? Math.round((etapa.count / maxCount) * 100) : 0;

              return (
                <div
                  key={etapa.index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: "var(--bg-surface-alt)",
                  }}
                >
                  {/* Indicador de Número */}
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      background: hasLeads ? "rgba(16, 185, 129, 0.2)" : "rgba(37, 99, 235, 0.12)",
                      border: `1px solid ${hasLeads ? "rgba(16, 185, 129, 0.45)" : "rgba(37, 99, 235, 0.25)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11.5px",
                      fontWeight: 800,
                      color: hasLeads ? "var(--primary-green)" : "var(--primary-blue)",
                      flexShrink: 0,
                    }}
                  >
                    {etapa.index}
                  </div>

                  {/* Nome da Etapa (Legibilidade Garantida) */}
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      width: "210px",
                      flexShrink: 0,
                      fontWeight: hasLeads ? 800 : 600,
                    }}
                  >
                    {etapa.label}
                  </span>

                  {/* Trilha da Barra */}
                  <div
                    style={{
                      flex: 1,
                      height: "10px",
                      background: "var(--border)",
                      borderRadius: "99px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #059669, #10b981)",
                        borderRadius: "99px",
                        boxShadow: hasLeads ? "0 0 10px rgba(16, 185, 129, 0.5)" : "none",
                        transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>

                  {/* Indicador de pessoas ao vivo nesta etapa */}
                  {etapa.liveCount > 0 && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "var(--primary-green)",
                        background: "rgba(16, 185, 129, 0.15)",
                        padding: "3px 8px",
                        borderRadius: "5px",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Users style={{ width: "11px", height: "11px" }} />
                      {etapa.liveCount} agora
                    </span>
                  )}

                  {/* Contagem Histórica */}
                  <span
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 900,
                      color: hasLeads ? "var(--text-primary)" : "var(--text-muted)",
                      width: "36px",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {etapa.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Card: Lista de Leads Registrados */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Leads Registrados no Funil
            </h3>
            <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "2px 0 0", fontWeight: 500 }}>
              Clique sobre a linha para abrir o dossiê do consulente
            </p>
          </div>

          {/* Campo de Busca */}
          <div style={{ position: "relative" }}>
            <Search
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "13px",
                height: "13px",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, ente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                fontSize: "12px",
                padding: "7px 12px 7px 32px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--bg-surface-alt)",
                color: "var(--text-primary)",
                outline: "none",
                width: "260px",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(16, 185, 129, 0.5)";
                e.target.style.boxShadow = "0 0 10px rgba(16, 185, 129, 0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Tabela de Leads */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>
                {["Nome do Consulente", "Ente Querido", "Etapa Atual", "Status do Pagamento", "Origem UTM", "Última Atividade"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "11px 20px",
                      textAlign: "left",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      background: "var(--bg-surface-alt)",
                      borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div className="skeleton" style={{ height: "14px", width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "50px 20px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "12.5px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <Sparkles style={{ width: "24px", height: "24px", color: "#10b981", opacity: 0.7 }} />
                      <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>Nenhum lead capturado no momento</span>
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        Novos consulentes aparecem aqui automaticamente via conexão websocket em tempo real.
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.map((lead, idx) => {
                const etapa = ETAPAS.find((e) => e.index === lead.current_step_index || e.name === lead.current_step_name);
                const isOnline = new Date(lead.updated_at).getTime() >= Date.now() - 15 * 60 * 1000;

                return (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    style={{
                      background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(16, 185, 129, 0.06)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)"; }}
                  >
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isOnline && <div className="pulse-emerald" style={{ width: "7px", height: "7px" }} />}
                        <span>{lead.lead_name || "Anônimo"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontWeight: 600 }}>
                      {lead.ente_querido || "—"}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "var(--primary-blue)", fontWeight: 700 }}>
                      {etapa ? `${etapa.index}. ${etapa.label}` : lead.current_step_name || "—"}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span className={PAYMENT_BADGES[lead.payment_status] ?? "badge badge-expired"}>
                        {PAYMENT_LABELS[lead.payment_status] ?? lead.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "11px", fontWeight: 600 }}>
                      {lead.utm_source || "Orgânico"}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: isOnline ? "var(--primary-green)" : "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap", fontWeight: isOnline ? 800 : 500 }}>
                      {isOnline ? "● Ao vivo agora" : timeAgo(lead.updated_at || lead.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhe do Lead */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999,
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "500px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "26px",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 25px rgba(16, 185, 129, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  Ficha do Consulente
                </h3>
                <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  Informações capturadas no quiz
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="btn"
                style={{ padding: "5px 10px" }}
              >
                <X style={{ width: "14px", height: "14px" }} />
              </button>
            </div>

            {[
              ["Nome do Consulente", selected.lead_name || "Não informado"],
              ["WhatsApp / Telefone", selected.lead_phone || "—"],
              ["Ente Querido", selected.ente_querido || "—"],
              ["Grau de Parentesco", selected.grau_parentesco || "—"],
              ["Etapa no Funil", selected.current_step_name],
              ["Status de Pagamento", PAYMENT_LABELS[selected.payment_status] ?? selected.payment_status],
              ["Valor Selecionado", selected.last_amount_cents > 0 ? `R$ ${(selected.last_amount_cents / 100).toFixed(2)}` : "—"],
              ["Origem (UTM Source)", selected.utm_source || "Orgânico"],
              ["Campanha (UTM Campaign)", selected.utm_campaign || "—"],
              ["Meio (UTM Medium)", selected.utm_medium || "—"],
              ["ID da Sessão", selected.session_id],
              ["Primeiro Acesso", new Date(selected.created_at).toLocaleString("pt-BR")],
              ["Última Ação", new Date(selected.updated_at).toLocaleString("pt-BR")],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--text-primary)", textAlign: "right", maxWidth: "65%" }}>
                  {value}
                </span>
              </div>
            ))}

            {selected.temas_selecionados && selected.temas_selecionados.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Temas de Mensagem Escolhidos
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selected.temas_selecionados.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: "6px",
                        padding: "4px 10px",
                        color: "var(--primary-green)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

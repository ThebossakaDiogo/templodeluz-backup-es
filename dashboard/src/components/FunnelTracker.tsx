import { useState } from "react";
import { RefreshCw, X, Search, Sparkles } from "lucide-react";
import type { Lead } from "@/types";

interface FunnelTrackerProps {
  leads: Lead[];
  loading: boolean;
  onRefresh: () => void;
}

const ETAPAS = [
  { index: 1, name: "intro",    label: "Início do Quiz",        color: "#f43f5e" },
  { index: 2, name: "ente",     label: "Nome do Ente Querido",  color: "#e11d48" },
  { index: 3, name: "relacao",  label: "Vínculo Familiar",      color: "#e11d48" },
  { index: 4, name: "tempo",    label: "Tempo e Sentimento",    color: "#be123c" },
  { index: 5, name: "mensagem", label: "Mensagem e Intenção",   color: "#be123c" },
  { index: 6, name: "confirma", label: "Confirmação dos Dados", color: "#9f1239" },
  { index: 7, name: "loading",  label: "Preparação da Carta",   color: "#881337" },
  { index: 8, name: "result",   label: "Checkout e Doação",     color: "#10b981" },
];

const PAYMENT_LABELS: Record<string, string> = {
  paid:            "Pago",
  waiting_payment: "PIX Pendente",
  failed:          "Falhou",
  none:            "Em Navegação",
};

const PAYMENT_BADGES: Record<string, string> = {
  paid:            "badge badge-paid",
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

export function FunnelTracker({ leads, loading, onRefresh }: FunnelTrackerProps) {
  const [selected, setSelected] = useState<Lead | null>(null);
  const [search,   setSearch]   = useState("");

  const stepCounts = ETAPAS.map((etapa) => ({
    ...etapa,
    count: leads.filter(
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
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
              Rastreamento de Leads em Tempo Real
            </h2>
            <span className="badge badge-ruby" style={{ fontSize: "10px" }}>
              Ao Vivo
            </span>
          </div>
          <p style={{ fontSize: "11.5px", color: "#a1a1aa", margin: "4px 0 0", fontWeight: 500 }}>
            {loading ? "Sincronizando com Supabase..." : `${leads.length} lead${leads.length !== 1 ? "s" : ""} registrado${leads.length !== 1 ? "s" : ""} · Atualização automática via WebSocket`}
          </p>
        </div>

        <button onClick={onRefresh} disabled={loading} className="btn btn-ruby">
          <RefreshCw
            style={{
              width: "13px",
              height: "13px",
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
          Sincronizar Agora
        </button>
      </div>

      {/* Card: Distribuição por Etapa do Quiz */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Distribuição por Etapa do Quiz
            </h3>
            <p style={{ fontSize: "11px", color: "#a1a1aa", margin: "3px 0 0" }}>
              Posição atual dos usuários navegando no funil
            </p>
          </div>
          <span style={{ fontSize: "11px", color: "#71717a", fontWeight: 600 }}>
            Total: <strong style={{ color: "#ffffff" }}>{leads.length}</strong>
          </span>
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
                  padding: "6px 8px",
                  borderRadius: "8px",
                  transition: "background 0.15s ease",
                }}
              >
                {/* Indicador de Número Ruby */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: hasLeads ? "rgba(225,29,72,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${hasLeads ? "rgba(225,29,72,0.5)" : "rgba(255,255,255,0.1)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: hasLeads ? "#f43f5e" : "#71717a",
                    flexShrink: 0,
                  }}
                >
                  {etapa.index}
                </div>

                {/* Nome da Etapa */}
                <span
                  style={{
                    fontSize: "12.5px",
                    color: hasLeads ? "#ffffff" : "#d4d4d8",
                    width: "200px",
                    flexShrink: 0,
                    fontWeight: hasLeads ? 700 : 500,
                  }}
                >
                  {etapa.label}
                </span>

                {/* Trilha da Barra com Alta Visibilidade */}
                <div
                  style={{
                    flex: 1,
                    height: "10px",
                    background: "#191920",
                    border: "1px solid #282833",
                    borderRadius: "99px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: etapa.index === 8
                        ? "linear-gradient(90deg, #10b981, #34d399)"
                        : "linear-gradient(90deg, #e11d48, #f43f5e)",
                      borderRadius: "99px",
                      boxShadow: hasLeads ? "0 0 10px rgba(225,29,72,0.5)" : "none",
                      transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>

                {/* Contagem */}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: hasLeads ? "#ffffff" : "#52525b",
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
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
              Leads Registrados
            </h3>
            <p style={{ fontSize: "11px", color: "#a1a1aa", margin: "2px 0 0", fontWeight: 500 }}>
              Clique em qualquer lead para inspecionar os detalhes
            </p>
          </div>

          {/* Campo de Busca Estilizado */}
          <div style={{ position: "relative" }}>
            <Search
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "13px",
                height: "13px",
                color: "#71717a",
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
                color: "#ffffff",
                outline: "none",
                width: "260px",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(225,29,72,0.5)";
                e.target.style.boxShadow = "0 0 10px rgba(225,29,72,0.2)";
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
                {["Nome do Consulente", "Ente Querido", "Etapa Atual", "Status do Pagamento", "Origem UTM", "Cadastrado Há"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "11px 20px",
                      textAlign: "left",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      color: "#a1a1aa",
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
                      color: "#a1a1aa",
                      fontSize: "12.5px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <Sparkles style={{ width: "24px", height: "24px", color: "#e11d48", opacity: 0.7 }} />
                      <span style={{ color: "#ffffff", fontWeight: 700 }}>Nenhum lead capturado no momento</span>
                      <span style={{ fontSize: "11.5px", color: "#71717a" }}>
                        Assim que um usuário preencher o primeiro passo do quiz, ele aparecerá aqui instantaneamente.
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.map((lead, idx) => {
                const etapa = ETAPAS.find((e) => e.index === lead.current_step_index || e.name === lead.current_step_name);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    style={{
                      background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(225,29,72,0.06)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)"; }}
                  >
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap" }}>
                      {lead.lead_name || "Anônimo"}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "#d4d4d8", fontWeight: 500 }}>
                      {lead.ente_querido || "—"}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "#ffffff", fontWeight: 600 }}>
                      {etapa ? `${etapa.index}. ${etapa.label}` : lead.current_step_name || "—"}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span className={PAYMENT_BADGES[lead.payment_status] ?? "badge badge-expired"}>
                        {PAYMENT_LABELS[lead.payment_status] ?? lead.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "#a1a1aa", fontSize: "11px" }}>
                      {lead.utm_source || "Orgânico"}
                    </td>
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "#a1a1aa", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {timeAgo(lead.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhe do Lead (Ruby Luxury) */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999,
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "480px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "26px",
              border: "1px solid rgba(225,29,72,0.4)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.9), 0 0 25px rgba(225,29,72,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Ficha do Consulente
                </h3>
                <p style={{ fontSize: "11px", color: "#a1a1aa", margin: "2px 0 0" }}>
                  Informações capturadas no funil
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
                  padding: "9px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", textAlign: "right", maxWidth: "65%" }}>
                  {value}
                </span>
              </div>
            ))}

            {selected.temas_selecionados && selected.temas_selecionados.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Temas de Mensagem Escolhidos
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selected.temas_selecionados.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "rgba(225,29,72,0.12)",
                        border: "1px solid rgba(225,29,72,0.3)",
                        borderRadius: "6px",
                        padding: "4px 10px",
                        color: "#ffffff",
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

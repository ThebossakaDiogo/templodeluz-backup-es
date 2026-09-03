import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import type { Lead } from "@/types";

interface FunnelTrackerProps {
  leads: Lead[];
  loading: boolean;
  onRefresh: () => void;
}

const ETAPAS = [
  { index: 1, name: "intro",    label: "Início do Quiz"         },
  { index: 2, name: "ente",     label: "Nome do Ente Querido"   },
  { index: 3, name: "relacao",  label: "Vínculo Familiar"       },
  { index: 4, name: "tempo",    label: "Tempo e Sentimento"     },
  { index: 5, name: "mensagem", label: "Mensagem e Intenção"    },
  { index: 6, name: "confirma", label: "Confirmação dos Dados"  },
  { index: 7, name: "loading",  label: "Preparação da Carta"    },
  { index: 8, name: "result",   label: "Checkout e Doação"      },
];

const PAYMENT_LABELS: Record<string, string> = {
  paid:            "Pago",
  waiting_payment: "PIX Pendente",
  failed:          "Falhou",
  none:            "Sem pagamento",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid:            "var(--success)",
  waiting_payment: "var(--warning)",
  failed:          "var(--danger)",
  none:            "var(--text-muted)",
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s atrás`;
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Rastreamento ao Vivo
          </h2>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "3px 0 0" }}>
            {loading ? "Carregando..." : `${leads.length} lead${leads.length !== 1 ? "s" : ""} registrados · atualiza a cada 30 segundos`}
          </p>
        </div>
        <button onClick={onRefresh} disabled={loading} className="btn">
          <RefreshCw
            style={{
              width: "13px",
              height: "13px",
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
          Atualizar
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Funil de Etapas */}
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 16px" }}>
          Distribuição por Etapa do Quiz
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {stepCounts.map((etapa) => {
            const pct = Math.round((etapa.count / maxCount) * 100);
            return (
              <div key={etapa.index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  width: "16px",
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {etapa.index}
                </span>
                <span style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  width: "180px",
                  flexShrink: 0,
                  fontWeight: 500,
                }}>
                  {etapa.label}
                </span>
                <div style={{ flex: 1, height: "6px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: etapa.index === 8 ? "var(--success)" : "var(--accent)",
                    borderRadius: "99px",
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: etapa.count > 0 ? "var(--text-primary)" : "var(--text-muted)",
                  width: "30px",
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {etapa.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Leads */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Leads Registrados
          </h3>
          <input
            type="text"
            placeholder="Buscar por nome, telefone, ente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "var(--bg-surface-alt)",
              color: "var(--text-primary)",
              outline: "none",
              width: "240px",
            }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>
                {["Nome", "Ente Querido", "Etapa Atual", "Status do Pag.", "Origem UTM", "Há quanto tempo"].map((col) => (
                  <th key={col} style={{
                    padding: "9px 14px",
                    textAlign: "left",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: "var(--bg-surface-alt)",
                    borderBottom: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <div className="skeleton" style={{ height: "12px", width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                    Nenhum lead encontrado.
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
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--border-subtle)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)"; }}
                  >
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {lead.lead_name || "Anônimo"}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                      {lead.ente_querido || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                      {etapa ? `${etapa.index}. ${etapa.label}` : lead.current_step_name || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: PAYMENT_COLORS[lead.payment_status] ?? "var(--text-muted)",
                      }}>
                        {PAYMENT_LABELS[lead.payment_status] ?? lead.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "11px" }}>
                      {lead.utm_source || "Orgânico"}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {timeAgo(lead.created_at)}
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
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "460px", maxHeight: "80vh", overflowY: "auto", padding: "24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Detalhes do Lead
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="btn"
                style={{ padding: "4px 8px" }}
              >
                <X style={{ width: "14px", height: "14px" }} />
              </button>
            </div>

            {[
              ["Nome", selected.lead_name || "Não informado"],
              ["Telefone", selected.lead_phone || "—"],
              ["Ente Querido", selected.ente_querido || "—"],
              ["Grau de Parentesco", selected.grau_parentesco || "—"],
              ["Etapa Atual", selected.current_step_name],
              ["Status de Pagamento", PAYMENT_LABELS[selected.payment_status] ?? selected.payment_status],
              ["Valor (centavos)", selected.last_amount_cents > 0 ? `R$ ${(selected.last_amount_cents / 100).toFixed(2)}` : "—"],
              ["UTM Source", selected.utm_source || "Orgânico"],
              ["UTM Medium", selected.utm_medium || "—"],
              ["UTM Campaign", selected.utm_campaign || "—"],
              ["Session ID", selected.session_id],
              ["Cadastrado em", new Date(selected.created_at).toLocaleString("pt-BR")],
              ["Última atualização", new Date(selected.updated_at).toLocaleString("pt-BR")],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", textAlign: "right", maxWidth: "60%" }}>
                  {value}
                </span>
              </div>
            ))}

            {selected.temas_selecionados && selected.temas_selecionados.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Temas Selecionados
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selected.temas_selecionados.map((t) => (
                    <span key={t} style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "var(--bg-surface-alt)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "3px 10px",
                      color: "var(--text-secondary)",
                    }}>
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

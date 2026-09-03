import { useState } from "react";
import { MessageCircle, Search, ExternalLink, QrCode, CreditCard, Clock, RefreshCw } from "lucide-react";
import type { WhatsAppMessage } from "@/types";

interface WhatsAppTrackerProps {
  messages: WhatsAppMessage[];
  loading: boolean;
  onRefresh: () => void;
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WhatsAppTracker({ messages, loading, onRefresh }: WhatsAppTrackerProps) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<"all" | "pix" | "credit_card" | "pending">("all");
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null);

  const pixCount = messages.filter((m) => m.payment_method === "pix" && m.payment_status === "paid").length;
  const cardCount = messages.filter((m) => m.payment_method === "credit_card" && m.payment_status === "paid").length;
  const pendingCount = messages.filter((m) => m.payment_status === "pending" || m.payment_method === "pending").length;

  const filteredMessages = messages.filter((m) => {
    if (methodFilter === "pix" && (m.payment_method !== "pix" || m.payment_status !== "paid")) return false;
    if (methodFilter === "credit_card" && (m.payment_method !== "credit_card" || m.payment_status !== "paid")) return false;
    if (methodFilter === "pending" && m.payment_status === "paid") return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.customer_name.toLowerCase().includes(q) ||
      (m.ente_querido && m.ente_querido.toLowerCase().includes(q)) ||
      (m.customer_phone && m.customer_phone.includes(q))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Cards de Métricas do WhatsApp */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>
        {/* Total de Mensagens */}
        <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
              }}
            >
              <MessageCircle style={{ width: "18px", height: "18px" }} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary-green)", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
              Total Contatos
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Conversas Iniciadas
          </span>
          <span style={{ fontSize: "26px", fontWeight: 900, color: "var(--text-primary)" }}>
            {messages.length}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Clientes que clicaram para falar com a médium</span>
        </div>

        {/* Pagos via PIX */}
        <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
              }}
            >
              <QrCode style={{ width: "18px", height: "18px" }} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
              PIX Confirmado
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Clientes Pagos no PIX
          </span>
          <span style={{ fontSize: "26px", fontWeight: 900, color: "#10b981" }}>
            {pixCount}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Enviaram mensagem após liquidar o PIX</span>
        </div>

        {/* Pagos via Cartão Stripe */}
        <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <CreditCard style={{ width: "18px", height: "18px" }} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#818cf8", background: "rgba(99, 102, 241, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
              Cartão Aprovado
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Clientes Pagos no Cartão
          </span>
          <span style={{ fontSize: "26px", fontWeight: 900, color: "#818cf8" }}>
            {cardCount}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Enviaram mensagem após aprovar na Stripe</span>
        </div>

        {/* Pendentes / Recuperação */}
        <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f59e0b",
              }}
            >
              <Clock style={{ width: "18px", height: "18px" }} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
              Recuperação
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Pendentes no WhatsApp
          </span>
          <span style={{ fontSize: "26px", fontWeight: 900, color: "#f59e0b" }}>
            {pendingCount}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Chamaram sem concluir doação (oportunidade)</span>
        </div>
      </div>

      {/* Tabela de Clientes do WhatsApp */}
      <div className="card" style={{ overflow: "hidden" }}>
        {/* Cabeçalho da Tabela */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Clientes que Enviaram Mensagem no WhatsApp</span>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary-green)", background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px", borderRadius: "6px" }}>
                {filteredMessages.length} registrados
              </span>
            </h3>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0", fontWeight: 500 }}>
              Registro em tempo real com nome, ente querido, forma de pagamento e detalhes da carta
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Filtros por Método */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--bg-surface-alt)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "2px",
                gap: "2px",
              }}
            >
              {[
                { id: "all", label: "Todos" },
                { id: "pix", label: "Pagos no PIX", icon: QrCode },
                { id: "credit_card", label: "Pagos no Cartão", icon: CreditCard },
                { id: "pending", label: "Pendentes", icon: Clock },
              ].map((f) => {
                const active = methodFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setMethodFilter(f.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: active ? 800 : 600,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: active
                        ? f.id === "credit_card"
                          ? "#6366f1"
                          : f.id === "pending"
                          ? "#f59e0b"
                          : "var(--primary-green)"
                        : "transparent",
                      color: active ? "#ffffff" : "var(--text-secondary)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.icon && <f.icon style={{ width: "11px", height: "11px" }} />}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Campo de Busca */}
            <div style={{ position: "relative" }}>
              <Search
                style={{
                  position: "absolute",
                  left: "9px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "12px",
                  height: "12px",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Buscar consulente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  fontSize: "11.5px",
                  padding: "5px 10px 5px 28px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  background: "var(--bg-surface-alt)",
                  color: "var(--text-primary)",
                  outline: "none",
                  width: "170px",
                }}
              />
            </div>

            <button onClick={onRefresh} className="btn" style={{ padding: "6px 10px" }} title="Atualizar mensagens">
              <RefreshCw style={{ width: "12px", height: "12px", animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {/* Lista / Tabela */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>
                {["Nome do Consulente", "Ente Querido & Vínculo", "Forma de Pagamento", "Valor", "Origem", "Horário", "Ação"].map((col) => (
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
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div className="skeleton" style={{ height: "14px", width: "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && filteredMessages.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "48px 20px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "12.5px",
                    }}
                  >
                    Nenhuma mensagem registrada no WhatsApp com os filtros aplicados.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredMessages.map((msg, idx) => {
                  const isPaidPix = msg.payment_method === "pix" && msg.payment_status === "paid";
                  const isPaidCard = msg.payment_method === "credit_card" && msg.payment_status === "paid";
                  const isPending = !isPaidPix && !isPaidCard;

                  return (
                    <tr
                      key={msg.id}
                      style={{
                        background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = "rgba(16, 185, 129, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)";
                      }}
                    >
                      {/* Nome do Consulente */}
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "7px",
                              background: "rgba(16, 185, 129, 0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#10b981",
                              fontWeight: 900,
                              fontSize: "11px",
                            }}
                          >
                            {msg.customer_name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{msg.customer_name}</span>
                        </div>
                      </td>

                      {/* Ente Querido & Vínculo */}
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
                        <strong style={{ color: "var(--text-primary)", fontSize: "12px", display: "block" }}>
                          {msg.ente_querido || "Não informado"}
                        </strong>
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                          {msg.grau_parentesco || "Familiar"}
                        </span>
                      </td>

                      {/* Forma de Pagamento com Badge */}
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
                        {isPaidPix && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "3px 9px",
                              borderRadius: "6px",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#10b981",
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                            }}
                          >
                            <QrCode style={{ width: "12px", height: "12px" }} />
                            PIX Pago
                          </span>
                        )}

                        {isPaidCard && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "3px 9px",
                              borderRadius: "6px",
                              background: "rgba(99, 102, 241, 0.15)",
                              color: "#818cf8",
                              border: "1px solid rgba(99, 102, 241, 0.35)",
                            }}
                          >
                            <CreditCard style={{ width: "12px", height: "12px" }} />
                            Cartão Stripe Pago
                          </span>
                        )}

                        {isPending && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "3px 9px",
                              borderRadius: "6px",
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#f59e0b",
                              border: "1px solid rgba(245, 158, 11, 0.35)",
                            }}
                          >
                            <Clock style={{ width: "12px", height: "12px" }} />
                            Pagamento Pendente
                          </span>
                        )}
                      </td>

                      {/* Valor */}
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 800, color: !isPending ? "var(--primary-green)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {msg.amount_cents > 0 ? formatBRL(msg.amount_cents) : "R$ 0,00"}
                      </td>

                      {/* Origem */}
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap" }}>
                        {msg.source_page || "escrever-carta"}
                      </td>

                      {/* Horário */}
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap" }}>
                        {formatDate(msg.created_at)}
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {msg.message_preview && (
                            <button
                              onClick={() => setSelectedMessage(msg)}
                              className="btn"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              Ver Carta
                            </button>
                          )}

                          {msg.customer_phone && (
                            <a
                              href={`https://wa.me/${msg.customer_phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-emerald"
                              style={{ padding: "4px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <span>Conversar</span>
                              <ExternalLink style={{ width: "11px", height: "11px" }} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pré-visualização da Mensagem */}
      {selectedMessage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  Carta enviada por {selectedMessage.customer_name}
                </h4>
                <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  Ente querido: {selectedMessage.ente_querido} ({selectedMessage.grau_parentesco})
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="btn"
                style={{ padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "var(--bg-surface-alt)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "16px",
                fontSize: "12px",
                color: "var(--text-primary)",
                maxHeight: "300px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {selectedMessage.message_preview}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedMessage(null)} className="btn btn-emerald">
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

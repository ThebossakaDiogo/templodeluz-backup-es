import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle, Search, ExternalLink, QrCode, CreditCard, Clock, RefreshCw, X } from "lucide-react";
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
  const previewRef = useRef<HTMLDialogElement>(null);
  const previewOpenerRef = useRef<HTMLElement | null>(null);
  const previewTitleId = useId();

  const closePreview = () => {
    setSelectedMessage(null);
  };

  useEffect(() => {
    if (!selectedMessage) return;
    const dialog = previewRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previewOpenerRef.current = opener;
    dialog.showModal();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button, a[href], input, textarea, select, [tabindex]:not([tabindex='-1'])")].filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trapFocus);
    return () => {
      dialog.removeEventListener("keydown", trapFocus);
      dialog.close();
      const restore = previewOpenerRef.current;
      previewOpenerRef.current = null;
      restore?.focus();
    };
  }, [selectedMessage]);

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
    <div className="whatsapp-tracker">
      {/* Cards de Métricas do WhatsApp */}
      <div className="metric-cards-grid">
        {/* Total de Mensagens */}
        <div className="card whatsapp-metric-card">
          <div className="whatsapp-metric-header">
            <div className="whatsapp-metric-icon green">
              <MessageCircle className="whatsapp-method-icon" />
            </div>
            <span className="whatsapp-metric-badge green">Total Contatos</span>
          </div>
          <span className="whatsapp-metric-label">Conversas Iniciadas</span>
          <span className="whatsapp-metric-value">{messages.length}</span>
          <span className="whatsapp-metric-desc">Clientes que clicaram para falar com a médium</span>
        </div>

        {/* Pagos via PIX */}
        <div className="card whatsapp-metric-card">
          <div className="whatsapp-metric-header">
            <div className="whatsapp-metric-icon green">
              <QrCode className="whatsapp-method-icon" />
            </div>
            <span className="whatsapp-metric-badge green">PIX Confirmado</span>
          </div>
          <span className="whatsapp-metric-label">Clientes Pagos no PIX</span>
          <span className="whatsapp-metric-value green">{pixCount}</span>
          <span className="whatsapp-metric-desc">Enviaram mensagem após liquidar o PIX</span>
        </div>

        {/* Pagos via Cartão Stripe */}
        <div className="card whatsapp-metric-card">
          <div className="whatsapp-metric-header">
            <div className="whatsapp-metric-icon purple">
              <CreditCard className="whatsapp-method-icon" />
            </div>
            <span className="whatsapp-metric-badge purple">Cartão Aprovado</span>
          </div>
          <span className="whatsapp-metric-label">Clientes Pagos no Cartão</span>
          <span className="whatsapp-metric-value purple">{cardCount}</span>
          <span className="whatsapp-metric-desc">Enviaram mensagem após aprovar na Stripe</span>
        </div>

        {/* Pendentes / Recuperação */}
        <div className="card whatsapp-metric-card">
          <div className="whatsapp-metric-header">
            <div className="whatsapp-metric-icon yellow">
              <Clock className="whatsapp-method-icon" />
            </div>
            <span className="whatsapp-metric-badge yellow">Recuperação</span>
          </div>
          <span className="whatsapp-metric-label">Pendentes no WhatsApp</span>
          <span className="whatsapp-metric-value yellow">{pendingCount}</span>
          <span className="whatsapp-metric-desc">Chamaram sem concluir doação (oportunidade)</span>
        </div>
      </div>

      {/* Tabela de Clientes do WhatsApp */}
      <div className="card whatsapp-panel">
        {/* Cabeçalho da Tabela */}
        <div className="whatsapp-table-toolbar">
          <div>
            <h3>
              <span>Clientes que Enviaram Mensagem no WhatsApp</span>
              <span className="whatsapp-metric-badge green">{filteredMessages.length} registrados</span>
            </h3>
            <p>
              Registro em tempo real com nome, ente querido, forma de pagamento e detalhes da carta
            </p>
          </div>

          <div className="whatsapp-controls">
            {/* Filtros por Método */}
            <div className="whatsapp-filters" role="group" aria-label="Filtrar mensagens por pagamento">
              {([
                { id: "all", label: "Todos" },
                { id: "pix", label: "Pagos no PIX", icon: QrCode },
                { id: "credit_card", label: "Pagos no Cartão", icon: CreditCard },
                { id: "pending", label: "Pendentes", icon: Clock },
              ] as const).map((f) => {
                const active = methodFilter === f.id;
                return (
                  <button
                    type="button"
                    key={f.id}
                    className={`${active ? "active" : ""} whatsapp-filter-${f.id}`}
                    aria-pressed={active}
                    onClick={() => setMethodFilter(f.id)}
                  >
                    {"icon" in f && <f.icon className="orders-seg-icon" />}
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Campo de Busca */}
            <div className="orders-search">
              <Search className="orders-search-icon" />
              <input
                type="text"
                aria-label="Buscar consulente"
                placeholder="Buscar consulente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button type="button" onClick={onRefresh} className="btn whatsapp-refresh" title="Atualizar mensagens" aria-label="Atualizar mensagens" disabled={loading}>
              <RefreshCw className={`whatsapp-badge-icon${loading ? " spinning" : ""}`} />
            </button>
          </div>
        </div>

        {/* Lista / Tabela */}
        <div className="whatsapp-table-scroll" style={{ maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="whatsapp-table" style={{ minWidth: "920px" }}>
            <thead>
              <tr>
                {["Nome do Consulente", "Ente Querido & Vínculo", "Forma de Pagamento", "Valor", "Origem", "Horário", "Ação"].map((col) => (
                  <th key={col} scope="col">
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
                      <td key={j}>
                        <div className="skeleton whatsapp-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && filteredMessages.length === 0 && (
                <tr>
                  <td className="whatsapp-empty" colSpan={7}>
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
                      className={`whatsapp-row ${idx % 2 === 0 ? "" : "odd"}`}
                    >
                      {/* Nome do Consulente */}
                      <td className="whatsapp-cell whatsapp-cell-nowrap">
                        <div className="whatsapp-customer">
                          <div className="whatsapp-avatar">
                            {msg.customer_name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="whatsapp-name">{msg.customer_name}</span>
                        </div>
                      </td>

                      {/* Ente Querido & Vínculo */}
                      <td className="whatsapp-cell whatsapp-cell-nowrap">
                        <strong className="whatsapp-name">{msg.ente_querido || "Não informado"}</strong>
                        <span className="whatsapp-metric-desc">{msg.grau_parentesco || "Familiar"}</span>
                      </td>

                      {/* Forma de Pagamento com Badge */}
                      <td className="whatsapp-cell whatsapp-cell-nowrap">
                        {isPaidPix && (
                          <span className="whatsapp-badge pix">
                            <QrCode className="whatsapp-badge-icon" />
                            PIX Pago
                          </span>
                        )}

                        {isPaidCard && (
                          <span className="whatsapp-badge stripe">
                            <CreditCard className="whatsapp-badge-icon" />
                            Cartão Stripe Pago
                          </span>
                        )}

                        {isPending && (
                          <span className="whatsapp-badge pending">
                            <Clock className="whatsapp-badge-icon" />
                            Pagamento Pendente
                          </span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className={`whatsapp-cell whatsapp-cell-nowrap whatsapp-amount ${isPending ? "pending" : "paid"}`}>
                        {msg.amount_cents > 0 ? formatBRL(msg.amount_cents) : "R$ 0,00"}
                      </td>

                      {/* Origem */}
                      <td className="whatsapp-cell whatsapp-cell-muted whatsapp-cell-nowrap">
                        {msg.source_page || "escrever-carta"}
                      </td>

                      {/* Horário */}
                      <td className="whatsapp-cell whatsapp-cell-muted whatsapp-cell-nowrap">
                        {formatDate(msg.created_at)}
                      </td>

                      {/* Ações */}
                      <td className="whatsapp-cell whatsapp-cell-nowrap">
                        <div className="whatsapp-actions">
                          {msg.message_preview && (
                            <button
                              type="button"
                              onClick={() => setSelectedMessage(msg)}
                              className="btn whatsapp-action"
                            >
                              Ver Carta
                            </button>
                          )}

                          {msg.customer_phone && (
                            <a
                              href={`https://wa.me/${msg.customer_phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-emerald whatsapp-action"
                            >
                              <span>Conversar</span>
                              <ExternalLink className="orders-action-icon" />
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
        <dialog
          ref={previewRef}
          className="card whatsapp-modal-card"
          aria-labelledby={previewTitleId}
          onCancel={closePreview}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
              closePreview();
            }
          }}
        >
            <div className="whatsapp-modal-header">
              <div>
                <h4 id={previewTitleId}>
                  Carta enviada por {selectedMessage.customer_name}
                </h4>
                <p>
                  Ente querido: {selectedMessage.ente_querido} ({selectedMessage.grau_parentesco})
                </p>
              </div>
              <button
                type="button"
                autoFocus
                onClick={closePreview}
                className="btn whatsapp-close"
                aria-label="Fechar"
              >
                <X className="whatsapp-badge-icon" />
              </button>
            </div>

            <div className="whatsapp-modal-body">
              {selectedMessage.message_preview}
            </div>

            <div className="whatsapp-modal-footer">
              <button type="button" onClick={closePreview} className="btn btn-emerald">
                Fechar Visualização
              </button>
            </div>
        </dialog>
      )}
    </div>
  );
}

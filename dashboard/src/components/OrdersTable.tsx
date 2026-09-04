import { useState } from "react";
import { Search, Download, CreditCard, QrCode, Smartphone, Sparkles, CheckCircle } from "lucide-react";
import type { PaymentOrder, Lead } from "@/types";
import { ProductDeliveryModal, getDeliveredOrders } from "./ProductDeliveryModal";
import { EvolutionQRModal } from "./EvolutionQRModal";

interface OrdersTableProps {
  orders: PaymentOrder[];
  loading?: boolean;
  compact?: boolean;
  leads?: readonly Lead[];
}

const STATUS_LABELS: Record<string, string> = {
  paid:       "Pago",
  pending:    "Pendente",
  creating:   "Gerando PIX",
  failed:     "Falhou",
  expired:    "Expirado",
  in_dispute: "Em disputa",
  chargeback: "Estornado",
};

const STATUS_CLASS: Record<string, string> = {
  paid:       "badge badge-emerald",
  pending:    "badge badge-pending",
  creating:   "badge badge-cyan",
  failed:     "badge badge-failed",
  expired:    "badge badge-expired",
  in_dispute: "badge badge-pending",
  chargeback: "badge badge-failed",
};

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

export function OrdersTable({ orders, loading, compact = false, leads = [] }: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "pix" | "credit_card">("all");
  const [deliveryOrder, setDeliveryOrder] = useState<PaymentOrder | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [deliveredMap, setDeliveredMap] = useState<Record<string, string>>(getDeliveredOrders);

  const filteredOrders = orders.filter((o) => {
    // Filtro por status
    if (statusFilter === "paid" && o.status !== "paid") return false;
    if (statusFilter === "pending" && o.status !== "pending" && o.status !== "creating") return false;

    // Filtro por método
    if (methodFilter === "pix" && o.payment_method === "credit_card") return false;
    if (methodFilter === "credit_card" && o.payment_method !== "credit_card") return false;

    // Busca textual
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q) ||
      o.product_name.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  const exportFiltered = () => {
    const rows = [
      "ID,Nome,E-mail,Produto,Valor (R$),Status,Metodo,Data",
      ...filteredOrders.map(
        (o) =>
          `${o.id},"${o.customer_name}","${o.customer_email}","${o.product_name}",${(
            o.amount_cents / 100
          ).toFixed(2)},${o.status},${o.payment_method},${o.created_at}`
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLS = compact
    ? ["Nome do Consulente", "Produto", "Valor", "Método / Gateway", "Status", "Data", "Ações"]
    : ["Nome do Consulente", "E-mail", "Produto", "Valor", "Método / Gateway", "Status", "Data", "Entrega WhatsApp"];

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Barra de Título e Filtros */}
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
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {compact ? "Últimos Pedidos Registrados" : "Auditoria de Pedidos do Gateway"}
          </h3>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              margin: "2px 0 0",
              fontWeight: 500,
            }}
          >
            {loading
              ? "Carregando transações..."
              : `${filteredOrders.length} de ${orders.length} pedidos · Telemetria em tempo real`}
          </p>
        </div>

        {/* Filtros e Busca */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Filtro por Método de Pagamento (PIX vs Cartão) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#0D0E16",
              border: "1px solid #252733",
              borderRadius: "10px",
              padding: "3px",
              gap: "2px",
            }}
          >
            {[
              { id: "all", label: "Todos Métodos" },
              { id: "pix", label: "PIX", icon: QrCode },
              { id: "credit_card", label: "Cartão Stripe", icon: CreditCard },
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
                    fontWeight: active ? 600 : 400,
                    padding: "4px 8px",
                    borderRadius: "7px",
                    border: "none",
                    cursor: "pointer",
                    background: active ? "#292A35" : "transparent",
                    color: active ? "#F5F4FA" : "#707281",
                    boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                    transition: "all 0.14s ease",
                  }}
                >
                  {f.icon && <f.icon style={{ width: "11px", height: "11px" }} />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Abas de Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#0D0E16",
              border: "1px solid #252733",
              borderRadius: "10px",
              padding: "3px",
              gap: "2px",
            }}
          >
            {[
              { id: "all", label: "Todos" },
              { id: "paid", label: "Pagos" },
              { id: "pending", label: "Pendentes" },
            ].map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  style={{
                    fontSize: "11px",
                    fontWeight: active ? 600 : 400,
                    padding: "4px 9px",
                    borderRadius: "7px",
                    border: "none",
                    cursor: "pointer",
                    background: active ? "#292A35" : "transparent",
                    color: active ? (f.id === "paid" ? "#2EDB6F" : "#F5F4FA") : "#707281",
                    boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                    transition: "all 0.14s ease",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
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
                color: "#707281",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                fontSize: "12px",
                padding: "6px 12px 6px 30px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-1)",
                color: "var(--text-primary)",
                width: "200px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Botão Conectar WhatsApp */}
          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="btn"
            style={{
              fontSize: "11.5px",
              padding: "6px 12px",
              gap: "6px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10B981",
              cursor: "pointer",
            }}
            title="Conectar WhatsApp na Evolution API via QR Code"
          >
            <Smartphone style={{ width: "13px", height: "13px" }} />
            WhatsApp QR Code
          </button>

          {/* Botão Exportar CSV */}
          {!compact && (
            <button
              onClick={exportFiltered}
              className="btn"
              style={{ fontSize: "11.5px", padding: "6px 12px", gap: "6px" }}
              title="Exportar pedidos visíveis em CSV"
            >
              <Download style={{ width: "12px", height: "12px" }} />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr>
              {COLS.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "10px 18px",
                    textAlign: "left",
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: "var(--surface-1)",
                    borderBottom: "1px solid var(--border-subtle)",
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
              Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
                <tr key={i}>
                  {COLS.map((col) => (
                    <td key={col} style={{ padding: "12px 18px", borderBottom: "1px solid #1D1F2B" }}>
                      <div className="skeleton" style={{ height: "14px", width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan={COLS.length}
                  style={{
                    padding: "44px 20px",
                    textAlign: "center",
                    color: "#707281",
                    fontSize: "12px",
                  }}
                >
                  Nenhum pedido encontrado com os filtros selecionados.
                </td>
              </tr>
            )}

            {!loading &&
              filteredOrders.map((order, idx) => {
                const isCard = order.payment_method === "credit_card";
                return (
                  <tr
                    key={order.id}
                    style={{
                      background: idx % 2 === 0 ? "transparent" : "var(--surface-hover)",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-selected)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        idx % 2 === 0 ? "transparent" : "var(--surface-hover)";
                    }}
                  >
                    {/* Nome */}
                    <td
                      style={{
                        padding: "12px 18px",
                        borderBottom: "1px solid var(--border-subtle)",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.customer_name}
                    </td>

                    {/* E-mail (somente completo) */}
                    {!compact && (
                      <td
                        style={{
                          padding: "12px 18px",
                          borderBottom: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                          maxWidth: "180px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {order.customer_email || "—"}
                      </td>
                    )}

                    {/* Produto */}
                    <td
                      style={{
                        padding: "12px 18px",
                        borderBottom: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                        maxWidth: "220px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 400,
                      }}
                    >
                      {order.product_name}
                    </td>

                    {/* Valor */}
                    <td
                      className="font-numeric"
                      style={{
                        padding: "12px 18px",
                        borderBottom: "1px solid var(--border-subtle)",
                        fontWeight: 600,
                        color: order.status === "paid" ? "var(--success)" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatBRL(order.amount_cents)}
                    </td>

                    {/* Método / Gateway (DESTAQUE PIX vs CARTÃO STRIPE) */}
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
                      {isCard ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "11px",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "var(--accent-soft-bg)",
                            color: "var(--accent-strong)",
                            border: "1px solid var(--accent-border)",
                          }}
                        >
                          <CreditCard style={{ width: "12px", height: "12px" }} strokeWidth={1.8} />
                          Cartão (Stripe)
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "11px",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "var(--success-soft)",
                            color: "var(--success)",
                            border: "1px solid rgba(46, 219, 111, 0.25)",
                          }}
                        >
                          <QrCode style={{ width: "12px", height: "12px" }} strokeWidth={1.8} />
                          PIX Oficial
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
                      <span className={STATUS_CLASS[order.status] ?? "badge badge-expired"}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>

                    {/* Data */}
                    <td
                      style={{
                        padding: "13px 20px",
                        borderBottom: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(order.created_at)}
                    </td>

                    {/* Ação: Entrega da Carta no WhatsApp */}
                    <td
                      style={{
                        padding: "10px 18px",
                        borderBottom: "1px solid var(--border-subtle)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.status === "paid" ? (
                        deliveredMap[order.id] ? (
                          <button
                            type="button"
                            onClick={() => setDeliveryOrder(order)}
                            className="btn"
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              padding: "4px 9px",
                              borderRadius: "6px",
                              background: "rgba(16, 185, 129, 0.12)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              color: "#10B981",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                            title={`Entregue em ${new Date(deliveredMap[order.id]).toLocaleDateString("pt-BR")}. Clique para reenviar.`}
                          >
                            <CheckCircle style={{ width: "11px", height: "11px" }} />
                            Consagrada
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeliveryOrder(order)}
                            className="btn"
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))",
                              border: "1px solid rgba(16, 185, 129, 0.4)",
                              color: "#10B981",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                            title="Consagrar pedido e entregar carta no WhatsApp do consulente"
                          >
                            <Sparkles style={{ width: "11px", height: "11px" }} />
                            Entregar Carta
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Modal de Consagração e Entrega do Produto */}
      <ProductDeliveryModal
        isOpen={Boolean(deliveryOrder)}
        onClose={() => setDeliveryOrder(null)}
        order={deliveryOrder}
        leads={leads}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onDeliverySuccess={() => {
          setDeliveredMap(getDeliveredOrders());
        }}
      />

      {/* Modal de Conexão WhatsApp / QR Code Evolution API */}
      <EvolutionQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </div>
  );
}

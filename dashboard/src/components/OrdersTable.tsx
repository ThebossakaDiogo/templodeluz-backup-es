import type { PaymentOrder } from "@/types";

interface OrdersTableProps {
  orders: PaymentOrder[];
  loading?: boolean;
  compact?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  paid:     "Pago",
  pending:  "Pendente",
  creating: "Gerando PIX",
  failed:   "Falhou",
  expired:  "Expirado",
};

const STATUS_CLASS: Record<string, string> = {
  paid:     "badge badge-paid",
  pending:  "badge badge-pending",
  creating: "badge badge-pending",
  failed:   "badge badge-failed",
  expired:  "badge badge-expired",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function OrdersTable({ orders, loading, compact }: OrdersTableProps) {
  const COLS = compact
    ? ["Nome", "Produto", "Valor", "Status", "Data"]
    : ["Nome", "E-mail", "Produto", "Valor", "Status", "Método", "Data"];

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Cabeçalho */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {compact ? "Últimos Pedidos" : "Todos os Pedidos"}
          </h3>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              margin: "2px 0 0",
            }}
          >
            {loading
              ? "Carregando..."
              : `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"} · Dados reais do Supabase`}
          </p>
        </div>
        {!loading && orders.length > 0 && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Total pago:{" "}
            <strong style={{ color: "var(--success)" }}>
              {formatBRL(
                orders
                  .filter((o) => o.status === "paid")
                  .reduce((s, o) => s + o.amount_cents, 0)
              )}
            </strong>
          </span>
        )}
      </div>

      {/* Tabela */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr>
              {COLS.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: "10px",
                    fontWeight: 700,
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
              Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
                <tr key={i}>
                  {COLS.map((col) => (
                    <td
                      key={col}
                      style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <div className="skeleton" style={{ height: "12px", width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && orders.length === 0 && (
              <tr>
                <td
                  colSpan={COLS.length}
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                  }}
                >
                  Nenhum pedido encontrado. Os pedidos aparecerão aqui em tempo real.
                </td>
              </tr>
            )}

            {!loading &&
              orders.map((order, idx) => (
                <tr
                  key={order.id}
                  style={{
                    background:
                      idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--border-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)";
                  }}
                >
                  {/* Nome */}
                  <td
                    style={{
                      padding: "11px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.customer_name}
                  </td>

                  {/* E-mail (somente não-compact) */}
                  {!compact && (
                    <td
                      style={{
                        padding: "11px 16px",
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
                      padding: "11px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.product_name}
                  </td>

                  {/* Valor */}
                  <td
                    style={{
                      padding: "11px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                      fontWeight: 700,
                      color:
                        order.status === "paid"
                          ? "var(--success)"
                          : "var(--text-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatBRL(order.amount_cents)}
                  </td>

                  {/* Status */}
                  <td
                    style={{
                      padding: "11px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span className={STATUS_CLASS[order.status] ?? "badge badge-expired"}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>

                  {/* Método (somente não-compact) */}
                  {!compact && (
                    <td
                      style={{
                        padding: "11px 16px",
                        borderBottom: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {order.payment_method}
                    </td>
                  )}

                  {/* Data */}
                  <td
                    style={{
                      padding: "11px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                      fontSize: "11px",
                    }}
                  >
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

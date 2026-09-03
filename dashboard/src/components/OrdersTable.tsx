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
  creating: "badge badge-ruby",
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
    ? ["Nome do Consulente", "Produto", "Valor", "Status", "Data / Hora"]
    : ["Consulente", "E-mail", "Produto", "Valor", "Status", "Método", "Data / Hora"];

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Cabeçalho do Card */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
            {compact ? "Últimos Pedidos Registrados" : "Todos os Pedidos do Gateway"}
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
              ? "Carregando registros..."
              : `${orders.length} ${orders.length === 1 ? "pedido encontrado" : "pedidos encontrados"} · Conectado ao Supabase`}
          </p>
        </div>

        {!loading && orders.length > 0 && (
          <div
            style={{
              fontSize: "11.5px",
              color: "var(--text-muted)",
              background: "var(--bg-surface-alt)",
              padding: "4px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            Total faturado:{" "}
            <strong style={{ color: "#10b981", fontWeight: 800 }}>
              {formatBRL(
                orders
                  .filter((o) => o.status === "paid")
                  .reduce((s, o) => s + o.amount_cents, 0)
              )}
            </strong>
          </div>
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
                    padding: "11px 20px",
                    textAlign: "left",
                    fontSize: "10.5px",
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
                      style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <div className="skeleton" style={{ height: "14px", width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && orders.length === 0 && (
              <tr>
                <td
                  colSpan={COLS.length}
                  style={{
                    padding: "45px 20px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "12.5px",
                  }}
                >
                  Nenhum pedido cadastrado no momento. Cobranças PIX aparecerão aqui em tempo real.
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
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "rgba(225, 29, 72, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-alt)";
                  }}
                >
                  {/* Nome */}
                  <td
                    style={{
                      padding: "13px 20px",
                      borderBottom: "1px solid var(--border-subtle)",
                      fontWeight: 700,
                      color: "#ffffff",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.customer_name}
                  </td>

                  {/* E-mail (somente completo) */}
                  {!compact && (
                    <td
                      style={{
                        padding: "13px 20px",
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
                      padding: "13px 20px",
                      borderBottom: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                      maxWidth: "220px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                    }}
                  >
                    {order.product_name}
                  </td>

                  {/* Valor */}
                  <td
                    style={{
                      padding: "13px 20px",
                      borderBottom: "1px solid var(--border-subtle)",
                      fontWeight: 800,
                      color:
                        order.status === "paid"
                          ? "#10b981"
                          : "#ffffff",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatBRL(order.amount_cents)}
                  </td>

                  {/* Status */}
                  <td
                    style={{
                      padding: "13px 20px",
                      borderBottom: "1px solid var(--border-subtle)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span className={STATUS_CLASS[order.status] ?? "badge badge-expired"}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>

                  {/* Método (somente completo) */}
                  {!compact && (
                    <td
                      style={{
                        padding: "13px 20px",
                        borderBottom: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {order.payment_method}
                    </td>
                  )}

                  {/* Data */}
                  <td
                    style={{
                      padding: "13px 20px",
                      borderBottom: "1px solid var(--border-subtle)",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                      fontSize: "11px",
                      fontWeight: 500,
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

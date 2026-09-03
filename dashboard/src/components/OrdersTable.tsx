import { useState } from "react";
import { Search, Download, CreditCard, QrCode } from "lucide-react";
import type { PaymentOrder } from "@/types";

interface OrdersTableProps {
  orders: PaymentOrder[];
  loading?: boolean;
  compact?: boolean;
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

export function OrdersTable({ orders, loading, compact = false }: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "pix" | "credit_card">("all");

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
    ? ["Nome do Consulente", "Produto", "Valor", "Método / Gateway", "Status", "Data"]
    : ["Nome do Consulente", "E-mail", "Produto", "Valor", "Método / Gateway", "Status", "Data"];

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
              background: "var(--bg-surface-alt)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "2px",
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
                    fontWeight: active ? 800 : 600,
                    padding: "4px 9px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    background: active
                      ? f.id === "credit_card"
                        ? "#6366f1"
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

          {/* Abas de Status */}
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
                    fontWeight: active ? 800 : 600,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    background: active ? "var(--primary-green)" : "transparent",
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    transition: "all 0.15s ease",
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
              placeholder="Filtrar pedidos..."
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
                width: "160px",
              }}
            />
          </div>

          {!compact && (
            <button onClick={exportFiltered} className="btn" style={{ padding: "5px 10px" }} title="Exportar tabela">
              <Download style={{ width: "12px", height: "12px" }} />
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
              Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
                <tr key={i}>
                  {COLS.map((col) => (
                    <td key={col} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
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
                    color: "var(--text-muted)",
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
                    {/* Nome */}
                    <td
                      style={{
                        padding: "13px 20px",
                        borderBottom: "1px solid var(--border-subtle)",
                        fontWeight: 800,
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
                        color: order.status === "paid" ? "var(--primary-green)" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatBRL(order.amount_cents)}
                    </td>

                    {/* Método / Gateway (DESTAQUE PIX vs CARTÃO STRIPE) */}
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
                      {isCard ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#818cf8",
                            border: "1px solid rgba(99, 102, 241, 0.35)",
                          }}
                        >
                          <CreditCard style={{ width: "12px", height: "12px" }} />
                          Cartão (Stripe)
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(16, 185, 129, 0.14)",
                            color: "var(--primary-green)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                          }}
                        >
                          <QrCode style={{ width: "12px", height: "12px" }} />
                          PIX Oficial
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
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
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

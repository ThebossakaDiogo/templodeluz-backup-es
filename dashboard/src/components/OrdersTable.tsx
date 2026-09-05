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
    <div className="card orders-panel">
      {/* Barra de Título e Filtros */}
      <div className="orders-toolbar">
        <div>
          <h3>
            {compact ? "Últimos Pedidos Registrados" : "Auditoria de Pedidos do Gateway"}
          </h3>
          <p>
            {loading
              ? "Carregando transações..."
              : `${filteredOrders.length} de ${orders.length} pedidos · Telemetria em tempo real`}
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="orders-controls">
          {/* Filtro por Método de Pagamento (PIX vs Cartão) */}
          <div className="orders-segmented">
            {[
              { id: "all", label: "Todos Métodos" },
              { id: "pix", label: "PIX", icon: QrCode },
              { id: "credit_card", label: "Cartão Stripe", icon: CreditCard },
            ].map((f) => {
              const active = methodFilter === f.id;
              return (
                <button
                  key={f.id}
                  className={`${active ? "active" : ""} orders-seg-${f.id}`}
                  onClick={() => setMethodFilter(f.id as any)}
                >
                  {f.icon && <f.icon className="orders-seg-icon" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Abas de Status */}
          <div className="orders-segmented">
            {[
              { id: "all", label: "Todos" },
              { id: "paid", label: "Pagos" },
              { id: "pending", label: "Pendentes" },
            ].map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  className={`${active ? "active" : ""} ${f.id === "paid" && active ? "orders-paid" : ""}`}
                  onClick={() => setStatusFilter(f.id as any)}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Campo de Busca */}
          <div className="orders-search">
            <Search className="orders-search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Botão Conectar WhatsApp */}
          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="btn orders-btn-whatsapp"
            title="Conectar WhatsApp na Evolution API via QR Code"
          >
            <Smartphone className="orders-method-icon" />
            WhatsApp QR Code
          </button>

          {/* Botão Exportar CSV */}
          {!compact && (
            <button
              onClick={exportFiltered}
              className="btn orders-btn-export"
              title="Exportar pedidos visíveis em CSV"
            >
              <Download className="orders-action-icon" />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="orders-table-scroll">
        <table className={`orders-table${compact ? " compact" : ""}`}>
          <thead>
            <tr>
              {COLS.map((col) => (
                <th key={col}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
                <tr key={i} className="orders-row">
                  {COLS.map((col) => (
                    <td key={col}>
                      <div className="skeleton" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td className="orders-empty" colSpan={COLS.length}>
                  Nenhum pedido encontrado com os filtros selecionados.
                </td>
              </tr>
            )}

            {!loading &&
              filteredOrders.map((order, idx) => {
                const isCard = order.payment_method === "credit_card";
                return (
                  <tr key={order.id} className={`orders-row ${idx % 2 === 0 ? "" : "odd"}`}>
                    {/* Nome */}
                    <td className="orders-cell orders-cell-primary orders-cell-nowrap">
                      {order.customer_name}
                    </td>

                    {/* E-mail (somente completo) */}
                    {!compact && (
                      <td className="orders-cell orders-cell-secondary orders-cell-truncate">
                        {order.customer_email || "—"}
                      </td>
                    )}

                    {/* Produto */}
                    <td className="orders-cell orders-cell-primary orders-cell-truncate">
                      {order.product_name}
                    </td>

                    {/* Valor */}
                    <td
                      className={`font-numeric orders-cell ${order.status === "paid" ? "orders-cell-success" : "orders-cell-primary-bold"}`}
                    >
                      {formatBRL(order.amount_cents)}
                    </td>

                    {/* Método / Gateway (DESTAQUE PIX vs CARTÃO STRIPE) */}
                    <td className="orders-cell orders-cell-nowrap">
                      {isCard ? (
                        <span className="orders-badge orders-badge-accent">
                          <CreditCard className="orders-method-icon" strokeWidth={1.8} />
                          Cartão (Stripe)
                        </span>
                      ) : (
                        <span className="orders-badge paid">
                          <QrCode className="orders-method-icon" strokeWidth={1.8} />
                          PIX Oficial
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="orders-cell orders-cell-nowrap">
                      <span className={STATUS_CLASS[order.status] ?? "badge badge-expired"}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="orders-cell orders-cell-muted">
                      {formatDate(order.created_at)}
                    </td>

                    {/* Ação: Entrega da Carta no WhatsApp */}
                    <td className="orders-cell orders-cell-nowrap">
                      {order.status === "paid" ? (
                        deliveredMap[order.id] ? (
                          <button
                            type="button"
                            onClick={() => setDeliveryOrder(order)}
                            className="btn orders-btn-success"
                            title={`Entregue em ${new Date(deliveredMap[order.id]).toLocaleDateString("pt-BR")}. Clique para reenviar.`}
                          >
                            <CheckCircle className="orders-action-icon" />
                            Consagrada
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeliveryOrder(order)}
                            className="btn orders-btn-gradient"
                            title="Consagrar pedido e entregar carta no WhatsApp do consulente"
                          >
                            <Sparkles className="orders-action-icon" />
                            Entregar Carta
                          </button>
                        )
                      ) : (
                        <span className="orders-cell-secondary">—</span>
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

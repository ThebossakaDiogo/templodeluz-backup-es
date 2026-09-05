import { CircleDollarSign, CreditCard, QrCode, TrendingDown, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@/types";

interface MetricCardsProps {
  stats: DashboardStats;
  loading: boolean;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function Difference({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`metric-difference ${positive ? "positive" : "negative"}`}>
      <Icon size={14} /> {positive ? "+" : ""}{value}%
    </span>
  );
}

export function MetricCards({ stats, loading }: MetricCardsProps) {
  const conversionRate = stats.newSubscriptions > 0
    ? (stats.newOrders / stats.newSubscriptions) * 100
    : 0;
  const totalPixAttempts = stats.pixCount + stats.pixPendingCount;
  const pixRate = totalPixAttempts > 0 ? Math.round((stats.pixCount / totalPixAttempts) * 100) : 0;

  const cards = [
    {
      label: "Faturamento total",
      eyebrow: "Receita confirmada",
      value: loading ? "—" : formatBRL(stats.totalRevenue),
      primaryDetail: `${stats.newOrders} pedidos pagos`,
      secondaryDetail: `Ticket médio ${formatBRL(stats.avgOrderRevenue)}`,
      Icon: CircleDollarSign,
      tone: "coral",
      difference: stats.totalRevenueDiff,
    },
    {
      label: "Conversões no PIX",
      eyebrow: "Pagamento instantâneo",
      value: loading ? "—" : formatBRL(stats.pixRevenue),
      primaryDetail: `${stats.pixCount} pagamentos`,
      secondaryDetail: `${pixRate}% das cobranças liquidadas`,
      Icon: QrCode,
      tone: "lime",
    },
    {
      label: "Cartão de crédito",
      eyebrow: "Stripe gateway",
      value: loading ? "—" : formatBRL(stats.cardRevenue),
      primaryDetail: `${stats.cardCount} aprovados`,
      secondaryDetail: `Ticket médio ${formatBRL(stats.cardAvgRevenue)}`,
      Icon: CreditCard,
      tone: "blue",
    },
    {
      label: "Conversão global",
      eyebrow: "Lead para doador",
      value: loading ? "—" : `${conversionRate.toFixed(1)}%`,
      primaryDetail: `${stats.newOrders} de ${stats.newSubscriptions} leads`,
      secondaryDetail: "Eficiência do funil",
      Icon: TrendingUp,
      tone: "yellow",
    },
  ];

  return (
    <section className="metric-section" aria-labelledby="metric-section-title">
      <header className="metric-section-header">
        <div>
          <span>Desempenho consolidado</span>
          <h2 id="metric-section-title">Visão geral e faturamento</h2>
        </div>
        <p>Mesmo período selecionado para todos os indicadores.</p>
      </header>

      <div className="metric-cards-grid">
        {cards.map((card) => (
          <article className={`card metric-card metric-card-${card.tone}`} key={card.label}>
            <div className="metric-card-heading">
              <span className="metric-icon"><card.Icon size={19} /></span>
              <div>
                <small>{card.eyebrow}</small>
                <h3>{card.label}</h3>
              </div>
            </div>

            <div className="metric-card-body">
              <strong className="metric-value font-numeric">{card.value}</strong>
              {card.difference !== undefined && <Difference value={card.difference} />}
            </div>

            <footer className="metric-card-footer">
              <strong>{card.primaryDetail}</strong>
              <span>{card.secondaryDetail}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

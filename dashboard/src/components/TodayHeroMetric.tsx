import { Activity, Clock3, QrCode, Zap } from "lucide-react";

interface TodayHeroMetricProps {
  todayEntriesCount: number;
  onlineCount: number;
  todayCheckoutsCount: number;
  todayPixCount: number;
  avgQuizTimeSeconds: number;
  loading?: boolean;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes === 0 ? `${remainingSeconds}s` : `${minutes}m ${remainingSeconds}s`;
}

export function TodayHeroMetric({
  todayEntriesCount,
  onlineCount,
  todayCheckoutsCount,
  todayPixCount,
  avgQuizTimeSeconds,
  loading = false,
}: TodayHeroMetricProps) {
  const checkoutRate = todayEntriesCount > 0
    ? Math.round((todayCheckoutsCount / todayEntriesCount) * 100)
    : 0;

  const metrics = [
    {
      label: "Entradas hoje",
      value: loading ? "—" : String(todayEntriesCount),
      context: "Iniciaram o quiz",
      detail: "consulentes",
      Icon: Activity,
      tone: "coral",
    },
    {
      label: "Chegaram ao checkout",
      value: loading ? "—" : String(todayCheckoutsCount),
      context: "Concluíram as perguntas",
      detail: `${checkoutRate}% de avanço`,
      Icon: Zap,
      tone: "yellow",
    },
    {
      label: "PIX gerados hoje",
      value: loading ? "—" : String(todayPixCount),
      context: "Emitidos no gateway",
      detail: "cobranças",
      Icon: QrCode,
      tone: "lime",
    },
    {
      label: "Tempo médio no quiz",
      value: loading ? "—" : formatTime(avgQuizTimeSeconds),
      context: "Engajamento por consulente",
      detail: "duração",
      Icon: Clock3,
      tone: "blue",
    },
  ];

  return (
    <section className="today-hero-card" aria-labelledby="today-hero-title">
      <header className="today-hero-header">
        <div className="today-hero-heading">
          <span className="today-hero-mark"><Activity size={18} /></span>
          <div>
            <h2 id="today-hero-title">Telemetria operacional do dia</h2>
            <p>Fluxo do quiz desde 00h, no horário de Brasília.</p>
          </div>
        </div>
        <span className="today-live-badge">
          <i />
          {onlineCount === 1 ? "1 consulente online" : `${onlineCount} consulentes online`}
        </span>
      </header>

      <div className="today-metrics-grid">
        {metrics.map(({ label, value, context, detail, Icon, tone }) => (
          <article className={`today-metric today-metric-${tone}`} key={label}>
            <div className="today-metric-label">
              <span>{label}</span>
              <Icon size={16} />
            </div>
            <div className="today-metric-value">
              <strong className="font-numeric">{value}</strong>
              <span>{detail}</span>
            </div>
            <p>{context}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

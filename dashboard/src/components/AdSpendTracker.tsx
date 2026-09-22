import { useState, useMemo, type SyntheticEvent } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { PaymentOrder } from "@/types";
import type { DashboardProfileId } from "@/lib/dashboard-profiles";
import {
  type AdSpendDayRecord,
  loadAdSpendRecords,
  saveAdSpendRecords,
  calculateDayProfit,
  calculateDayRoi,
  calculateAdSpendSummary,
  formatBrlCurrency,
  formatDayDisplay,
  formatFullDayDisplay,
  aggregateRevenueByDate,
  exportAdSpendToCsv,
} from "@/lib/ad-spend";

interface AdSpendTrackerProps {
  readonly orders: readonly PaymentOrder[];
  readonly profile: DashboardProfileId;
  readonly dateKeyFn: (value: string | Date) => string;
}

export function AdSpendTracker({ orders, profile, dateKeyFn }: Readonly<AdSpendTrackerProps>) {
  const [records, setRecords] = useState<AdSpendDayRecord[]>(() => loadAdSpendRecords(profile));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Campos do formulário
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formSpend, setFormSpend] = useState("");
  const [formRevenue, setFormRevenue] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Mapa de receita real das ordens do sistema
  const systemRevenueByDate = useMemo(() => {
    return aggregateRevenueByDate(orders, dateKeyFn);
  }, [orders, dateKeyFn]);

  // Resumo geral
  const summary = useMemo(() => {
    return calculateAdSpendSummary(records);
  }, [records]);

  const handleOpenAddModal = (dateToPreload?: string) => {
    const targetDate = dateToPreload || new Date().toISOString().slice(0, 10);
    const existing = records.find((r) => r.date === targetDate);

    setEditingDate(existing ? targetDate : null);
    setFormDate(targetDate);
    setFormSpend(existing ? existing.spend.toString() : "");
    const systemRev = systemRevenueByDate.get(targetDate) || 0;
    setFormRevenue(existing ? existing.revenue.toString() : systemRev.toString());
    setFormNotes(existing?.notes || "");
    setIsModalOpen(true);
  };

  const handleEditRecord = (record: AdSpendDayRecord) => {
    setEditingDate(record.date);
    setFormDate(record.date);
    setFormSpend(record.spend.toString());
    setFormRevenue(record.revenue.toString());
    setFormNotes(record.notes || "");
    setIsModalOpen(true);
  };

  const handleDeleteRecord = (dateToDelete: string) => {
    const updated = records.filter((r) => r.date !== dateToDelete);
    setRecords(updated);
    saveAdSpendRecords(profile, updated);
  };

  const handleSaveModal = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formDate) return;

    const spendNum = Number.parseFloat(formSpend.replace(",", ".")) || 0;
    const revNum = Number.parseFloat(formRevenue.replace(",", ".")) || 0;

    const newRecord: AdSpendDayRecord = {
      date: formDate,
      spend: Number(spendNum.toFixed(2)),
      revenue: Number(revNum.toFixed(2)),
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString(),
      source: "manual",
    };

    const existingIndex = records.findIndex((r) => r.date === formDate);
    let updated: AdSpendDayRecord[];
    if (existingIndex >= 0) {
      updated = [...records];
      updated[existingIndex] = newRecord;
    } else {
      updated = [newRecord, ...records];
    }

    setRecords(updated);
    saveAdSpendRecords(profile, updated);
    setIsModalOpen(false);
  };

  const handleSyncWithSystemOrders = () => {
    let syncedCount = 0;
    const recordsMap = new Map<string, AdSpendDayRecord>();

    // Mantém os existentes
    for (const r of records) {
      recordsMap.set(r.date, { ...r });
    }

    // Atualiza ou insere receita a partir do faturamento real do quiz
    for (const [dateKey, revAmount] of systemRevenueByDate.entries()) {
      const existing = recordsMap.get(dateKey);
      if (existing) {
        if (existing.revenue !== revAmount) {
          existing.revenue = revAmount;
          existing.source = "synced";
          existing.updatedAt = new Date().toISOString();
          syncedCount++;
        }
      } else {
        recordsMap.set(dateKey, {
          date: dateKey,
          spend: 0,
          revenue: revAmount,
          notes: "Receita sincronizada das vendas do quiz",
          source: "synced",
          updatedAt: new Date().toISOString(),
        });
        syncedCount++;
      }
    }

    const updated = Array.from(recordsMap.values());
    setRecords(updated);
    saveAdSpendRecords(profile, updated);

    setSyncFeedback(`Sincronização concluída! ${syncedCount} dia(s) atualizados com as vendas do sistema.`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handlePullSystemRevenueForCurrentDate = () => {
    const sysRev = systemRevenueByDate.get(formDate) || 0;
    setFormRevenue(sysRev.toFixed(2));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── CABEÇALHO DA SEÇÃO ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="section-kicker">Gestão de Tráfego Pago & ROI</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles size={12} /> {profile === "meta" ? "Campanha Meta" : "Campanha TikTok"}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Controle de Gastos & Lucro</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Acompanhe o retorno sobre o investimento em anúncios, faturamento real e lucro diário da operação.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncWithSystemOrders}
            className="btn btn-secondary inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3"
            title="Sincroniza automaticamente a receita real dos pedidos pagos com a tabela"
          >
            <RefreshCw size={14} />
            <span>Sincronizar Pedidos</span>
          </button>

          <button
            type="button"
            onClick={() => exportAdSpendToCsv(records, profile)}
            className="btn btn-secondary inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3"
            title="Exportar planilha compatível com Google Sheets e Excel"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="btn btn-primary inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3.5"
          >
            <Plus size={15} />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* ── FEEDBACK DE SINCRONIZAÇÃO ── */}
      {syncFeedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* ── CARDS DE RESUMO (KPIS) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Gasto */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">Gastos em Anúncios</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-red-500">
              <TrendingDown size={15} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[var(--text-primary)]">
              {formatBrlCurrency(summary.totalSpend)}
            </span>
            <span className="block text-[10.5px] text-[var(--text-muted)] mt-0.5">
              Investimento total no período
            </span>
          </div>
        </div>

        {/* Faturamento */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">Faturamento Bruto</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
              <DollarSign size={15} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              {formatBrlCurrency(summary.totalRevenue)}
            </span>
            <span className="block text-[10.5px] text-[var(--text-muted)] mt-0.5">
              Receita de pedidos pagos
            </span>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">Lucro Líquido</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                summary.totalProfit >= 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/15 text-red-500"
              }`}
            >
              <TrendingUp size={15} />
            </span>
          </div>
          <div className="mt-2">
            <span
              className={`text-xl font-black ${
                summary.totalProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {formatBrlCurrency(summary.totalProfit)}
            </span>
            <span className="block text-[10.5px] text-[var(--text-muted)] mt-0.5">
              {summary.totalProfit >= 0 ? "Margem positiva no período" : "Atenção: Margem negativa"}
            </span>
          </div>
        </div>

        {/* ROI / ROAS */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">ROI Geral (ROAS)</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                summary.overallRoi >= 1
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-500"
              }`}
            >
              <Sparkles size={15} />
            </span>
          </div>
          <div className="mt-2">
            <span
              className={`text-xl font-black ${
                summary.overallRoi >= 1
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {summary.overallRoi >= 999 ? "Orgânico" : `${summary.overallRoi.toFixed(2).replace(".", ",")}x`}
            </span>
            <span className="block text-[10.5px] text-[var(--text-muted)] mt-0.5">
              {summary.overallRoi >= 1
                ? `R$ ${(summary.overallRoi - 1).toFixed(2)} de retorno por real gasto`
                : "Abaixo de 1.0x (ponto de equilíbrio)"}
            </span>
          </div>
        </div>

        {/* Dias Lucrativos */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-bold uppercase tracking-wider text-[10.5px]">Dias no Verde</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-500">
              <Calendar size={15} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-[var(--text-primary)]">
              {summary.profitableDaysCount} / {summary.totalDaysCount}
            </span>
            <span className="block text-[10.5px] text-[var(--text-muted)] mt-0.5">
              {summary.totalDaysCount > 0
                ? `${Math.round((summary.profitableDaysCount / summary.totalDaysCount) * 100)}% dos dias com lucro`
                : "Nenhum dia registrado"}
            </span>
          </div>
        </div>
      </div>

      {/* ── TABELA DE GASTOS, FATURAMENTO E ROI (LAYOUT IDÊNTICO À PLANILHA) ── */}
      <div className="card overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Lançamentos Diários de Anúncios</h3>
            <p className="text-[11.5px] text-[var(--text-muted)]">
              Os valores de lucro e ROI são recalculados dinamicamente em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Lucro (ROI &ge; 1.0)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Prejuízo (ROI &lt; 1.0)</span>
            </span>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">
            <Calendar size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold">Nenhum registro de anúncio para este perfil ainda.</p>
            <p className="mt-1 text-xs">
              Clique em &quot;Novo Registro&quot; ou em &quot;Sincronizar Pedidos&quot; para preencher os primeiros dias.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Gastos</th>
                  <th className="py-3 px-4">Receita</th>
                  <th className="py-3 px-4">Lucro</th>
                  <th className="py-3 px-4">ROI</th>
                  <th className="py-3 px-4">Observações</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {records.map((r) => {
                  const profit = calculateDayProfit(r.revenue, r.spend);
                  const roi = calculateDayRoi(r.revenue, r.spend);
                  const isPositive = profit >= 0;
                  const isRoiPositive = roi >= 1.0;

                  return (
                    <tr
                      key={r.date}
                      className="hover:bg-[var(--bg-surface-alt)]/60 transition-colors"
                    >
                      {/* Data */}
                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={13} className="text-[var(--text-muted)]" />
                          <span>{formatDayDisplay(r.date)}</span>
                          <span className="text-[10px] font-normal text-[var(--text-muted)] hidden sm:inline">
                            ({formatFullDayDisplay(r.date)})
                          </span>
                        </span>
                      </td>

                      {/* Gastos */}
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {formatBrlCurrency(r.spend)}
                      </td>

                      {/* Receita */}
                      <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        <div className="flex items-center gap-1.5">
                          <span>{formatBrlCurrency(r.revenue)}</span>
                          {r.source === "synced" && (
                            <span
                              className="inline-flex text-[9px] font-bold px-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              title="Receita sincronizada com os pedidos pagos do quiz"
                            >
                              Quiz
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lucro (Verde se >= 0, Vermelho se < 0) */}
                      <td className="py-3 px-4 font-black">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-bold ${
                            isPositive
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30"
                          }`}
                        >
                          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatBrlCurrency(profit)}
                        </span>
                      </td>

                      {/* ROI */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isRoiPositive
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-red-500/15 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {roi >= 999 ? "Orgânico" : `${roi.toFixed(2).replace(".", ",")}x`}
                        </span>
                      </td>

                      {/* Observações */}
                      <td className="py-3 px-4 text-xs text-[var(--text-muted)] max-w-[280px] truncate" title={r.notes}>
                        {r.notes ? (
                          <span className="italic">{r.notes}</span>
                        ) : (
                          <span className="opacity-40">-</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEditRecord(r)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
                            aria-label={`Editar registro de ${r.date}`}
                            title="Editar este dia"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.date)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            aria-label={`Excluir registro de ${r.date}`}
                            title="Excluir este dia"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL DE ADIÇÃO / EDIÇÃO ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[480px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {editingDate ? `Editar Registro: ${formatFullDayDisplay(formDate)}` : "Novo Lançamento de Gastos & Receita"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-lg font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Data */}
              <div>
                <label htmlFor="ad-spend-modal-date" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  Data do Lançamento
                </label>
                <input
                  id="ad-spend-modal-date"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Gastos em Anúncios */}
              <div>
                <label htmlFor="ad-spend-modal-spend" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  Gastos em Anúncios (R$)
                </label>
                <input
                  id="ad-spend-modal-spend"
                  type="text"
                  placeholder="Ex: 32,25"
                  value={formSpend}
                  onChange={(e) => setFormSpend(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="block mt-1 text-[11px] text-[var(--text-muted)]">
                  Quanto você investiu em tráfego nesta data (Meta Ads / TikTok Ads).
                </span>
              </div>

              {/* Receita */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="ad-spend-modal-revenue" className="block text-xs font-bold text-[var(--text-muted)]">
                    Receita / Faturamento (R$)
                  </label>
                  <button
                    type="button"
                    onClick={handlePullSystemRevenueForCurrentDate}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw size={11} /> Puxar das vendas do quiz
                  </button>
                </div>
                <input
                  id="ad-spend-modal-revenue"
                  type="text"
                  placeholder="Ex: 64,95"
                  value={formRevenue}
                  onChange={(e) => setFormRevenue(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="block mt-1 text-[11px] text-[var(--text-muted)]">
                  Total de vendas aprovadas (pode digitar ou puxar das ordens reais).
                </span>
              </div>

              {/* Observações */}
              <div>
                <label htmlFor="ad-spend-modal-notes" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  Observações do Dia
                </label>
                <textarea
                  id="ad-spend-modal-notes"
                  rows={2}
                  placeholder="Ex: Teste de novos criativos, primeiro dia de oferta..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Preview Dinâmico do Lucro e ROI */}
              {formSpend && formRevenue && (
                <div className="rounded-xl bg-[var(--bg-surface-alt)] p-3 border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] block">Lucro estimado:</span>
                    <span
                      className={`font-black ${
                        Number.parseFloat(formRevenue.replace(",", ".")) - Number.parseFloat(formSpend.replace(",", ".")) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500"
                      }`}
                    >
                      {formatBrlCurrency(
                        Number.parseFloat(formRevenue.replace(",", ".")) - Number.parseFloat(formSpend.replace(",", "."))
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">ROI estimado:</span>
                    <span className="font-black text-[var(--text-primary)]">
                      {calculateDayRoi(
                        Number.parseFloat(formRevenue.replace(",", ".")) || 0,
                        Number.parseFloat(formSpend.replace(",", ".")) || 0
                      ).toFixed(2)}x
                    </span>
                  </div>
                </div>
              )}

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary text-xs py-2 px-3.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-4"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

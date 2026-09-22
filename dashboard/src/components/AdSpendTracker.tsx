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
  Percent,
  Layers,
  AlertCircle,
} from "lucide-react";
import type { PaymentOrder } from "@/types";
import type { DashboardProfileId } from "@/lib/dashboard-profiles";
import {
  type AdSpendDayRecord,
  loadAdSpendRecords,
  saveAdSpendRecords,
  clearAdSpendRecords,
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

  // Campos do formulário do modal
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formSpend, setFormSpend] = useState("");
  const [formRevenue, setFormRevenue] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Mapa de receita real das ordens do sistema
  const systemRevenueByDate = useMemo(() => {
    return aggregateRevenueByDate(orders, dateKeyFn);
  }, [orders, dateKeyFn]);

  // Resumo de KPIs
  const summary = useMemo(() => {
    return calculateAdSpendSummary(records);
  }, [records]);

  // Margem de Lucro Geral (%)
  const profitMarginPercent = useMemo(() => {
    if (summary.totalRevenue <= 0) return 0;
    return Number(((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1));
  }, [summary]);

  const handleOpenAddModal = (dateToPreload?: string) => {
    const targetDate = dateToPreload || new Date().toISOString().slice(0, 10);
    const existing = records.find((r) => r.date === targetDate);

    setEditingDate(existing ? targetDate : null);
    setFormDate(targetDate);
    setFormSpend(existing ? existing.spend.toString().replace(".", ",") : "");
    const systemRev = systemRevenueByDate.get(targetDate) || 0;
    setFormRevenue(
      existing
        ? existing.revenue.toString().replace(".", ",")
        : systemRev > 0
        ? systemRev.toFixed(2).replace(".", ",")
        : ""
    );
    setFormNotes(existing?.notes || "");
    setIsModalOpen(true);
  };

  const handleEditRecord = (record: AdSpendDayRecord) => {
    setEditingDate(record.date);
    setFormDate(record.date);
    setFormSpend(record.spend.toString().replace(".", ","));
    setFormRevenue(record.revenue.toString().replace(".", ","));
    setFormNotes(record.notes || "");
    setIsModalOpen(true);
  };

  const handleDeleteRecord = (dateToDelete: string) => {
    const updated = records.filter((r) => r.date !== dateToDelete);
    setRecords(updated);
    saveAdSpendRecords(profile, updated);
  };

  const handleClearAll = () => {
    clearAdSpendRecords(profile);
    setRecords([]);
    setIsConfirmingClear(false);
    setSyncFeedback({
      message: "Lançamentos zerados com sucesso! Você pode iniciar novos registros a qualquer momento.",
      type: "info",
    });
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleSaveModal = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formDate) return;

    const cleanSpend = formSpend.trim().replace(",", ".");
    const cleanRev = formRevenue.trim().replace(",", ".");

    const spendNum = Number.parseFloat(cleanSpend) || 0;
    const revNum = Number.parseFloat(cleanRev) || 0;

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

    setSyncFeedback({
      message: `Lançamento de ${formatDayDisplay(formDate)} salvo com sucesso!`,
      type: "success",
    });
    setTimeout(() => setSyncFeedback(null), 3500);
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
          notes: "Receita sincronizada do quiz",
          source: "synced",
          updatedAt: new Date().toISOString(),
        });
        syncedCount++;
      }
    }

    const updated = Array.from(recordsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    setRecords(updated);
    saveAdSpendRecords(profile, updated);

    setSyncFeedback({
      message: `Sincronização concluída! ${syncedCount} dia(s) atualizados com as vendas do sistema.`,
      type: "success",
    });
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handlePullSystemRevenueForCurrentDate = () => {
    const sysRev = systemRevenueByDate.get(formDate) || 0;
    setFormRevenue(sysRev.toFixed(2).replace(".", ","));
  };

  const handleSetQuickDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() - offsetDays);
    const dateStr = dateKeyFn(target);
    setFormDate(dateStr);
    const existing = records.find((r) => r.date === dateStr);
    if (existing) {
      setFormSpend(existing.spend.toString().replace(".", ","));
      setFormRevenue(existing.revenue.toString().replace(".", ","));
      setFormNotes(existing.notes || "");
    } else {
      const sysRev = systemRevenueByDate.get(dateStr) || 0;
      setFormSpend("");
      setFormRevenue(sysRev > 0 ? sysRev.toFixed(2).replace(".", ",") : "");
      setFormNotes("");
    }
  };

  // Preview dinâmico dos cálculos no modal
  const previewSpendNum = Number.parseFloat(formSpend.replace(",", ".")) || 0;
  const previewRevNum = Number.parseFloat(formRevenue.replace(",", ".")) || 0;
  const previewProfit = calculateDayProfit(previewRevNum, previewSpendNum);
  const previewRoi = calculateDayRoi(previewRevNum, previewSpendNum);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── HEADER DE CONTROLE FINANCEIRO ── */}
      <div
        className="card"
        style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, var(--surface-card) 0%, var(--surface-1) 100%)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-neo-pop-card)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="section-kicker">Gestão & Inteligência Financeira</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "999px",
                  padding: "2px 10px",
                  fontSize: "11px",
                  fontWeight: 800,
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                <Sparkles size={12} /> {profile === "meta" ? "Meta Ads" : "TikTok Ads"}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Controle de Gastos & Lucro
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--text-muted)", maxWidth: "600px" }}>
              Acompanhe seu retorno sobre investimento diário, lance os gastos de campanhas e calcule faturamento, lucro líquido e ROI em tempo real.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handleSyncWithSystemOrders}
              className="btn btn-secondary"
              style={{ fontSize: "12px", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              title="Sincroniza automaticamente a receita real dos pedidos pagos com a tabela"
            >
              <RefreshCw size={14} />
              <span>Sincronizar Quiz</span>
            </button>

            {records.length > 0 && (
              <button
                type="button"
                onClick={() => exportAdSpendToCsv(records, profile)}
                className="btn btn-secondary"
                style={{ fontSize: "12px", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                title="Exportar planilha formatada em CSV"
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>
            )}

            {records.length > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="btn btn-secondary"
                style={{
                  fontSize: "12px",
                  padding: "8px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--text-muted)",
                }}
                title="Limpar e zerar todos os lançamentos"
              >
                <Trash2 size={13} />
                <span>Zerar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="btn btn-primary"
              style={{
                fontSize: "12.5px",
                padding: "8px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(255, 51, 119, 0.25)",
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Notificação / Feedback rápido */}
        {syncFeedback && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor:
                syncFeedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(59, 130, 246, 0.12)",
              color: syncFeedback.type === "success" ? "#059669" : "#2563eb",
              border: `1px solid ${
                syncFeedback.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)"
              }`,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{syncFeedback.message}</span>
          </div>
        )}
      </div>

      {/* ── CARDS DE RESUMO FINANCEIRO (KPIS EXECUTIVOS) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* 1. GASTOS EM ANÚNCIOS */}
        <div
          className="card"
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "16px",
            border: "1px solid var(--border-subtle)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Gastos em Anúncios
            </span>
            <span
              style={{
                display: "flex",
                width: "28px",
                height: "28px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
              }}
            >
              <TrendingDown size={15} />
            </span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "monospace" }}>
              {formatBrlCurrency(summary.totalSpend)}
            </div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
              {records.length > 0 ? `Total acumulado em ${records.length} dia(s)` : "Nenhum gasto lançado"}
            </span>
          </div>
        </div>

        {/* 2. FATURAMENTO BRUTO */}
        <div
          className="card"
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "16px",
            border: "1px solid var(--border-subtle)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Faturamento Bruto
            </span>
            <span
              style={{
                display: "flex",
                width: "28px",
                height: "28px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                backgroundColor: "rgba(59, 130, 246, 0.12)",
                color: "#3b82f6",
              }}
            >
              <DollarSign size={15} />
            </span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#2563eb", fontFamily: "monospace" }}>
              {formatBrlCurrency(summary.totalRevenue)}
            </div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
              Receita de pedidos pagos
            </span>
          </div>
        </div>

        {/* 3. LUCRO LÍQUIDO */}
        <div
          className="card"
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "16px",
            border: summary.totalProfit >= 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            backgroundColor: summary.totalProfit > 0 ? "rgba(16, 185, 129, 0.04)" : "var(--surface-card)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Lucro Líquido
            </span>
            <span
              style={{
                display: "flex",
                width: "28px",
                height: "28px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                backgroundColor: summary.totalProfit >= 0 ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)",
                color: summary.totalProfit >= 0 ? "#10b981" : "#ef4444",
              }}
            >
              <TrendingUp size={15} />
            </span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: summary.totalProfit >= 0 ? "#059669" : "#dc2626",
                fontFamily: "monospace",
              }}
            >
              {formatBrlCurrency(summary.totalProfit)}
            </div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
              {summary.totalProfit >= 0 ? `Margem: ${profitMarginPercent}% sobre receita` : "Margem negativa no período"}
            </span>
          </div>
        </div>

        {/* 4. ROI / ROAS */}
        <div
          className="card"
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "16px",
            border: "1px solid var(--border-subtle)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              ROI Médio (ROAS)
            </span>
            <span
              style={{
                display: "flex",
                width: "28px",
                height: "28px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                backgroundColor: summary.overallRoi >= 1 ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                color: summary.overallRoi >= 1 ? "#10b981" : "#f59e0b",
              }}
            >
              <Percent size={14} />
            </span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: summary.overallRoi >= 1 ? "#059669" : summary.overallRoi > 0 ? "#d97706" : "var(--text-primary)",
                fontFamily: "monospace",
              }}
            >
              {summary.overallRoi >= 999
                ? "Orgânico"
                : summary.overallRoi > 0
                ? `${summary.overallRoi.toFixed(2).replace(".", ",")}x`
                : "0,00x"}
            </div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
              {summary.overallRoi >= 1
                ? `R$ ${(summary.overallRoi - 1).toFixed(2).replace(".", ",")} de retorno / R$ 1`
                : summary.overallRoi > 0
                ? "Abaixo do ponto de equilíbrio"
                : "Sem dados suficientes"}
            </span>
          </div>
        </div>

        {/* 5. DIAS LUCRATIVOS */}
        <div
          className="card"
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "16px",
            border: "1px solid var(--border-subtle)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Dias no Verde
            </span>
            <span
              style={{
                display: "flex",
                width: "28px",
                height: "28px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                backgroundColor: "rgba(168, 85, 247, 0.12)",
                color: "#a855f7",
              }}
            >
              <Layers size={15} />
            </span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "monospace" }}>
              {summary.profitableDaysCount} / {summary.totalDaysCount}
            </div>
            <div style={{ marginTop: "6px" }}>
              <div
                style={{
                  height: "4px",
                  width: "100%",
                  backgroundColor: "rgba(0,0,0,0.08)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${summary.totalDaysCount > 0 ? (summary.profitableDaysCount / summary.totalDaysCount) * 100 : 0}%`,
                    backgroundColor: "#10b981",
                    borderRadius: "999px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span style={{ display: "block", fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                {summary.totalDaysCount > 0
                  ? `${Math.round((summary.profitableDaysCount / summary.totalDaysCount) * 100)}% de consistência`
                  : "0 dias lançados"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABELA OU EMPTY STATE ELEGANTE ── */}
      <div
        className="card"
        style={{
          borderRadius: "16px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-neo-pop-card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "var(--surface-1)",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>
              Histórico Diário de Investimentos & Faturamento
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Os valores de lucro e ROI são calculados automaticamente por dia.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", fontWeight: 700 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#10b981" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
              <span>Lucro (ROI &ge; 1.0)</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#ef4444" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
              <span>Prejuízo (ROI &lt; 1.0)</span>
            </span>
          </div>
        </div>

        {/* SE ESTIVER ZERADO: EMPTY STATE DE ALTO PADRÃO */}
        {records.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                backgroundColor: "rgba(255, 51, 119, 0.08)",
                border: "1px solid rgba(255, 51, 119, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <Calendar size={30} strokeWidth={1.8} />
            </div>
            <div style={{ maxWidth: "420px" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
                Nenhum lançamento cadastrado
              </h4>
              <p style={{ margin: "6px 0 0", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Seu painel está limpo e zerado. Você pode cadastrar manualmente quanto investiu em anúncios hoje ou puxar as vendas reais já efetuadas pelo quiz.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="btn btn-primary"
                style={{ fontSize: "12.5px", padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Lançar Primeiro Dia</span>
              </button>
              <button
                type="button"
                onClick={handleSyncWithSystemOrders}
                className="btn btn-secondary"
                style={{ fontSize: "12.5px", padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <RefreshCw size={14} />
                <span>Puxar Vendas do Quiz</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--surface-1)",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                  }}
                >
                  <th style={{ padding: "12px 18px" }}>Data</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Gastos (Anúncios)</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Receita (Faturamento)</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Lucro Líquido</th>
                  <th style={{ padding: "12px 18px", textAlign: "center" }}>ROI</th>
                  <th style={{ padding: "12px 18px" }}>Observações</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const profit = calculateDayProfit(r.revenue, r.spend);
                  const roi = calculateDayRoi(r.revenue, r.spend);
                  const isPositive = profit >= 0;
                  const isRoiPositive = roi >= 1.0;

                  return (
                    <tr
                      key={r.date}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background-color 0.15s ease",
                      }}
                      className="hover:bg-[var(--surface-hover)]"
                    >
                      {/* Data */}
                      <td style={{ padding: "13px 18px", fontWeight: 700, color: "var(--text-primary)" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                          <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                          <span style={{ fontFamily: "monospace", fontSize: "12.5px" }}>{formatDayDisplay(r.date)}</span>
                          <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>
                            ({formatFullDayDisplay(r.date)})
                          </span>
                        </div>
                      </td>

                      {/* Gastos */}
                      <td style={{ padding: "13px 18px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)" }}>
                        {formatBrlCurrency(r.spend)}
                      </td>

                      {/* Receita */}
                      <td style={{ padding: "13px 18px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#2563eb" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <span>{formatBrlCurrency(r.revenue)}</span>
                          {r.source === "synced" && (
                            <span
                              style={{
                                fontSize: "9.5px",
                                fontWeight: 800,
                                padding: "1px 5px",
                                borderRadius: "4px",
                                backgroundColor: "rgba(37, 99, 235, 0.1)",
                                color: "#2563eb",
                                border: "1px solid rgba(37, 99, 235, 0.2)",
                              }}
                              title="Sincronizado automaticamente com os pedidos do quiz"
                            >
                              Quiz
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lucro Líquido */}
                      <td style={{ padding: "13px 18px", textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: "12px",
                            backgroundColor: isPositive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: isPositive ? "#059669" : "#dc2626",
                            border: `1px solid ${isPositive ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                          }}
                        >
                          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatBrlCurrency(profit)}
                        </span>
                      </td>

                      {/* ROI */}
                      <td style={{ padding: "13px 18px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 800,
                            backgroundColor: isRoiPositive ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)",
                            color: isRoiPositive ? "#059669" : "#dc2626",
                          }}
                        >
                          {roi >= 999 ? "Orgânico" : `${roi.toFixed(2).replace(".", ",")}x`}
                        </span>
                      </td>

                      {/* Observações */}
                      <td style={{ padding: "13px 18px", color: "var(--text-secondary)", maxWidth: "260px" }}>
                        {r.notes ? (
                          <span style={{ fontSize: "11.5px", lineHeight: 1.4, display: "block" }}>
                            {r.notes}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-disabled)", fontStyle: "italic", fontSize: "11px" }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "13px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => handleEditRecord(r)}
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-subtle)",
                              backgroundColor: "var(--surface-1)",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                            }}
                            title="Editar lançamento"
                            aria-label={`Editar lançamento de ${r.date}`}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.date)}
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              backgroundColor: "rgba(239, 68, 68, 0.06)",
                              color: "#ef4444",
                              cursor: "pointer",
                            }}
                            title="Excluir lançamento"
                            aria-label={`Excluir lançamento de ${r.date}`}
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

      {/* ── MODAL DE CRIAÇÃO / EDIÇÃO DE LANÇAMENTO ── */}
      {isModalOpen && (
        <div
          className="modal-glass-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              borderRadius: "20px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "var(--text-primary)" }}>
                  {editingDate ? "Editar Lançamento" : "Novo Lançamento Diário"}
                </h3>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  Insira o valor investido e o faturamento para calcular o ROI do dia.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Data com botões de atalho rápido */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label htmlFor="ad-spend-modal-date" style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                    Data do Lançamento
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(0)}
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-subtle)",
                        backgroundColor: "var(--surface-1)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(1)}
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-subtle)",
                        backgroundColor: "var(--surface-1)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      Ontem
                    </button>
                  </div>
                </div>
                <input
                  id="ad-spend-modal-date"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--surface-1)",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Gasto em Anúncios */}
              <div>
                <label htmlFor="ad-spend-modal-spend" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Gastos em Anúncios (R$)
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                    }}
                  >
                    R$
                  </span>
                  <input
                    id="ad-spend-modal-spend"
                    type="text"
                    placeholder="0,00"
                    value={formSpend}
                    onChange={(e) => setFormSpend(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid var(--border-subtle)",
                      backgroundColor: "var(--surface-1)",
                      padding: "8px 12px 8px 36px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <span style={{ display: "block", fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Valor total investido nesta data no gerenciador de anúncios.
                </span>
              </div>

              {/* Receita / Faturamento */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label htmlFor="ad-spend-modal-revenue" style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                    Receita / Faturamento (R$)
                  </label>
                  <button
                    type="button"
                    onClick={handlePullSystemRevenueForCurrentDate}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#059669",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <RefreshCw size={11} />
                    <span>Puxar vendas do quiz</span>
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                    }}
                  >
                    R$
                  </span>
                  <input
                    id="ad-spend-modal-revenue"
                    type="text"
                    placeholder="0,00"
                    value={formRevenue}
                    onChange={(e) => setFormRevenue(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1px solid var(--border-subtle)",
                      backgroundColor: "var(--surface-1)",
                      padding: "8px 12px 8px 36px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#2563eb",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <span style={{ display: "block", fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Total de vendas aprovadas (você pode digitar ou clicar para puxar do quiz).
                </span>
              </div>

              {/* SIMULAÇÃO EM TEMPO REAL (PREVIEW AO VIVO) */}
              {(formSpend !== "" || formRevenue !== "") && (
                <div
                  style={{
                    borderRadius: "12px",
                    padding: "12px 14px",
                    backgroundColor: previewProfit >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                    border: `1px solid ${previewProfit >= 0 ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ display: "block", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Resultado Previsto
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        color: previewProfit >= 0 ? "#059669" : "#dc2626",
                      }}
                    >
                      {previewProfit >= 0 ? "Lucro: +" : "Prejuízo: "}
                      {formatBrlCurrency(previewProfit)}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                      ROI Calculado
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        color: previewRoi >= 1 ? "#059669" : "#d97706",
                      }}
                    >
                      {previewRoi >= 999 ? "Orgânico" : `${previewRoi.toFixed(2).replace(".", ",")}x`}
                    </span>
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <label htmlFor="ad-spend-modal-notes" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Observações do Dia (Opcional)
                </label>
                <textarea
                  id="ad-spend-modal-notes"
                  rows={2}
                  placeholder="Ex: Testei novos criativos de vídeo, escalei orçamento para R$ 100..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--surface-1)",
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Botões do Modal */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: "12px", padding: "8px 16px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: "12px", padding: "8px 20px", fontWeight: 800 }}
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMAÇÃO PARA ZERAR DADOS ── */}
      {isConfirmingClear && (
        <div
          className="modal-glass-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsConfirmingClear(false);
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "24px",
              borderRadius: "20px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              backgroundColor: "var(--surface-card)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <AlertCircle size={26} />
            </div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "var(--text-primary)" }}>
              Deseja zerar todos os lançamentos?
            </h3>
            <p style={{ margin: "8px 0 20px", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Esta ação removerá todos os registros de gastos e faturamento deste perfil para você recomeçar do zero.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="btn btn-secondary"
                style={{ fontSize: "12px", padding: "8px 18px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="btn btn-primary"
                style={{
                  fontSize: "12px",
                  padding: "8px 18px",
                  fontWeight: 800,
                  backgroundColor: "#dc2626",
                  borderColor: "#dc2626",
                }}
              >
                Sim, zerar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import type { PaymentOrder } from "@/types";
import type { DashboardProfileId } from "@/lib/dashboard-profiles";

export interface AdSpendDayRecord {
  date: string; // formato YYYY-MM-DD
  spend: number; // em reais (ex: 32.25)
  revenue: number; // em reais (ex: 64.95)
  notes?: string;
  source?: "manual" | "synced";
  updatedAt: string;
}

export interface AdSpendSummary {
  totalSpend: number;
  totalRevenue: number;
  totalProfit: number;
  overallRoi: number;
  profitableDaysCount: number;
  totalDaysCount: number;
}

const STORAGE_PREFIX = "od_ad_spend_records_v2";

export function getAdSpendStorageKey(profile: DashboardProfileId): string {
  return `${STORAGE_PREFIX}_${profile}`;
}

export function loadAdSpendRecords(profile: DashboardProfileId): AdSpendDayRecord[] {
  if (typeof window === "undefined") return [];
  const key = getAdSpendStorageKey(profile);
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.date.localeCompare(a.date));
      }
    } catch {
      // Caso haja erro de parse, inicia zerado
    }
  }

  // Inicia 100% zerado conforme solicitação do usuário
  return [];
}

export function clearAdSpendRecords(profile: DashboardProfileId): void {
  if (typeof window === "undefined") return;
  const key = getAdSpendStorageKey(profile);
  localStorage.removeItem(key);
  // Também remove qualquer resquício de versões antigas v1
  localStorage.removeItem(`od_ad_spend_records_v1_${profile}`);
}

export function saveAdSpendRecords(profile: DashboardProfileId, records: AdSpendDayRecord[]): void {
  if (typeof window === "undefined") return;
  const key = getAdSpendStorageKey(profile);
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(key, JSON.stringify(sorted));
}

export function calculateDayProfit(revenue: number, spend: number): number {
  return Number((revenue - spend).toFixed(2));
}

export function calculateDayRoi(revenue: number, spend: number): number {
  if (spend <= 0) {
    return revenue > 0 ? 999 : 0;
  }
  return Number((revenue / spend).toFixed(2));
}

export function calculateAdSpendSummary(records: readonly AdSpendDayRecord[]): AdSpendSummary {
  let totalSpend = 0;
  let totalRevenue = 0;
  let profitableDaysCount = 0;

  for (const r of records) {
    totalSpend += r.spend || 0;
    totalRevenue += r.revenue || 0;
    const profit = (r.revenue || 0) - (r.spend || 0);
    if (profit > 0) {
      profitableDaysCount++;
    }
  }

  const totalProfit = Number((totalRevenue - totalSpend).toFixed(2));
  let overallRoi = 0;
  if (totalSpend > 0) {
    overallRoi = Number((totalRevenue / totalSpend).toFixed(2));
  } else if (totalRevenue > 0) {
    overallRoi = 999;
  }

  return {
    totalSpend: Number(totalSpend.toFixed(2)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalProfit,
    overallRoi,
    profitableDaysCount,
    totalDaysCount: records.length,
  };
}

export function formatBrlCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value));

  return value < 0 ? `-${formatted}` : formatted;
}

export function formatDayDisplay(dateIsoYmd: string): string {
  if (!dateIsoYmd) return "";
  const parts = dateIsoYmd.split("-");
  if (parts.length === 3) {
    const [, month, day] = parts;
    return `${day}/${month}`;
  }
  return dateIsoYmd;
}

export function formatFullDayDisplay(dateIsoYmd: string): string {
  if (!dateIsoYmd) return "";
  const parts = dateIsoYmd.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateIsoYmd;
}

/**
 * Agrupa ordens pagas por data em Brasília (YYYY-MM-DD) para sincronização automática.
 */
export function aggregateRevenueByDate(
  orders: readonly PaymentOrder[],
  dateKeyFn: (date: string | Date) => string
): Map<string, number> {
  const revenueMap = new Map<string, number>();

  for (const order of orders) {
    if (order.status !== "paid" || !order.created_at) continue;
    const dateKey = dateKeyFn(order.created_at);
    const orderReais = (order.amount_cents || 0) / 100;
    const current = revenueMap.get(dateKey) || 0;
    revenueMap.set(dateKey, Number((current + orderReais).toFixed(2)));
  }

  return revenueMap;
}

/**
 * Gera arquivo CSV compatível com Excel e Google Sheets.
 */
export function exportAdSpendToCsv(records: readonly AdSpendDayRecord[], profileLabel: string): void {
  const headers = ["Data", "Gastos (R$)", "Receita (R$)", "Lucro (R$)", "ROI", "Observações"];
  const rows = records.map((r) => {
    const profit = calculateDayProfit(r.revenue, r.spend);
    const roi = calculateDayRoi(r.revenue, r.spend);
    const roiStr = r.spend <= 0 && r.revenue > 0 ? "Orgânico" : roi.toFixed(2).replace(".", ",");
    return [
      formatFullDayDisplay(r.date),
      r.spend.toFixed(2).replace(".", ","),
      r.revenue.toFixed(2).replace(".", ","),
      profit.toFixed(2).replace(".", ","),
      roiStr,
      `"${(r.notes || "").replaceAll('"', '""')}"`,
    ].join(";");
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `controle-anuncios-${profileLabel.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

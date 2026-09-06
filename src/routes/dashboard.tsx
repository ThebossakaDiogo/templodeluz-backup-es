import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  MessageCircle,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Download,
  Search,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Phone,
  AlertCircle,
  Copy,
  Check,
  BarChart3,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Executiva & Tracking de Leads · Templo de Luz" },
      {
        name: "description",
        content: "Painel de controle em tempo real para monitoramento de leads, quiz e WhatsApps.",
      },
    ],
  }),
  component: DashboardPage,
});

const DEFAULT_SUPABASE_URL = "https://opftmzegcvfyoinjfmcj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24";

type FilterQuickOption = "all" | "with_phone" | "paid" | "pending" | "quiz";
type DashboardTab = "leads" | "orders" | "metrics";
type PaymentStatusType = "none" | "waiting_payment" | "paid" | "failed";
type OrderStatusType = "paid" | "pending" | "failed" | "creating" | "expired";

interface Lead {
  id: string;
  session_id: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  ente_querido: string | null;
  grau_parentesco: string | null;
  mensagem_preview: string | null;
  temas_selecionados: string[] | null;
  current_step_index: number;
  current_step_name: string;
  highest_step_index: number;
  completed: boolean;
  payment_status: PaymentStatusType;
  last_amount_cents: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  created_at: string;
  updated_at: string;
  time_spent_seconds?: number;
}

interface PaymentOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  product_name: string;
  amount_cents: number;
  status: OrderStatusType;
  payment_method: "pix" | "credit_card";
  created_at: string;
}

function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  const clean = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return raw;
}

function getWhatsAppLink(phone: string, leadName?: string | null, ente?: string | null): string {
  const digits = phone.replace(/\D/g, "");
  const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
  const nomeConsulente = leadName && leadName !== "Consulente" && leadName !== "Você" ? leadName : "irmão(ã)";
  const saudacao = ente
    ? `Olá, ${nomeConsulente}! Que a paz de Jesus esteja com você. Aqui é da equipe do Templo de Luz da médium Milena Medeiros. Vimos o seu pedido de oração e acolhimento para a memória de ${ente}. Como podemos te confortar hoje?`
    : `Olá, ${nomeConsulente}! Que a paz de Jesus esteja com você. Aqui é da equipe do Templo de Luz da médium Milena Medeiros. Vimos seu contato para a psicografia e viemos te acolher com carinho.`;
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(saudacao)}`;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Agora mesmo";
    if (minutes === 1) return "Há 1 min";
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "Há 1 hora";
    if (hours < 24) return `Há ${hours} horas`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Ontem";
    return `Há ${days} dias`;
  } catch {
    return dateStr;
  }
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

function LeadStatusBadge({ lead }: { readonly lead: Lead }) {
  if (lead.payment_status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
        ✓ Pago {lead.last_amount_cents ? formatCurrency(lead.last_amount_cents / 100) : ""}
      </span>
    );
  }
  if (lead.payment_status === "waiting_payment") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
        ⏳ PIX Gerado
      </span>
    );
  }
  if (lead.current_step_index >= 8) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
        No Checkout
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-800 text-stone-300 px-2 py-0.5 text-[10px] font-semibold">
      Passo {lead.current_step_index || 1}: {lead.current_step_name || "intro"}
    </span>
  );
}

function LeadCardItem({
  lead,
  isExpanded,
  onToggleExpand,
  onCopyPhone,
  isCopied,
}: {
  readonly lead: Lead;
  readonly isExpanded: boolean;
  readonly onToggleExpand: () => void;
  readonly onCopyPhone: (phone: string) => void;
  readonly isCopied: boolean;
}) {
  const hasPhone = Boolean(lead.lead_phone && lead.lead_phone.replace(/\D/g, "").length >= 8);
  const formattedPhone = formatPhoneDisplay(lead.lead_phone);

  return (
    <article
      className={`rounded-2xl border transition-all duration-200 ${
        hasPhone
          ? "border-emerald-500/30 bg-gradient-to-br from-[#120a1c] via-[#101713] to-[#0f1412]"
          : "border-purple-900/40 bg-[#120a1c]"
      } p-3.5 sm:p-4.5 shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
              {lead.lead_name && lead.lead_name !== "Consulente" ? lead.lead_name : "Consulente no Quiz"}
            </h3>
            <span className="text-[10.5px] font-semibold text-purple-300/60">
              · {formatRelativeTime(lead.updated_at || lead.created_at)}
            </span>
          </div>

          <p className="text-xs text-purple-200/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-amber-400 font-bold">🤍 Ente:</span>
            <span className="font-semibold text-white">
              {lead.ente_querido || "Não informado"}
            </span>
            {lead.grau_parentesco && (
              <span className="text-purple-300/70">({lead.grau_parentesco})</span>
            )}
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <LeadStatusBadge lead={lead} />
          {lead.utm_source && (
            <span className="text-[9.5px] font-mono text-purple-400/80 bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-800/40">
              {lead.utm_source}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-purple-900/30 flex items-center justify-between gap-2 flex-wrap">
        {hasPhone ? (
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <a
              href={getWhatsAppLink(lead.lead_phone!, lead.lead_name, lead.ente_querido)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 text-xs font-black tracking-wide shadow-md shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-95 flex-1"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chamar no WhatsApp ({formattedPhone})</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            <button
              type="button"
              onClick={() => onCopyPhone(lead.lead_phone!)}
              title="Copiar número"
              className="h-8 w-8 flex items-center justify-center rounded-xl border border-emerald-600/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-purple-300/50 italic">
            <AlertCircle className="w-3.5 h-3.5 text-purple-400/60" />
            <span>Ainda no quiz (telefone pendente)</span>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white px-2 py-1 rounded-lg hover:bg-purple-950/60 transition-colors"
        >
          <span>{isExpanded ? "Ocultar" : "Ver Detalhes"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-purple-900/40 space-y-2.5 text-xs text-stone-200 animate-fadeIn">
          {lead.mensagem_preview && (
            <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-900/60">
              <span className="block text-[10px] font-bold uppercase text-amber-400 mb-1">
                Mensagem digitada pelo consulente:
              </span>
              <p className="italic text-purple-100/90 leading-relaxed font-serif">
                "{lead.mensagem_preview}"
              </p>
            </div>
          )}

          {lead.temas_selecionados && lead.temas_selecionados.length > 0 && (
            <div>
              <span className="block text-[10px] font-bold uppercase text-purple-300/80 mb-1">
                Temas e Intenções Selecionadas:
              </span>
              <div className="flex flex-wrap gap-1">
                {lead.temas_selecionados.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-purple-900/40 border border-purple-800/50 px-2 py-0.5 text-[10.5px] text-purple-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10.5px] text-purple-300/70 font-mono">
            <div>
              <span className="block text-[9px] uppercase text-stone-400">Tempo no Quiz</span>
              <span>
                {lead.time_spent_seconds
                  ? `${Math.floor(lead.time_spent_seconds / 60)}m ${lead.time_spent_seconds % 60}s`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase text-stone-400">Campanha</span>
              <span className="truncate block">{lead.utm_campaign || "—"}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase text-stone-400">Medium</span>
              <span className="truncate block">{lead.utm_medium || "—"}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase text-stone-400">Criado em</span>
              <span>{new Date(lead.created_at).toLocaleTimeString("pt-BR")}</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

interface DashboardKpiSectionProps {
  readonly metrics: {
    readonly leadsWithPhoneCount: number;
    readonly phoneCaptureRate: number;
    readonly paidCount: number;
    readonly totalPaidRevenue: number;
    readonly pendingCount: number;
    readonly totalPendingRevenue: number;
    readonly totalLeads: number;
    readonly conversionRate: number;
  };
}

function DashboardKpiSection({ metrics }: Readonly<DashboardKpiSectionProps>) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      <div className="col-span-2 sm:col-span-1 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#141d19] to-[#0f1412] p-3.5 sm:p-4 shadow-lg shadow-emerald-950/20 relative overflow-hidden">
        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
          <MessageCircle className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider block">
          WhatsApps Capturados
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-400">
            {metrics.leadsWithPhoneCount}
          </span>
          <span className="text-xs font-semibold text-emerald-300/60">
            ({metrics.phoneCaptureRate.toFixed(0)}% do funil)
          </span>
        </div>
        <p className="mt-1 text-[10.5px] text-emerald-200/50">Prontos para contato e acolhimento</p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-[#1e1710] to-[#140f09] p-3.5 sm:p-4 shadow-lg shadow-amber-950/20 relative overflow-hidden">
        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
          <TrendingUp className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-bold text-amber-300/80 uppercase tracking-wider block">
          Doações Pagas
        </span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-amber-300">
            {formatCurrency(metrics.totalPaidRevenue)}
          </span>
        </div>
        <p className="mt-1 text-[10.5px] text-amber-200/50">{metrics.paidCount} pedidos concluídos</p>
      </div>

      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-[#181024] to-[#120a1c] p-3.5 sm:p-4 shadow-lg shadow-purple-950/20 relative overflow-hidden">
        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
          <Clock className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-bold text-purple-300/80 uppercase tracking-wider block">
          PIX Aguardando
        </span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-purple-300">
            {metrics.pendingCount}
          </span>
          <span className="text-xs font-semibold text-purple-400">
            ({formatCurrency(metrics.totalPendingRevenue)})
          </span>
        </div>
        <p className="mt-1 text-[10.5px] text-purple-200/50">Cobranças abertas a recuperar</p>
      </div>

      <div className="rounded-2xl border border-stone-800 bg-[#150f20]/60 p-3.5 sm:p-4 shadow-md relative overflow-hidden">
        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-stone-800 text-stone-300">
          <Users className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
          Sessões do Quiz
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-stone-200">
            {metrics.totalLeads}
          </span>
          <span className="text-xs font-semibold text-purple-400">
            {metrics.conversionRate.toFixed(1)}% conv.
          </span>
        </div>
        <p className="mt-1 text-[10.5px] text-stone-400/60">Interações registradas no total</p>
      </div>
    </section>
  );
}

interface DashboardLeadsTabProps {
  readonly filteredLeads: readonly Lead[];
  readonly totalLeadsCount: number;
  readonly leadsWithPhoneCount: number;
  readonly paidCount: number;
  readonly pendingCount: number;
  readonly quizCount: number;
  readonly loading: boolean;
  readonly searchQuery: string;
  readonly filterQuick: FilterQuickOption;
  readonly expandedLeadId: string | null;
  readonly copiedPhone: string | null;
  readonly onSearchChange: (value: string) => void;
  readonly onClearSearch: () => void;
  readonly onFilterChange: (filter: FilterQuickOption) => void;
  readonly onToggleExpand: (leadId: string) => void;
  readonly onCopyPhone: (phone: string) => void;
}

interface LeadListContentProps {
  readonly loading: boolean;
  readonly filteredLeads: readonly Lead[];
  readonly expandedLeadId: string | null;
  readonly copiedPhone: string | null;
  readonly onToggleExpand: (leadId: string) => void;
  readonly onCopyPhone: (phone: string) => void;
}

function LeadListContent({
  loading,
  filteredLeads,
  expandedLeadId,
  copiedPhone,
  onToggleExpand,
  onCopyPhone,
}: Readonly<LeadListContentProps>) {
  if (loading) {
    return (
      <div className="p-12 text-center text-purple-300/60 flex flex-col items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
        <p className="text-sm font-semibold">Carregando contatos em tempo real...</p>
      </div>
    );
  }

  if (filteredLeads.length === 0) {
    return (
      <div className="p-10 text-center rounded-2xl border border-dashed border-purple-900/50 bg-[#130b1e]/50">
        <p className="text-sm font-semibold text-purple-300">Nenhum lead encontrado com esse filtro.</p>
        <p className="text-xs text-purple-400/60 mt-1">Experimente limpar a busca ou selecionar "Todos".</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {filteredLeads.map((lead) => (
        <LeadCardItem
          key={lead.id}
          lead={lead}
          isExpanded={expandedLeadId === lead.id}
          onToggleExpand={() => onToggleExpand(lead.id)}
          onCopyPhone={onCopyPhone}
          isCopied={copiedPhone === lead.lead_phone}
        />
      ))}
    </div>
  );
}

function DashboardLeadsTab({
  filteredLeads,
  totalLeadsCount,
  leadsWithPhoneCount,
  paidCount,
  pendingCount,
  quizCount,
  loading,
  searchQuery,
  filterQuick,
  expandedLeadId,
  copiedPhone,
  onSearchChange,
  onClearSearch,
  onFilterChange,
  onToggleExpand,
  onCopyPhone,
}: Readonly<DashboardLeadsTabProps>) {
  const filterButtons: Array<{ id: FilterQuickOption; label: string; count: number }> = [
    { id: "all", label: "Todos", count: totalLeadsCount },
    { id: "with_phone", label: "📱 Com WhatsApp", count: leadsWithPhoneCount },
    { id: "paid", label: "✅ Pagos", count: paidCount },
    { id: "pending", label: "⏳ PIX Aguardando", count: pendingCount },
    { id: "quiz", label: "✍️ No Quiz", count: quizCount },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, WhatsApp (DDD), ente querido ou UTM..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-purple-900/40 bg-[#130b1e] text-xs sm:text-sm text-stone-100 placeholder:text-purple-300/40 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {filterButtons.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterQuick === item.id
                  ? "bg-amber-400 text-stone-950 shadow-sm"
                  : "bg-[#170e24] text-purple-200/70 border border-purple-900/40 hover:bg-purple-950"
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>

      <LeadListContent
        loading={loading}
        filteredLeads={filteredLeads}
        expandedLeadId={expandedLeadId}
        copiedPhone={copiedPhone}
        onToggleExpand={onToggleExpand}
        onCopyPhone={onCopyPhone}
      />
    </div>
  );
}

interface DashboardOrdersTabProps {
  readonly orders: readonly PaymentOrder[];
}

function DashboardOrdersTab({ orders }: Readonly<DashboardOrdersTabProps>) {
  if (orders.length === 0) {
    return (
      <div className="p-10 text-center rounded-2xl border border-dashed border-purple-900/50 bg-[#130b1e]/50">
        <p className="text-sm font-semibold text-purple-300">Nenhum pedido PIX registrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((ord) => (
        <div
          key={ord.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-purple-900/40 bg-[#120a1c] p-3.5 sm:p-4 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white truncate">{ord.customer_name}</span>
              <span className="text-[10px] text-purple-400">· {formatRelativeTime(ord.created_at)}</span>
            </div>
            <p className="text-xs text-purple-300/70 mt-0.5 truncate">{ord.product_name}</p>
            {ord.customer_phone && (
              <p className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{formatPhoneDisplay(ord.customer_phone)}</span>
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="font-black text-sm sm:text-base text-amber-400 block">
              {formatCurrency(ord.amount_cents / 100)}
            </span>
            {ord.status === "paid" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400">
                ✓ PAGO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                ⏳ AGUARDANDO
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface DashboardMetricsTabProps {
  readonly leads: readonly Lead[];
  readonly totalLeads: number;
  readonly paidCount: number;
}

function DashboardMetricsTab({ leads, totalLeads, paidCount }: Readonly<DashboardMetricsTabProps>) {
  const utmDistribution = useMemo(() => {
    return leads.reduce((acc: Record<string, number>, l) => {
      const src = l.utm_source || "Direto/Orgânico";
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});
  }, [leads]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-purple-900/40 bg-[#120a1c] p-4 sm:p-6 shadow-md">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Retenção por Etapa do Quiz
        </h3>

        <div className="space-y-3">
          {[
            { step: 1, name: "Intro (Nome)", count: leads.length },
            { step: 2, name: "Ente Querido", count: leads.filter((l) => l.highest_step_index >= 2).length },
            { step: 3, name: "Vínculo Familiar", count: leads.filter((l) => l.highest_step_index >= 3).length },
            { step: 4, name: "Tempo de Luto", count: leads.filter((l) => l.highest_step_index >= 4).length },
            { step: 5, name: "Mensagem / Temas", count: leads.filter((l) => l.highest_step_index >= 5).length },
            { step: 6, name: "Confirmação", count: leads.filter((l) => l.highest_step_index >= 6).length },
            { step: 8, name: "Checkout & WhatsApp", count: leads.filter((l) => l.highest_step_index >= 8).length },
            { step: 9, name: "Doação Concluída (Paga)", count: paidCount },
          ].map((item) => {
            const pct = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0;
            return (
              <div key={item.step} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-200">
                    {item.step}. {item.name}
                  </span>
                  <span className="font-mono text-purple-400">
                    {item.count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-stone-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-purple-900/40 bg-[#120a1c] p-4 sm:p-6 shadow-md">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Origem dos Visitantes (UTM Source)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(utmDistribution).map(([source, count]) => (
            <div key={source} className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/50">
              <span className="block text-[11px] font-mono text-purple-300 truncate">{source}</span>
              <span className="text-lg font-black text-white">{count}</span>
              <span className="text-[10px] text-purple-400/60 block">
                {((count / (leads.length || 1)) * 100).toFixed(0)}% do tráfego
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("leads");
  const [filterQuick, setFilterQuick] = useState<FilterQuickOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supabaseUrl = DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = DEFAULT_SUPABASE_ANON_KEY;

  const fetchData = async (showLoadingState = false) => {
    if (showLoadingState) setIsRefreshing(true);
    try {
      const resLeads = await fetch(
        `${supabaseUrl}/rest/v1/quiz_funnel_leads?select=*&order=updated_at.desc,created_at.desc&limit=250`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        }
      );
      if (resLeads.ok) {
        const data = await resLeads.json();
        if (Array.isArray(data)) {
          setLeads(data);
        }
      }

      const resOrders = await fetch(
        `${supabaseUrl}/rest/v1/pix_orders?select=*&order=created_at.desc&limit=250`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        }
      );
      if (resOrders.ok) {
        const data = await resOrders.json();
        if (Array.isArray(data)) {
          const mapped: PaymentOrder[] = data.map((o: any) => ({
            id: o.id,
            customer_name: o.customer_name || "Consulente",
            customer_email: o.customer_email || "contato@templodeluz.com",
            customer_phone: o.customer_phone || undefined,
            product_name: o.product_name || "Doação ao Templo de Luz",
            amount_cents: o.amount_cents || 0,
            status: o.status || "pending",
            payment_method: "pix",
            created_at: o.created_at,
          }));
          setOrders(mapped);
        }
      }
      setLastSync(new Date());
    } catch (err) {
      console.warn("Erro ao buscar dados do Dashboard:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData(true);
    const interval = setInterval(() => void fetchData(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const leadsWithPhone = leads.filter((l) => l.lead_phone && l.lead_phone.replace(/\D/g, "").length >= 8);
    const paidOrders = orders.filter((o) => o.status === "paid");
    const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + o.amount_cents, 0) / 100;
    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "creating");
    const totalPendingRevenue = pendingOrders.reduce((sum, o) => sum + o.amount_cents, 0) / 100;
    const phoneCaptureRate = totalLeads > 0 ? (leadsWithPhone.length / totalLeads) * 100 : 0;
    const conversionRate = totalLeads > 0 ? (paidOrders.length / totalLeads) * 100 : 0;

    return {
      totalLeads,
      leadsWithPhoneCount: leadsWithPhone.length,
      phoneCaptureRate,
      paidCount: paidOrders.length,
      totalPaidRevenue,
      pendingCount: pendingOrders.length,
      totalPendingRevenue,
      conversionRate,
    };
  }, [leads, orders]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filterQuick === "with_phone") {
        if (!lead.lead_phone || lead.lead_phone.replace(/\D/g, "").length < 8) return false;
      } else if (filterQuick === "paid") {
        if (lead.payment_status !== "paid") return false;
      } else if (filterQuick === "pending") {
        if (lead.payment_status !== "waiting_payment") return false;
      } else if (filterQuick === "quiz") {
        if (lead.current_step_index >= 8 || lead.payment_status === "paid") return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = lead.lead_name?.toLowerCase().includes(q) || false;
      const matchEnte = lead.ente_querido?.toLowerCase().includes(q) || false;
      const matchPhone = lead.lead_phone?.includes(q) || false;
      const matchRelacao = lead.grau_parentesco?.toLowerCase().includes(q) || false;
      const matchUtm = lead.utm_source?.toLowerCase().includes(q) || false;

      return matchName || matchEnte || matchPhone || matchRelacao || matchUtm;
    });
  }, [leads, filterQuick, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleToggleExpand = (leadId: string) => {
    setExpandedLeadId((prev) => (prev === leadId ? null : leadId));
  };

  const handleExportCsv = () => {
    const headers = [
      "Data/Hora",
      "Nome Consulente",
      "WhatsApp",
      "Ente Querido",
      "Parentesco",
      "Etapa do Quiz",
      "Status Pagamento",
      "Valor (R$)",
      "Origem (UTM Source)",
      "Campanha (UTM Campaign)",
      "Mensagem Livre",
    ];

    const rows = leads.map((l) => [
      `"${new Date(l.updated_at || l.created_at).toLocaleString("pt-BR")}"`,
      `"${l.lead_name || "Não informado"}"`,
      `"${l.lead_phone || ""}"`,
      `"${l.ente_querido || ""}"`,
      `"${l.grau_parentesco || ""}"`,
      `"Passo ${l.current_step_index}: ${l.current_step_name}"`,
      `"${l.payment_status}"`,
      `"${((l.last_amount_cents || 0) / 100).toFixed(2)}"`,
      `"${l.utm_source || "Direto/Orgânico"}"`,
      `"${l.utm_campaign || ""}"`,
      `"${(l.mensagem_preview || "").replaceAll('"', '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `leads_templo_de_luz_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const quizInProgressCount = useMemo(() => {
    return leads.filter((l) => l.current_step_index < 8 && l.payment_status !== "paid").length;
  }, [leads]);

  return (
    <div className="min-h-screen bg-[#0d0714] text-stone-100 font-sans antialiased pb-20 selection:bg-purple-500 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-purple-900/40 bg-[#130b1e]/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 text-white shadow-md shadow-purple-900/30">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Templo de Luz <span className="text-amber-400 font-medium text-xs">Tracking</span>
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AO VIVO</span>
                </span>
              </div>
              <p className="text-[10px] text-purple-300/70 hidden sm:block">
                Sincronizado {formatRelativeTime(lastSync.toISOString())} · Vercel Ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchData(true)}
              disabled={isRefreshing}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-purple-800/60 bg-purple-950/50 px-3 text-xs font-bold text-purple-200 hover:bg-purple-900/60 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden xs:inline">Atualizar</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 text-xs font-black text-white hover:brightness-110 shadow-sm shadow-amber-600/30 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Exportar CSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        <DashboardKpiSection metrics={metrics} />

        <div className="flex rounded-2xl bg-[#140b20] p-1 border border-purple-900/40">
          <button
            type="button"
            onClick={() => setActiveTab("leads")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === "leads"
                ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-900/40"
                : "text-purple-300/70 hover:text-white"
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Leads & WhatsApps</span>
            <span className="ml-1 rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">
              {filteredLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === "orders"
                ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-900/40"
                : "text-purple-300/70 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Doações PIX</span>
            <span className="ml-1 rounded-full bg-black/30 px-1.5 py-0.2 text-[10px]">
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("metrics")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === "metrics"
                ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-900/40"
                : "text-purple-300/70 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Funil & Tráfego</span>
          </button>
        </div>

        {activeTab === "leads" && (
          <DashboardLeadsTab
            filteredLeads={filteredLeads}
            totalLeadsCount={leads.length}
            leadsWithPhoneCount={metrics.leadsWithPhoneCount}
            paidCount={metrics.paidCount}
            pendingCount={metrics.pendingCount}
            quizCount={quizInProgressCount}
            loading={loading}
            searchQuery={searchQuery}
            filterQuick={filterQuick}
            expandedLeadId={expandedLeadId}
            copiedPhone={copiedPhone}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
            onFilterChange={setFilterQuick}
            onToggleExpand={handleToggleExpand}
            onCopyPhone={handleCopy}
          />
        )}

        {activeTab === "orders" && <DashboardOrdersTab orders={orders} />}

        {activeTab === "metrics" && (
          <DashboardMetricsTab
            leads={leads}
            totalLeads={metrics.totalLeads}
            paidCount={metrics.paidCount}
          />
        )}
      </main>
    </div>
  );
}

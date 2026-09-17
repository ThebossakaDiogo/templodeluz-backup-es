import { useState, useMemo } from "react";
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
import type { Lead, PaymentOrder } from "@/types";

interface LiveTrackingHubProps {
  readonly leads: Lead[];
  readonly orders: PaymentOrder[];
  readonly loading: boolean;
  readonly onRefresh: () => void;
  readonly onlineCount?: number;
}

type FilterQuickOption = "all" | "with_phone" | "paid" | "pending" | "quiz";
type HubTab = "leads" | "orders" | "metrics";

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
  if (lead.payment_status === "waiting_payment" || lead.pix_generated) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
        ⏳ PIX Gerado
      </span>
    );
  }
  if (lead.current_step_index >= 8 || lead.checkout_opened) {
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
      } hover:border-purple-500/50 p-4 shadow-lg`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              hasPhone
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-purple-950 text-purple-400 border border-purple-800/40"
            }`}
          >
            {hasPhone ? <Phone size={18} /> : <Users size={18} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-sm text-stone-100">
                {lead.lead_name || "Consulente no Quiz"}
              </h4>
              <span className="text-[11px] text-stone-400">
                • {formatRelativeTime(lead.updated_at || lead.created_at)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-amber-200/90 font-medium">
                🤍 Ente: <strong>{lead.ente_querido || "Não informado"}</strong>
                {lead.grau_parentesco ? ` (${lead.grau_parentesco})` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <LeadStatusBadge lead={lead} />
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-xs text-purple-300 hover:text-white px-2 py-1 rounded bg-purple-950/60 hover:bg-purple-900/60 transition flex items-center gap-1 border border-purple-800/40"
          >
            {isExpanded ? (
              <>
                Menos <ChevronUp size={12} />
              </>
            ) : (
              <>
                Ver Detalhes <ChevronDown size={12} />
              </>
            )}
          </button>
        </div>
      </div>

      {hasPhone && (
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 bg-emerald-950/20 -mx-4 -mb-4 p-3 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-300 tracking-wide">
              {formattedPhone}
            </span>
            <button
              type="button"
              onClick={() => lead.lead_phone && onCopyPhone(lead.lead_phone)}
              className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 transition"
              title="Copiar WhatsApp"
            >
              {isCopied ? (
                <>
                  <Check size={11} className="text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy size={11} /> Copiar
                </>
              )}
            </button>
          </div>

          <a
            href={getWhatsAppLink(lead.lead_phone ?? "", lead.lead_name, lead.ente_querido)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm hover:shadow-emerald-500/20"
          >
            <MessageCircle size={13} />
            Chamar no WhatsApp
            <ExternalLink size={11} />
          </a>
        </div>
      )}

      {!hasPhone && (
        <div className="mt-3 pt-2 border-t border-white/5 text-[11px] text-stone-500 flex items-center gap-1">
          <AlertCircle size={12} />
          Ainda no quiz (telefone pendente)
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-purple-900/30 text-xs text-stone-300 space-y-2 bg-black/30 p-3 rounded-xl">
          {lead.lead_email && (
            <div>
              <span className="text-stone-400">E-mail:</span> {lead.lead_email}
            </div>
          )}
          {lead.mensagem_preview && (
            <div>
              <span className="text-stone-400">Mensagem / Dor:</span>
              <p className="mt-0.5 text-stone-200 italic bg-white/5 p-2 rounded border border-white/5">
                "{lead.mensagem_preview}"
              </p>
            </div>
          )}
          {lead.temas_selecionados && lead.temas_selecionados.length > 0 && (
            <div>
              <span className="text-stone-400">Temas de afinidade:</span>{" "}
              {lead.temas_selecionados.join(", ")}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-stone-400 border-t border-white/5">
            <div>
              <span className="block text-stone-500">Origem:</span>
              {lead.utm_source || "Direto"}
            </div>
            <div>
              <span className="block text-stone-500">Campanha:</span>
              {lead.utm_campaign || "Orgânico"}
            </div>
            <div>
              <span className="block text-stone-500">Etapa Atual:</span>
              {lead.current_step_name} ({lead.current_step_index}/8)
            </div>
            <div>
              <span className="block text-stone-500">ID da Sessão:</span>
              <span className="font-mono">{lead.session_id ? lead.session_id.slice(0, 8) : "—"}</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export function LiveTrackingHub({
  leads,
  orders,
  loading,
  onRefresh,
  onlineCount = 0,
}: LiveTrackingHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("leads");
  const [filterQuick, setFilterQuick] = useState<FilterQuickOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const leadsWithPhone = leads.filter(
      (l) => l.lead_phone && l.lead_phone.replace(/\D/g, "").length >= 8
    );
    const paidOrders = orders.filter((o) => o.status === "paid");
    const totalRevenueCents = paidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === "pending");
    const pendingRevenueCents = pendingOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);

    const checkoutsReached = leads.filter((l) => l.current_step_index >= 8 || l.checkout_opened).length;
    const conversionRate = totalLeads > 0 ? ((paidOrders.length / totalLeads) * 100).toFixed(1) : "0.0";
    const phoneCaptureRate = totalLeads > 0 ? ((leadsWithPhone.length / totalLeads) * 100).toFixed(1) : "0.0";

    return {
      totalLeads,
      leadsWithPhoneCount: leadsWithPhone.length,
      phoneCaptureRate,
      paidOrdersCount: paidOrders.length,
      totalRevenueCents,
      pendingOrdersCount: pendingOrders.length,
      pendingRevenueCents,
      checkoutsReached,
      conversionRate,
    };
  }, [leads, orders]);

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (filterQuick === "with_phone") {
      result = result.filter((l) => l.lead_phone && l.lead_phone.replace(/\D/g, "").length >= 8);
    } else if (filterQuick === "paid") {
      result = result.filter((l) => l.payment_status === "paid");
    } else if (filterQuick === "pending") {
      result = result.filter((l) => l.payment_status === "waiting_payment" || l.pix_generated);
    } else if (filterQuick === "quiz") {
      result = result.filter((l) => l.current_step_index < 8 && !l.lead_phone);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          (l.lead_name && l.lead_name.toLowerCase().includes(q)) ||
          (l.lead_phone && l.lead_phone.includes(q)) ||
          (l.ente_querido && l.ente_querido.toLowerCase().includes(q)) ||
          (l.utm_source && l.utm_source.toLowerCase().includes(q)) ||
          (l.utm_campaign && l.utm_campaign.toLowerCase().includes(q))
      );
    }

    return result;
  }, [leads, filterQuick, searchQuery]);

  const exportLeadsCsv = () => {
    const headers = [
      "Nome",
      "Telefone",
      "E-mail",
      "Ente Querido",
      "Parentesco",
      "Mensagem",
      "Status Pagamento",
      "Etapa",
      "Origem (UTM)",
      "Criado em",
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.lead_name || "Anônimo"}"`,
      `"${l.lead_phone || ""}"`,
      `"${l.lead_email || ""}"`,
      `"${l.ente_querido || ""}"`,
      `"${l.grau_parentesco || ""}"`,
      `"${(l.mensagem_preview || "").replace(/"/g, '""')}"`,
      `"${l.payment_status}"`,
      `"${l.current_step_name || l.current_step_index}"`,
      `"${l.utm_source || "Direto"}"`,
      `"${l.created_at}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `leads_templo_de_luz_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header do Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#130d22] border border-purple-900/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-stone-100">
                Templo de Luz <span className="text-purple-400 font-semibold">Tracking • AO VIVO</span>
              </h2>
              {onlineCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineCount} AO VIVO
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Telemetria de leads, acolhimento e doações no OD Metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-800 transition disabled:opacity-50"
            title="Atualizar dados agora"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-purple-400" : ""} />
          </button>
          <button
            type="button"
            onClick={exportLeadsCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
          >
            <Download size={14} />
            Exportar Leads
          </button>
        </div>
      </div>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Whatsapps Capturados */}
        <div className="p-4 rounded-2xl bg-[#120a1c] border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              WhatsApps Capturados
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageCircle size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.leadsWithPhoneCount}</span>
            <span className="text-xs text-emerald-400 font-bold">({metrics.phoneCaptureRate}% do funil)</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Prontos para contato e acolhimento</p>
        </div>

        {/* Doações Pagas */}
        <div className="p-4 rounded-2xl bg-[#120a1c] border border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Doações Pagas
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {formatCurrency(metrics.totalRevenueCents / 100)}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">{metrics.paidOrdersCount} pedidos concluídos</p>
        </div>

        {/* PIX Aguardando */}
        <div className="p-4 rounded-2xl bg-[#120a1c] border border-purple-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-purple-300">
              PIX Aguardando
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.pendingOrdersCount}</span>
            <span className="text-xs text-purple-300 font-medium">
              ({formatCurrency(metrics.pendingRevenueCents / 100)})
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Cobranças abertas a recuperar</p>
        </div>

        {/* Sessões do Quiz */}
        <div className="p-4 rounded-2xl bg-[#120a1c] border border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Sessões do Quiz
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.totalLeads}</span>
            <span className="text-xs text-indigo-400 font-bold">{metrics.conversionRate}% conv.</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Interações registradas no total</p>
        </div>
      </div>

      {/* Abas Internas */}
      <div className="flex items-center gap-2 border-b border-purple-900/30 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("leads")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "leads"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
              : "bg-stone-900/60 text-stone-400 hover:text-white"
          }`}
        >
          <Phone size={14} />
          Leads & WhatsApps
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
            {metrics.totalLeads}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "orders"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
              : "bg-stone-900/60 text-stone-400 hover:text-white"
          }`}
        >
          <CreditCard size={14} />
          Doações PIX
          <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px]">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("metrics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "metrics"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
              : "bg-stone-900/60 text-stone-400 hover:text-white"
          }`}
        >
          <BarChart3 size={14} />
          Funil & Tráfego
        </button>
      </div>

      {/* CONTEÚDO DA ABA: LEADS */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          {/* Barra de Busca e Filtros Rápidos */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                type="text"
                placeholder="Buscar por nome, WhatsApp (DDD), ente querido ou UTM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#120a1c] border border-purple-900/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFilterQuick("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterQuick === "all"
                    ? "bg-amber-500 text-stone-950 font-bold"
                    : "bg-stone-900/80 text-stone-400 hover:text-white"
                }`}
              >
                Todos ({metrics.totalLeads})
              </button>

              <button
                type="button"
                onClick={() => setFilterQuick("with_phone")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterQuick === "with_phone"
                    ? "bg-emerald-500 text-stone-950 font-bold"
                    : "bg-stone-900/80 text-stone-400 hover:text-white"
                }`}
              >
                📱 Com WhatsApp ({metrics.leadsWithPhoneCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterQuick("paid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterQuick === "paid"
                    ? "bg-emerald-600 text-white font-bold"
                    : "bg-stone-900/80 text-stone-400 hover:text-white"
                }`}
              >
                ✓ Pagos ({metrics.paidOrdersCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterQuick("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterQuick === "pending"
                    ? "bg-amber-600 text-white font-bold"
                    : "bg-stone-900/80 text-stone-400 hover:text-white"
                }`}
              >
                ⏳ PIX Aguardando ({metrics.pendingOrdersCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterQuick("quiz")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterQuick === "quiz"
                    ? "bg-purple-600 text-white font-bold"
                    : "bg-stone-900/80 text-stone-400 hover:text-white"
                }`}
              >
                ✍️ No Quiz ({metrics.totalLeads - metrics.leadsWithPhoneCount})
              </button>
            </div>
          </div>

          {/* Lista de Leads */}
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-[#120a1c] border border-purple-900/30">
              <Users size={32} className="mx-auto text-stone-600 mb-2" />
              <p className="text-sm font-semibold text-stone-300">Nenhum lead encontrado</p>
              <p className="text-xs text-stone-500 mt-1">Tente ajustar seus termos de busca ou filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredLeads.map((lead) => (
                <LeadCardItem
                  key={lead.id || lead.session_id}
                  lead={lead}
                  isExpanded={expandedLeadId === (lead.id || lead.session_id)}
                  onToggleExpand={() =>
                    setExpandedLeadId(
                      expandedLeadId === (lead.id || lead.session_id)
                        ? null
                        : lead.id || lead.session_id
                    )
                  }
                  onCopyPhone={handleCopyPhone}
                  isCopied={copiedPhone === lead.lead_phone}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA: PEDIDOS */}
      {activeTab === "orders" && (
        <div className="rounded-2xl bg-[#120a1c] border border-purple-900/40 overflow-hidden">
          <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-200">Pedidos PIX & Transações</h3>
            <span className="text-xs text-stone-400">{orders.length} pedidos registrados</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">Nenhum pedido registrado até o momento.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-950/40 text-stone-400 font-bold border-b border-purple-900/30">
                  <tr>
                    <th className="p-3">Consulente</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-stone-300">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-purple-950/20">
                      <td className="p-3 font-semibold text-white">
                        {o.customer_name || "Anônimo"}
                        {o.customer_email && (
                          <span className="block text-[11px] text-stone-400 font-normal">
                            {o.customer_email}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {formatCurrency(o.amount_cents / 100)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : o.status === "pending"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {o.status === "paid" ? "Pago" : o.status === "pending" ? "Aguardando" : o.status}
                        </span>
                      </td>
                      <td className="p-3 text-stone-400 font-mono text-[11px]">
                        {formatRelativeTime(o.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA: MÉTRICAS & FUNIL */}
      {activeTab === "metrics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#120a1c] border border-purple-900/40 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-300">
              Taxas de Conversão do Funil
            </h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300">Início do Quiz → WhatsApp</span>
                  <span className="font-bold text-emerald-400">{metrics.phoneCaptureRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, Number(metrics.phoneCaptureRate))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300">Início → Checkout</span>
                  <span className="font-bold text-indigo-400">
                    {metrics.totalLeads > 0
                      ? ((metrics.checkoutsReached / metrics.totalLeads) * 100).toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${
                        metrics.totalLeads > 0
                          ? Math.min(100, (metrics.checkoutsReached / metrics.totalLeads) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300">Início → Pagamento Concluído</span>
                  <span className="font-bold text-amber-400">{metrics.conversionRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, Number(metrics.conversionRate))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#120a1c] border border-purple-900/40 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-300">
              Resumo Operacional
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-stone-400 block">Total de Cadastros</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{metrics.totalLeads}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-stone-400 block">WhatsApps Prontos</span>
                <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                  {metrics.leadsWithPhoneCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-stone-400 block">Pedidos Concluídos</span>
                <span className="text-lg font-bold text-amber-400 mt-0.5 block">
                  {metrics.paidOrdersCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-stone-400 block">PIX Pendentes</span>
                <span className="text-lg font-bold text-purple-300 mt-0.5 block">
                  {metrics.pendingOrdersCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

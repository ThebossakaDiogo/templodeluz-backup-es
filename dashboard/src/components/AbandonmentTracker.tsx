import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import type { DashboardProfileId } from "@/lib/dashboard-profiles";
import { createWhatsAppChatClient } from "@/services/whatsapp-chat";
import type { Lead, PaymentOrder } from "@/types";

interface AbandonmentTrackerProps {
  readonly leads: readonly Lead[];
  readonly orders: readonly PaymentOrder[];
  readonly profile: DashboardProfileId;
  readonly accessToken: string | undefined;
  readonly loading?: boolean;
  readonly onRefresh: () => void;
}

type FollowUpStage = "first" | "reminder";

interface RecoveryCandidate {
  readonly id: string;
  readonly lead: Lead;
  readonly phone: string;
  readonly pixGeneratedAt: string;
  readonly amountCents: number;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function cleanPhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function timeAgo(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Data não informada";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 2) return "Agora mesmo";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Há ${days} dia${days === 1 ? "" : "s"}`;
}

function contactRecommendation(value: string): { label: string; tone: string } {
  const minutes = Math.max(0, (Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 30) return { label: "Aguardar 30 min", tone: "var(--text-muted)" };
  if (minutes < 24 * 60) return { label: "1º follow-up", tone: "#b45309" };
  return { label: "Lembrete cordial", tone: "#047857" };
}

function followUpMessage(candidate: RecoveryCandidate, stage: FollowUpStage): string {
  const firstName = candidate.lead.lead_name?.trim().split(/\s+/)[0] || "tudo bem";
  const lovedOne = candidate.lead.ente_querido?.trim();
  const context = lovedOne ? ` para ${lovedOne}` : "";

  if (stage === "reminder") {
    return `Olá, ${firstName}. Aqui é da equipe da Milena Medeiros.\n\nPassamos apenas para confirmar se você teve alguma dificuldade com o PIX do seu pedido${context}. Se precisar de ajuda para concluir ou tiver qualquer dúvida, responda por aqui que orientamos você com calma.`;
  }

  return `Olá, ${firstName}. Aqui é da equipe da Milena Medeiros.\n\nVimos que o PIX do seu pedido${context} foi gerado, mas ainda não identificamos a confirmação. Às vezes isso acontece por uma dúvida ou por uma interrupção no momento do pagamento.\n\nSe precisar de ajuda para concluir, responda por aqui. Estamos à disposição.`;
}

function isPaidForLead(lead: Lead, paidPhones: Set<string>, paidEmails: Set<string>): boolean {
  const phone = cleanPhone(lead.lead_phone);
  if (phone.length >= 8 && paidPhones.has(phone)) return true;
  const email = lead.lead_email?.trim().toLowerCase();
  return Boolean(email && paidEmails.has(email));
}

function whatsappLink(candidate: RecoveryCandidate, message: string): string {
  const phone = candidate.phone.startsWith("55") ? candidate.phone : `55${candidate.phone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function AbandonmentTracker({
  leads,
  orders,
  profile,
  accessToken,
  loading = false,
  onRefresh,
}: AbandonmentTrackerProps) {
  const client = useMemo(() => createWhatsAppChatClient(profile, accessToken), [profile, accessToken]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RecoveryCandidate | null>(null);
  const [stage, setStage] = useState<FollowUpStage>("first");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(() => {
    const paidPhones = new Set<string>();
    const paidEmails = new Set<string>();
    for (const order of orders) {
      if (order.status !== "paid") continue;
      const phone = cleanPhone(order.customer_phone);
      if (phone.length >= 8) paidPhones.add(phone);
      const email = order.customer_email?.trim().toLowerCase();
      if (email) paidEmails.add(email);
    }

    const byPhone = new Map<string, RecoveryCandidate>();
    for (const lead of leads) {
      const phone = cleanPhone(lead.lead_phone);
      const pixGenerated = lead.pix_generated || lead.payment_status === "waiting_payment";
      if (!pixGenerated || lead.payment_status === "paid" || !phone || phone.length < 8) continue;
      if (isPaidForLead(lead, paidPhones, paidEmails)) continue;

      const pixGeneratedAt = lead.pix_generated_at || lead.updated_at || lead.created_at;
      const candidate: RecoveryCandidate = {
        id: lead.id || lead.session_id,
        lead,
        phone,
        pixGeneratedAt,
        amountCents: lead.last_amount_cents || 0,
      };
      const current = byPhone.get(phone);
      if (!current || new Date(candidate.pixGeneratedAt).getTime() > new Date(current.pixGeneratedAt).getTime()) {
        byPhone.set(phone, candidate);
      }
    }

    return [...byPhone.values()].sort(
      (left, right) => new Date(right.pixGeneratedAt).getTime() - new Date(left.pixGeneratedAt).getTime(),
    );
  }, [leads, orders]);

  const visibleCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return candidates;
    return candidates.filter(({ lead, phone }) =>
      [lead.lead_name, lead.ente_querido, lead.lead_email, phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [candidates, search]);

  const pendingValue = candidates.reduce((total, candidate) => total + candidate.amountCents, 0);
  const readyToContact = candidates.filter((candidate) => {
    const minutes = (Date.now() - new Date(candidate.pixGeneratedAt).getTime()) / 60_000;
    return minutes >= 30;
  }).length;

  const openComposer = (candidate: RecoveryCandidate, nextStage: FollowUpStage = "first") => {
    setSelected(candidate);
    setStage(nextStage);
    setMessage(followUpMessage(candidate, nextStage));
    setError(null);
    setNotice(null);
  };

  const changeStage = (nextStage: FollowUpStage) => {
    if (!selected) return;
    setStage(nextStage);
    setMessage(followUpMessage(selected, nextStage));
  };

  const sendFollowUp = async () => {
    if (!selected || !message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const thread = await client.createThread({
        customerPhone: selected.phone,
        customerName: selected.lead.lead_name,
      });
      await client.sendText({ thread, content: message.trim() });
      const now = new Date().toISOString();
      setSentAt((current) => ({ ...current, [selected.id]: now }));
      setNotice(`Follow-up enviado para ${selected.lead.lead_name || "o consulente"} e registrado no WhatsApp Chat.`);
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o follow-up.");
    } finally {
      setSending(false);
    }
  };

  const profileLabel = profile === "meta" ? "Meta" : "TikTok";

  return (
    <section className="space-y-5" aria-label={`Recuperação de PIX ${profileLabel}`}>
      <header className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
            <WalletCards size={21} />
          </span>
          <div>
            <span className="section-kicker">Modo de recuperação</span>
            <h2 className="mt-1 text-lg font-black text-[var(--text-primary)]">PIX gerado, ainda não pago</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-muted)]">
              Fila exclusiva do perfil {profileLabel}. Cada mensagem é revisada e enviada manualmente pelo WhatsApp Chat, sem disparos automáticos.
            </p>
          </div>
        </div>
        <button type="button" className="btn self-start lg:self-auto" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Atualizar fila
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="card border-amber-500/30 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">PIX pendentes com WhatsApp</span>
          <strong className="mt-2 block text-3xl font-black text-[var(--text-primary)]">{candidates.length}</strong>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Contatos únicos para recuperação</p>
        </article>
        <article className="card border-emerald-500/30 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Prontos para contato</span>
          <strong className="mt-2 block text-3xl font-black text-[var(--text-primary)]">{readyToContact}</strong>
          <p className="mt-1 text-xs text-[var(--text-muted)]">PIX emitidos há pelo menos 30 minutos</p>
        </article>
        <article className="card p-4">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Valor pendente identificado</span>
          <strong className="mt-2 block text-3xl font-black text-[var(--text-primary)]">{currency.format(pendingValue / 100)}</strong>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Somente valores vinculados a um contato</p>
        </article>
      </div>

      {notice && <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"><span className="flex items-center gap-2"><Check size={16} /> {notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Fechar aviso"><X size={16} /></button></div>}
      {error && <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Fechar aviso"><X size={16} /></button></div>}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)]">Lista de recuperação</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Pagamentos confirmados são excluídos antes de aparecerem nesta fila.</p>
          </div>
          <label className="relative block w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={15} />
            <input className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome ou WhatsApp" />
          </label>
        </div>

        {visibleCandidates.length === 0 ? (
          <div className="p-10 text-center">
            <Check className="mx-auto text-emerald-500" size={28} />
            <h3 className="mt-3 text-sm font-bold text-[var(--text-primary)]">Nenhum PIX pendente com WhatsApp</h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-[var(--text-muted)]">Novos PIX não pagos aparecerão aqui quando os dados do perfil forem atualizados.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {visibleCandidates.map((candidate) => {
              const recommendation = contactRecommendation(candidate.pixGeneratedAt);
              const followUpSentAt = sentAt[candidate.id];
              return (
                <article key={candidate.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]"><UserRound size={16} /></span>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-[var(--text-primary)]">{candidate.lead.lead_name || "Consulente sem nome"}</h4>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{candidate.phone}{candidate.lead.ente_querido ? ` · ${candidate.lead.ente_querido}` : ""}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300"><Clock3 size={12} /> PIX {timeAgo(candidate.pixGeneratedAt)}</span>
                        <span className="font-semibold text-[var(--text-secondary)]">{candidate.amountCents > 0 ? currency.format(candidate.amountCents / 100) : "Valor não informado"}</span>
                        <span style={{ color: recommendation.tone }} className="font-bold">{recommendation.label}</span>
                        {followUpSentAt && <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300"><Check size={12} /> Enviado nesta sessão</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button type="button" className="btn btn-emerald" onClick={() => openComposer(candidate, new Date(candidate.pixGeneratedAt).getTime() + 86_400_000 < Date.now() ? "reminder" : "first")}>
                      <MessageCircle size={15} /> Preparar follow-up
                    </button>
                    <a className="btn" href={whatsappLink(candidate, followUpMessage(candidate, "first"))} target="_blank" rel="noopener noreferrer" title="Abrir no WhatsApp Web">
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Preparar follow-up">
          <div className="card max-h-[92dvh] w-full max-w-xl overflow-y-auto p-5 shadow-2xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <span className="section-kicker">Follow-up individual</span>
                <h3 className="mt-1 text-base font-black text-[var(--text-primary)]">{selected.lead.lead_name || "Consulente"}</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{selected.phone} · PIX {timeAgo(selected.pixGeneratedAt)}</p>
              </div>
              <button type="button" className="btn" onClick={() => setSelected(null)} aria-label="Fechar mensagem"><X size={16} /></button>
            </header>

            <div className="mt-5 flex gap-2" role="group" aria-label="Tipo de follow-up">
              <button type="button" className={`btn ${stage === "first" ? "btn-emerald" : ""}`} onClick={() => changeStage("first")}>1º contato</button>
              <button type="button" className={`btn ${stage === "reminder" ? "btn-emerald" : ""}`} onClick={() => changeStage("reminder")}>Lembrete</button>
            </div>

            <label className="mt-4 block text-xs font-bold text-[var(--text-primary)]" htmlFor="recovery-message">Mensagem para revisar antes do envio</label>
            <textarea id="recovery-message" className="mt-2 min-h-48 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-sm leading-relaxed text-[var(--text-primary)] outline-none focus:border-emerald-500" value={message} onChange={(event) => setMessage(event.target.value)} />
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">O envio é manual. A mensagem será salva na conversa deste contato no WhatsApp Chat do perfil {profileLabel}.</p>

            <footer className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn" onClick={() => setSelected(null)}>Cancelar</button>
              <a className="btn" href={whatsappLink(selected, message)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> WhatsApp Web</a>
              <button type="button" className="btn btn-emerald" onClick={() => void sendFollowUp()} disabled={sending || !message.trim()}>
                {sending ? <RefreshCw className="animate-spin" size={15} /> : <Send size={15} />} {sending ? "Enviando..." : "Enviar follow-up"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}

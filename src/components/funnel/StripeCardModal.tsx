import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { trackInitiateDonation } from "@/lib/metaPixel";
import { CreditCard } from "@/components/ui/credit-card";
import { CardFlagsBadgeRow } from "./CardFlags";

interface StripeCardModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly productId: "carta_sagrada" | "cirurgia_milena";
  readonly amountCents: number;
  readonly primeiroEnte?: string;
}

export function StripeCardModal({
  isOpen,
  onClose,
  productId,
  amountCents: initialAmountCents,
  primeiroEnte = "seu ente querido",
}: StripeCardModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [amountCents, setAmountCents] = useState(initialAmountCents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAmountCents(initialAmountCents);
  }, [initialAmountCents]);

  // Recupera nome do lead já digitado no quiz
  useEffect(() => {
    if (typeof window !== "undefined" && !customerName) {
      try {
        const raw = localStorage.getItem("play_and_win_captured_logs");
        if (raw) {
          const parsed = JSON.parse(raw);
          const nameEntry = parsed.find(
            (e: { field: string; value: string }) =>
              (e.field === "nome_consulente" || e.field === "lead_name") && e.value,
          );
          if (nameEntry?.value) {
            setCustomerName(nameEntry.value);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [customerName]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  const formattedAmount = (amountCents / 100).toFixed(2).replace(".", ",");

  const handleProceedStripe = async () => {
    setError("");
    if (customerName.trim().length < 3) {
      setError("Por favor, digite seu nome completo.");
      return;
    }

    setLoading(true);
    try {
      const productName =
        productId === "carta_sagrada"
          ? `Contribuição Fraterna - Materiais de ${primeiroEnte}`
          : "Campanha Solidária - Cirurgia Médium Milena";

      // Dispara início de doação no Meta Pixel com o valor monetário
      trackInitiateDonation({
        amountCents,
        productName,
        productId,
        paymentMethod: "cartao",
      });

      const session = await createStripeCheckoutSession({
        amountCents,
        productId,
        productName,
        customerName: customerName.trim(),
      });

      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Link da Stripe não retornado.");
      }
    } catch (err) {
      console.warn("Stripe Checkout Session failed:", err);
      setError(err instanceof Error ? err.message : "Não foi possível abrir o checkout da Stripe.");
      setLoading(false);
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[#e5daf0] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-left shadow-2xl sm:max-w-[440px] sm:rounded-3xl sm:p-6 animate-scale-up">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-purple-950">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-purple-700">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span>Pagamento Seguro com Cartão</span>
            </span>
            <h3 className="mt-1.5 text-xl font-extrabold text-[#181126] leading-tight">
              Confirmar Doação Fraterna
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f3edf8] text-lg font-bold text-[#2d144d] transition-colors hover:bg-[#e8ddf2]"
          >
            ✕
          </button>
        </div>

        {/* Cartão de Crédito Animado */}
        <div className="my-3 flex justify-center">
          <CreditCard
            cardNumber="•••• •••• •••• ••••"
            cardHolder={customerName.trim() || "NOME DO TITULAR"}
            expiryDate="••/••"
            variant="dark"
          />
        </div>

        {/* Card de Resumo do Valor */}
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-[#fffdfa] via-[#fffbeb] to-[#fef8ea] p-3.5 text-center shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#92400e]">
              Valor da Contribuição:
            </span>
            <span className="font-display text-2xl font-black text-[#2d144d]">
              R$ {formattedAmount}
            </span>
          </div>
          <p className="mt-1 text-left text-[11px] text-[#786445] leading-tight">
            {productId === "carta_sagrada"
              ? `Vela de 7 dias e materiais do oratório para ${primeiroEnte}`
              : "Aporte solidário para a cirurgia de catarata da Médium Milena"}
          </p>
        </div>

        {/* Campo do Nome */}
        <div className="mt-3.5">
          <label htmlFor="stripe-card-name" className="mb-1.5 block text-xs font-bold text-[#2d144d]">
            Nome completo impresso no cartão:
          </label>
          <input
            id="stripe-card-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleProceedStripe();
            }}
            placeholder="Digite como está no cartão"
            autoComplete="name"
            className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3 text-[15px] font-medium text-[#181126] outline-hidden transition-colors placeholder:text-[#9583a6] focus:border-purple-600 shadow-2xs"
          />
        </div>

        {error && <p className="mt-2 text-xs font-bold text-red-700">{error}</p>}

        {/* Botão de Ação */}
        <button
          type="button"
          onClick={() => void handleProceedStripe()}
          disabled={loading}
          className="mt-5 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#2d144d] via-[#3d1868] to-[#1f0c36] px-6 py-4 text-[14.5px] font-extrabold uppercase tracking-wide text-white shadow-xl shadow-[#2d144d]/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 text-center"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Abrindo Checkout Stripe...</span>
            </span>
          ) : (
            `Pagar R$ ${formattedAmount} com Cartão ›`
          )}
        </button>

        {/* Garantia & Bandeiras */}
        <div className="mt-4 pt-3 border-t border-[#ece4f4] space-y-2.5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-[#5e4b73]">
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-600">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Criptografia SSL 256-bit
            </span>
            <span aria-hidden="true" className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-blue-600">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Checkout Oficial Stripe
            </span>
            <span aria-hidden="true" className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-purple-600">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Garantia e Proteção Total
            </span>
          </div>

          <div className="pt-1 flex flex-col items-center justify-center gap-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8e7a60]">
              Bandeiras Aceitas
            </span>
            <CardFlagsBadgeRow className="justify-center" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

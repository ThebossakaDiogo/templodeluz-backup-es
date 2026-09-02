import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { CHECKOUT_URL } from "./data";
import { trackInitiateDonation } from "@/lib/metaPixel";

interface StripeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: "carta_sagrada" | "cirurgia_milena";
  amountCents: number;
  primeiroEnte?: string;
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
      console.warn("Stripe Checkout Session fallback:", err);
      // Se a Edge Function da Stripe não estiver ativa ou faltar a chave secreta, usa o link de checkout alternativo
      if (CHECKOUT_URL) {
        window.location.href = CHECKOUT_URL;
      } else {
        setError(err instanceof Error ? err.message : "Não foi possível abrir o checkout da Stripe.");
        setLoading(false);
      }
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar valor para Cartão de Crédito"
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[#e5daf0] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-left shadow-2xl sm:max-w-[440px] sm:rounded-3xl sm:p-6 animate-scale-up">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-blue-900">
              💳 Pagamento com Cartão
            </span>
            <h3 className="mt-2 text-xl font-extrabold text-[#181126] leading-tight">
              Confirmar Doação no Cartão
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

        {/* Card de Valor */}
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-[#fffdfa] via-[#fffbeb] to-[#fef8ea] p-4 text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#92400e] block">
            Valor selecionado para a doação:
          </span>
          <span className="font-display mt-1 block text-3xl font-black text-[#2d144d]">
            R$ {formattedAmount}
          </span>
          <span className="mt-1 block text-[11.5px] text-[#786445]">
            {productId === "carta_sagrada"
              ? `Materiais do oratório e vela sagrada para ${primeiroEnte}`
              : "Aporte para a cirurgia de catarata da Médium Milena"}
          </span>
        </div>

        {/* Campo do Nome */}
        <div className="mt-4">
          <label htmlFor="stripe-card-name" className="mb-1.5 block text-xs font-bold text-[#2d144d]">
            Nome completo do titular
          </label>
          <input
            id="stripe-card-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleProceedStripe();
            }}
            placeholder="Digite o nome como no cartão"
            autoComplete="name"
            className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3 text-[15px] font-medium text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-[#2d144d]"
          />
        </div>

        {error && <p className="mt-2 text-xs font-bold text-red-700">{error}</p>}

        {/* Botão de Ação */}
        <button
          type="button"
          onClick={() => void handleProceedStripe()}
          disabled={loading}
          className="utmify-initiate-checkout mt-5 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#2d144d] via-[#3d1868] to-[#1f0c36] px-6 py-4 text-[14.5px] font-extrabold uppercase tracking-wide text-white shadow-xl shadow-[#2d144d]/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 text-center"
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Abrindo Checkout Stripe...
            </span>
          ) : (
            `Pagar R$ ${formattedAmount} com Cartão ›`
          )}
        </button>

        {/* Garantia & Bandeiras */}
        <div className="mt-4 pt-3 border-t border-[#ece4f4] space-y-2 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-[#5e4b73]">
            <span>🔒 Criptografia SSL 256-bit</span>
            <span>•</span>
            <span>⚡ Processamento Seguro Stripe</span>
            <span>•</span>
            <span>🛡️ 7 Dias de Garantia</span>
          </div>
          <p className="text-[10.5px] text-[#8e7a60]">
            Aceita Visa, Mastercard, Elo, Hipercard, American Express e parcelamento.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { createPixCharge, getPixStatus, type PixCharge, type PixPaymentStatus } from "@/lib/pix";
import { sendUtmifyOrder } from "@/lib/utmify";
import { trackInitiateDonation, trackPurchaseComplete } from "@/lib/metaPixel";

export function PixIcon({
  className = "w-5 h-5",
  fill = "currentColor",
}: {
  readonly className?: string;
  readonly fill?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
    >
      <path
        fill={fill}
        d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z"
      />
      <path
        fill={fill}
        d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z"
      />
      <path
        fill={fill}
        d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26C46.65,21.88,46.65,26.12,44.04,28.74z"
      />
    </svg>
  );
}

interface PixCheckoutProps {
  readonly productId: "carta_sagrada" | "cirurgia_milena";
  readonly amountCents: number;
}

const DEFAULT_SUPABASE_URL = "https://opftmzegcvfyoinjfmcj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24";

const config = {
  supabaseUrl: (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || DEFAULT_SUPABASE_URL,
  supabaseAnonKey: (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) || DEFAULT_SUPABASE_ANON_KEY,
};

const statusMessage: Record<PixPaymentStatus, string> = {
  creating: "Preparando cobrança...",
  pending: "Aguardando pagamento",
  paid: "Pagamento confirmado com sucesso!",
  failed: "Não foi possível concluir o pagamento",
  expired: "Este PIX expirou",
  in_dispute: "Pagamento em análise",
  chargeback: "Pagamento estornado",
};

const terminalStatuses = new Set<PixPaymentStatus>([
  "paid",
  "failed",
  "expired",
  "in_dispute",
  "chargeback",
]);

interface PixModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly productId: "carta_sagrada" | "cirurgia_milena";
  readonly formattedAmount: string;
  readonly customerName: string;
  readonly setCustomerName: (name: string) => void;
  readonly charge: PixCharge | null;
  readonly status: PixPaymentStatus;
  readonly loading: boolean;
  readonly copied: boolean;
  readonly error: string;
  readonly onGeneratePix: () => void;
  readonly onCopyPix: () => void;
  readonly onResetCharge: () => void;
}

function PixModalContent({
  charge,
  status,
  copied,
  onResetCharge,
  onCopyPix,
}: {
  readonly charge: PixCharge;
  readonly status: PixPaymentStatus;
  readonly copied: boolean;
  readonly onResetCharge: () => void;
  readonly onCopyPix: () => void;
}) {
  if (status === "paid") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-950">
        <span className="text-3xl block mb-2">🎉</span>
        <p className="text-sm font-black">Pagamento confirmado com sucesso!</p>
        <p className="mt-1 text-xs text-emerald-700">Redirecionando automaticamente em instantes...</p>
      </div>
    );
  }

  if (terminalStatuses.has(status)) {
    return (
      <button
        type="button"
        onClick={onResetCharge}
        className="w-full cursor-pointer rounded-2xl bg-[#2d144d] px-5 py-4 text-sm font-extrabold uppercase text-white"
      >
        Gerar novo PIX
      </button>
    );
  }

  return (
    <>
      <div className="inline-block rounded-2xl border-2 border-emerald-500/30 bg-white p-3 shadow-md">
        {charge.qrCodeBase64 ? (
          <img
            src={charge.qrCodeBase64.startsWith("data:") ? charge.qrCodeBase64 : `data:image/png;base64,${charge.qrCodeBase64}`}
            alt="QR Code PIX"
            className="h-[210px] w-[210px]"
          />
        ) : (
          <QRCodeSVG value={charge.pixPayload} size={210} level="M" marginSize={4} />
        )}
      </div>
      <button
        type="button"
        onClick={onCopyPix}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25"
      >
        <PixIcon className="w-4 h-4 text-white" />
        <span>{copied ? "Código PIX copiado!" : "Copiar Código PIX Copia e Cola"}</span>
      </button>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#786445]">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>A confirmação acontece automaticamente em segundos.</span>
      </div>
    </>
  );
}

function PixModal({
  isOpen,
  onClose,
  productId,
  formattedAmount,
  customerName,
  setCustomerName,
  charge,
  status,
  loading,
  copied,
  error,
  onGeneratePix,
  onCopyPix,
  onResetCharge,
}: PixModalProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[#e5daf0] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:max-w-[430px] sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3 text-left">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              <PixIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>PIX Oficial Banco Central</span>
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-[#181126]">
              {charge ? "Escaneie o QR Code" : "Gerar Pagamento PIX"}
            </h3>
            <p className="mt-1 text-sm font-black text-emerald-700">R$ {formattedAmount}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f3edf8] text-lg font-bold text-[#2d144d] transition-colors hover:bg-[#e8ddf2]"
          >
            ✕
          </button>
        </div>

        {!charge ? (
          <>
            <label htmlFor={`pix-payer-${productId}`} className="mb-2 block text-left text-xs font-bold text-[#2d144d]">
              Nome completo do titular da conta:
            </label>
            <input
              id={`pix-payer-${productId}`}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onGeneratePix();
              }}
              placeholder="Digite seu nome completo"
              autoComplete="name"
              autoFocus
              className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3.5 text-base text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-emerald-500"
            />
            {error && <p className="mt-2 text-left text-xs font-bold text-red-700">{error}</p>}
            <button
              type="button"
              onClick={onGeneratePix}
              disabled={loading}
              className="utmify-initiate-checkout mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              <PixIcon className="w-5 h-5 text-white" />
              <span>{loading ? "Gerando PIX..." : `Confirmar PIX de R$ ${formattedAmount}`}</span>
            </button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-[#786445]">
              <span>🔒</span>
              <span>Ambiente criptografado SSL 256 bits</span>
            </div>
          </>
        ) : (
          <>
            <div className={`mb-3 text-xs font-extrabold uppercase tracking-wider ${status === "paid" ? "text-emerald-700" : "text-[#2d144d]"}`}>
              {statusMessage[status]}
            </div>
            <PixModalContent
              charge={charge}
              status={status}
              copied={copied}
              onResetCharge={onResetCharge}
              onCopyPix={onCopyPix}
            />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function PixCheckout({ productId, amountCents }: PixCheckoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [status, setStatus] = useState<PixPaymentStatus>("creating");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const formattedAmount = (amountCents / 100).toFixed(2).replace(".", ",");

  // Tentar pré-carregar o nome digitado anteriormente no quiz
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
    setCharge(null);
    setStatus("creating");
    setCopied(false);
    setError("");
    setIsOpen(false);
  }, [amountCents, productId]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!charge || terminalStatuses.has(status)) return;

    let active = true;
    const checkStatus = async () => {
      try {
        const result = await getPixStatus(config, charge);
        if (active) setStatus(result.status);
      } catch {
        // Próxima consulta tenta novamente sem travar
      }
    };
    void checkStatus();
    const timer = window.setInterval(() => void checkStatus(), 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [charge, status]);

  // Ao confirmar pagamento, grava sessão, envia evento UTMify e Meta Pixel e redireciona automaticamente
  useEffect(() => {
    if (status === "paid") {
      sessionStorage.setItem("templodeluz:pix-paid", "true");

      const prodName =
        productId === "carta_sagrada"
          ? "Carta Psicografada Sagrada"
          : "Campanha Solidária - Cirurgia Médium Milena";

      // 1. Dispara evento de compra para a UTMify
      void sendUtmifyOrder({
        orderId: charge?.orderId || `pix_${Date.now()}`,
        platform: "TemploDeLuz",
        paymentMethod: "pix",
        status: "paid",
        customer: {
          name: customerName || "Consulente Templo de Luz",
        },
        products: [
          {
            id: productId,
            name: prodName,
            quantity: 1,
            priceInCents: amountCents,
          },
        ],
      });

      // 2. Dispara evento de compra e doação para o Meta Pixel com o valor monetário exato
      trackPurchaseComplete({
        amountCents,
        productName: prodName,
        productId,
        paymentMethod: "pix",
        ...(charge?.orderId ? { orderId: charge.orderId } : {}),
      });

      const redirectTimer = window.setTimeout(() => {
        if (productId === "carta_sagrada") {
          window.location.href = "/apoio-milena";
        } else {
          window.location.href = "/obrigado";
        }
      }, 1800);
      return () => window.clearTimeout(redirectTimer);
    }
    return undefined;
  }, [status, productId, charge, customerName, amountCents]);

  const generatePix = async () => {
    setError("");
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      setError("A API PIX ainda não foi configurada neste ambiente.");
      return;
    }
    if (customerName.trim().length < 3) {
      setError("Digite o nome completo do pagador.");
      return;
    }

    setLoading(true);
    try {
      const created = await createPixCharge(config, {
        productId,
        amountCents,
        customer: { name: customerName.trim() },
      });
      setCharge(created);
      setStatus("pending");

      // Rastreia início de doação (InitiateCheckout) com valor no Meta Pixel
      trackInitiateDonation({
        amountCents,
        productName:
          productId === "carta_sagrada"
            ? "Carta Psicografada Sagrada"
            : "Campanha Solidária - Cirurgia Médium Milena",
        productId,
        paymentMethod: "pix",
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível gerar o PIX.");
    } finally {
      setLoading(false);
    }
  };

  const copyPix = async () => {
    if (!charge) return;
    await navigator.clipboard.writeText(charge.pixPayload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  };

  const resetCharge = () => {
    setCharge(null);
    setStatus("creating");
    setCopied(false);
    setError("");
  };

  return (
    <>
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="utmify-initiate-checkout group relative flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14.5px] font-black uppercase tracking-wide text-white shadow-xl shadow-emerald-600/30 transition-all duration-200 hover:scale-[1.015] hover:brightness-105 active:scale-[0.985]"
        >
          <PixIcon className="w-5 h-5 text-white shrink-0 drop-shadow-xs" />
          <span>{charge ? "Ver QR Code PIX" : `Gerar Chave PIX de R$ ${formattedAmount}`}</span>
        </button>

        {/* Selos de Confiança e Realismo PIX */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] text-[#6c5a82] font-semibold">
          <span className="flex items-center gap-1">
            <span className="text-emerald-600">⚡</span> Aprovação Instantânea 24h
          </span>
          <span className="h-3 w-px bg-[#d8caea]" />
          <span className="flex items-center gap-1">
            <span className="text-emerald-600">🔒</span> Criptografia Banco Central
          </span>
          <span className="h-3 w-px bg-[#d8caea]" />
          <span className="flex items-center gap-1">
            <span className="text-emerald-600">📱</span> Notificação no WhatsApp
          </span>
        </div>
      </div>

      <PixModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        productId={productId}
        formattedAmount={formattedAmount}
        customerName={customerName}
        setCustomerName={setCustomerName}
        charge={charge}
        status={status}
        loading={loading}
        copied={copied}
        error={error}
        onGeneratePix={() => void generatePix()}
        onCopyPix={() => void copyPix()}
        onResetCharge={resetCharge}
      />
    </>
  );
}

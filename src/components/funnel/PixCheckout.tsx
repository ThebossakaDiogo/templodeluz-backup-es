import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { createPixCharge, getPixStatus, type PixCharge, type PixPaymentStatus } from "@/lib/pix";

interface PixCheckoutProps {
  productId: "carta_sagrada" | "cirurgia_milena";
  amountCents: number;
}

const DEFAULT_SUPABASE_URL = "https://opftmzegcvfyoinjfmcj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24";

const config = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_SUPABASE_URL,
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_SUPABASE_ANON_KEY,
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

  // Ao confirmar pagamento, grava sessão e redireciona automaticamente
  useEffect(() => {
    if (status === "paid") {
      sessionStorage.setItem("templodeluz:pix-paid", "true");
      const redirectTimer = window.setTimeout(() => {
        if (productId === "carta_sagrada") {
          window.location.href = "/apoio-milena";
        } else {
          window.location.href = "/obrigado";
        }
      }, 1800);
      return () => window.clearTimeout(redirectTimer);
    }
  }, [status, productId]);

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

  const popup = isOpen && typeof document !== "undefined" ? createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gerar QR Code PIX"
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[#e5daf0] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:max-w-[430px] sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3 text-left">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Pagamento via PIX
            </p>
            <h3 className="mt-1 text-xl font-extrabold text-[#181126]">
              {charge ? "Escaneie o QR Code" : "Gerar QR Code"}
            </h3>
            <p className="mt-1 text-sm font-bold text-[#5e4b73]">R$ {formattedAmount}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar popup"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f3edf8] text-lg font-bold text-[#2d144d] transition-colors hover:bg-[#e8ddf2]"
          >
            x
          </button>
        </div>

        {!charge ? (
          <>
            <label htmlFor={`pix-payer-${productId}`} className="mb-2 block text-left text-xs font-bold text-[#2d144d]">
              Nome completo do pagador
            </label>
            <input
              id={`pix-payer-${productId}`}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void generatePix();
              }}
              placeholder="Digite seu nome completo"
              autoComplete="name"
              autoFocus
              className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3.5 text-base text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-emerald-500"
            />
            {error && <p className="mt-2 text-left text-xs font-bold text-red-700">{error}</p>}
            <button
              type="button"
              onClick={() => void generatePix()}
              disabled={loading}
              className="mt-4 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? "Gerando PIX..." : "Gerar QR Code PIX"}
            </button>
            <p className="mt-3 text-[11px] text-[#786445]">Somente o nome é necessário para gerar o pagamento.</p>
          </>
        ) : (
          <>
            <div className={`mb-3 text-xs font-extrabold uppercase tracking-wider ${status === "paid" ? "text-emerald-700" : "text-[#2d144d]"}`}>
              {statusMessage[status]}
            </div>
            {status === "paid" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-950">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-sm font-black">Pagamento confirmado com sucesso!</p>
                <p className="mt-1 text-xs text-emerald-700">Redirecionando automaticamente em instantes...</p>
              </div>
            ) : terminalStatuses.has(status) ? (
              <button
                type="button"
                onClick={resetCharge}
                className="w-full cursor-pointer rounded-2xl bg-[#2d144d] px-5 py-4 text-sm font-extrabold uppercase text-white"
              >
                Gerar novo PIX
              </button>
            ) : (
              <>
                <div className="inline-block rounded-2xl border-2 border-emerald-500/30 bg-white p-3 shadow-md">
                  {charge.qrCodeBase64 ? (
                    <img
                      src={charge.qrCodeBase64.startsWith("data:") ? charge.qrCodeBase64 : `data:image/png;base64,${charge.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="h-[210px] w-[210px]"
                    />
                  ) : (
                    <QRCodeSVG value={charge.pixPayload} size={210} level="M" includeMargin />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void copyPix()}
                  className="mt-4 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25"
                >
                  {copied ? "Código PIX copiado!" : "Copiar PIX Copia e Cola"}
                </button>
                <p className="mt-3 text-[11px] text-[#786445]">A confirmação acontece automaticamente após o pagamento.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          {charge ? "Ver QR Code PIX" : `Gerar QR Code PIX de R$ ${formattedAmount}`}
        </button>
        <p className="mt-2 text-[10.5px] text-[#786445]">Rápido e seguro. Informe apenas o nome do pagador.</p>
      </div>
      {popup}
    </>
  );
}

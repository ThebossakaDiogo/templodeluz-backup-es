import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { sendUtmifyOrder } from "@/lib/utmify";
import {
  trackQuizStep,
  trackCheckoutInitiated,
  trackPixGenerated,
  trackCardDeclined,
  trackCardAbandoned,
} from "@/lib/funnel-telemetry";

export interface PixCheckoutProps {
  productId: "carta_sagrada" | "campanha_cirurgia" | "cirurgia_milena";
  amountCents: number;
}

interface PixCharge {
  orderId: string;
  pixPayload: string;
  qrCodeBase64?: string;
  expiresAt: string;
  statusToken: string;
}

type PixPaymentStatus = "creating" | "pending" | "paid" | "failed" | "expired";

const terminalStatuses = new Set<PixPaymentStatus>(["paid", "failed", "expired"]);

const statusMessage: Record<PixPaymentStatus, string> = {
  creating: "Gerando cobrança PIX...",
  pending: "Aguardando seu pagamento PIX...",
  paid: "Pagamento confirmado!",
  failed: "Falha na cobrança",
  expired: "Código PIX expirado",
};

function PixIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M402.5 354.2L282.8 234.5c-14.7-14.7-38.6-14.7-53.3 0L109.8 354.2c-15.6 15.6-40.8 15.6-56.4 0-15.6-15.6-15.6-40.8 0-56.4L173.1 178c45.8-45.8 120.1-45.8 165.9 0l119.7 119.7c15.6 15.6 15.6 40.8 0 56.4-15.5 15.7-40.7 15.7-56.2.1z" />
      <path d="M109.8 157.8l119.7 119.7c14.7 14.7 38.6 14.7 53.3 0l119.7-119.7c15.6-15.6 40.8-15.6 56.4 0 15.6 15.6 15.6 40.8 0 56.4L339.1 334c-45.8 45.8-120.1 45.8-165.9 0L53.4 214.2c-15.6-15.6-15.6-40.8 0-56.4 15.6-15.6 40.8-15.6 56.4 0z" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

const config = {
  supabaseUrl: "https://opftmzegcvfyoinjfmcj.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24",
};

async function createPixCharge(
  payerName: string,
  amountCents: number,
  productId: string
): Promise<PixCharge> {
  const url = `${config.supabaseUrl}/functions/v1/create-pix-charge`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      apikey: config.supabaseAnonKey,
    },
    body: JSON.stringify({
      productId,
      amountCents,
      customerName: payerName,
      customerEmail: "consulente@templodeluz.com",
      customerPhone: "11999999999",
      customerCpf: "00000000000",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    orderId: data.orderId,
    pixPayload: data.pixPayload,
    qrCodeBase64: data.qrCodeBase64,
    expiresAt: data.expiresAt,
    statusToken: data.statusToken,
  };
}

async function getPixStatus(charge: PixCharge): Promise<{ status: PixPaymentStatus }> {
  const url = `${config.supabaseUrl}/functions/v1/get-pix-status?orderId=${encodeURIComponent(
    charge.orderId
  )}&token=${encodeURIComponent(charge.statusToken)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      apikey: config.supabaseAnonKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return { status: data.status };
}

function getUtmParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    utm_content: params.get("utm_content") || null,
    utm_term: params.get("utm_term") || null,
    src: params.get("src") || null,
    sck: params.get("sck") || null,
  };
}

export function PixCheckout({ productId, amountCents }: PixCheckoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pix" | "card">("pix");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [status, setStatus] = useState<PixPaymentStatus>("creating");
  const [loading, setLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const formattedAmount = (amountCents / 100).toFixed(2).replace(".", ",");
  const prodName =
    productId === "carta_sagrada"
      ? "Carta Psicografada Sagrada"
      : "Campanha Solidária - Cirurgia Médium Milena";

  // Tentar pré-carregar o nome digitado anteriormente no quiz
  useEffect(() => {
    if (typeof window !== "undefined" && !customerName) {
      try {
        const raw = localStorage.getItem("play_and_win_captured_logs");
        if (raw) {
          const parsed = JSON.parse(raw);
          const nameEntry = parsed.find(
            (e: { field: string; value: string }) =>
              (e.field === "nome_consulente" || e.field === "lead_name") && e.value
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

    trackCheckoutInitiated({
      leadName: customerName || undefined,
      leadEmail: customerEmail || undefined,
      amountCents,
    });

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
  }, [isOpen, customerName, customerEmail, amountCents]);

  // Polling de status do PIX
  useEffect(() => {
    if (!charge || terminalStatuses.has(status)) return;

    let active = true;
    const checkStatus = async () => {
      try {
        const result = await getPixStatus(charge);
        if (active) setStatus(result.status);
      } catch {
        // tenta novamente
      }
    };
    void checkStatus();
    const timer = window.setInterval(() => void checkStatus(), 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [charge, status]);

  // Confirmação de PIX pago
  useEffect(() => {
    if (status !== "paid") return;

    sessionStorage.setItem("templodeluz:pix-paid", "true");

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
          planId: "plano_unico",
          planName: "Pagamento Único",
          quantity: 1,
          priceInCents: amountCents,
        },
      ],
      commission: {
        totalPriceInCents: amountCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: amountCents,
        currency: "BRL",
      },
    });

    trackQuizStep({
      stepIndex: 8,
      stepName: "checkout_confirmado",
      paymentStatus: "paid",
      amountCents,
      completed: true,
      leadName: customerName,
      enteQuerido: customerName,
      checkoutEvent: "completed",
    });

    const timer = setTimeout(() => {
      window.location.href = `/obrigado?orderId=${encodeURIComponent(
        charge?.orderId || ""
      )}&method=pix`;
    }, 2500);

    return () => clearTimeout(timer);
  }, [status, amountCents, customerName, productId, prodName, charge?.orderId]);

  const generatePix = async () => {
    if (!customerName.trim()) {
      setError("Por favor, preencha seu nome completo para gerar o PIX.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const newCharge = await createPixCharge(customerName.trim(), amountCents, productId);
      setCharge(newCharge);
      setStatus("pending");

      trackPixGenerated({
        leadName: customerName.trim(),
        leadEmail: customerEmail.trim() || undefined,
        amountCents,
      });
    } catch (err: any) {
      setError(err?.message || "Não foi possível gerar a chave PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const startStripeCheckout = async () => {
    if (!customerName.trim()) {
      setError("Por favor, preencha seu nome completo para continuar com o Cartão.");
      return;
    }
    setError("");
    setCardLoading(true);

    try {
      trackQuizStep({
        stepIndex: 8,
        stepName: "checkout_cartao_iniciado",
        paymentStatus: "waiting_payment",
        amountCents,
        completed: false,
        leadName: customerName.trim(),
        enteQuerido: customerName.trim(),
        checkoutEvent: "checkout_initiated",
      });

      // Cria sessão de checkout na Stripe via Edge Function
      const url = `${config.supabaseUrl}/functions/v1/create-stripe-checkout`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          apikey: config.supabaseAnonKey,
        },
        body: JSON.stringify({
          amountCents,
          productName: prodName,
          productId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          successUrl: `${window.location.origin}/obrigado?method=card&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/quiz?payment=cancelled`,
          trackingParameters: getUtmParams(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada pela Stripe");
      }
    } catch (err: any) {
      trackCardDeclined({
        leadName: customerName.trim(),
        leadEmail: customerEmail.trim() || undefined,
        amountCents,
      });
      setError(err?.message || "Não foi possível iniciar o checkout com cartão. Tente novamente.");
    } finally {
      setCardLoading(false);
    }
  };

  const copyPix = async () => {
    if (!charge?.pixPayload) return;
    try {
      await navigator.clipboard.writeText(charge.pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Não foi possível copiar automaticamente.");
    }
  };

  return (
    <>
      {/* Botão Gatilho com Suporte a PIX e Cartão */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="utmify-initiate-checkout group relative flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14.5px] font-black uppercase tracking-wide text-white shadow-xl shadow-emerald-600/30 transition-all duration-200 hover:scale-[1.015] hover:brightness-105 active:scale-[0.985]"
        >
          <PixIcon className="w-5 h-5 text-white shrink-0 drop-shadow-xs" />
          <span>Fazer Doação de R$ {formattedAmount} (PIX ou Cartão)</span>
        </button>

        {/* Selos de Confiança */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[#6c5a82] font-semibold">
          <span className="flex items-center gap-1">
            <span className="text-emerald-600">⚡</span> PIX Instantâneo
          </span>
          <span className="h-3 w-px bg-[#d8caea]" />
          <span className="flex items-center gap-1">
            <span className="text-[#6366f1]">💳</span> Cartão em até 12x (Stripe)
          </span>
          <span className="h-3 w-px bg-[#d8caea]" />
          <span className="flex items-center gap-1">
            <span className="text-emerald-600">🔒</span> Criptografia SSL 256 bits
          </span>
        </div>
      </div>

      {/* Modal de Checkout */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-modal="true"
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} aria-hidden="true" />
            <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[#e5daf0] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:max-w-[440px] sm:rounded-3xl sm:p-6">
              {/* Topo do Modal */}
              <div className="mb-4 flex items-start justify-between gap-3 text-left">
                <div>
                  <h3 className="text-xl font-extrabold text-[#181126]">
                    Finalizar Sua Contribuição
                  </h3>
                  <p className="mt-0.5 text-sm font-black text-emerald-700">
                    Valor total: R$ {formattedAmount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar modal"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f3edf8] text-lg font-bold text-[#2d144d] transition-colors hover:bg-[#e8ddf2]"
                >
                  ✕
                </button>
              </div>

              {/* Seletor de Abas: PIX vs Cartão Stripe */}
              {!charge && (
                <div className="mb-5 flex rounded-xl border border-[#d8caea] bg-[#f8f5fc] p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("pix");
                      setError("");
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-black transition-all cursor-pointer ${
                      activeTab === "pix"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-[#4b356d] hover:bg-[#eae2f5]"
                    }`}
                  >
                    <PixIcon className="w-4 h-4" />
                    <span>PIX Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("card");
                      setError("");
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-black transition-all cursor-pointer ${
                      activeTab === "card"
                        ? "bg-[#6366f1] text-white shadow-sm"
                        : "text-[#4b356d] hover:bg-[#eae2f5]"
                    }`}
                  >
                    <CardIcon className="w-4 h-4" />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              )}

              {/* Conteúdo da Aba PIX */}
              {activeTab === "pix" && (
                <>
                  {!charge ? (
                    <>
                      <label
                        htmlFor={`pix-payer-${productId}`}
                        className="mb-2 block text-left text-xs font-bold text-[#2d144d]"
                      >
                        Nome completo do titular:
                      </label>
                      <input
                        id={`pix-payer-${productId}`}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Digite seu nome completo"
                        className="w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3.5 text-base text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-emerald-500"
                      />

                      {error && (
                        <p className="mt-2 text-left text-xs font-bold text-red-700">{error}</p>
                      )}

                      <button
                        type="button"
                        onClick={generatePix}
                        disabled={loading}
                        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
                      >
                        <PixIcon className="w-5 h-5 text-white" />
                        <span>{loading ? "Gerando PIX..." : `Confirmar PIX de R$ ${formattedAmount}`}</span>
                      </button>

                      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-[#786445]">
                        <span>🔒</span>
                        <span>Ambiente criptografado Banco Central do Brasil</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`mb-3 text-xs font-extrabold uppercase tracking-wider ${
                          status === "paid" ? "text-emerald-700" : "text-[#2d144d]"
                        }`}
                      >
                        {statusMessage[status]}
                      </div>

                      {status === "paid" ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-950">
                          <span className="text-3xl block mb-2">🎉</span>
                          <p className="text-sm font-black">Pagamento confirmado com sucesso!</p>
                          <p className="mt-1 text-xs text-emerald-700">
                            Redirecionando automaticamente em instantes...
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="inline-block rounded-2xl border-2 border-emerald-500/30 bg-white p-3 shadow-md">
                            {charge.qrCodeBase64 ? (
                              <img
                                src={
                                  charge.qrCodeBase64.startsWith("data:")
                                    ? charge.qrCodeBase64
                                    : `data:image/png;base64,${charge.qrCodeBase64}`
                                }
                                alt="QR Code PIX"
                                className="h-[210px] w-[210px]"
                              />
                            ) : (
                              <QRCodeSVG
                                value={charge.pixPayload}
                                size={210}
                                level="M"
                                marginSize={4}
                              />
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={copyPix}
                            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-emerald-600/25"
                          >
                            <PixIcon className="w-4 h-4 text-white" />
                            <span>
                              {copied ? "Código PIX copiado!" : "Copiar Código PIX Copia e Cola"}
                            </span>
                          </button>

                          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#786445]">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>A confirmação acontece automaticamente em segundos.</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Conteúdo da Aba Cartão Stripe */}
              {activeTab === "card" && !charge && (
                <>
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#2d144d]">
                        Nome do titular do cartão:
                      </label>
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nome como impresso no cartão"
                        className="w-full rounded-xl border-2 border-[#d8caea] bg-white px-3.5 py-3 text-sm text-[#181126] outline-none transition-colors focus:border-[#6366f1]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#2d144d]">
                        E-mail para recibo:
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full rounded-xl border-2 border-[#d8caea] bg-white px-3.5 py-3 text-sm text-[#181126] outline-none transition-colors focus:border-[#6366f1]"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="mt-2 text-left text-xs font-bold text-red-700">{error}</p>
                  )}

                  {/* Bandeiras Aceitas */}
                  <div className="mt-4 flex items-center justify-center gap-3 py-2 border-y border-[#eee5f5]">
                    <span className="text-[10px] font-bold text-[#6c5a82] uppercase">
                      Bandeiras:
                    </span>
                    <div className="flex items-center gap-2 text-xs font-black text-[#4b356d]">
                      <span>Visa</span> • <span>Mastercard</span> • <span>Elo</span> •{" "}
                      <span>Hipercard</span> • <span>Amex</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startStripeCheckout}
                    disabled={cardLoading}
                    className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#4338ca] px-6 py-4 text-[14px] font-extrabold uppercase text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
                  >
                    <CardIcon className="w-5 h-5 text-white" />
                    <span>
                      {cardLoading
                        ? "Conectando Stripe..."
                        : `Pagar R$ ${formattedAmount} no Cartão (Stripe)`}
                    </span>
                  </button>

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-[#786445]">
                    <span>🔒</span>
                    <span>Processado com segurança pelo Stripe Checkout</span>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

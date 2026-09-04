import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { IMAGES } from "./data";
import { CardFlagsBadgeRow } from "./CardFlags";
import { StripeCardModal } from "./StripeCardModal";
import { sendUtmifyOrder } from "@/lib/utmify";
import { trackQuizStep, syncLeadPhone, syncLeadPhoneImmediate } from "@/lib/funnel-telemetry";
import { useSurgeryGoalSimulation } from "@/lib/donation-simulation";

const config = {
  supabaseUrl: "https://opftmzegcvfyoinjfmcj.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24",
};

export interface MilenaCataractModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onProceedToWhatsApp: () => void;
  readonly consulenteNome?: string;
  readonly enteQuerido?: string;
}

interface PixCharge {
  orderId: string;
  pixPayload: string;
  qrCodeBase64?: string;
  expiresAt: string;
  statusToken: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits.length) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

async function createPixCharge(
  payerName: string,
  amountCents: number,
  productId: string,
  payerPhone?: string
): Promise<PixCharge> {
  const url = `${config.supabaseUrl}/functions/v1/create-connectpay-pix`;
  const idempotencyKey = crypto.randomUUID();
  const statusToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;

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
      customerPhone: payerPhone ? payerPhone.replace(/\D/g, "") : undefined,
      idempotencyKey,
      statusToken,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    orderId: data.orderId,
    pixPayload: data.pixPayload,
    qrCodeBase64: data.qrCodeBase64,
    expiresAt: data.expiresAt,
    statusToken,
  };
}

async function getPixStatus(charge: PixCharge): Promise<string> {
  const url = `${config.supabaseUrl}/functions/v1/get-connectpay-pix-status`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      apikey: config.supabaseAnonKey,
    },
    body: JSON.stringify({
      orderId: charge.orderId,
      statusToken: charge.statusToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.status;
}

export function MilenaCataractModal({
  isOpen,
  onClose,
  onProceedToWhatsApp,
  consulenteNome = "",
  enteQuerido = "",
}: MilenaCataractModalProps) {
  const [amountCents, setAmountCents] = useState<number>(1000); // Padrão R$ 10
  const [customValue, setCustomValue] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"pix" | "card">("pix");
  const [name, setName] = useState<string>(
    !consulenteNome || consulenteNome === "Consulente" || consulenteNome === "Maria Clara" ? "" : consulenteNome
  );
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [stripeOpen, setStripeOpen] = useState<boolean>(false);
  const cataractSim = useSurgeryGoalSimulation();

  // Recupera dados capturados no quiz
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("play_and_win_captured_logs");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!name || name === "Consulente") {
          const nameEntry = parsed.find(
            (e: { field: string; value: string }) =>
              (e.field === "nome_consulente" || e.field === "lead_name") && e.value
          );
          if (nameEntry?.value) setName(nameEntry.value);
        }
        if (!phone) {
          const phoneEntry = parsed.find(
            (e: { field: string; value: string }) =>
              (e.field === "telefone" || e.field === "whatsapp" || e.field === "lead_phone") && e.value
          );
          if (phoneEntry?.value) setPhone(formatPhone(phoneEntry.value));
        }
      }
    } catch {
      // ignore
    }
  }, [name, phone]);

  // Trava scroll da página ao abrir
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  // Polling de status do PIX
  useEffect(() => {
    if (!charge || isPaid) return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const status = await getPixStatus(charge);
        if (status === "paid" && active) {
          setIsPaid(true);
          sessionStorage.setItem("templodeluz:pix-paid", "true");
          sessionStorage.setItem("templodeluz:catarata-paid", "true");

          void sendUtmifyOrder({
            orderId: charge.orderId,
            platform: "TemploDeLuz",
            paymentMethod: "pix",
            status: "paid",
            customer: {
              name: name || "Consulente Solidário",
              ...(phone ? { phone: phone.replace(/\D/g, "") } : {}),
            },
            products: [
              {
                id: "cirurgia_milena",
                name: "Campanha Solidária - Cirurgia Médium Milena",
                planId: "doacao_cirurgia",
                planName: "Aporte Solidário",
                quantity: 1,
                priceInCents: effectiveAmountCents,
              },
            ],
            commission: {
              totalPriceInCents: effectiveAmountCents,
              gatewayFeeInCents: 0,
              userCommissionInCents: effectiveAmountCents,
              currency: "BRL",
            },
          });

          trackQuizStep({
            stepIndex: 99,
            stepName: "doacao_cirurgia_milena",
            amountCents: effectiveAmountCents,
            leadName: name,
            leadPhone: phone ? phone.replace(/\D/g, "") : undefined,
            enteQuerido,
            paymentStatus: "paid",
            checkoutEvent: "completed",
          });

          setTimeout(() => {
            onProceedToWhatsApp();
            onClose();
          }, 2400);
        }
      } catch {
        // tenta novamente
      }
    }, 3500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [charge, isPaid, name, phone, enteQuerido, onProceedToWhatsApp, onClose]);

  const effectiveAmountCents = isCustom
    ? Math.max(500, (Number(customValue.replace(/\D/g, "")) || 5) * 100)
    : amountCents;

  const formattedAmount = (effectiveAmountCents / 100).toFixed(2).replace(".", ",");

  const presets = [
    { val: 500, label: "R$ 5", tag: "Mínimo" },
    { val: 1000, label: "R$ 10", tag: "Vela Sagrada" },
    { val: 1500, label: "R$ 15", tag: "Mais Escolhido", highlight: true },
    { val: 2500, label: "R$ 25", tag: "Corrente de Fé" },
    { val: 5000, label: "R$ 50", tag: "Bênção de Luz" },
  ];

  const handleSelectPreset = (cents: number) => {
    setAmountCents(cents);
    setIsCustom(false);
    setCustomValue("");
    setCharge(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setIsCustom(true);
    setCustomValue(raw);
    setCharge(null);
  };

  const handleGeneratePix = async () => {
    if (!name.trim()) {
      setError("Por favor, informe seu nome completo para a consagração.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Por favor, informe seu WhatsApp com DDD para envio da foto da carta.");
      return;
    }

    if (effectiveAmountCents < 500) {
      setError("O valor mínimo solidário para a consagração é de R$ 5,00.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const newCharge = await createPixCharge(
        name.trim(),
        effectiveAmountCents,
        "cirurgia_milena",
        cleanPhone
      );
      setCharge(newCharge);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar a chave PIX no momento.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!charge?.pixPayload) return;
    try {
      await navigator.clipboard.writeText(charge.pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = charge.pixPayload;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] flex items-end justify-center bg-black/85 backdrop-blur-md sm:items-center sm:p-4 animate-fade-in"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 max-h-[96dvh] w-full overflow-y-auto rounded-t-[32px] border border-amber-200/60 bg-white p-4 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-left shadow-[0_25px_80px_-15px_rgba(20,10,35,0.4)] sm:max-w-[560px] sm:rounded-[32px] animate-scale-up">
        {/* Botão Fechar no Topo da Janela */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors text-sm font-bold z-20 cursor-pointer"
        >
          ✕
        </button>

        {isPaid ? (
          /* Tela de Sucesso Emocionante */
          <div className="py-10 text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg border-2 border-emerald-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-[#181126]">
              Consagração Confirmada!
            </h3>
            <p className="text-sm text-[#5e4b73] max-w-sm mx-auto leading-relaxed">
              Que a espiritualidade de luz multiplique sua generosidade. Sua ajuda pela visão da Médium Milena foi acolhida no altar sagrado.
            </p>
            <p className="text-xs font-black text-purple-950 animate-pulse bg-purple-50 py-2 px-4 rounded-full inline-block border border-purple-200">
              Abrindo o WhatsApp pessoal da médium com sua carta...
            </p>
          </div>
        ) : (
          <>
            {/* IMAGEM NÍTIDA NO FORMATO ORIGINAL (SEM CORTES E SEM SOBREPOSIÇÃO) */}
            <div className="flex flex-col items-center text-center pt-1 pb-3">
              {/* Badge Nobre Superior */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200/80 px-3.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-purple-950 mb-3 shadow-2xs">
                <span>🕊️</span> Corrente Pela Visão da Médium
              </div>

              {/* Moldura Nítida da Foto Original Sem Cortes */}
              <div className="w-full max-w-[330px] sm:max-w-[370px] rounded-3xl overflow-hidden border-2 border-amber-300 shadow-md bg-stone-50 p-1.5 transition-transform">
                <img
                  src={IMAGES.milenaCatarata}
                  alt="Médium Milena Medeiros no oratório"
                  className="w-full h-auto aspect-square object-contain rounded-[20px]"
                  loading="eager"
                />
              </div>

              {/* Título e Texto Emotivo Claros Abaixo da Imagem */}
              <h2 className="font-display text-xl sm:text-2xl font-black text-stone-900 leading-snug mt-3.5">
                Pela Luz dos Olhos da Médium Milena
              </h2>
              <p className="mt-1.5 text-xs sm:text-[13px] text-stone-600 leading-relaxed max-w-md">
                Há 33 anos confortando famílias sem jamais cobrar pelo dom divino. Hoje, ela enfrenta uma <strong className="text-stone-900 font-bold">catarata bilateral severa</strong> que ameaça apagar a luz dos seus olhos.
              </p>
            </div>

            {/* CARD SOLIDÁRIO DE CONEXÃO COM A CARTA */}
            <div className="mt-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 border border-amber-300/80 p-3.5 text-left shadow-2xs">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0 mt-0.5">🕯️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#78350f] leading-relaxed">
                    Antes de encaminhar sua carta ao WhatsApp da médium, junte-se aos irmãos do templo: uma contribuição simbólica a partir de <strong>R$ 5,00</strong> ajuda no custo do procedimento cirúrgico nos olhos e cobre a vela de 7 dias, garantindo que as cartas continuem sendo psicografadas.
                  </p>

                  {/* Barra de Progresso Solidária Dinâmica da Catarata */}
                  <div className="mt-2.5 pt-2 border-t border-amber-200/80">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 mb-1">
                      <span>Cirurgia de Catarata Bilateral (Meta: {cataractSim.formattedTarget})</span>
                      <span className="text-emerald-700 font-extrabold">
                        {cataractSim.formattedCurrent} ({cataractSim.percent.toFixed(1).replace(".", ",")}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-amber-100 overflow-hidden p-0.5 border border-amber-200/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 transition-all duration-1000"
                        style={{ width: `${Math.max(cataractSim.percent, 5)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[9.5px] font-semibold text-stone-500">
                      <span>Última doação: há {cataractSim.minutesSinceLastDonation} min</span>
                      <span>Faltam {cataractSim.formattedRemaining}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PRESETS DE CONTRIBUIÇÃO SOLIDÁRIA */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-stone-900">
                  Escolha o valor da sua contribuição fraterna:
                </span>
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Mínimo R$ 5,00
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => {
                  const isSelected = !isCustom && amountCents === p.val;
                  return (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleSelectPreset(p.val)}
                      className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#2d144d] bg-[#2d144d] text-white shadow-md scale-[1.02]"
                          : p.highlight
                          ? "border-amber-400 bg-amber-50/50 text-stone-900 hover:bg-amber-100/60"
                          : "border-stone-200 bg-white text-stone-900 hover:border-purple-300 hover:bg-purple-50/40"
                      }`}
                    >
                      {p.highlight && (
                        <span className="absolute -top-2 rounded-full bg-amber-500 px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider text-stone-950 shadow-2xs">
                          Destaque
                        </span>
                      )}
                      <span className="text-sm sm:text-base font-black">{p.label}</span>
                      <span
                        className={`text-[9.5px] font-semibold mt-0.5 ${
                          isSelected ? "text-purple-200" : "text-stone-500"
                        }`}
                      >
                        {p.tag}
                      </span>
                    </button>
                  );
                })}

                {/* Botão Outro Valor Integrado no Grid */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setCharge(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isCustom
                      ? "border-purple-600 bg-purple-50 text-purple-950 font-black shadow-2xs"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black">Outro</span>
                  <span className="text-[9.5px] text-stone-500 font-medium mt-0.5">Valor livre</span>
                </button>
              </div>

              {/* Campo Input de Outro Valor */}
              {isCustom && (
                <div className="mt-2.5 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#2d144d]">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customValue}
                    onChange={handleCustomChange}
                    placeholder="Digite o valor (mínimo 5)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-purple-400 text-xs font-bold text-stone-900 outline-hidden focus:border-[#2d144d] shadow-2xs"
                  />
                </div>
              )}
            </div>

            {/* ABAS PIX / CARTÃO */}
            <div className="mt-4 pt-3.5 border-t border-stone-200/80">
              <div className="flex rounded-xl bg-stone-100 p-1 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("pix");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    activeTab === "pix"
                      ? "bg-white text-emerald-800 shadow-2xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  PIX Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("card");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    activeTab === "card"
                      ? "bg-white text-purple-950 shadow-2xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  Cartão de Crédito
                </button>
              </div>

              {activeTab === "pix" ? (
                /* Conteúdo PIX */
                <div className="space-y-3">
                  {!charge ? (
                    <>
                      {/* Grid de Nome e Telefone lado a lado */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10.5px] font-bold text-stone-600 mb-1">
                            Seu Nome Completo:
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome"
                            className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-900 outline-hidden focus:border-emerald-600 bg-stone-50/50 focus:bg-white transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-stone-600 mb-1">
                            WhatsApp com DDD:
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              setPhone(formatted);
                              syncLeadPhone(formatted, name);
                            }}
                            onBlur={() => {
                              syncLeadPhoneImmediate(phone, name);
                            }}
                            placeholder="(11) 99999-9999"
                            className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-medium text-stone-900 outline-hidden focus:border-emerald-600 bg-stone-50/50 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="text-[11px] font-bold text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                          {error}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleGeneratePix()}
                        disabled={loading}
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Gerando Código PIX...</span>
                          </>
                        ) : (
                          <span>Gerar PIX Solidário de R$ {formattedAmount} ›</span>
                        )}
                      </button>
                    </>
                  ) : (
                    /* PIX Gerado */
                    <div className="space-y-3 animate-fade-in text-center">
                      <div className="inline-block p-3 rounded-2xl bg-white border-2 border-emerald-500 shadow-md">
                        <QRCodeSVG
                          value={charge.pixPayload}
                          size={140}
                          level="M"
                          includeMargin
                        />
                      </div>

                      <div className="rounded-xl bg-stone-50 border border-stone-200 p-2.5 text-left">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-stone-600 mb-1">
                          Código PIX Copia e Cola:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={charge.pixPayload}
                            className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 text-[10.5px] font-mono text-stone-700 truncate"
                          />
                          <button
                            type="button"
                            onClick={() => void handleCopyCode()}
                            className={`px-3.5 py-1.5 rounded-lg text-[10.5px] font-black shrink-0 transition-all cursor-pointer ${
                              copied
                                ? "bg-emerald-600 text-white"
                                : "bg-[#2d144d] text-white hover:bg-[#3d1868]"
                            }`}
                          >
                            {copied ? "Copiado!" : "Copiar"}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-purple-900 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Aguardando confirmação bancária do PIX...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Conteúdo Cartão de Crédito */
                <div className="space-y-3 text-center">
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3 text-left">
                    <p className="text-[12px] text-[#2d144d] leading-relaxed">
                      Contribuição de <strong>R$ {formattedAmount}</strong> no cartão em até 12x via processamento seguro Stripe para liberação imediata da sua carta.
                    </p>
                  </div>

                  <CardFlagsBadgeRow className="justify-center py-1" />

                  <button
                    type="button"
                    onClick={() => setStripeOpen(true)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#2d144d] hover:bg-[#3d1868] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-950/20 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Consagrar com Cartão (R$ {formattedAmount}) ›
                  </button>
                </div>
              )}
            </div>

            {/* Garantias Limpas */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-center gap-3 text-[10px] font-semibold text-stone-400">
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-emerald-600">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                SSL 256 bits
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-purple-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Ambiente Protegido
              </span>
            </div>

            {/* Link Suave de Fechamento */}
            <div className="mt-2.5 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 transition-colors underline underline-offset-2 cursor-pointer"
              >
                Voltar para revisar a carta
              </button>
            </div>
          </>
        )}
      </div>

      <StripeCardModal
        isOpen={stripeOpen}
        onClose={() => setStripeOpen(false)}
        productId="cirurgia_milena"
        amountCents={effectiveAmountCents}
        primeiroEnte={enteQuerido}
      />
    </div>,
    document.body
  );
}

import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FAQ, IMAGES } from "./data";
import { Reveal, SectionLabel } from "./Shell";
import { trackQuizStep as trackQuizTelemetry } from "@/lib/funnel-telemetry";
import { parseBrazilianCurrency, sanitizeBrazilianCurrencyInput } from "@/lib/currency";
import milenaCartaImage from "../../assets/images/quiz/medium-milena-carta.webp";
import insumoVelaImage from "../../assets/images/quiz/insumo-vela-512.webp";
import insumoCartaImage from "../../assets/images/quiz/insumo-carta-512.webp";
import insumoSopaImage from "../../assets/images/quiz/insumo-sopa-512.webp";
import milenaFreeLetterAudio from "../../assets/media/audio/milena-carta-gratuita.mp3";
import correiosLogo from "../../assets/images/quiz/correios-logo.webp";

const PixCheckout = lazy(() =>
  import("./PixCheckout").then(({ PixCheckout: Component }) => ({ default: Component })),
);
const SocialProofSection = lazy(() =>
  import("./SocialProofSection").then(({ SocialProofSection: Component }) => ({
    default: Component,
  })),
);
const MilenaAudioMessage = lazy(() =>
  import("./MilenaAudioMessage").then(({ MilenaAudioMessage: Component }) => ({
    default: Component,
  })),
);
const WhatsAppContactModal = lazy(() =>
  import("./WhatsAppContactModal").then(({ WhatsAppContactModal: Component }) => ({
    default: Component,
  })),
);
const CustomAudioPlayer = lazy(() =>
  import("./CustomAudioPlayer").then(({ CustomAudioPlayer: Component }) => ({
    default: Component,
  })),
);

function DeferredFallback() {
  return (
    <div
      className="mx-auto my-4 h-16 w-full max-w-md animate-pulse rounded-2xl bg-slate-100"
      aria-hidden="true"
    />
  );
}

function redirectWithParams(destination: string) {
  const params = window.location.search;
  if (!params) {
    window.location.href = destination;
    return;
  }
  window.location.href =
    destination + (destination.includes("?") ? "&" : "?") + params.substring(1);
}

function getDonationPsychologicalImpact(amount: number, primeiroEnte: string) {
  if (amount < 15) {
    return {
      tier: "invalid",
      icon: "⚠️",
      badge: "Valor abaixo do mínimo",
      title: "Escolha um valor para continuar",
      description: `A carta e o acolhimento são gratuitos. A contribuição voluntária ajuda a preparar a vela e o pergaminho para ${primeiroEnte}.`,
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      cardBorder: "border-red-200 bg-red-50/30",
      isValid: false,
    };
  }
  if (amount < 30) {
    return {
      tier: "basic",
      icon: "🕯️",
      badge: "Apoio essencial",
      title: `Ajuda com a vela de 7 dias para ${primeiroEnte}`,
      description:
        "Contribui para a vela utilizada no período de oração e acolhimento no oratório.",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      cardBorder: "border-amber-200 bg-amber-50/50",
      isValid: true,
    };
  }
  if (amount < 40) {
    return {
      tier: "paper",
      icon: "⭐",
      badge: "Materiais do pedido",
      title: `Ajuda com vela e pergaminho para ${primeiroEnte}`,
      description:
        "Contribui para os principais materiais usados no registro e na preparação do pedido.",
      badgeColor: "bg-[#f1eaf6] text-[#705b80] border-[#d7c9e1]",
      cardBorder: "border-[#d7c9e1] bg-[#f8f4fa]",
      isValid: true,
    };
  }
  if (amount < 60) {
    return {
      tier: "heart",
      icon: "✨",
      badge: "Escolha mais completa",
      title: `Materiais + carta física para ${primeiroEnte}`,
      description:
        "Ajuda com vela, pergaminho e preparação do pedido. A carta física pode ser incluída conforme o valor escolhido.",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      cardBorder: "border-amber-200 bg-[#fffaf0]",
      isValid: true,
    };
  }
  if (amount < 100) {
    return {
      tier: "light",
      icon: "🌟",
      badge: "Apoio ampliado",
      title: "Materiais e ações fraternas da casa",
      description: `Além dos materiais relacionados a ${primeiroEnte}, ajuda nas atividades de acolhimento e assistência informadas pela instituição.`,
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      cardBorder: "border-purple-200 bg-purple-50/50",
      isValid: true,
    };
  }
  if (amount < 150) {
    return {
      tier: "guardian",
      icon: "🕊️",
      badge: "Apoio solidário",
      title: "Ajuda ampliada à manutenção da casa",
      description: `Apoia os materiais de ${primeiroEnte} e amplia a contribuição para as atividades fraternas mantidas pela instituição.`,
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      cardBorder: "border-emerald-200 bg-emerald-50/50",
      isValid: true,
    };
  }

  return {
    tier: "eternal",
    icon: "👑",
    badge: "Apoio extraordinário",
    title: "Contribuição ampliada aos materiais e à obra fraterna",
    description: `Ajuda a manter os materiais de ${primeiroEnte}, o acolhimento da casa e as ações assistenciais informadas pela instituição.`,
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    cardBorder: "border-amber-200 bg-gradient-to-br from-[#fffdf7] via-[#fffaf0] to-[#f8f1df]",
    isValid: true,
  };
}

function PixIcon({
  className = "w-4 h-4",
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

function useCheckoutPosition(isValid: boolean, hasUserSelectedOption: boolean) {
  const [isCheckoutInView, setIsCheckoutInView] = useState<boolean>(false);
  const [checkoutPosition, setCheckoutPosition] = useState<"above" | "below">("below");

  useEffect(() => {
    const getCheckoutTarget = () =>
      document.getElementById("botao-pagamento-checkout") ||
      document.querySelector<HTMLElement>("#area-pagamento-pix button.utmify-initiate-checkout") ||
      document.getElementById("area-pagamento-pix");

    let rafId: number | null = null;

    const checkPosition = () => {
      const el = getCheckoutTarget();
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      const inView = rect.top < viewportHeight - 50 && rect.bottom > 50;
      setIsCheckoutInView(inView);
      setCheckoutPosition(rect.top < 0 ? "above" : "below");
    };

    const handleScrollOrResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(checkPosition);
    };

    checkPosition();
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isValid, hasUserSelectedOption]);

  return { isCheckoutInView, checkoutPosition };
}

function resolvePhysicalLetterDescription(requested: boolean, fee: number): string {
  if (!requested) {
    return "Marque esta opção para incluir R$15 de envio e receber a carta física pelos Correios.";
  }
  return fee === 0
    ? "A taxa já está incluída neste valor. Na próxima página, você informa apenas o endereço."
    : "R$15 serão incluídos automaticamente no total do PIX/cartão. Na próxima página, você informa apenas o endereço de entrega.";
}

function PixInstantBox({
  primeiroNome = "Você",
  primeiroEnte = "seu ente querido",
  nomeCompleto,
  enteCompleto,
  relacao,
  tempoPassagem,
  intencaoPrincipal,
  mensagem,
  temas = [],
  horario,
}: {
  readonly primeiroNome?: string;
  readonly primeiroEnte?: string;
  readonly nomeCompleto?: string;
  readonly enteCompleto?: string;
  readonly relacao?: string;
  readonly tempoPassagem?: string;
  readonly intencaoPrincipal?: string;
  readonly mensagem?: string;
  readonly temas?: string[];
  readonly horario?: string;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number>(40);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<boolean>(false);
  const [freeLetterAudioOpen, setFreeLetterAudioOpen] = useState(false);
  const [hasUserSelectedOption, setHasUserSelectedOption] = useState<boolean>(false);
  const [physicalLetterRequested, setPhysicalLetterRequested] = useState(true);

  const activeAmount = isCustom ? parseBrazilianCurrency(customInput) : selectedAmount;
  const physicalLetterIncluded = activeAmount >= 40;
  const shouldReceivePhysicalLetter = physicalLetterIncluded || physicalLetterRequested;
  const physicalLetterFee = shouldReceivePhysicalLetter && !physicalLetterIncluded ? 15 : 0;
  const checkoutAmount = activeAmount + physicalLetterFee;
  const impact = getDonationPsychologicalImpact(activeAmount, primeiroEnte);
  const { isCheckoutInView, checkoutPosition } = useCheckoutPosition(
    impact.isValid,
    hasUserSelectedOption,
  );
  const physicalLetterDescription = resolvePhysicalLetterDescription(
    shouldReceivePhysicalLetter,
    physicalLetterFee,
  );
  const physicalLetterBadge =
    shouldReceivePhysicalLetter && physicalLetterFee === 0
      ? "SEM CUSTO ADICIONAL"
      : "+ R$ 15 ENTREGA";

  useEffect(() => {
    if (!physicalLetterIncluded) return;
    setPhysicalLetterRequested(true);
    try {
      sessionStorage.setItem("templodeluz:physical-letter-selected", "true");
      sessionStorage.setItem("templodeluz:physical-letter-fee-included", "true");
    } catch {
      // A inclusão automática continua válida durante a sessão atual.
    }
  }, [physicalLetterIncluded]);

  const scrollToCheckout = () => {
    const payBtn =
      document.getElementById("botao-pagamento-checkout") ||
      document.querySelector<HTMLButtonElement>(
        "#area-pagamento-pix button.utmify-initiate-checkout",
      ) ||
      document.getElementById("area-pagamento-pix");

    if (payBtn) {
      payBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      payBtn.classList.add("ring-4", "ring-emerald-400", "scale-[1.015]");
      window.setTimeout(() => {
        payBtn.classList.remove("ring-4", "ring-emerald-400", "scale-[1.015]");
      }, 1600);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true);
    const nextValue = sanitizeBrazilianCurrencyInput(e.target.value);
    setCustomInput(nextValue);
    handlePhysicalLetterPreference(parseBrazilianCurrency(nextValue) >= 40);
    setHasUserSelectedOption(true);
  };

  const handlePhysicalLetterPreference = (checked: boolean) => {
    setPhysicalLetterRequested(checked);
    setHasUserSelectedOption(true);
    try {
      if (checked) {
        sessionStorage.setItem("templodeluz:physical-letter-selected", "true");
        sessionStorage.setItem("templodeluz:physical-letter-fee-included", "true");
      } else {
        sessionStorage.removeItem("templodeluz:physical-letter-selected");
        sessionStorage.removeItem("templodeluz:physical-letter-fee-included");
      }
    } catch {
      // A escolha continua ativa durante a sessão atual.
    }
  };

  const handleSelectPreset = (val: number) => {
    setSelectedAmount(val);
    setIsCustom(false);
    setCustomInput("");
    handlePhysicalLetterPreference(val >= 40);
    setHasUserSelectedOption(true);
  };

  const continueToPergaminho = () => {
    setFreeLetterAudioOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("templodeluz:initial-payment-skipped", "true");
    }
    try {
      trackQuizTelemetry({
        stepIndex: 99,
        stepName: "checkout_skipped",
        leadName: primeiroNome,
        enteQuerido: primeiroEnte,
      });
    } catch (err) {
      console.warn("[TELEMETRY]", err);
    }
    redirectWithParams("/chamada-ao-vivo-milena?source=skipped&next=%2Fescrever-carta");
  };

  const handleIrParaPergaminho = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setFreeLetterAudioOpen(true);
  };

  useEffect(() => {
    if (!freeLetterAudioOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFreeLetterAudioOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [freeLetterAudioOpen]);

  const presets = [
    {
      val: 20,
      label: "R$ 20",
      tag: "Ajuda com a vela de 7 dias",
    },
    {
      val: 30,
      label: "R$ 30",
      tag: "Ajuda com vela e pergaminho",
    },
    {
      val: 35,
      label: "R$ 35",
      tag: "Ajuda ampliada aos materiais",
    },
    {
      val: 40,
      label: "R$ 40",
      tag: "Materiais + carta física incluída",
      highlight: true,
    },
    {
      val: 60,
      label: "R$ 60",
      tag: "Carta física + apoio às ações fraternas",
    },
  ];

  return (
    <div className="mt-4 overflow-hidden rounded-[30px] border border-[#d9cee2] bg-[#fffefd] text-center shadow-[0_28px_80px_-36px_rgba(82,67,99,0.35)]">
      <div className="relative overflow-hidden border-b border-[#ddd3e5] bg-gradient-to-br from-[#eee6f4] via-[#f7f2fa] to-[#fff9ed] px-5 py-7 text-left text-[#342b3e] sm:px-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#9d82c4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-[#c49a52]/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7c9e1] bg-white/80 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#705b80] backdrop-blur-sm">
            Contribuição voluntária
          </span>
          <h3 className="mt-3 max-w-[360px] font-display text-[22px] font-extrabold leading-[1.2] text-[#342b3e]">
            {primeiroNome}, escolha como deseja apoiar os materiais de {primeiroEnte}
          </h3>
          <p className="mt-2 max-w-[390px] text-[13px] leading-relaxed text-[#665b70]">
            Cada valor mostra de forma simples o que sua contribuição ajuda a manter. A psicografia
            continua sem cobrança.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#e2cf9f] bg-[#fff7df] px-3 py-1.5 text-[11.5px] font-semibold text-[#765a24]">
            <span>
              ⏱️ Previsão de recebimento:{" "}
              <strong>Hoje às {horario || "18h00"} (Horário de Brasília)</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#e1d8e7] bg-[#f8f4fa] p-3 text-center shadow-sm">
          {[
            ["1", "Escolha o valor"],
            ["2", "PIX ou cartão"],
            ["3", "Confirmação"],
          ].map(([step, label]) => (
            <div key={step} className="min-w-0">
              <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full border border-[#cdbfda] bg-white text-[10px] font-black text-[#705b80]">
                {step}
              </span>
              <span className="mt-1.5 block text-[10.5px] font-bold leading-tight text-[#716777]">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 text-left">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#554a5e]">
              Escolha o seu gesto
            </span>
            <span className="text-[10.5px] font-semibold text-[#817687]">Você decide o valor</span>
          </div>

          <div
            className={`mb-5 rounded-2xl border-2 bg-white p-4 shadow-[0_14px_28px_-20px_rgba(82,67,99,0.25)] transition-all ${isCustom ? "border-[#8a729d] ring-4 ring-[#8a729d]/10" : "border-[#e1d8e7]"}`}
          >
            <label htmlFor="custom-donation-input" className="block">
              <span className="inline-flex rounded-full border border-[#d8cce2] bg-[#f3edf7] px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] text-[#705b80]">
                Valor livre
              </span>
              <span className="mt-2 block text-[15px] font-extrabold text-[#3b3244]">
                Ou escolha outro valor
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-relaxed text-[#716777]">
                A partir de R$ 40, a carta física e o envio já ficam incluídos no valor.
              </span>
            </label>
            <div className="relative mt-3 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#705b80]">
                R$
              </span>
              <input
                id="custom-donation-input"
                type="text"
                inputMode="decimal"
                value={customInput}
                onFocus={() => {
                  setIsCustom(true);
                  handlePhysicalLetterPreference(false);
                  setHasUserSelectedOption(true);
                }}
                onChange={handleCustomChange}
                placeholder="Ex.: 50,00"
                className="w-full rounded-xl border border-[#d9cee2] bg-[#fbf9fc] py-4 pl-12 pr-4 text-[22px] font-black text-[#342b3e] outline-none transition-all placeholder:text-[#aaa0b0] focus:border-[#8a729d] focus:bg-white"
              />
            </div>
            {isCustom && customInput.length > 0 && activeAmount < 15 && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
                O valor sugerido a partir de R$ 15 ajuda a cobrir os materiais mínimos do oratório.
              </p>
            )}
          </div>

          <div className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#716777]">
            Veja o que cada valor ajuda a manter
          </div>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((item) => {
              const isSelected = !isCustom && selectedAmount === item.val;
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handleSelectPreset(item.val)}
                  className={`group relative flex min-h-[112px] flex-col justify-center overflow-hidden rounded-2xl text-left transition-all duration-200 cursor-pointer ${item.highlight ? "col-span-2 min-h-[132px]" : ""} ${
                    isSelected
                      ? "border-2 border-[#8a729d] bg-[#f0e9f5] text-[#342b3e] shadow-[0_18px_40px_-18px_rgba(111,90,136,0.35)] ring-4 ring-[#8a729d]/10"
                      : "border border-[#ddd3e5] bg-white text-[#342b3e] shadow-sm hover:border-[#b6a5c2] hover:bg-[#faf7fc]"
                  }`}
                >
                  {item.highlight && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#c49a52] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-sm">
                      Mais escolhida
                    </span>
                  )}
                  <div className="flex flex-1 flex-col justify-center p-4">
                    <span
                      className={`block font-black leading-tight tracking-tight text-[#6c557d] ${item.highlight ? "text-[28px]" : "text-[21px]"}`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`mt-1 block font-semibold leading-snug ${item.highlight ? "text-[13px]" : "text-[11.5px]"} ${isSelected ? "text-[#655470]" : "text-[#766d7d]"}`}
                    >
                      {item.tag}
                    </span>
                    {isSelected && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#55796e]">
                        <span>✓</span> Escolhido
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <label
        className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${physicalLetterIncluded ? "cursor-default" : "cursor-pointer"} ${shouldReceivePhysicalLetter ? "border-[#8a729d] bg-[#f0e9f5] ring-4 ring-[#8a729d]/10" : "border-[#ddd3e5] bg-white hover:border-[#b6a5c2]"}`}
      >
        <input
          type="checkbox"
          checked={shouldReceivePhysicalLetter}
          disabled={physicalLetterIncluded}
          onChange={(event) => handlePhysicalLetterPreference(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#789c90]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[14px] font-extrabold text-[#3b3244]">
            <span>
              {physicalLetterIncluded
                ? "Carta física incluída no valor"
                : "Quero receber a carta física"}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#705b80] ring-1 ring-[#d8cce2]">
              {physicalLetterBadge}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#716777]">
            {physicalLetterDescription}
          </p>
          {shouldReceivePhysicalLetter && (
            <div className="mt-4 border-t border-[#d8cce2] pt-4">
              <div className="flex h-20 justify-center overflow-hidden rounded-2xl bg-white px-5 shadow-sm ring-1 ring-[#5b476a]">
                <img
                  src={correiosLogo}
                  alt="Correios"
                  className="h-16 w-full scale-[2.35] object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="mt-3 text-left">
                <span className="block text-[12px] font-black text-[#44394c]">
                  Envio pelos Correios
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#716777]">
                  Postagem estimada em 2–3 dias úteis após confirmar o endereço. O prazo final
                  depende do CEP.
                </span>
              </div>
            </div>
          )}
        </div>
      </label>

      {shouldReceivePhysicalLetter && impact.isValid && (
        <div className="mt-3 rounded-2xl border border-[#d8cce2] bg-[#f8f4fa] p-3 text-left">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-bold text-[#655a70]">Total para confirmar</span>
            <span className="text-[18px] font-black text-[#705b80]">
              R$ {checkoutAmount.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#766d7d]">
            {physicalLetterFee > 0
              ? `R$ ${activeAmount.toFixed(2).replace(".", ",")} de contribuição + R$ 15,00 da taxa de envio físico.`
              : `R$ ${activeAmount.toFixed(2).replace(".", ",")} de contribuição, com carta física e envio incluídos.`}
          </p>
        </div>
      )}

      {/* Card de Impacto Espiritual Refinado */}
      <div
        className={`mt-4 rounded-2xl border p-4 text-left shadow-2xs transition-all duration-300 ${impact.cardBorder}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide border ${impact.badgeColor}`}
          >
            <span>{impact.icon}</span>
            {impact.badge}
          </span>
          <span className="text-[13px] font-black text-[#6c557d]">
            R$ {activeAmount > 0 ? activeAmount.toFixed(2).replace(".", ",") : "0,00"}
          </span>
        </div>

        <h4 className="text-[13.5px] font-extrabold leading-snug text-[#3b3244]">{impact.title}</h4>
        <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">{impact.description}</p>

        {activeAmount < 15 && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-red-100/80 border border-red-200 text-red-900 text-[11.5px] font-bold leading-tight">
            O valor mínimo de R$15 ajuda a cobrir a vela de 7 dias e o pergaminho físico.
          </div>
        )}
      </div>

      <div id="area-pagamento-pix" className="scroll-mt-14">
        {impact.isValid ? (
          <Suspense fallback={<DeferredFallback />}>
            <PixCheckout
              productId="carta_sagrada"
              amountCents={Math.round(checkoutAmount * 100)}
              initialCustomerName={nomeCompleto || primeiroNome}
              enteQuerido={enteCompleto || primeiroEnte}
              grauParentesco={relacao}
              mensagemPreview={mensagem}
              successPath="/chamada-ao-vivo-milena?source=paid&next=%2Fobrigado"
              includePaymentParams={false}
              displayProductName={
                shouldReceivePhysicalLetter ? "Contribuição + envio de carta física" : undefined
              }
              onPaymentConfirmed={(receipt) => {
                if (shouldReceivePhysicalLetter && receipt.orderId) {
                  sessionStorage.setItem(
                    "templodeluz:physical-letter-fee-receipt",
                    JSON.stringify({
                      orderId: receipt.orderId,
                      amountCents: receipt.amountCents,
                      paidAt: new Date().toISOString(),
                    }),
                  );
                }
              }}
            />
          </Suspense>
        ) : (
          <div className="mt-5 p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
            Por favor, selecione ou digite um valor a partir de R$ 15 para continuar.
          </div>
        )}
      </div>

      {/* Continuidade após o pagamento */}
      <div className="mt-4 border-t border-[#e3dbe9] pt-3">
        <p className="text-center text-[11.5px] leading-relaxed text-[#766d7d]">
          Após confirmar a contribuição via PIX ou cartão, você será redirecionado(a)
          automaticamente.
        </p>
      </div>

      {/* Linha de Apoio via WhatsApp - Sutil, elegante e sem roubar o foco do pagamento */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setWhatsAppModalOpen(true)}
          className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#eff8f4] via-[#e6f4ee] to-[#f7fbf9] p-3 text-left shadow-[0_16px_34px_-22px_rgba(58,126,101,0.3)] transition-all hover:border-[#8fc3af] hover:brightness-[1.02] sm:p-3.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-xs">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.107-.07-.251-.08-.574-.188-.988-.369-1.758-.767-2.903-2.545-2.991-2.663-.088-.118-.718-.956-.718-1.822 0-.866.453-1.293.614-1.469.161-.177.351-.221.468-.221.117 0 .234.001.336.006.107.005.251-.041.393.298.146.351.498 1.214.542 1.303.044.088.073.192.015.308-.059.117-.088.19-.176.293-.088.103-.186.23-.265.31-.088.088-.18.184-.078.36.103.176.458.756.983 1.224.676.602 1.246.789 1.422.877.176.088.279.074.382-.044.103-.117.439-.512.556-.688.117-.176.235-.147.396-.088.161.059 1.026.484 1.202.572.176.088.293.132.337.206.044.074.044.43-.1 1.035z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.523 3.664 1.435 5.186L2.1 22l4.98-1.306A9.958 9.958 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.635 0-3.15-.494-4.414-1.343l-.316-.214-2.95.774.787-2.876-.234-.336A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-950">
                  Suporte
                </span>
                <span className="text-[12px] font-bold leading-tight text-[#335f50]">
                  Dúvidas com seu pedido? Fale no WhatsApp
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] leading-tight text-[#5f796f]">
                Atendimento fraterno com a equipe da Médium Milena
              </p>
            </div>
          </div>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition-all group-hover:bg-emerald-50">
            ›
          </span>
        </button>
      </div>

      <Suspense fallback={null}>
        <WhatsAppContactModal
          isOpen={whatsAppModalOpen}
          onClose={() => setWhatsAppModalOpen(false)}
          nomeConsulente={nomeCompleto || primeiroNome}
          nomeEnte={enteCompleto || primeiroEnte}
          grauParentesco={relacao}
          tempoPassagem={tempoPassagem}
          intencaoPrincipal={intencaoPrincipal}
          mensagemPreview={mensagem}
          temas={temas}
          horario={horario}
          onSelectDonateNow={() => {
            setWhatsAppModalOpen(false);
            const pixSection = document.getElementById("pix-section");
            if (pixSection) {
              pixSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        />
      </Suspense>

      {/* A alternativa gratuita permanece disponível, sem disputar o foco da contribuição. */}
      <div className="mt-7 border-t border-[#e3dbe9] pt-5">
        <div className="rounded-2xl border border-[#e1d8e7] bg-[#f8f4fa] p-4 text-center shadow-xs">
          <p className="text-[11.5px] leading-relaxed text-[#766d7d]">
            A contribuição é voluntária. Se este não for o seu momento, você ainda pode seguir para
            o pergaminho.
          </p>

          <div className="mt-3">
            <button
              type="button"
              onClick={handleIrParaPergaminho}
              className="w-full cursor-pointer rounded-xl border border-[#cfc3d8] bg-white px-4 py-3 text-[11.5px] font-bold text-[#655470] transition-colors hover:border-[#aa96b8] hover:bg-[#f3edf7] hover:text-[#4f405a]"
            >
              Seguir sem contribuir neste momento
            </button>
          </div>

          {freeLetterAudioOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                className="free-letter-audio-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-[#e6ddeb]/90 p-3 backdrop-blur-sm sm:p-5"
                aria-modal="true"
                aria-labelledby="free-letter-audio-title"
              >
                <div
                  className="fixed inset-0"
                  onClick={() => setFreeLetterAudioOpen(false)}
                  aria-hidden="true"
                />
                <div className="free-letter-audio-card relative z-10 max-h-[calc(100dvh-24px)] w-full max-w-[420px] overflow-y-auto overscroll-contain rounded-[26px] border border-[#d8cae5] bg-[#fffefd] shadow-2xl text-center pb-2">
                  {/* Topo Elegante com Botão Fechar */}
                  <div className="relative overflow-hidden border-b border-[#d5e5df] bg-gradient-to-br from-[#e9f5f0] via-[#f7fbf9] to-[#fff8e8] px-5 pb-5 pt-6 text-center text-[#342b3e]">
                    <button
                      type="button"
                      onClick={() => setFreeLetterAudioOpen(false)}
                      aria-label="Fechar"
                      className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#d8cce2] bg-white text-sm font-bold text-[#655470] transition-all hover:bg-[#f3edf7] active:scale-95"
                    >
                      ✕
                    </button>
                    <div className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-[#a8d3c0]/20 blur-3xl" />
                    <div className="pointer-events-none absolute -right-10 bottom-0 h-24 w-24 rounded-full bg-[#c49a52]/20 blur-3xl" />

                    <span className="relative inline-flex items-center gap-1 rounded-full border border-[#dec99a] bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#765a24]">
                      <span>🕊️</span> Mensagem da Milena
                    </span>

                    <h2
                      id="free-letter-audio-title"
                      className="relative mt-2.5 font-display text-[19px] sm:text-[21px] font-black leading-snug"
                    >
                      OUÇA ANTES DE SEGUIR PARA O PERGAMINHO
                    </h2>
                    <p className="relative mt-1 text-[11.5px] leading-relaxed text-[#63746e]">
                      Sua carta continua 100% gratuita. Ouça este breve recado especial da médium
                      antes de você redigir.
                    </p>
                  </div>

                  {/* Conteúdo do Modal */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <Suspense fallback={<DeferredFallback />}>
                      <CustomAudioPlayer
                        src={milenaFreeLetterAudio}
                        title="Áudio de acolhimento"
                        subtitle="Mensagem de orientação da Médium"
                        autoPlay={true}
                        defaultDuration={61}
                        theme="emerald"
                        ariaLabel="Mensagem da Milena sobre receber a carta"
                      />
                    </Suspense>

                    <button
                      type="button"
                      onClick={continueToPergaminho}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4b8b7e] via-[#39776c] to-[#2d665e] py-3.5 px-5 text-sm font-black text-white uppercase tracking-wider shadow-lg shadow-[#39776c]/30 hover:shadow-xl hover:shadow-[#39776c]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                    >
                      <span>Continuar para o pergaminho</span>
                      <span className="text-base">→</span>
                    </button>

                    <button
                      type="button"
                      onClick={continueToPergaminho}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-3 transition-colors cursor-pointer"
                    >
                      Ignorar áudio e ir direto ao pergaminho
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* ── BARRA FLUTUANTE DE PAGAMENTO RÁPIDO (PIX / CARTÃO) ── */}
          {hasUserSelectedOption &&
            impact.isValid &&
            !isCheckoutInView &&
            !freeLetterAudioOpen &&
            !whatsAppModalOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <aside
                className="float-bar-enter fixed bottom-0 left-0 right-0 z-[9990] border-t border-[#ded4eb] bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(33,26,53,0.22)] backdrop-blur-md transition-all sm:px-6"
                aria-label="Pagamento Rápido"
              >
                <div className="mx-auto flex max-w-[480px] items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 text-left">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                      {shouldReceivePhysicalLetter
                        ? "Total com carta física:"
                        : "Valor selecionado:"}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-[21px] sm:text-[24px] font-black text-[#2e1d4a] leading-none">
                        R$ {checkoutAmount.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="inline-flex text-[9.5px] font-extrabold text-[#5d4786] bg-[#f2eef8] border border-[#e1d8ec] px-1.5 py-0.5 rounded-md">
                        PIX / Cartão
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToCheckout}
                    className="group relative cursor-pointer flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-5 py-3 text-white font-black text-[13px] sm:text-[14px] uppercase tracking-wider shadow-lg shadow-emerald-950/20 hover:brightness-105 active:scale-[0.98] transition-all"
                  >
                    <PixIcon className="w-4 h-4 fill-white shrink-0" />
                    <span>PAGAR AGORA</span>
                    <span
                      aria-hidden="true"
                      className={`text-emerald-100 text-base leading-none transition-transform ${
                        checkoutPosition === "above"
                          ? "group-hover:-translate-y-0.5"
                          : "group-hover:translate-y-0.5"
                      }`}
                    >
                      {checkoutPosition === "above" ? "↑" : "↓"}
                    </span>
                  </button>
                </div>
              </aside>,
              document.body,
            )}
        </div>
      </div>
    </div>
  );
}

function SecurityGuaranteeSeal() {
  return (
    <div className="mt-7 space-y-3.5 border-t border-[#e3dbe9] pt-5 text-left">
      {/* Título da Seção dos Selos */}
      <div className="text-center">
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[#b45309]">
          ✦ Atendimento e segurança ✦
        </span>
        <h3 className="font-display mt-0.5 text-[16px] font-extrabold text-[#342b3e]">
          Transparência em cada etapa
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Card 1: Selo da Paz */}
        <div className="flex flex-col items-center rounded-2xl border border-[#ead9b0] bg-gradient-to-b from-[#fffdf8] to-[#fff8e9] p-4 text-center shadow-xs transition-transform duration-300 hover:scale-[1.01]">
          <div className="relative mb-2 flex items-center justify-center">
            <img
              src={IMAGES.seloPomba}
              alt="Selo de Paz Espiritual e Fé - Templo de Luz"
              className="h-28 w-28 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-widest text-[#b45309] block">
            Paz & Acolhimento
          </span>
          <h4 className="font-display mt-0.5 text-[14.5px] font-extrabold leading-tight text-[#3b3244]">
            Selo de Paz Espiritual
          </h4>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#746956]">
            Sua intenção é registrada com cuidado para o atendimento e a oração da casa.
          </p>
        </div>

        {/* Card 2: Selo de Garantia */}
        <div className="flex flex-col items-center rounded-2xl border border-[#ddd3e5] bg-gradient-to-b from-white to-[#f5f0f8] p-4 text-center shadow-xs transition-transform duration-300 hover:scale-[1.01]">
          <div className="relative mb-2 flex items-center justify-center">
            <img
              src={IMAGES.seloCheckout}
              alt="Selo de Garantia Incondicional de 7 Dias"
              className="h-28 w-28 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-widest text-[#5d4786] block">
            Pagamento seguro
          </span>
          <h4 className="font-display mt-0.5 text-[14.5px] font-extrabold leading-tight text-[#3b3244]">
            Processamento protegido
          </h4>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#716777]">
            PIX e cartão são processados por provedores de pagamento; você vê o método antes de
            confirmar.
          </p>
        </div>
      </div>
    </div>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-2.5">
      {FAQ.map((item, i) => (
        <div
          key={item.q}
          className="overflow-hidden rounded-2xl border border-[#ddd3e5] bg-white shadow-sm"
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between p-4 text-left text-[14px] font-bold text-[#3b3244]"
          >
            <span>{item.q}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d8cce2] bg-[#f3edf7] text-base text-[#705b80]">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i ? (
            <p className="animate-rise-in border-t border-[#ebe4ef] px-4 pb-4 pt-3 text-[13px] leading-relaxed text-[#716777]">
              {item.a}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function QuizResult({
  nome = "",
  ente = "",
  relacao = "",
  tempo = "",
  dorPrincipal = "",
  horario = "",
  mensagem = "",
  temasEscolhidos = [],
}: {
  readonly nome?: string;
  readonly ente?: string;
  readonly relacao?: string;
  readonly tempo?: string;
  readonly dorPrincipal?: string;
  readonly horario?: string;
  readonly mensagem?: string;
  readonly temasEscolhidos?: string[];
}) {
  const primeiro: string = (nome?.trim() ? nome.trim().split(" ")[0] : "Você") || "Você";
  const primeiroEnte: string =
    (ente?.trim() ? ente.trim().split(" ")[0] : "seu ente querido") || "seu ente querido";
  const nomeEnteCompleto: string = ente?.trim() || "seu ente querido";
  const horarioExibicao: string = horario?.trim() || "";
  const hopeMessages = [
    "Você não precisa atravessar esse momento sozinho(a).",
    "Cada história merece tempo, cuidado e respeito.",
    "Seu gesto ajuda a transformar intenção em cuidado concreto.",
    "Seu pedido pode ser revisado antes de qualquer confirmação.",
  ];
  const [hopeMessageIndex, setHopeMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setHopeMessageIndex((index) => (index + 1) % hopeMessages.length),
      4_500,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && horarioExibicao) {
      try {
        sessionStorage.setItem("templodeluz_horario_entrega", horarioExibicao);
        localStorage.setItem("templodeluz_horario_entrega", horarioExibicao);
      } catch {
        // ignore
      }
    }
  }, [horarioExibicao]);

  const scrollToEscolha = () => {
    const section = document.getElementById("escolha-caminho");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="animate-rise-in bg-[#f5f1f8] pb-12 text-[#342b3e]">
      {/* ── HEADER: CONFIRMAÇÃO ESPIRITUAL & ESCOLHA COM CALMA ── */}
      <header className="relative overflow-hidden border-b border-[#ddd3e5] bg-gradient-to-b from-[#ebe3f1] to-[#f7f3fa] text-[#342b3e]">
        {/* Foto da médium escrevendo no oratório sagrado */}
        <div className="w-full bg-[#eee8f3] p-3 sm:p-4">
          <img
            src={milenaCartaImage}
            alt="Milena Medeiros escrevendo uma carta no oratório sagrado"
            className="mx-auto block h-auto w-full max-w-[620px] rounded-2xl object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Card Nobre com Resposta Imediata em Segundos */}
        <div className="relative z-10 px-4 pb-7 pt-4">
          <div className="relative mx-auto max-w-[460px] overflow-hidden rounded-[26px] border border-[#d8cce2] bg-white/90 p-5 text-center shadow-[0_24px_60px_-30px_rgba(82,67,99,0.4)] sm:p-6">
            <div className="pointer-events-none absolute -left-14 -top-12 h-32 w-44 rounded-full bg-[#ded0e8]/45 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-28 w-52 rounded-full bg-[#f2dfb9]/35 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9c9eb]/10 blur-2xl" />

            <div className="relative z-10 animate-float-soft text-[36px] mb-2">🕊️</div>

            <h1 className="relative z-10 font-display text-[23px] font-extrabold leading-snug text-[#342b3e] sm:text-[26px]">
              {primeiro}, seu pedido para <span className="text-[#705b80]">{nomeEnteCompleto}</span>{" "}
              foi recebido 🕊️
            </h1>

            <h2 className="relative z-10 mt-2 text-[15px] font-bold leading-snug text-[#655a70] sm:text-[16px]">
              Agora você pode revisar sua intenção e escolher, com calma, como deseja continuar.
            </h2>

            <div className="relative z-10 mt-3.5 rounded-2xl border border-[#e2d9e8] bg-[#faf7fc] p-3.5 text-left">
              <p className="text-[12.5px] leading-relaxed text-[#655a70]">
                <strong className="font-bold text-[#705b80]">A psicografia não é cobrada.</strong> A
                seguir, você conhecerá os materiais usados e poderá escolher livremente se deseja
                apoiá-los.
              </p>
            </div>

            {/* Intenção Registrada */}
            <div className="relative z-10 mt-4 rounded-xl border border-[#d9cee2] bg-[#f3edf7] p-3 text-left">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#705b80]">
                Sua intenção registrada:
              </span>
              <p className="mt-1 text-[13px] font-medium italic text-[#4f4558]">
                "{dorPrincipal || "Lembrança e paz no coração"}"
              </p>
            </div>

            {/* Gatilho de Recebimento com Horário Confirmado */}
            <div className="relative z-10 mt-3.5 rounded-2xl border border-[#e6d3a4] bg-gradient-to-r from-[#fff9e9] via-[#fff4d7] to-[#fff9e9] p-3.5 text-left shadow-sm backdrop-blur-xs sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#ead8ae] pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f3dfaa] text-[11px] text-[#765a24]">
                    ⏱️
                  </span>
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-[#765a24]">
                    Previsão de Recebimento
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#b7d5cb] bg-[#e8f4ef] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4e7166]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Horário Reservado</span>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[12px] font-medium text-[#655a70]">
                  Horário previsto de entrega:
                </span>
                <span className="text-[17px] font-black tracking-tight text-[#765a24] sm:text-[19px]">
                  Hoje às {horarioExibicao}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#887145] sm:text-[10.5px]">
                  (Horário de Brasília)
                </span>
              </div>

              <p className="mt-1 text-[11px] leading-relaxed text-[#716777]">
                A sessão de oração e acolhimento para <strong>{nomeEnteCompleto}</strong> está
                agendada no oratório. Sua carta tem entrega estimada em 1h30 a 2h (até às{" "}
                {horarioExibicao}, horário oficial de Brasília e São Paulo).
              </p>
            </div>

            {/* Três Passos Claros */}
            <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 text-center text-[10.5px]">
              <div className="rounded-lg border border-[#c8ddd6] bg-[#edf6f2] p-2 font-bold text-[#4e7166]">
                ✓ Pedido recebido
              </div>
              <div className="rounded-lg border border-[#e5d1a0] bg-[#fff5dc] p-2 font-extrabold text-[#765a24] shadow-xs">
                2. Escolha como continuar
              </div>
              <div className="rounded-lg border border-[#ddd3e5] bg-[#f3edf7] p-2 font-bold text-[#705b80]">
                3. Receba às {horarioExibicao}
              </div>
            </div>

            {/* Botão de Decisão Primário */}
            <div className="relative z-10 mt-5">
              <button
                type="button"
                onClick={scrollToEscolha}
                className="group relative w-full overflow-hidden cursor-pointer rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 text-[14px] sm:text-[15px] font-black uppercase tracking-wide text-stone-950 shadow-xl shadow-amber-950/40 hover:brightness-105 active:scale-[0.99] transition-all"
              >
                <span className="relative flex items-center justify-center gap-2">
                  <span>ESCOLHER COMO CONTINUAR ↓</span>
                </span>
              </button>
              <p className="mt-2 text-[11px] italic text-[#766d7d]">
                Nenhuma cobrança é feita ao tocar no botão.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-[#ddd3e5] bg-[#eee8f3] px-4 py-2.5 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#705b80]">
          Uma mensagem para você
        </span>
        <p
          key={hopeMessageIndex}
          className="mt-1 animate-rise-in text-[12.5px] font-semibold text-[#574c60]"
        >
          {hopeMessages[hopeMessageIndex]}
        </p>
      </div>

      <div className="px-4 pt-7 sm:px-6">
        {/* ── SEÇÃO: O QUE ACONTECE A PARTIR DAQUI? ── */}
        <Reveal>
          <div className="rounded-[26px] border border-[#ddd3e5] bg-white p-5 text-left shadow-sm sm:p-7">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-[#f3edf7] px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#705b80]">
              <span>✦</span>
              <span>Passo a Passo Transparente</span>
            </span>

            <h2 className="font-display text-[22px] font-extrabold leading-snug text-[#342b3e] sm:text-[24px]">
              O que acontece a partir daqui?
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#716777]">
              Queremos que você saiba exatamente o que está escolhendo antes de continuar.
            </p>

            <div className="mt-5 space-y-3.5">
              <div className="flex items-start gap-3 rounded-2xl border border-[#e7e0ec] bg-[#faf7fc] p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5d4786] text-xs font-black text-white">
                  1
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold leading-tight text-[#3b3244]">
                    Seu pedido já foi registrado
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    O nome de <strong className="text-[#705b80]">{nomeEnteCompleto}</strong> e a
                    intenção que você informou foram recebidos para o acolhimento espiritual.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#e7e0ec] bg-[#faf7fc] p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5d4786] text-xs font-black text-white">
                  2
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold leading-tight text-[#3b3244]">
                    Você escolhe como deseja prosseguir
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    Você verá os materiais utilizados pela casa e poderá escolher um valor de
                    contribuição voluntária.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#e7e0ec] bg-[#faf7fc] p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5d4786] text-xs font-black text-white">
                  3
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold leading-tight text-[#3b3244]">
                    Recebimento previsto para hoje às {horarioExibicao} (Horário de Brasília)
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    Sua sessão foi acolhida no oratório com previsão de entrega em aproximadamente
                    1h30 a 2h (
                    <strong className="text-[#705b80]">
                      hoje, até às {horarioExibicao}, horário oficial de Brasília e São Paulo
                    </strong>
                    ). Você poderá ler a mensagem e acompanhar todas as orientações espirituais.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-center text-[12px] font-extrabold text-emerald-200">
              🔒 Nada é cobrado sem a sua confirmação.
            </div>
          </div>
        </Reveal>

        {/* ── SEÇÃO: CONHEÇA QUEM REALIZARÁ O ATENDIMENTO ── */}
        <Reveal className="mt-8">
          <SectionLabel>Antes de escolher</SectionLabel>
          <h2 className="font-display text-[25px] font-extrabold leading-tight text-[#342b3e] sm:text-[28px]">
            Conheça quem realizará o atendimento
          </h2>
        </Reveal>

        <Reveal
          delay={80}
          className="relative my-4 flex flex-col items-center justify-center text-center"
        >
          {/* Aura de Nuvem e Luz */}
          <div className="absolute inset-0 -m-6 rounded-full cloud-aura blur-2xl pointer-events-none opacity-80" />

          {/* Foto Nítida */}
          <div className="relative w-full max-w-[380px] flex justify-center cloud-mask-ethereal">
            <img
              src={IMAGES.medium}
              alt="Milena Medeiros, médium responsável pelo atendimento"
              className="w-full h-auto max-h-[340px] object-cover object-center drop-shadow-md"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="mt-3 max-w-[380px] px-2 z-10 text-center">
            <h3 className="font-display text-[22px] font-bold text-[#342b3e]">Milena Medeiros</h3>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase text-[#705b80] shadow-xs backdrop-blur-xs">
              Médium titular da Casa Nova desde 1993
            </span>
            <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-[#716777]">
              Há 33 anos dedicada às atividades mediúnicas e de acolhimento fraterno da casa. Milena
              jamais cobra por psicografia — o trabalho é realizado por amor e caridade pura.
            </p>
          </div>
        </Reveal>

        {/* Métricas Sóbrias e Verificadas */}
        <Reveal delay={120} className="mt-3 grid grid-cols-3 gap-2.5">
          {[
            { n: "33 anos", l: "de atuação fraterna" },
            { n: "+12 mil", l: "cartas manuscritas" },
            { n: "Desde 1993", l: "na Casa Nova" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-[#ddd3e5] bg-white p-3 text-center shadow-sm"
            >
              <span className="font-display block text-[17px] font-extrabold text-[#705b80] sm:text-[20px]">
                {s.n}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium leading-tight text-[#716777]">
                {s.l}
              </span>
            </div>
          ))}
        </Reveal>

        {/* Mensagem em Áudio da Milena com Transcrição */}
        <Reveal delay={130}>
          <Suspense fallback={<DeferredFallback />}>
            <MilenaAudioMessage />
          </Suspense>
        </Reveal>

        {/* ── SEÇÃO: FAMÍLIAS QUE JÁ PASSARAM PELO ATENDIMENTO ── */}
        <Reveal className="mt-8">
          <SectionLabel>Acolhimento real</SectionLabel>
          <h2 className="font-display text-[23px] font-extrabold text-[#342b3e] sm:text-[25px]">
            Famílias que já passaram pelo atendimento
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[#c7b8d1]">
            Veja alguns dos relatos espontaneamente compartilhados com a casa.
          </p>
        </Reveal>

        <Suspense fallback={<DeferredFallback />}>
          <SocialProofSection />
        </Suspense>

        <p className="mt-3 text-center text-[12px] leading-relaxed italic text-[#9e8eaa]">
          *Os relatos representam experiências pessoais de quem os enviou e não constituem promessa
          de resultado.
        </p>

        {/* ── SEÇÃO: POR QUE EXISTE UMA CONTRIBUIÇÃO? ── */}
        <Reveal delay={130} className="mt-8">
          <div
            id="materiais-section"
            className="scroll-mt-24 rounded-[26px] border border-[#ddd3e5] bg-gradient-to-b from-[#fffefd] to-[#f7f2fa] p-5 text-left text-[#342b3e] shadow-[0_24px_60px_-34px_rgba(82,67,99,0.32)] sm:p-7"
          >
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-[#f3edf7] px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#705b80]">
              <span>🕊️</span>
              <span>Transparência da Casa</span>
            </div>

            <h2 className="font-display text-[21px] font-extrabold leading-snug text-[#342b3e] sm:text-[23px]">
              Veja onde sua contribuição faz diferença
            </h2>
            <h3 className="font-display mt-0.5 text-[16px] font-bold text-[#705b80] sm:text-[18px]">
              A psicografia não é cobrada; o apoio é destinado aos materiais e atividades
              informadas.
            </h3>

            <div className="mt-3 text-[13.5px] leading-relaxed text-[#655b6e]">
              <p>
                A contribuição apresentada nesta página é destinada aos materiais e às atividades da
                casa informados abaixo. Ela{" "}
                <strong className="font-extrabold text-[#705b80]">
                  não é o preço da psicografia
                </strong>
                .
              </p>
            </div>

            {/* Foto no Oratório com Vela e Pergaminho */}
            <div className="my-5 overflow-hidden rounded-2xl border border-[#dfd1b2] bg-white shadow-xl">
              <img
                src={IMAGES.milenaOratorio}
                alt="Médium Milena Medeiros em recolhimento e oração no Templo de Luz"
                className="h-auto max-h-[420px] w-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
              <div className="border-t border-[#eadfca] bg-[#fffaf0] p-3 text-center">
                <span className="text-[11px] font-bold italic text-[#756a7e]">
                  O espaço onde os materiais do pedido são preparados
                </span>
              </div>
            </div>

            {/* Os 3 Pilares de Materiais */}
            <div className="space-y-3">
              <div className="grid grid-cols-[112px_1fr] items-center overflow-hidden rounded-2xl border border-[#e5d7b7] bg-white shadow-sm sm:grid-cols-[136px_1fr]">
                <img
                  src={insumoVelaImage}
                  alt="Vela de sete dias no altar"
                  className="aspect-square h-auto w-full object-contain bg-[#fffaf0]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="p-4">
                  <h4 className="text-[14px] font-extrabold text-[#5f4d38]">🕯️ Vela de 7 dias</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    Preparada com o nome informado para o período de oração e recolhimento da casa
                    diante do altar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[112px_1fr] items-center overflow-hidden rounded-2xl border border-[#ddd3e5] bg-white shadow-sm sm:grid-cols-[136px_1fr]">
                <img
                  src={insumoCartaImage}
                  alt="Papel e materiais da carta"
                  className="aspect-square h-auto w-full object-contain bg-[#f8f4fa]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="p-4">
                  <h4 className="text-[14px] font-extrabold text-[#5f4d6b]">
                    📜 Papel e materiais da carta
                  </h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    Materiais físicos utilizados na preparação e no registro manuscrito do
                    atendimento.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[112px_1fr] items-center overflow-hidden rounded-2xl border border-[#cfdfd8] bg-white shadow-sm sm:grid-cols-[136px_1fr]">
                <img
                  src={insumoSopaImage}
                  alt="Manutenção e ações fraternas"
                  className="aspect-square h-auto w-full object-contain bg-[#f0f7f4]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="p-4">
                  <h4 className="text-[14px] font-extrabold text-[#4e7166]">
                    🤍 Manutenção e ações fraternas
                  </h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#63746e]">
                    Parte da contribuição ajuda a sustentar as atividades e ações assistenciais
                    informadas pela instituição.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e5d7b7] bg-[#fff8e8] p-3 text-[12px] font-medium leading-relaxed text-[#715d3b]">
              <strong>Importante:</strong> contribuir é uma escolha. Você encontrará abaixo uma
              opção para continuar sem realizar a contribuição neste momento.
            </div>
          </div>
        </Reveal>

        {/* ── SEÇÃO DE ESCOLHA: AGORA ESCOLHA COMO DESEJA CONTINUAR ── */}
        <div id="escolha-caminho" className="scroll-mt-12">
          <Reveal className="relative mt-8">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-[#f3edf7] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#705b80]">
                <span>✦</span> Decisão Tranquila
              </span>
              <h2 className="font-display mt-2 text-[23px] font-extrabold leading-snug text-[#342b3e] sm:text-[26px]">
                Transforme sua intenção em cuidado concreto
              </h2>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-[#716777]">
                Veja o que cada valor ajuda a manter e escolha o gesto que faz sentido para você.
              </p>
            </div>

            {/* Contribuição em destaque e alternativa gratuita disponível no mesmo bloco. */}
            <PixInstantBox
              primeiroNome={primeiro}
              primeiroEnte={primeiroEnte}
              nomeCompleto={nome}
              enteCompleto={ente}
              relacao={relacao}
              tempoPassagem={tempo}
              intencaoPrincipal={dorPrincipal}
              mensagem={mensagem}
              temas={temasEscolhidos}
              horario={horarioExibicao}
            />

            {/* Selos de Segurança e Garantia */}
            <SecurityGuaranteeSeal />
          </Reveal>
        </div>

        {/* ── SEÇÃO DE DÚVIDAS FREQUENTES (FAQ) ── */}
        <Reveal className="mt-10">
          <SectionLabel>Ainda está em dúvida?</SectionLabel>
          <h2 className="font-display mb-3 text-[22px] font-extrabold text-[#342b3e] sm:text-[24px]">
            Não há necessidade de decidir sem entender o atendimento
          </h2>
          <Faq />
        </Reveal>

        {/* ── SEÇÃO FINAL: CONFIRMAÇÃO & RETORNO À ESCOLHA ── */}
        <Reveal className="mt-10 mb-6">
          <div className="rounded-[28px] border border-[#e5d7b7] bg-gradient-to-b from-[#fffefd] via-[#fffaf2] to-[#f6f0f8] p-6 text-center shadow-md sm:p-8">
            <div className="text-[32px] mb-1">🕊️</div>
            <h2 className="font-display text-[22px] font-extrabold leading-snug text-[#342b3e] sm:text-[25px]">
              Seu pedido para {nomeEnteCompleto} já foi recebido 🕊️
            </h2>
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-[#e2cf9f] bg-[#fff3d3] px-3.5 py-1 text-xs font-black text-[#765a24] shadow-2xs">
              <span>
                ⏱️ Horário estimado de entrega:{" "}
                <strong>Hoje às {horarioExibicao} (Horário de Brasília)</strong>
              </span>
            </div>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-[#716777]">
              Você não precisa decidir com pressa. Revise as opções acima e escolha o caminho que
              fizer sentido para você.
            </p>

            <div className="mt-5 max-w-sm mx-auto">
              <button
                type="button"
                onClick={scrollToEscolha}
                className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#5d4786] via-[#4e3877] to-[#3a275f] p-4 text-[13.5px] sm:text-[14px] font-black uppercase tracking-wider text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
              >
                ESCOLHER COMO CONTINUAR
              </button>
            </div>

            <p className="mt-3 text-[11.5px] font-medium text-[#817687]">
              Psicografia sem cobrança • Contribuição voluntária • Opção de continuar sem contribuir
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

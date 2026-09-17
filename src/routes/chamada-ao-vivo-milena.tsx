import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Footer, Halos, Stars } from "@/components/funnel/Shell";
import { PixCheckout } from "@/components/funnel/PixCheckout";
import { recordInput } from "@/lib/auto-capture";
import { verifyStripeCheckoutSession } from "@/lib/stripe";
import milenaLiveCallImage from "../assets/images/quiz/medium-milena-BduzfpAk.webp_202609071752.jpeg";
import milenaLiveCallAudio from "../assets/media/audio/milena-chamada-convite.mp3";
import feedbackOne from "../assets/media/feedbacks/Feedback.webp";
import feedbackTwo from "../assets/media/feedbacks/Feedback2.webp";

export const Route = createFileRoute("/chamada-ao-vivo-milena")({
  head: () => ({
    meta: [
      { title: "Chamada Ao Vivo com Milena Medeiros | Templo de Luz" },
      {
        name: "description",
        content:
          "Conversa particular por videochamada com Milena Medeiros, com opções de acolhimento, aprofundamento e acompanhamento espiritual.",
      },
    ],
  }),
  component: ChamadaAoVivoMilenaPage,
});

type Step = "offer" | "contract" | "payment" | "scheduling" | "confirmed";
type PeriodPreference = "day" | "night";
const LIVE_CALL_PACKAGES = [
  {
    id: "chamada_2h",
    hours: 1,
    amountCents: 6000,
    title: "Conversa particular",
    heading: "1 hora com Milena",
    description: "Para quem gostaria de conversar diretamente com Milena e ter um momento reservado para ser ouvido.",
    includes: ["1 hora de videochamada individual", "Escuta e acolhimento da sua história", "Espaço para perguntas e dúvidas", "Conversa sobre sua carta e sua saudade", "Orientação espiritual e fraterna", "Momento de oração ou reflexão, se desejar"],
  },
  {
    id: "acolhimento_4h",
    hours: 2,
    amountCents: 10000,
    title: "Acolhimento aprofundado",
    heading: "2 horas, com mais tempo para conversar",
    description: "Para quem sente que existe muita coisa para contar e não quer ficar olhando para o relógio quando começar a falar sobre o que importa.",
    includes: ["2 horas de videochamada individual", "Tudo do atendimento de 1 hora", "Mais tempo para aprofundar sua história", "Orientação espiritual mais detalhada", "Momento de oração e reflexão", "Orientação de prática pessoal para realizar após a conversa, quando apropriado"],
    popular: true,
  },
  {
    id: "renovacao_3_dias",
    hours: 2,
    amountCents: 15000,
    title: "3 dias de renovação",
    heading: "A chamada termina. O acolhimento não.",
    description: "Uma conversa inicial com Milena e três dias de acompanhamento espiritual pelo WhatsApp.",
    includes: ["2 horas de videochamada particular", "3 dias de acompanhamento pelo WhatsApp", "Orientações pessoais durante o período", "Momentos de oração e reflexão", "Prática simbólica orientada, quando apropriado", "Encerramento do acompanhamento no terceiro dia"],
  },
] as const;

const CONTRACT_TEXT = `CONTRATO DE CHAMADA AO VIVO — TEMPLO DE LUZ

1. DO OBJETO
O presente contrato regula a prestacao de servico de chamada de video ao vivo com a medium Milena Medeiros, exclusivamente para acolhimento espiritual e orientacao fraterna.

2. DAS RESPONSABILIDADES
A medium Milena Medeiros atuara como intermediaria espiritual, transmitindo mensagens e orientacoes provenientes do plano espiritual. O servico nao substitui acompanhamento medico, psicologico ou juridico profissional.

3. DO AGENDAMENTO
A chamada podera ser agendada a partir de 2 horas apos a confirmacao do pagamento, conforme disponibilidade. O participante recebera um link de acesso por WhatsApp ou e-mail.

4. DO PAGAMENTO
O pacote escolhido e {{PACKAGE}}, no valor de {{AMOUNT}}. O pagamento e feito antecipadamente via PIX ou cartao de credito e confirma a solicitacao de agendamento.

5. DO CANCELAMENTO
Cancelamentos com ate 1 hora de antecedencia recebem reembolso integral. Apos esse prazo, nao ha reembolso, sendo permitido remarcar uma vez.

6. DA CONFIDENCIALIDADE
Todo o conteudo da sessao e sigiloso. A medium respeita o segredo e a intimidade do participante.

7. DO ACEITE
Ao marcar esta opcao, o participante declara estar ciente e de acordo com todos os termos acima.`;

function ChamadaAoVivoMilenaPage() {
  const [step, setStep] = useState<Step>("offer");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractSigner, setContractSigner] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<(typeof LIVE_CALL_PACKAGES)[number]["id"]>("acolhimento_4h");
  const [periodPreference, setPeriodPreference] = useState<PeriodPreference>("day");
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [nextPath, setNextPath] = useState("/escrever-carta");
  const [source, setSource] = useState("skipped");
  const [isVerifyingCardPayment, setIsVerifyingCardPayment] = useState(false);
  const [cardPaymentError, setCardPaymentError] = useState("");
  const [isInvitationAudioPlaying, setIsInvitationAudioPlaying] = useState(false);
  const [quizProfile, setQuizProfile] = useState<{ nome?: string; ente?: string; relacao?: string; dorPrincipal?: string }>({});
  const selectedPackage = LIVE_CALL_PACKAGES.find((item) => item.id === selectedPackageId) ?? LIVE_CALL_PACKAGES[0];
  const callAmountCents = selectedPackage.amountCents;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const requestedNext = urlParams.get("next");
    if (requestedNext === "/obrigado" || requestedNext === "/escrever-carta") {
      setNextPath(requestedNext);
    }
    setSource(urlParams.get("source") === "paid" ? "paid" : "skipped");
    try {
      const storedContract = JSON.parse(
        sessionStorage.getItem("templodeluz:chamada-contract") || "null",
      ) as { signer?: string } | null;
      if (storedContract?.signer) setContractSigner(storedContract.signer);
      const profile = JSON.parse(localStorage.getItem("templodeluz_quiz_state") || "{}") as { nome?: string; ente?: string; relacao?: string; dorPrincipal?: string };
      setQuizProfile(profile);
    } catch {
      // Mantém o campo vazio se o armazenamento estiver indisponível ou corrompido.
    }

    const orderId = urlParams.get("orderId") || "";
    let pixSuccess = false;
    if (urlParams.get("method") === "pix" && orderId) {
      try {
        const receipt = JSON.parse(
          sessionStorage.getItem(`templodeluz:payment-receipt:${orderId}`) || "null",
        ) as { productId?: string; amountCents?: number; method?: string } | null;
        pixSuccess = receipt?.productId === "chamada_ao_vivo_milena"
          && receipt?.amountCents === callAmountCents
          && receipt?.method === "pix";
      } catch {
        pixSuccess = false;
      }
    }

    if (pixSuccess) {
      setStep(selectedSlot ? "confirmed" : "scheduling");
    }

    const sessionId = urlParams.get("session_id") || "";
    if (urlParams.get("method") === "card" && sessionId) {
      setStep("payment");
      setIsVerifyingCardPayment(true);
      void verifyStripeCheckoutSession({
        sessionId,
        productId: "chamada_ao_vivo_milena",
        amountCents: callAmountCents,
      })
        .then((paid) => {
          if (paid) setStep(selectedSlot ? "confirmed" : "scheduling");
          else setCardPaymentError("O pagamento por cartão ainda não foi confirmado pela Stripe.");
        })
        .catch((error: unknown) => {
          setCardPaymentError(error instanceof Error ? error.message : "Não foi possível validar o pagamento por cartão.");
        })
        .finally(() => setIsVerifyingCardPayment(false));
    }
  }, [callAmountCents]);

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    const base = new Date();
    const hours = periodPreference === "day" ? [10, 11, 14, 15, 16] : [18, 19, 20, 21];
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      for (const hour of hours) {
        const slot = new Date(base);
        slot.setDate(base.getDate() + dayOffset);
        slot.setHours(hour, 0, 0, 0);
        slots.push(slot.toISOString());
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const availableDates = Array.from(new Map(timeSlots.map((slot) => {
    const date = new Date(slot);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
    return [key, date] as const;
  })).entries());
  const activeDateKey = selectedDateKey || availableDates[0]?.[0] || "";
  const visibleTimeSlots = timeSlots.filter((slot) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(slot)) === activeDateKey);

  const handleConfirmScheduling = () => {
    if (!selectedSlot) return;
    sessionStorage.setItem("templodeluz:chamada-slot", selectedSlot);
    sessionStorage.setItem("templodeluz:chamada-ordered", "true");
    recordInput(
      "chamada_ao_vivo_horario",
      selectedSlot,
      {
        userName: contractSigner,
        currentScreen: "chamada_ao_vivo_agendamento",
        metadata: { signedAt: new Date().toISOString() },
      },
      0,
    );
    setStep("contract");
  };

  const continueFlow = () => {
    window.location.href = nextPath;
  };

  const acceptContract = () => {
    if (!contractAccepted || contractSigner.trim().length < 3) return;
    sessionStorage.setItem(
      "templodeluz:chamada-contract",
      JSON.stringify({ signer: contractSigner.trim(), acceptedAt: new Date().toISOString() }),
    );
    setStep("payment");
  };

  const handleInitiateCheckout = () => {
    recordInput("chamada_ao_vivo_initiate", "click", { currentScreen: "chamada_ao_vivo_offer" }, 0);
  };

  const returnPath = `/chamada-ao-vivo-milena?source=${source}&next=${encodeURIComponent(nextPath)}`;
  const selectedDate = selectedSlot
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(selectedSlot))
    : "";
  const quizFirstName = quizProfile.nome?.trim().split(/\s+/)[0] || "";
  const personalizedOffer = quizFirstName && quizProfile.ente
    ? `${quizFirstName}, pelo que você compartilhou sobre ${quizProfile.ente}${quizProfile.relacao ? ` (${quizProfile.relacao})` : ""}, escolha o formato de conversa que mais respeita o seu momento.`
    : "Escolha o formato de conversa que mais respeita o seu momento.";
  const whatsappConfirmationUrl = `https://api.whatsapp.com/send?phone=5511960746285&text=${encodeURIComponent(
     `Olá, sou ${contractSigner}. Contratei ${selectedPackage.title} e indiquei ${selectedDate} (horário de São Paulo) como preferência. Gostaria de confirmar o agendamento.`,
   )}`;
  const whatsappCheckoutUrl = `https://api.whatsapp.com/send?phone=5511960746285&text=${encodeURIComponent(
    `Olá! ${quizFirstName ? `Sou ${quizFirstName} e ` : ""}gostaria de finalizar pelo WhatsApp o atendimento “${selectedPackage.heading}” no valor de R$ ${(callAmountCents / 100).toFixed(2).replace(".", ",")}. ${quizProfile.ente ? `Meu pedido está relacionado a ${quizProfile.ente}. ` : ""}Gostaria de receber orientação para escolher data e horário.`,
  )}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-[#f7f2ea] to-[#f4eee4] text-[#181126] antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-white shadow-2xl border-x border-[#ece4f4]">
        <header className="relative overflow-hidden bg-gradient-to-b from-[#240e3d] via-[#1a072d] to-[#120320] px-6 pt-10 pb-9 text-center">
          <Halos />
          <div className="relative z-10 flex flex-col items-center">
            <Stars />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5d285]/40 bg-[#f5d285]/15 px-4 py-1 text-[10.5px] font-extrabold tracking-[0.22em] text-[#f5d285] uppercase shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5d285] animate-ping" />✨ Convite
              exclusivo
            </span>
            <figure className="relative mt-5 w-full overflow-hidden rounded-3xl border-2 border-[#f5d285]/65 bg-[#120320] p-1.5 shadow-[0_22px_52px_rgba(0,0,0,0.46)]">
              <img
                src={milenaLiveCallImage}
                alt="Milena Medeiros durante uma chamada de video ao vivo"
                className="aspect-[4/3] w-full rounded-[18px] object-cover object-center"
              />
              <figcaption className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-[#160728]/85 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-md">
                Atendimento por videochamada
              </figcaption>
            </figure>
            <div className="mt-4 w-full overflow-hidden rounded-2xl border border-[#f5d285]/30 bg-white/[0.08] p-3.5 text-left shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f5d285]/45 bg-[#f5d285]/15 text-lg shadow-inner">
                  🎙️
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#f5d285]">
                    Mensagem da Milena
                  </span>
                  <span className="mt-0.5 block text-[12px] font-semibold leading-snug text-white/85">
                    Entenda a chamada antes de decidir
                  </span>
                </div>
              </div>
              <div className={`mt-3 rounded-xl border bg-black/20 px-3 py-2.5 transition-all duration-300 ${isInvitationAudioPlaying ? "border-[#f5d285] shadow-[0_0_22px_rgba(245,210,133,0.38)] animate-pulse" : "border-white/10"}`}>
                <audio
                  controls
                  preload="none"
                  onPlay={() => setIsInvitationAudioPlaying(true)}
                  onPause={() => setIsInvitationAudioPlaying(false)}
                  onEnded={() => setIsInvitationAudioPlaying(false)}
                  aria-label="Áudio de Milena Medeiros explicando a chamada ao vivo"
                  className="w-full accent-[#f5d285]"
                >
                  <source src={milenaLiveCallAudio} type="audio/mpeg" />
                  Seu navegador não oferece suporte à reprodução deste áudio.
                </audio>
               </div>
               <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#f5d285]/35 bg-[#2d144d]/85 px-3 py-2.5 text-[#fff3cc] shadow-inner">
                 <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5d285] text-sm text-[#2d144d]">▶</span>
                 <p className="text-[12px] font-black leading-snug">Ouça o convite da Milena antes de escolher sua sessão.</p>
               </div>
            </div>
            <h1 className="font-display mt-4 text-[25px] leading-tight font-black text-white">
              Talvez tenha ficado coisa demais no coração para colocar em uma carta.
            </h1>
            <p className="mt-3.5 max-w-[340px] text-[13.5px] leading-relaxed text-white/80 font-light">
              {quizFirstName ? `${quizFirstName}, ` : ""}Milena gostaria de abrir para você a possibilidade de uma conversa particular por videochamada. Sua carta continua normalmente; esse atendimento é opcional.
            </p>
          </div>
        </header>

        {step === "offer" && (
          <main className="flex flex-1 flex-col animate-rise-in">
            <div className="px-6 pt-8 pb-4">
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[11.5px] font-bold leading-relaxed text-emerald-900">
                {source === "paid"
                  ? "Sua contribuição foi confirmada. Esta conversa é um espaço adicional e opcional para quem desejar acolhimento individual."
                  : "Sua carta continua normalmente. A conversa abaixo é opcional para quem deseja um espaço individual com a Milena."}
              </div>
              <div className="rounded-3xl border-2 border-[#d4af37]/40 bg-gradient-to-br from-[#fbf8ee] via-white to-[#f7f2e4] p-5 shadow-xl text-center space-y-4">
                <span className="text-4xl">🕯️</span>
                <h2 className="font-display text-xl font-black text-[#1a082c] leading-snug">
                  Um espaço só seu com a Milena
                </h2>
                <p className="text-xs text-[#6d5488] leading-relaxed">
                  {personalizedOffer} Você não precisa preparar nada: pode falar sobre sua história, sobre quem partiu, sobre a saudade, a carta e perguntas que ainda ficaram.
                </p>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <div className="flex items-start gap-3 rounded-xl bg-white/90 border border-[#d4af37]/30 p-3 shadow-2xs">
                    <span className="text-lg shrink-0">📹</span>
                    <div className="text-left">
                      <span className="block text-xs font-black text-[#1a082c]">
                        Ao vivo e particular
                      </span>
                      <span className="block text-[11px] text-[#6d5488]">
                        A conversa acontece diretamente com Milena por videochamada.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-white/90 border border-[#d4af37]/30 p-3 shadow-2xs">
                    <span className="text-lg shrink-0">📄</span>
                    <div className="text-left">
                      <span className="block text-xs font-black text-[#1a082c]">
                        No seu tempo
                      </span>
                      <span className="block text-[11px] text-[#6d5488]">
                        Um espaço reservado para falar sem resumir sua história em mensagens.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-white/90 border border-[#d4af37]/30 p-3 shadow-2xs">
                    <span className="text-lg shrink-0">📅</span>
                    <div className="text-left">
                      <span className="block text-xs font-black text-[#1a082c]">
                        Com privacidade
                      </span>
                      <span className="block text-[11px] text-[#6d5488]">
                        Atendimento individual e confidencial.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d9c6a3] bg-white/85 px-4 py-3.5 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#b45309]">Atendimento escolhido</span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={selectedPackage.id}
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="mt-1 block text-[38px] font-black leading-none text-[#1a082c]"
                    >
                      R$ {(callAmountCents / 100).toFixed(2).replace(".", ",")}
                    </motion.span>
                  </AnimatePresence>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={`${selectedPackage.id}-label`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="mt-1 block text-[11.5px] font-bold leading-relaxed text-[#6d5488]"
                    >
                      {selectedPackage.heading}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="rounded-2xl border border-[#d4af37]/30 bg-white/90 p-3 text-left">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#786445]">Como você gostaria de ser acolhido?</span>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#6d5488]">Não existe uma opção certa. Escolha apenas o tipo de atendimento que fizer mais sentido para o seu momento.</p>
                  <div className="mt-2 grid gap-2">
                    {LIVE_CALL_PACKAGES.map((item) => {
                      const isSelected = selectedPackageId === item.id;
                      const isRecommended = item.amountCents === 10000;
                      return (
                      <button key={item.id} type="button" onClick={() => setSelectedPackageId(item.id)} className={`relative rounded-2xl border-2 p-3.5 text-left transition-all duration-300 ${isSelected && isRecommended ? "z-10 scale-[1.065] border-[#c49a52] bg-[#fff9eb] ring-4 ring-[#c49a52]/20 shadow-[0_22px_38px_-20px_rgba(196,154,82,0.82)]" : isSelected ? "z-10 scale-[1.035] border-[#5d4786] bg-[#f6f0fc] ring-4 ring-[#5d4786]/15 shadow-[0_18px_32px_-20px_rgba(45,20,77,0.75)]" : "scale-100 border-[#e5daf0] bg-white hover:border-[#b9a8cf] hover:bg-[#fcfaff]"}`}>
                        <span className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
                          <strong className="text-[15.5px] font-black leading-snug text-[#1a082c]">{item.heading}</strong>
                          <span className={`shrink-0 text-right font-black ${isSelected && isRecommended ? "text-[21px] text-[#a66f14]" : isSelected ? "text-[18px] text-[#2d144d]" : "text-[15px] text-[#5d4786]"}`}>R$ {(item.amountCents / 100).toFixed(0)},00</span>
                          <span className="col-span-2 mt-1.5 text-[11px] leading-relaxed text-[#6d5488]">{item.description}</span>
                          <span className="col-span-2 mt-2 flex items-center justify-between gap-2">
                            <span className={`text-[9.5px] font-black uppercase tracking-wide ${isSelected ? "text-[#2d144d]" : "text-[#8a779f]"}`}>{isSelected ? "✓ Selecionado" : "Selecionar pacote"}</span>
                            {"popular" in item && item.popular && <span className="rounded-full bg-[#c49a52] px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm">Recomendado</span>}
                          </span>
                        </span>
                      </button>
                    )})}
                  </div>
                  <div className="mt-3 rounded-xl border border-[#e3dbea] bg-[#f5f1f8] px-3 py-3 text-left">
                    <strong className="text-[12px] text-[#2d144d]">{selectedPackage.title}</strong>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#514763]">{selectedPackage.description}</p>
                    <ul className="mt-2 space-y-1 text-[10.5px] leading-relaxed text-[#514763]">
                      {selectedPackage.includes.map((item) => <li key={item} className="flex gap-1.5"><span className="text-[#39776c]">•</span><span>{item}</span></li>)}
                    </ul>
                  </div>
                  <section className="mt-4 rounded-2xl border border-[#e5daf0] bg-white p-4 text-left shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[9.5px] font-black uppercase tracking-[0.12em] text-[#5d4786]">Relatos compartilhados</span>
                        <h3 className="mt-1 text-[14px] font-black text-[#1a082c]">Famílias que receberam acolhimento</h3>
                      </div>
                      <span className="rounded-full bg-[#f2eef8] px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wide text-[#5d4786]">Privacidade</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[feedbackOne, feedbackTwo].map((feedback, index) => (
                        <figure key={feedback} className="overflow-hidden rounded-xl border border-[#e5daf0] bg-[#fbf9fd]">
                          <img src={feedback} alt={`Relato compartilhado por uma família acolhida ${index + 1}`} loading="lazy" decoding="async" className="block h-auto w-full object-contain" />
                        </figure>
                      ))}
                    </div>
                    <p className="mt-3 text-[10.5px] leading-relaxed text-[#6d5488]">Relatos recebidos após atendimentos individuais. Cada experiência é pessoal e não representa promessa de resultado.</p>
                  </section>
                </div>
              </div>
            </div>

            <div className="mt-auto px-6 pb-8 pt-4">
              <button
                type="button"
                onClick={() => {
                  setStep("scheduling");
                  handleInitiateCheckout();
                }}
                className="group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-[#57a698] via-[#39776c] to-[#285e56] px-6 py-4 text-sm font-black text-white uppercase tracking-wider shadow-[0_16px_30px_-14px_rgba(40,94,86,0.8)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_-14px_rgba(40,94,86,0.9)] active:translate-y-0"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                <span className="relative flex items-center justify-center gap-2">Continuar e escolher horário <span className="rounded-full bg-white/18 px-2.5 py-1 text-[13px] tracking-normal">R$ {(callAmountCents / 100).toFixed(2).replace(".", ",")}</span></span>
              </button>
              <a href={whatsappCheckoutUrl} target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8caea] bg-white px-4 py-3 text-xs font-bold text-[#5d4786] transition-colors hover:bg-[#f6f0fc]">
                Prefiro finalizar pelo WhatsApp
              </a>
              <button
                type="button"
                onClick={continueFlow}
                className="mt-3 w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-xs font-bold text-[#6d5488] underline decoration-[#d4af37] underline-offset-4 hover:text-[#2d144d]"
              >
                Agora não, quero continuar com minha carta ›
              </button>
            </div>
          </main>
        )}

        {step === "contract" && (
          <main className="flex flex-1 flex-col animate-rise-in">
            <div className="px-6 pt-8 pb-4">
              <h2 className="font-display text-[22px] leading-[1.25] font-extrabold text-[#181126]">
                Contrato Digital
              </h2>
              <p className="mt-2 text-xs text-[#5e4b73] leading-relaxed">
                Leia os termos, informe seu nome completo como assinatura e aceite para prosseguir.
              </p>

              <div className="mt-4 max-h-[300px] overflow-y-auto rounded-2xl border border-[#e5daf0] bg-[#fbf9f5] p-4">
                <pre className="text-[11px] leading-relaxed text-[#5e4b73] whitespace-pre-wrap font-sans">
                  {CONTRACT_TEXT.replace("{{PACKAGE}}", selectedPackage.title).replace("{{AMOUNT}}", `R$ ${(callAmountCents / 100).toFixed(2).replace(".", ",")}`)}
                </pre>
              </div>

              <label
                htmlFor="contract-signer"
                className="mt-4 block text-xs font-bold text-[#2d144d]"
              >
                Assinatura digital (nome completo)
              </label>
              <input
                id="contract-signer"
                type="text"
                autoComplete="name"
                value={contractSigner}
                onChange={(event) => setContractSigner(event.target.value)}
                placeholder="Digite seu nome completo"
                className="mt-1.5 w-full rounded-2xl border-2 border-[#d8caea] bg-white px-4 py-3 text-sm text-[#181126] outline-none transition-colors placeholder:text-[#9583a6] focus:border-[#2d144d]"
              />

              <label className="mt-4 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[#e5daf0] text-[#2d144d] focus:ring-[#f59e0b]"
                />
                <span className="text-xs text-[#5e4b73] leading-relaxed">
                  Li e aceito os termos do contrato de chamada ao vivo com a medium Milena Medeiros.
                </span>
              </label>
            </div>

            <div className="mt-auto px-6 pb-8 pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setStep("offer")}
                className="flex-1 cursor-pointer rounded-2xl border-2 border-[#d8caea] bg-white px-5 py-3.5 text-xs font-bold text-[#2d144d] hover:bg-[#f6f0fc] transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={acceptContract}
                disabled={!contractAccepted || contractSigner.trim().length < 3}
                className="flex-1 cursor-pointer rounded-2xl bg-gradient-to-r from-[#2d144d] via-[#3d1868] to-[#1f0c36] px-6 py-3.5 text-sm font-black text-white uppercase tracking-wider shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99] transition-all"
              >
                Aceitar e Pagar
              </button>
            </div>
          </main>
        )}

        {step === "payment" && (
          <main className="flex flex-1 flex-col animate-rise-in">
            <div className="px-6 pt-8 pb-4">
              <h2 className="font-display text-[22px] leading-[1.25] font-extrabold text-[#181126]">
                Pagamento da Sessao
              </h2>
              <p className="mt-2 text-xs text-[#5e4b73] leading-relaxed">
                Escolha a forma de pagamento para confirmar sua solicitação de agendamento.
              </p>
              {isVerifyingCardPayment && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  Confirmando seu pagamento por cartão com a Stripe...
                </p>
              )}
              {cardPaymentError && (
                <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                  {cardPaymentError}
                </p>
              )}
            </div>

            <div className="px-6 pb-6 space-y-4">
              <PixCheckout
                productId="chamada_ao_vivo_milena"
                pixProductId="carta_sagrada"
                amountCents={callAmountCents}
                initialCustomerName={contractSigner}
                enteQuerido="Upsell Chamada Ao Vivo"
                grauParentesco="Produto adicional"
                successPath={returnPath}
                showCard
              />
            </div>
          </main>
        )}

        {step === "scheduling" && (
          <main className="flex flex-1 flex-col animate-rise-in">
            <div className="px-6 pt-8 pb-4">
              <h2 className="font-display text-[22px] leading-[1.25] font-extrabold text-[#181126]">
                Escolha o Horario da Chamada
              </h2>
              <p className="mt-2 text-xs text-[#5e4b73] leading-relaxed">
                Escolha sua preferência antes do pagamento. Todos os horários estão no fuso de São Paulo e serão confirmados pelo WhatsApp após a compra.
              </p>
            </div>

            <div className="px-6 pb-6">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setPeriodPreference("day"); setSelectedSlot(""); }} className={`rounded-2xl border-2 p-3 text-left ${periodPreference === "day" ? "border-[#2d144d] bg-[#f6f0fc]" : "border-[#e5daf0] bg-white"}`}>
                  <span className="text-lg">☀️</span><span className="mt-1 block text-xs font-black text-[#181126]">De dia</span><span className="block text-[10px] text-[#6d5488]">Manhã e tarde</span>
                </button>
                <button type="button" onClick={() => { setPeriodPreference("night"); setSelectedSlot(""); }} className={`rounded-2xl border-2 p-3 text-left ${periodPreference === "night" ? "border-[#2d144d] bg-[#f6f0fc]" : "border-[#e5daf0] bg-white"}`}>
                  <span className="text-lg">🌙</span><span className="mt-1 block text-xs font-black text-[#181126]">À noite</span><span className="block text-[10px] text-[#6d5488]">Fim de tarde e noite</span>
                </button>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {availableDates.map(([dateKey, date]) => {
                  const label = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "short" }).format(date);
                  return <button key={dateKey} type="button" onClick={() => { setSelectedDateKey(dateKey); setSelectedSlot(""); }} className={`shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold capitalize ${activeDateKey === dateKey ? "border-[#2d144d] bg-[#2d144d] text-white" : "border-[#e5daf0] bg-white text-[#514763]"}`}>{label}</button>;
                })}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {visibleTimeSlots.map((slot) => {
                  const date = new Date(slot);
                  const timeLabel = new Intl.DateTimeFormat("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(date);
                  const dayLabel = new Intl.DateTimeFormat("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                  }).format(date);

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-2xl text-center transition-all duration-200 cursor-pointer ${
                        selectedSlot === slot
                          ? "border-2 border-[#2d144d] bg-[#2d144d] text-white shadow-lg"
                          : "border border-[#e5daf0] bg-white text-[#1f1035] hover:border-[#2d144d]"
                      }`}
                    >
                      <span className="block text-[15px] font-black">{timeLabel}</span>
                      <span className="mt-0.5 block text-[9px] font-bold opacity-70">
                        {dayLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSlot && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[12px] font-bold text-emerald-800">
                    Preferência selecionada: <strong>{selectedDate}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-auto px-6 pb-8 pt-4">
              <button
                type="button"
                onClick={handleConfirmScheduling}
                disabled={!selectedSlot}
                className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-black text-white uppercase tracking-wider shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99] transition-all"
              >
                 Revisar contrato
              </button>
            </div>
          </main>
        )}

        {step === "confirmed" && (
          <main className="flex flex-1 flex-col animate-rise-in">
            <div className="px-6 pt-10 pb-8 text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg border-2 border-emerald-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-black text-[#181126]">
                Horário Pré-selecionado!
              </h2>
              <p className="text-sm text-[#5e4b73] max-w-sm mx-auto leading-relaxed">
                 Você indicou <strong>{selectedDate}</strong> como preferência para a chamada ao vivo com a médium
                 Milena Medeiros. Envie a confirmação no WhatsApp para validar a disponibilidade e receber o link de acesso.
              </p>

              <div className="pt-4 space-y-3">
                <div className="p-4 rounded-2xl bg-[#fbf9f5] border border-[#e5daf0] text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#786445] block mb-1">
                    Resumo do Pedido
                  </span>
                  <div className="flex justify-between text-xs font-bold text-[#181126]">
                     <span>{selectedPackage.title}</span>
                     <span>R$ {(callAmountCents / 100).toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#181126] mt-1">
                    <span>Horario</span>
                    <span className="max-w-[210px] text-right">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#181126] mt-1">
                    <span>Status</span>
                    <span className="text-amber-700">Aguardando confirmação</span>
                  </div>
                </div>
                <a
                  href={whatsappConfirmationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-700"
                >
                  Confirmar horário no WhatsApp
                </a>
                <button
                  type="button"
                  onClick={continueFlow}
                  className="w-full cursor-pointer rounded-xl border border-[#d8caea] bg-white px-4 py-3 text-xs font-bold text-[#2d144d] hover:bg-[#f6f0fc]"
                >
                  Continuar para minha carta ›
                </button>
              </div>
            </div>
          </main>
        )}

        <Footer />
      </div>
    </div>
  );
}

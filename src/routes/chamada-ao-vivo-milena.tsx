import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Footer, Halos, Stars } from "@/components/funnel/Shell";
import { PixCheckout } from "@/components/funnel/PixCheckout";
import { trackPurchaseComplete } from "@/lib/metaPixel";
import { recordInput } from "@/lib/auto-capture";
import milenaLiveCallImage from "../../images-elements/medium-milena-BduzfpAk.webp_202609071752.jpeg";

export const Route = createFileRoute("/chamada-ao-vivo-milena")({
  head: () => ({
    meta: [
      { title: "Chamada Ao Vivo com Milena Medeiros | Templo de Luz" },
      {
        name: "description",
        content:
          "Agende uma chamada de video ao vivo com a medium Milena Medeiros. Contrato digital, horario a partir de 2 horas e atendimento exclusivo.",
      },
    ],
  }),
  component: ChamadaAoVivoMilenaPage,
});

type Step = "offer" | "contract" | "payment" | "scheduling" | "confirmed";

const CONTRACT_TEXT = `CONTRATO DE CHAMADA AO VIVO — TEMPLO DE LUZ

1. DO OBJETO
O presente contrato regula a prestacao de servico de chamada de video ao vivo com a medium Milena Medeiros, exclusivamente para acolhimento espiritual e orientacao fraterna.

2. DAS RESPONSABILIDADES
A medium Milena Medeiros atuara como intermediaria espiritual, transmitindo mensagens e orientacoes provenientes do plano espiritual. O servico nao substitui acompanhamento medico, psicologico ou juridico profissional.

3. DO AGENDAMENTO
A chamada podera ser agendada a partir de 2 horas apos a confirmacao do pagamento, conforme disponibilidade. O participante recebera um link de acesso por WhatsApp ou e-mail.

4. DO PAGAMENTO
O valor da sessao e de R$ 150,00, pago antecipadamente via PIX ou cartao de credito. O pagamento confirma a reserva do horario.

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
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [nextPath, setNextPath] = useState("/escrever-carta");
  const [source, setSource] = useState("skipped");

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
    } catch {
      // Mantém o campo vazio se o armazenamento estiver indisponível ou corrompido.
    }

    const stripeSuccess = urlParams.get("method") === "card" && urlParams.has("session_id");
    const pixSuccess = urlParams.get("method") === "pix" && urlParams.has("orderId");

    if (stripeSuccess || pixSuccess) {
      const sid = urlParams.get("session_id") || urlParams.get("orderId") || "";
      setStep("scheduling");

      if (stripeSuccess) {
        const storageKey = `templodeluz:chamada-card-pixel:${sid}`;
        if (!sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, "true");
          trackPurchaseComplete({
            amountCents: 15000,
            productName: "Chamada Ao Vivo com Milena",
            productId: "chamada_ao_vivo_milena",
            paymentMethod: "cartao",
            orderId: sid || `stripe_chamada_${Date.now()}`,
          });
        }
      }
    }
  }, []);

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    const minimumTime = Date.now() + 2 * 60 * 60 * 1000;
    const halfHour = 30 * 60 * 1000;
    const firstSlot = Math.ceil(minimumTime / halfHour) * halfHour;

    for (let i = 0; i < 12; i++) {
      slots.push(new Date(firstSlot + i * halfHour).toISOString());
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

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
    setStep("confirmed");
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
  const whatsappConfirmationUrl = `https://api.whatsapp.com/send?phone=5519998316353&text=${encodeURIComponent(
    `Olá, sou ${contractSigner}. Acabei de contratar a Chamada Ao Vivo e escolhi ${selectedDate} (horário de São Paulo). Gostaria de confirmar meu agendamento.`,
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
            <figure className="relative mt-5 w-full overflow-hidden rounded-2xl border border-[#f5d285]/55 bg-[#120320] p-1 shadow-[0_18px_45px_rgba(0,0,0,0.38)]">
              <img
                src={milenaLiveCallImage}
                alt="Milena Medeiros durante uma chamada de video ao vivo"
                className="aspect-[16/10] w-full rounded-[13px] object-cover object-center"
              />
              <figcaption className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-[#160728]/85 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-md">
                Atendimento por videochamada
              </figcaption>
            </figure>
            <h1 className="font-display mt-3 text-[25px] leading-tight font-black text-white">
              Chamada Ao Vivo com Milena
            </h1>
            <p className="mt-3.5 max-w-[340px] text-[13.5px] leading-relaxed text-white/80 font-light">
              Antes de continuar sua carta, você pode reservar uma conversa particular com a médium
              Milena Medeiros.
            </p>
          </div>
        </header>

        {step === "offer" && (
          <main className="flex flex-1 flex-col animate-rise-in">
            <div className="px-6 pt-8 pb-4">
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[11.5px] font-bold leading-relaxed text-emerald-900">
                {source === "paid"
                  ? "Sua contribuição foi confirmada. Esta é uma oportunidade adicional e opcional antes de continuar."
                  : "Você pode continuar sua carta normalmente. Antes disso, esta oportunidade opcional foi separada para você."}
              </div>
              <div className="rounded-3xl border-2 border-[#d4af37]/40 bg-gradient-to-br from-[#fbf8ee] via-white to-[#f7f2e4] p-5 shadow-xl text-center space-y-4">
                <span className="text-4xl">🕯️</span>
                <h2 className="font-display text-xl font-black text-[#1a082c] leading-snug">
                  Chamada Individual com Milena
                </h2>
                <p className="text-xs text-[#6d5488] leading-relaxed">
                  Converse ao vivo com Milena Medeiros, receba orientacao espiritual personalizada e
                  conecte-se com o seu ente querido em um atendimento sigiloso e acolhedor.
                </p>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <div className="flex items-start gap-3 rounded-xl bg-white/90 border border-[#d4af37]/30 p-3 shadow-2xs">
                    <span className="text-lg shrink-0">📹</span>
                    <div className="text-left">
                      <span className="block text-xs font-black text-[#1a082c]">
                        Videochamada Exclusiva
                      </span>
                      <span className="block text-[11px] text-[#6d5488]">
                        Atendimento ao vivo, particular e acolhedor
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-white/90 border border-[#d4af37]/30 p-3 shadow-2xs">
                    <span className="text-lg shrink-0">📄</span>
                    <div className="text-left">
                      <span className="block text-xs font-black text-[#1a082c]">
                        Contrato Digital
                      </span>
                      <span className="block text-[11px] text-[#6d5488]">
                        Termo de confidencialidade e agendamento
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-white/90 border border-[#d4af37]/30 p-3 shadow-2xs">
                    <span className="text-lg shrink-0">📅</span>
                    <div className="text-left">
                      <span className="block text-xs font-black text-[#1a082c]">
                        Horário com Antecedência
                      </span>
                      <span className="block text-[11px] text-[#6d5488]">
                        Escolha um horário disponível a partir de 2 horas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <span className="text-3xl font-black text-[#1a082c]">R$ 150,00</span>
                  <span className="block text-[10px] font-bold text-[#6d5488] mt-1">
                    Pagamento unico · Sessao completa
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto px-6 pb-8 pt-4">
              <button
                type="button"
                onClick={() => {
                  setStep("contract");
                  handleInitiateCheckout();
                }}
                className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#2d144d] via-[#3d1868] to-[#1f0c36] px-6 py-4 text-sm font-black text-white uppercase tracking-wider shadow-lg shadow-[#2d144d]/25 hover:brightness-110 active:scale-[0.99] transition-all"
              >
                Quero reservar minha chamada
              </button>
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
                  {CONTRACT_TEXT}
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
                Escolha a forma de pagamento para confirmar sua reserva.
              </p>
            </div>

            <div className="px-6 pb-6 space-y-4">
              <PixCheckout
                productId="chamada_ao_vivo_milena"
                amountCents={15000}
                initialCustomerName={contractSigner}
                successPath={returnPath}
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
                Selecione um horario disponivel a partir de 2 horas apos o pagamento. Todos os
                horarios estao no fuso de Sao Paulo.
              </p>
            </div>

            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => {
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
                    Horário selecionado: <strong>{selectedDate}</strong>
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
                Confirmar Agendamento
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
                Horário Selecionado!
              </h2>
              <p className="text-sm text-[#5e4b73] max-w-sm mx-auto leading-relaxed">
                Sua chamada ao vivo com a médium Milena Medeiros foi reservada para{" "}
                <strong>{selectedDate}</strong>. Envie a confirmação no WhatsApp para receber o link
                de acesso.
              </p>

              <div className="pt-4 space-y-3">
                <div className="p-4 rounded-2xl bg-[#fbf9f5] border border-[#e5daf0] text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#786445] block mb-1">
                    Resumo do Pedido
                  </span>
                  <div className="flex justify-between text-xs font-bold text-[#181126]">
                    <span>Chamada Ao Vivo</span>
                    <span>R$ 150,00</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#181126] mt-1">
                    <span>Horario</span>
                    <span className="max-w-[210px] text-right">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#181126] mt-1">
                    <span>Status</span>
                    <span className="text-emerald-600">Confirmado</span>
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

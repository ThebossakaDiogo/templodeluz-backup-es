import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Halos, Reveal, Stars } from "@/components/funnel/Shell";
import {
  CheckCircle2,
  Sparkles,
  Flame,
  Video,
  ArrowRight,
  ShieldCheck,
  Scroll,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Doação Confirmada · Gratidão | Templo de Luz" },
      {
        name: "description",
        content:
          "Sua contribuição foi confirmada com sucesso. Entenda como funciona sua Carta Sagrada e envie suas intenções para a médium Milena Medeiros.",
      },
    ],
  }),
  component: ObrigadoPage,
});

function parseCurrency(val: string | null | undefined): string {
  if (!val) return "R$ 35,00";
  const num = Number.parseFloat(val.replace(/[^\d.,]/g, "").replace(",", "."));
  if (Number.isNaN(num) || num <= 0) return "R$ 35,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

function generateSecureOrderCode(): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return `TL-${100000 + (array[0] % 900000)}`;
  }
  return `TL-${Date.now().toString().slice(-6)}`;
}

function triggerCelebrationConfetti() {
  try {
    const count = 150;
    const defaults = {
      origin: { y: 0.45 },
      colors: ["#ffd700", "#f59e0b", "#fbbf24", "#ffffff", "#d4af37", "#fef3c7"],
    };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    fire(0.25, { spread: 30, startVelocity: 60 });
    fire(0.2, { spread: 70 });
    fire(0.35, { spread: 110, decay: 0.91, scalar: 0.9 });
    fire(0.1, { spread: 130, startVelocity: 30, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 130, startVelocity: 50 });
  } catch {
    // ignore
  }
}

function resolveDeliveryEstimate(): string {
  try {
    const stored =
      sessionStorage.getItem("templodeluz_horario_entrega") ||
      localStorage.getItem("templodeluz_horario_entrega");
    if (stored && stored.trim().length >= 4) {
      return stored.trim();
    }
  } catch {
    // ignore
  }

  const d = new Date();
  d.setMinutes(d.getMinutes() + 75);
  const rem = d.getMinutes() % 5;
  if (rem !== 0) d.setMinutes(d.getMinutes() + (5 - rem));
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function extractNameFromLogs(): string {
  try {
    const logs = localStorage.getItem("play_and_win_captured_logs");
    if (logs) {
      const parsed = JSON.parse(logs);
      const nameEvent = parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "nome_consulente" || e.field === "lead_name") && e.value,
      );
      return nameEvent?.value || "";
    }
  } catch {
    // ignore
  }
  return "";
}

interface ResolvedObrigadoData {
  userName: string;
  enteName: string;
  donationAmount: string;
  orderId: string;
  deliveryTime: string;
}

function resolveObrigadoState(): ResolvedObrigadoData {
  if (typeof window === "undefined") {
    return {
      userName: "Consulente",
      enteName: "seu ente querido",
      donationAmount: "R$ 35,00",
      orderId: generateSecureOrderCode(),
      deliveryTime: "em breve",
    };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const paramName = urlParams.get("name") || urlParams.get("cliente");
  const paramEnte = urlParams.get("ente") || urlParams.get("ente_querido");
  const paramAmount = urlParams.get("amount") || urlParams.get("valor");
  const paramOrderId =
    urlParams.get("orderId") || urlParams.get("order_id") || urlParams.get("session_id");

  let resolvedName = paramName || "";
  let resolvedEnte = paramEnte || "";
  let resolvedAmount = paramAmount || "";

  try {
    const quizStateRaw = localStorage.getItem("templodeluz_quiz_state");
    if (quizStateRaw) {
      const quiz = JSON.parse(quizStateRaw);
      if (!resolvedName && quiz.nome) resolvedName = quiz.nome;
      if (!resolvedEnte && quiz.ente) resolvedEnte = quiz.ente;
    }

    if (!resolvedName) resolvedName = localStorage.getItem("templodeluz_lead_name") || "";
    if (!resolvedEnte) resolvedEnte = localStorage.getItem("templodeluz_ente_querido") || "";
    if (!resolvedAmount) resolvedAmount = localStorage.getItem("templodeluz_last_donation_amount") || "";
    if (!resolvedName) resolvedName = extractNameFromLogs();
  } catch {
    // ignore
  }

  return {
    userName: resolvedName ? resolvedName.trim().split(" ")[0] || resolvedName : "Consulente",
    enteName: resolvedEnte ? resolvedEnte.trim().split(" ")[0] || resolvedEnte : "seu ente querido",
    donationAmount: resolvedAmount ? parseCurrency(resolvedAmount) : "R$ 35,00",
    orderId: paramOrderId ? paramOrderId.slice(0, 10) : generateSecureOrderCode(),
    deliveryTime: resolveDeliveryEstimate(),
  };
}

function ObrigadoPage() {
  const [data, setData] = useState<ResolvedObrigadoData>(() => resolveObrigadoState());

  useEffect(() => {
    triggerCelebrationConfetti();
    setData(resolveObrigadoState());
  }, []);

  const { userName, enteName, donationAmount, orderId, deliveryTime } = data;

  return (
    <div className="min-h-screen bg-[#f7f4fa] text-[#1c0d2d] antialiased selection:bg-[#f5d285] selection:text-[#160829]">
      <div className="mx-auto flex min-h-screen w-full max-w-[500px] flex-col bg-white shadow-2xl border-x border-[#ece5f4] pb-24">
        {/* Header Nobre de Agradecimento & Confirmação */}
        <header className="relative overflow-hidden bg-gradient-to-b from-[#240e3d] via-[#1a072d] to-[#120320] px-6 pt-10 pb-8 text-center text-white">
          <Halos />
          <div className="relative z-10 flex flex-col items-center">
            <Stars />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5d285]/40 bg-[#f5d285]/15 px-4 py-1 text-[10.5px] font-black tracking-[0.22em] text-[#f5d285] uppercase shadow-md">
              <Sparkles size={13} className="text-[#f5d285] animate-pulse" />
              <span>Contribuição Confirmada no Altar</span>
            </span>

            <div className="mt-4 text-[48px] animate-float-soft">🕊️</div>

            <h1 className="font-display mt-2 text-[26px] leading-tight font-black text-white sm:text-[28px]">
              Gratidão imensa, <span className="text-[#f8dd9f]">{userName}</span>!
            </h1>

            <p className="mt-3 max-w-[380px] text-[13.5px] leading-relaxed text-white/85 font-light">
              Sua doação sagrada de <strong className="font-extrabold text-[#f8dd9f] bg-white/10 px-2 py-0.5 rounded-md border border-white/15">{donationAmount}</strong> foi recebida com sucesso e consagrada no oratório do Templo de Luz.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Horário reservado com Milena: <strong>Hoje às {deliveryTime}</strong> para acolher <strong>{enteName}</strong></span>
            </div>
          </div>
        </header>

        {/* Faixa de Status da Jornada */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-500/20 px-5 py-3 text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span>Doação aprovada · Agora dê o direcionamento da sua intenção</span>
        </div>

        <main className="px-5 pt-6 space-y-6">
          {/* Recibo Rápido de Doação */}
          <div className="rounded-2xl border border-[#e8ddf2] bg-[#fbf9fe] p-4 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-[#ebdff5] pb-2.5">
              <span className="font-bold text-[#5c3a82] flex items-center gap-1.5">
                <Flame size={14} className="text-amber-500" />
                Recibo de Oração & Insumos
              </span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10.5px]">
                Pago via PIX/Doação
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11.5px] text-[#4d2874]">
              <div>
                <span className="text-[#87729f] block text-[10.5px]">Consulente:</span>
                <strong>{userName}</strong>
              </div>
              <div>
                <span className="text-[#87729f] block text-[10.5px]">Ente Homenageado:</span>
                <strong>{enteName}</strong>
              </div>
              <div>
                <span className="text-[#87729f] block text-[10.5px]">Valor Consagrado:</span>
                <strong className="text-emerald-700 text-sm font-black">{donationAmount}</strong>
              </div>
              <div>
                <span className="text-[#87729f] block text-[10.5px]">Código do Pedido:</span>
                <span className="font-mono text-[10.5px] text-stone-600">
                  {orderId.slice(0, 10)}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#ebdff5] flex items-center justify-between">
                <span className="text-[#87729f] text-[10.5px]">Previsão de Entrega da Carta:</span>
                <strong className="text-amber-800 text-[11.5px] font-black bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300/60">
                  Hoje às {deliveryTime}
                </strong>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SEÇÃO CRÍTICA ANTI-CONFUSÃO: QUEM ESCREVE A CARTA?
          ══════════════════════════════════════════════════════════════════ */}
          <Reveal className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-[#fffdfa] via-[#fffbf3] to-[#fef8ec] p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-200/80 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800">
                <HelpCircle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Importante saber antes de avançar
                </span>
                <h2 className="font-display text-base font-black text-[#2e1747] leading-tight">
                  Como funciona a escrita da sua Carta Sagrada?
                </h2>
              </div>
            </div>

            {/* Ponto 1: Quem Escreve é a Médium */}
            <div className="rounded-2xl border border-purple-200/80 bg-white/90 p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-[#3c1468]">
                <span className="text-lg">✍️</span>
                <h3 className="text-xs font-black uppercase tracking-wide text-[#3c1468]">
                  1. Quem escreve a carta é a Médium Milena Medeiros!
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[#553b72]">
                <strong>Você NÃO precisa redigir o texto espiritual.</strong> Fique com o coração sereno: a médium Milena se recolherá em oração profunda no altar com a vela sagrada, entrará em conexão com o plano espiritual e <strong>psicografará a mensagem à mão</strong> trazendo as palavras de paz de <strong>{enteName}</strong> para você.
              </p>
            </div>

            {/* Ponto 2: O que o consulente faz agora */}
            <div className="rounded-2xl border border-emerald-200/80 bg-white/90 p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-900">
                <span className="text-lg">💌</span>
                <h3 className="text-xs font-black uppercase tracking-wide text-emerald-900">
                  2. O que você vai fazer na próxima página?
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[#405b4b]">
                <strong>Você apenas enviará suas intenções e perguntas para orientar a médium!</strong> Na próxima tela, você deixará seu desabafo e citará o que gostaria de pedir a Milena que sonde durante a sessão (ex: saber como {enteName} está na luz, pedir um conselho ou mandar um abraço do coração). Milena lerá seus pedidos antes de abrir os trabalhos.
              </p>
            </div>

            {/* BOTÃO PRINCIPAL: PROSSEGUIR PARA ENVIAR AS INTENÇÕES */}
            <div className="pt-2">
              <Link
                to="/escrever-carta"
                className="group flex w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 p-4 text-center text-white shadow-xl shadow-emerald-700/25 transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
              >
                <span className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wide">
                  <span>✍️ Enviar Minhas Intenções para a Médium Milena</span>
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1 text-[11px] font-medium text-emerald-100">
                  Clique aqui para citar o que você deseja pedir que Milena pergunte a {enteName}
                </span>
              </Link>
            </div>
          </Reveal>

          {/* ══════════════════════════════════════════════════════════════════
              CARD DE UPSELL: GANCHO PARA CHAMADA AO VIVO COM A MÉDIUM
          ══════════════════════════════════════════════════════════════════ */}
          <Reveal delay={60} className="rounded-3xl border-2 border-[#b89fe0]/40 bg-gradient-to-br from-[#fbf8ff] via-[#f7f2fc] to-[#f2e9fa] p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#521b8b]/10 border border-[#521b8b]/20 px-3 py-0.5 text-[10px] font-black text-[#521b8b] uppercase tracking-wider">
                <Sparkles size={12} className="text-[#8435d8]" />
                Oportunidade Especial para Consulentes
              </span>
              <span className="text-[11px] font-bold text-purple-900 bg-purple-200/50 px-2 py-0.5 rounded-md">
                30 a 60 min
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3b1268] to-[#6a25b3] text-white shadow-md">
                <Video size={20} />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-[#260a45] leading-snug">
                  Deseja conversar pessoalmente com Milena por Vídeo?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#5f4480]">
                  Além da Carta Sagrada psicografada, você tem a oportunidade de realizar uma <strong>Chamada de Vídeo Individual e particular</strong> com a Médium Milena Medeiros para ter um momento exclusivo de acolhimento, oração e escuta fraterna em tempo real.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-purple-200/60 bg-white/80 p-3 text-[11px] text-[#4d2d75] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Conversa direta pelo WhatsApp ou Google Meet</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Espaço reservado para tirar dúvidas do coração</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Vagas limitadas por ordem de acolhimento</span>
              </div>
            </div>

            {/* BOTÃO DO UPSELL */}
            <Link
              to="/chamada-ao-vivo-milena"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#391264] via-[#4d1985] to-[#5e1f9e] p-3.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-md transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
            >
              <span>📹 Conhecer Opções da Chamada Ao Vivo com Milena</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          {/* Linha do Tempo: O que acontece a partir de agora */}
          <Reveal delay={100} className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#3c1766] flex items-center gap-1.5">
              <Scroll size={14} className="text-amber-600" />
              <span>Cronograma do seu Atendimento Fraterno:</span>
            </h3>

            <div className="space-y-2.5">
              {/* Etapa 1 */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#ece5f4] shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
                  1
                </div>
                <div>
                  <strong className="block text-xs font-bold text-[#1a082c]">
                    Você envia suas intenções e pedidos
                  </strong>
                  <span className="text-[11.5px] text-[#6d5488] leading-relaxed block mt-0.5">
                    Na próxima página, você conta o que deseja que a médium pergunte a {enteName} e deixa seu desabafo.
                  </span>
                </div>
              </div>

              {/* Etapa 2 */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#ece5f4] shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-900 text-xs font-black border border-purple-200">
                  2
                </div>
                <div>
                  <strong className="block text-xs font-bold text-[#1a082c]">
                    Milena psicografa a mensagem no altar
                  </strong>
                  <span className="text-[11.5px] text-[#6d5488] leading-relaxed block mt-0.5">
                    A médium se recolhe em oração com a vela consagrada e escreve a carta à mão com as mensagens recebidas.
                  </span>
                </div>
              </div>

              {/* Etapa 3 */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#ece5f4] shadow-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 text-xs font-black border border-amber-200">
                  3
                </div>
                <div>
                  <strong className="block text-xs font-bold text-[#1a082c]">
                    Envio da carta original no seu WhatsApp
                  </strong>
                  <span className="text-[11.5px] text-[#6d5488] leading-relaxed block mt-0.5">
                    Você recebe em até 24h as fotos nítidas do pergaminho manuscrito e uma mensagem de acolhimento.
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Garantia de Sigilo & Apoio Fraterno */}
          <div className="rounded-2xl border border-stone-200 bg-[#faf8fc] p-4 text-center text-xs text-[#5e447b] space-y-1.5">
            <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck size={16} />
              <span>Sigilo Espiritual e Proteção Total</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#72598e]">
              Suas intenções, orações e dados são tratados sob absoluto segredo de acolhimento pelo Templo de Luz da médium Milena Medeiros.
            </p>
          </div>

          {/* Link alternativo direto para a carta */}
          <div className="pt-1 text-center">
            <Link
              to="/escrever-carta"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3c1766] underline decoration-[#d4af37] decoration-2 underline-offset-4 hover:text-[#1a082c]"
            >
              <span>Ir agora para a página de envio de intenções</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

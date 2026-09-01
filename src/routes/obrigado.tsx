import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Halos, Reveal, Stars, Card } from "@/components/funnel/Shell";
import { IMAGES } from "@/components/funnel/data";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Doação Confirmada · Obrigado | Templo de Luz" },
      {
        name: "description",
        content:
          "Sua contribuição foi confirmada. Agora dê o próximo passo e escreva sua mensagem na Carta Sagrada para a médium Milena Medeiros.",
      },
    ],
  }),
  component: ObrigadoPage,
});

function ObrigadoPage() {
  const [userName, setUserName] = useState("Consulente");

  useEffect(() => {
    // Efeito de confetes dourados sagrados ao carregar
    try {
      const count = 150;
      const defaults = {
        origin: { y: 0.5 },
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

    if (typeof window !== "undefined") {
      const logs = localStorage.getItem("play_and_win_captured_logs");
      if (logs) {
        try {
          const parsed = JSON.parse(logs);
          const nameEvent = parsed.find(
            (e: { field: string; value: string }) =>
              (e.field === "nome_consulente" || e.field === "lead_name") && e.value,
          );
          if (nameEvent && nameEvent.value) {
            setUserName(nameEvent.value.split(" ")[0]);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f6fc] text-foreground antialiased selection:bg-[#f5d285] selection:text-[#160829]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-white shadow-2xl border-x border-[#ece5f4] pb-24">
        {/* Header de Confirmação */}
        <header className="relative overflow-hidden bg-gradient-to-b from-[#240e3d] via-[#1a072d] to-[#120320] px-6 pt-10 pb-9 text-center">
          <Halos />
          <div className="relative z-10 flex flex-col items-center">
            <Stars />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5d285]/40 bg-[#f5d285]/15 px-4 py-1 text-[10.5px] font-extrabold tracking-[0.22em] text-[#f5d285] uppercase shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5d285] animate-ping" />✨ Contribuição
              Confirmada com Sucesso
            </span>
            <div className="animate-float-soft mt-5 text-[54px]">🕊️</div>
            <h1 className="font-display mt-3 text-[25px] leading-tight font-black text-white">
              Que a paz e a luz estejam com você, {userName}!
            </h1>
            <p className="mt-3.5 max-w-[340px] text-[13.5px] leading-relaxed text-white/80 font-light">
              Sua doação foi consagrada no oratório do Templo de Luz. O seu horário de recolhimento
              espiritual está garantido.
            </p>
          </div>
        </header>

        {/* Faixa de Status */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Etapa 1 Concluída · Agora prepare sua Carta Sagrada</span>
        </div>

        <main className="px-6 pt-8 space-y-6">
          {/* Card Principal de Chamada para a Carta Real */}
          <Reveal className="p-6 rounded-3xl border-2 border-[#d4af37]/40 bg-gradient-to-br from-[#fbf8ee] via-white to-[#f7f2e4] shadow-xl text-center space-y-4">
            <span className="inline-block text-4xl animate-bounce">✍️</span>
            <h2 className="font-display text-xl font-black text-[#1a082c] leading-snug">
              Escreva agora a sua intenção na{" "}
              <span className="text-[#3c1766] underline decoration-[#d4af37] decoration-2 underline-offset-4">
                Carta Sagrada Real
              </span>
            </h2>
            <p className="text-xs text-[#6d5488] leading-relaxed">
              Preparamos um simulador de pergaminho manuscrito para você redigir, visualizar e
              enviar as palavras do seu coração diretamente para a médium Milena Medeiros.
            </p>

            <Link
              to="/escrever-carta"
              className="cta-hot inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3c1766] via-[#2a0e4a] to-[#1a0630] px-6 py-4 text-sm font-black tracking-wide text-white uppercase shadow-xl border border-[#d4af37]/40 transition-transform hover:scale-[1.02]"
            >
              <span className="relative z-10">✍️ Redigir Minha Carta em Pergaminho</span>
            </Link>
          </Reveal>

          {/* O que acontece agora */}
          <Reveal delay={80} className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#3c1766]">
              📋 O que acontece a partir de agora:
            </h3>

            <Card className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#ece5f4] shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f0fb] text-xl border border-[#e9dff4]">
                🕯️
              </span>
              <div>
                <strong className="block text-xs font-bold text-[#1a082c]">
                  1. Redação da Carta
                </strong>
                <span className="text-[12px] text-[#6d5488] leading-relaxed mt-0.5 block">
                  Você escolhe os temas ou escreve o que deseja dizer na página de carta manuscrita.
                </span>
              </div>
            </Card>

            <Card className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#ece5f4] shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f0fb] text-xl border border-[#e9dff4]">
                ✍️
              </span>
              <div>
                <strong className="block text-xs font-bold text-[#1a082c]">
                  2. Sessão de Psicografia
                </strong>
                <span className="text-[12px] text-[#6d5488] leading-relaxed mt-0.5 block">
                  A médium Milena entra em recolhimento no horário agendado e escreve a mensagem à
                  mão no oratório.
                </span>
              </div>
            </Card>

            <Card className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#ece5f4] shadow-xs">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f0fb] text-xl border border-[#e9dff4]">
                💌
              </span>
              <div>
                <strong className="block text-xs font-bold text-[#1a082c]">
                  3. Envio no seu WhatsApp
                </strong>
                <span className="text-[12px] text-[#6d5488] leading-relaxed mt-0.5 block">
                  As fotografias da carta original manuscrita chegam no seu WhatsApp em até 24h.
                </span>
              </div>
            </Card>
          </Reveal>

          {/* Card com Foto da Médium e Chamada para a Campanha Solidária */}
          <Reveal
            delay={120}
            className="overflow-hidden rounded-3xl border-2 border-[#fde68a] bg-[#fefaf3] p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full cloud-aura blur-md" />
                <img
                  src={IMAGES.milenaCatarata}
                  alt="Milena Medeiros"
                  className="relative w-14 h-14 rounded-full object-cover object-top border-2 border-[#f59e0b] shadow-sm"
                />
              </div>
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#b45309] block">
                  🙏 Corrente de Solidariedade
                </span>
                <h4 className="text-[13px] font-extrabold text-[#1a082c]">
                  Cirurgia dos Olhos da Médium Milena
                </h4>
              </div>
            </div>
            <p className="text-[12px] text-[#6d5488] leading-relaxed">
              Ajude Milena a realizar sua cirurgia de catarata para continuar essa missão de amor e
              cartas psicografadas.
            </p>
            <Link
              to="/upsell"
              className="inline-flex w-full items-center justify-center py-2.5 px-3 rounded-xl bg-white border border-[#fde68a] text-[#b45309] font-extrabold text-xs shadow-2xs hover:bg-[#fffbeb] transition-colors"
            >
              🤍 Conhecer a Campanha e Apoiar a Cirurgia ›
            </Link>
          </Reveal>

          {/* Botão de Redirecionamento Direto */}
          <div className="pt-2 text-center">
            <Link
              to="/escrever-carta"
              className="text-xs font-bold text-[#3c1766] underline decoration-[#d4af37] underline-offset-4 hover:text-[#1a082c]"
            >
              Ir direto para a página de redação da carta ›
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

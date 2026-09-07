import { createFileRoute, Link } from "@tanstack/react-router";
import { AjudaMilenaPage } from "./ajuda-milena";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/apoio-milena")({
  head: () => ({
    meta: [
      { title: "Ajude na Cirurgia dos Olhos da Médium Milena | Templo de Luz" },
      {
        name: "description",
        content:
          "Uma corrente de amor e solidariedade para a cirurgia de catarata da médium Milena Medeiros. Ajude a manter acesa a luz das cartas psicografadas.",
      },
    ],
  }),
  component: ApoioMilenaGate,
});

import { getStoredUtms, sendUtmifyOrder } from "@/lib/utmify";
import { trackPurchaseComplete } from "@/lib/metaPixel";

function ApoioMilenaGate() {
  const [paid, setPaid] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const isStripe = urlParams.get("payment") === "stripe_success" || urlParams.get("session_id");

      if (isStripe) {
        sessionStorage.setItem("templodeluz:pix-paid", "true");
        setPaid(true);

        // Garante que o evento Stripe seja enviado apenas 1 vez para a UTMify e Meta Pixel
        const alreadySent = sessionStorage.getItem("utmify_sent_stripe_carta");
        if (!alreadySent) {
          sessionStorage.setItem("utmify_sent_stripe_carta", "true");

          void sendUtmifyOrder({
            orderId: urlParams.get("session_id") || `stripe_carta_${Date.now()}`,
            platform: "TemploDeLuz",
            paymentMethod: "credit_card",
            status: "paid",
            customer: {
              name: "Consulente Templo de Luz",
            },
            products: [
              {
                id: "carta_sagrada",
                name: "Carta Psicografada Sagrada",
                quantity: 1,
                priceInCents: 1900,
              },
            ],
            trackingParameters: getStoredUtms(),
          });

          trackPurchaseComplete({
            amountCents: 1900,
            productName: "Carta Psicografada Sagrada",
            productId: "carta_sagrada",
            paymentMethod: "cartao",
            orderId: urlParams.get("session_id") || `stripe_carta_${Date.now()}`,
          });
        }
        return;
      }
    }
    const flag = sessionStorage.getItem("templodeluz:pix-paid");
    setPaid(flag === "true");
  }, []);

  // Loading
  if (paid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf9f5]">
        <span className="text-sm text-[#786445] animate-pulse">Carregando…</span>
      </div>
    );
  }

  // Bloqueio amigável e explicativo — pedido ainda não iniciado ou não consagrado
  if (!paid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-[#f7f2ea] to-[#f4eee4] text-[#181126] antialiased flex items-center justify-center p-4">
        <div className="mx-auto w-full max-w-[460px] rounded-3xl bg-white shadow-2xl border border-[#ede3f5] p-7 sm:p-9 text-center animate-fade-in">
          {/* Ícone Espiritual Nobre */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-purple-50 to-amber-50 border border-amber-200 shadow-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#92400e]">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#92400e]">
            Oratório Sagrado de Psicografia
          </span>

          <h1 className="mt-3 font-display text-2xl font-black text-[#181126] leading-tight">
            Inicie Seu Atendimento Espiritual
          </h1>

          <p className="mt-3 text-xs sm:text-[13px] text-[#5e4b73] leading-relaxed">
            Para sintonizar a carta psicografada do seu ente querido e ter acesso a esta área de acolhimento, é necessário primeiro registrar o seu pedido no formulário sagrado do Templo de Luz.
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-[#faf7fd] border border-[#e8dcf5] text-left">
            <p className="text-[11.5px] text-[#2d144d] leading-relaxed">
              A Médium Milena Medeiros acolhe cada mensagem no altar após a firmeza da vela de 7 dias. Se você já iniciou o seu pedido, conclua a consagração da vela para ter acesso imediato.
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <Link
              to="/"
              search={{ step: "intro" }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2d144d] via-[#3d1868] to-[#1f0c36] px-6 py-4 text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-[#2d144d]/25 hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <span>Iniciar Pedido da Minha Carta</span>
              <span className="text-sm font-bold">›</span>
            </Link>

            <Link
              to="/escrever-carta"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#d8caea] bg-white px-5 py-3 text-xs font-bold text-[#2d144d] hover:bg-purple-50/50 transition-colors"
            >
              <span>Redigir Carta no Pergaminho</span>
              <span className="text-sm">›</span>
            </Link>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              to="/como-funciona"
              className="text-[11px] font-semibold text-[#8e7a60] hover:text-[#2d144d] underline underline-offset-2 transition-colors"
            >
              Como funciona a carta psicografada?
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pagamento confirmado — renderiza a página de apoio
  return <AjudaMilenaPage />;
}

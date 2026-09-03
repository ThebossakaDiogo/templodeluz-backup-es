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

import { sendUtmifyOrder } from "@/lib/utmify";
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

  // Bloqueio — pagamento não detectado
  if (!paid) {
    return (
      <div className="min-h-screen bg-[#fbf9f5] text-[#181126] antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center bg-white shadow-2xl border-x border-[#ece5f4] px-6 py-16 text-center">
          <span className="text-5xl mb-5">🔒</span>
          <h1 className="font-display text-xl font-extrabold text-[#181126]">
            Acesso restrito
          </h1>
          <p className="mt-3 max-w-[340px] text-sm text-[#5e4b73] leading-relaxed">
            Esta página é exclusiva para quem já realizou a contribuição
            fraterna via PIX. Conclua o pagamento para continuar.
          </p>
          <Link
            to="/"
            search={{ step: "intro" }}
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#2d144d] px-6 py-3.5 text-sm font-extrabold text-white uppercase tracking-wide shadow-md hover:bg-[#1f0c36] transition-colors"
          >
            ‹ Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  // Pagamento confirmado — renderiza a página de apoio
  return <AjudaMilenaPage />;
}

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { QuizFunnel } from "@/components/funnel/QuizFunnel";
import { ExitIntentBackRedirect } from "@/components/funnel/ExitIntentBackRedirect";

function QuizPage() {
  return (
    <>
      <QuizFunnel />
      <ExitIntentBackRedirect enabled />
    </>
  );
}

const stepSchema = z
  .enum(["intro", "ente", "relacao", "tempo", "mensagem", "confirma", "loading", "result"])
  .catch("intro");

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: stepSchema.parse(search["step"] ?? "intro"),
  }),
  head: () => ({
    meta: [
      { title: "Carta Psicografada do Seu Ente Querido — Médium Milena Medeiros | Templo de Luz" },
      {
        name: "description",
        content:
          "Receba hoje uma carta psicografada à mão com a letra e assinatura do seu ente querido. Médium Milena Medeiros, 33 anos de prática, +12.400 cartas entregues. Garantia de 7 dias.",
      },
      {
        name: "keywords",
        content:
          "carta psicografada, psicografia, médium Milena Medeiros, carta manuscrita ente querido, mensagem espiritual, Templo de Luz, carta do além",
      },
      { property: "og:title", content: "Carta Psicografada do Seu Ente Querido | Templo de Luz" },
      {
        property: "og:description",
        content:
          "Responda algumas perguntas e agende sua carta psicografada. Escrita 100% à mão no santuário sagrado, com garantia de 7 dias.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://templodeluz.com" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Carta Psicografada do Seu Ente Querido | Templo de Luz" },
      {
        name: "twitter:description",
        content:
          "Receba uma carta psicografada manuscrita pela médium Milena Medeiros. +12.400 acolhidos desde 1977.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://yfpiqfytonuhigwkssio.supabase.co" },
      { rel: "dns-prefetch", href: "https://yfpiqfytonuhigwkssio.supabase.co" },
    ],
  }),
  component: QuizPage,
});

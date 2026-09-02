import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { QuizFunnel } from "@/components/funnel/QuizFunnel";

const stepSchema = z
  .enum(["intro", "ente", "relacao", "tempo", "mensagem", "confirma", "loading", "result"])
  .catch("intro");

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: stepSchema.parse(search.step ?? "intro"),
  }),
  head: () => ({
    meta: [
      { title: "Carta Psicografada do Seu Ente Querido | Templo de Luz" },
      {
        name: "description",
        content:
          "Receba hoje uma carta psicografada à mão, com a letra e a assinatura do seu ente querido. Médium Milena Medeiros, 33 anos e 12 mil cartas entregues.",
      },
      { property: "og:title", content: "Carta Psicografada do Seu Ente Querido | Templo de Luz" },
      {
        property: "og:description",
        content:
          "Responda algumas perguntas e agende sua carta psicografada. Escrita à mão, com garantia de 7 dias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizFunnel,
});

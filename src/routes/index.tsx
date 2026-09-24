import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { QuizFunnel } from "@/components/funnel/QuizFunnel";

const ExitIntentBackRedirect = lazy(() =>
  import("@/components/funnel/ExitIntentBackRedirect").then(({ ExitIntentBackRedirect: Component }) => ({ default: Component })),
);

const QUIZ_STEPS = ["intro", "ente", "relacao", "tempo", "mensagem", "confirma", "loading", "result"] as const;
type QuizStep = (typeof QUIZ_STEPS)[number];

function isQuizStep(value: unknown): value is QuizStep {
  return typeof value === "string" && (QUIZ_STEPS as readonly string[]).includes(value);
}

function QuizPage() {
  const [loadExitIntent, setLoadExitIntent] = useState(false);

  useEffect(() => {
    const load = () => setLoadExitIntent(true);
    const win = typeof window !== "undefined" ? (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }) : null;
    if (win?.requestIdleCallback && win?.cancelIdleCallback) {
      const idleId = win.requestIdleCallback(load, { timeout: 1200 });
      return () => win.cancelIdleCallback?.(idleId);
    }
    const timeoutId = setTimeout(load, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <QuizFunnel />
      {loadExitIntent && <Suspense fallback={null}><ExitIntentBackRedirect enabled /></Suspense>}
    </>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: isQuizStep(search["step"]) ? search["step"] : "intro",
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
      { rel: "preconnect", href: "https://opftmzegcvfyoinjfmcj.supabase.co" },
      { rel: "dns-prefetch", href: "https://opftmzegcvfyoinjfmcj.supabase.co" },
    ],
  }),
  component: QuizPage,
});

import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/funnel/Shell";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso | Templo de Luz" },
      {
        name: "description",
        content:
          "Condições de uso do Templo de Luz: como funcionam as cartas psicografadas, doações e a garantia de 7 dias.",
      },
      { property: "og:title", content: "Termos de Uso | Templo de Luz" },
      {
        property: "og:description",
        content: "Regras, doações e garantia de 7 dias das cartas psicografadas do Templo de Luz.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-card shadow-lift">
      <header className="bg-royal px-6 py-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">
          🕊️ Templo de Luz
        </p>
        <h1 className="font-display mt-2 text-[24px] font-black text-primary-foreground">
          Termos de Uso
        </h1>
      </header>
      <article className="flex flex-col gap-4 px-6 py-8 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          O Templo de Luz é um projeto do Centro Espírita Casa Nova, associação privada sem fins
          lucrativos. As cartas psicografadas são um trabalho de fé e caridade, de natureza
          religiosa e espiritual.
        </p>
        <p>
          O conteúdo oferecido não substitui acompanhamento médico, psicológico, jurídico ou
          financeiro. Em momentos de sofrimento intenso, procure também apoio profissional. O CVV
          atende gratuitamente pelo telefone 188.
        </p>
        <p>
          A carta é gratuita; a doação sugerida é destinada à manutenção do templo, dos materiais e
          do atendimento das famílias. A confirmação da doação libera o contato direto com a médium.
        </p>
        <p>
          Garantia: em até 7 dias após o recebimento, se a carta não fizer sentido para você,
          devolvemos integralmente o valor doado mediante solicitação por e-mail.
        </p>
        <p>
          O serviço é destinado a pessoas maiores de 18 anos. Ao continuar, você declara concordar
          com estas condições.
        </p>
        <Link to="/" search={{ step: "intro" }} className="mt-2 font-semibold text-primary underline">
          ← Voltar para o início
        </Link>
      </article>
      <Footer />
    </div>
  );
}

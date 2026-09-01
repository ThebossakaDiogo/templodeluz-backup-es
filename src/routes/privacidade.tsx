import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/funnel/Shell";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | Templo de Luz" },
      {
        name: "description",
        content:
          "Saiba como o Templo de Luz coleta, usa e protege os dados das pessoas que solicitam uma carta psicografada.",
      },
      { property: "og:title", content: "Política de Privacidade | Templo de Luz" },
      {
        property: "og:description",
        content: "Como tratamos e protegemos os seus dados no Templo de Luz.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-card shadow-lift">
      <header className="bg-royal px-6 py-8 text-center">
        <p className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">
          🕊️ Templo de Luz
        </p>
        <h1 className="font-display mt-2 text-[24px] font-black text-primary-foreground">
          Política de Privacidade
        </h1>
      </header>
      <article className="flex flex-col gap-4 px-6 py-8 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          O Templo de Luz respeita a sua privacidade. Coletamos apenas as informações que você
          fornece voluntariamente: nome, nome do ente querido, a mensagem que deseja enviar e dados
          de contato.
        </p>
        <p>
          Esses dados são usados exclusivamente para a elaboração e a entrega da sua carta
          psicografada e para o atendimento de suporte. Não vendemos, alugamos nem compartilhamos
          suas informações com terceiros para fins publicitários.
        </p>
        <p>
          Doações são processadas por plataformas de pagamento parceiras. Não armazenamos dados de
          cartão de crédito em nossos servidores.
        </p>
        <p>
          Utilizamos cookies e tecnologias de medição para entender o desempenho das nossas páginas.
          Você pode bloqueá-los nas configurações do seu navegador.
        </p>
        <p>
          A qualquer momento você pode solicitar a correção ou a exclusão dos seus dados escrevendo
          para <span className="text-primary">tempodaluz@gmail.com</span>.
        </p>
        <Link to="/" className="mt-2 font-semibold text-primary underline">
          ← Voltar para o início
        </Link>
      </article>
      <Footer />
    </div>
  );
}

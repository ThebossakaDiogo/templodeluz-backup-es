import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IMAGES } from "@/components/funnel/data";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona Sua Psicografia | Passo a Passo Sagrado | Templo de Luz" },
      {
        name: "description",
        content:
          "Entenda o passo a passo completo: como enviar suas informações no WhatsApp da médium Milena Medeiros, como funciona o recolhimento e a entrega da carta em PDF pronta para impressão.",
      },
    ],
  }),
  component: ComoFuncionaPage,
});

const ETAPAS_WHATSAPP = [
  {
    numero: "1",
    icone: "✍️",
    badge: "Etapa 1 · Você Redige Agora",
    titulo: "Escrever a Carta & Gerar o Texto Sagrado",
    subtitulo: "Na próxima página, você expressa aquilo que está no seu coração",
    descricao:
      "Você preenche o seu nome, o nome do seu ente querido e seleciona os temas de conforto ou escreve livremente suas palavras. Nosso simulador sagrado gera a mensagem já formatada para o oratório.",
    dica: "💡 Não se preocupe em escrever com perfeição: o plano espiritual compreende cada sentimento sincero.",
  },
  {
    numero: "2",
    icone: "📱",
    badge: "Etapa 2 · Envio no WhatsApp",
    titulo: "Enviar os Dados no WhatsApp Oficial da Médium",
    subtitulo: "Basta 1 toque no botão verde para enviar diretamente à Médium Milena",
    descricao:
      "Ao concluir sua carta, você clica no botão do WhatsApp (+55 19 99831-6353). A mensagem já vai pré-escrita com todos os dados. Se você realizou a doação da vela e insumos, basta enviar também o comprovante na mesma conversa para que a vela seja inscrita com o nome.",
    dica: "📲 Sua mensagem é acolhida imediatamente pela equipe do Templo de Luz.",
  },
  {
    numero: "3",
    icone: "🕯️",
    badge: "Etapa 3 · Recolhimento Sagrado",
    titulo: "A Vela é Acesa no Altar e Você Aguarda em Paz",
    subtitulo: "Milena Medeiros entra em recolhimento espiritual no horário agendado",
    descricao:
      "A vela de 7 dias é consagrada e acesa com o nome de quem partiu. No horário marcado, Milena recolhe-se em oração e verte a mensagem à mão no papel físico de algodão. Você não precisa fazer nenhum esforço: apenas mantenha o coração sereno, tranquilo e em prece.",
    dica: "🤍 Aguarde com tranquilidade: seu ente querido já está sendo acolhido na luz dos mentores.",
  },
  {
    numero: "4",
    icone: "📄",
    badge: "Etapa 4 · Entrega em PDF no WhatsApp",
    titulo: "Recebimento da Carta Sagrada em Formato PDF",
    subtitulo: "O documento em alta definição chega no seu WhatsApp pronto para ser impresso",
    descricao:
      "Assim que o recolhimento é concluído e a mensagem é abençoada no oratório, você recebe diretamente no seu WhatsApp o arquivo oficial em PDF de altíssima definição, contendo a psicografia integral com os traços originais da caligrafia, expressões de afeto e a assinatura espiritual, perfeitamente diagramado para ser impresso, emoldurado e guardado pela sua família.",
    dica: "🖨️ Você poderá imprimir a carta em papel nobre e reler sempre que a saudade bater no peito.",
  },
];

function ComoFuncionaPage() {
  const [nomeConsulente, setNomeConsulente] = useState("Consulente");
  const [nomeEnte, setNomeEnte] = useState("seu ente querido");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const logs = localStorage.getItem("play_and_win_captured_logs");
      if (logs) {
        const parsed = JSON.parse(logs);
        const nameEvent = parsed.find(
          (e: { field: string; value: string }) =>
            (e.field === "nome_consulente" || e.field === "lead_name") && e.value,
        );
        const enteEvent = parsed.find(
          (e: { field: string; value: string }) => e.field === "nome_ente_querido" && e.value,
        );
        if (nameEvent?.value) setNomeConsulente(nameEvent.value.split(" ")[0]);
        if (enteEvent?.value) setNomeEnte(enteEvent.value);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-[#f7f2ea] to-[#f3ece0] text-[#1f1035] flex flex-col justify-between selection:bg-amber-200 selection:text-[#2d144d] font-sans antialiased">
      {/* Header Claro & Nobre */}
      <header className="sticky top-0 z-40 border-b border-[#e8dfd1] bg-white/95 backdrop-blur-md px-4 py-3.5 sm:px-6 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5e4b73] hover:text-[#2d144d] transition-colors cursor-pointer"
          >
            <span className="text-base font-bold">‹</span>
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 border border-amber-300 text-sm shadow-2xs">
              🕊️
            </span>
            <span className="font-display text-sm font-black tracking-wide text-[#2d144d] uppercase">
              Templo de Luz
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-[10.5px] font-bold text-emerald-800 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Passo a Passo Oficial</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-10">
        {/* Banner de Boas-Vindas */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#92400e] shadow-2xs">
            <span>✨</span> Orientações & Envio no WhatsApp
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#181126] leading-tight max-w-2xl mx-auto">
            Como vai funcionar a psicografia de {nomeEnte}?
          </h1>

          <p className="text-sm sm:text-base text-[#5e4b73] max-w-xl mx-auto leading-relaxed font-medium">
            Olá, <strong className="text-[#181126]">{nomeConsulente}</strong>. Preparamos este guia para você saber exatamente o que enviar no WhatsApp e aguardar com serenidade no coração, sem nenhuma preocupação.
          </p>
        </div>

        {/* Foto da Médium Milena - Formato Natural sem Card */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div className="relative max-w-[420px] w-full flex justify-center">
            {/* Brilho e aura suave atrás da imagem */}
            <div className="absolute inset-0 -m-3 rounded-3xl bg-amber-300/20 blur-xl pointer-events-none" />
            
            <img
              src={IMAGES.milenaPss}
              alt="Médium Milena Medeiros - Templo de Luz"
              className="relative z-10 w-full h-auto object-contain rounded-3xl shadow-2xl shadow-amber-950/15 transition-transform duration-300 hover:scale-[1.01]"
            />
          </div>

          {/* Legenda Flutuante Discreta */}
          <div className="mt-3.5 text-center max-w-md px-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-amber-200 text-[11px] font-extrabold text-[#92400e] shadow-2xs">
              <span>✦</span> Médium Milena Medeiros · Templo de Luz
            </span>
            <p className="mt-1.5 text-xs text-[#6b5883] italic leading-snug">
              “Cada carta é um laço de amor que une a Terra ao plano espiritual.”
            </p>
          </div>
        </div>

        {/* Timeline dos 4 Passos do WhatsApp */}
        <div className="space-y-4 my-10">
          <div className="text-left px-1">
            <h2 className="font-display text-xl font-black text-[#181126] flex items-center gap-2">
              <span>📋</span>
              <span>Veja como é simples enviar e aguardar:</span>
            </h2>
            <p className="text-xs sm:text-[13px] text-[#5e4b73] mt-1">
              Siga estas 4 etapas para que tudo ocorra com máxima harmonia e respeito espiritual.
            </p>
          </div>

          <div className="space-y-4 mt-4">
            {ETAPAS_WHATSAPP.map((etapa) => (
              <div
                key={etapa.numero}
                className="relative overflow-hidden rounded-3xl border border-[#e8dfd1] bg-white p-5 sm:p-6 shadow-md transition-all duration-200 hover:border-amber-400 hover:shadow-lg text-left"
              >
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2d144d] via-[#4a1c77] to-[#1f0c36] text-white shadow-md shadow-purple-950/20 text-xl font-black">
                    <span>{etapa.icone}</span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#92400e]">
                        {etapa.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-base sm:text-lg font-extrabold text-[#181126] mt-1.5 leading-snug">
                      {etapa.titulo}
                    </h3>
                    <p className="text-xs font-semibold text-[#854d0e] mt-0.5">
                      {etapa.subtitulo}
                    </p>
                    <p className="text-xs sm:text-[13.5px] text-[#4d3a63] mt-2 leading-relaxed">
                      {etapa.descricao}
                    </p>

                    <div className="mt-3 p-3 rounded-2xl bg-[#fffef9] border border-amber-200 text-[11.5px] font-bold text-[#78350f] leading-relaxed shadow-2xs">
                      {etapa.dica}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card de Conforto & Alívio de Ansiedade */}
        <div className="rounded-3xl border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 sm:p-7 text-left shadow-lg">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl shadow-md shadow-emerald-700/20">
              🕊️
            </span>
            <div>
              <h4 className="font-display text-base font-extrabold text-emerald-950 uppercase tracking-wide">
                Aguarde com Serenidade e sem Preocupações
              </h4>
              <p className="text-xs sm:text-[13px] text-emerald-900 mt-2 leading-relaxed">
                Você não precisa ficar mandando mensagens repetidas ou ansioso(a). Nossa equipe acolhe cada pedido com profundo carinho e respeito à memória do seu ente querido. Assim que a carta for concluída, abençoada no oratório e diagramada em PDF, você receberá o arquivo diretamente na sua conversa particular do WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Principal - Guiando para a Página de Escrever Carta */}
        <div className="mt-9 text-center space-y-3.5">
          <Link
            to="/escrever-carta"
            className="group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-8 py-4 text-sm sm:text-base font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-700/30 transition-all duration-200 hover:scale-[1.015] hover:brightness-105 active:scale-[0.985]"
          >
            <span>✍️</span>
            <span>Avançar para Escrever Minha Carta Sagrada</span>
            <span className="text-lg transition-transform group-hover:translate-x-1">›</span>
          </Link>

          <p className="text-xs text-[#786445] font-medium">
            ✨ Leva menos de 2 minutos para preencher seus anseios e visualizar seu pergaminho.
          </p>
        </div>
      </main>

      {/* Rodapé Claro & Acolhedor */}
      <footer className="border-t border-[#e8dfd1] bg-[#ede4d4]/60 py-5 px-4 text-center text-[11.5px] text-[#786445]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Templo de Luz · Obras de Caridade e Consolo Espiritual · Desde 1977</span>
          <div className="flex items-center gap-4 font-bold text-[#5e4b73]">
            <Link to="/escrever-carta" className="hover:text-[#2d144d]">
              Escrever Carta
            </Link>
            <span>•</span>
            <Link to="/termos" className="hover:text-[#2d144d]">
              Termos
            </Link>
            <span>•</span>
            <Link to="/privacidade" className="hover:text-[#2d144d]">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { recordInput } from "@/lib/auto-capture";

export const Route = createFileRoute("/escrever-carta")({
  head: () => ({
    meta: [
      { title: "Redigir Carta Sagrada Manuscrita | Templo de Luz" },
      {
        name: "description",
        content:
          "Escolha os temas sagrados ou escreva sua mensagem livre no pergaminho. Visualize a caligrafia e envie diretamente para a médium Milena Medeiros.",
      },
    ],
  }),
  component: EscreverCartaPage,
});

const SUGGESTIONS = [
  "Sinto sua falta todos os dias e guardo cada ensinamento no meu coração...",
  "Obrigado por ter sido meu porto seguro e ter me amado com tanta pureza...",
  "Peço que o plano espiritual te envolva em luz e me envie um sinal de paz...",
  "Quero que saiba que estamos bem e cuidando uns dos outros aqui na Terra...",
  "Perdoe-me pelas vezes em que não soube demonstrar todo o meu amor...",
];

const TEMAS_GUIADOS = [
  {
    id: "paz",
    icon: "🕊️",
    label: "Notícias da Passagem e Estado de Paz",
    desc: "Saber como foi recebido(a) na luz e se já está descansando em paz.",
    textSnippet:
      "Peço aos mentores espirituais que me revelem como você está no plano de luz e o acolhimento da sua alma.",
  },
  {
    id: "conselho",
    icon: "🌟",
    label: "Conselho para Minha Vida e Família",
    desc: "Palavras de força e direcionamento para quem ficou na Terra.",
    textSnippet:
      "Gostaria de ouvir seus sábios conselhos e bênçãos para confortar os meus passos e os da nossa família.",
  },
  {
    id: "perdao",
    icon: "🤍",
    label: "Perdão, Reconciliação e Alívio",
    desc: "Cura de qualquer mágoa, culpa ou palavras não ditas em vida.",
    textSnippet:
      "Envio todo o meu perdão e peço que a luz espiritual desfaça qualquer peso do passado entre nós.",
  },
  {
    id: "sinal",
    icon: "✨",
    label: "Confirmação e Sinal de Presença",
    desc: "Saber que o laço de amor continua vivo entre os dois planos.",
    textSnippet:
      "Se for da vontade dos mensageiros divinos, envie-me um sinal de carinho para que eu sinta que você está bem.",
  },
];

function EscreverCartaPage() {
  const [mode, setMode] = useState<"guiada" | "livre">("guiada");
  const [nome, setNome] = useState("Maria Clara");
  const [ente, setEnte] = useState("Dona Helena");
  const [relacao, setRelacao] = useState("Mãe");
  const [selectedTemas, setSelectedTemas] = useState<string[]>(["paz", "sinal"]);
  const [mensagemLivre, setMensagemLivre] = useState(
    "Mãe querida, sinto sua presença em cada amanhecer. As saudades apertam o peito, mas saber que a senhora está em paz me traz consolo. Deixei esta mensagem para ouvir as suas palavras de conforto através da médium Milena...",
  );
  const [copied, setCopied] = useState(false);
  const [fontStyle, setFontStyle] = useState<"handwriting" | "cursive">("handwriting");

  // Carrega dados previamente preenchidos no funil (se houver)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const logs = localStorage.getItem("play_and_win_captured_logs");
      if (logs) {
        try {
          const parsed = JSON.parse(logs);
          const nameEv = parsed.find(
            (e: { field: string; value: string }) =>
              (e.field === "nome_consulente" || e.field === "lead_name") && e.value,
          );
          const enteEv = parsed.find(
            (e: { field: string; value: string }) => e.field === "nome_ente_querido" && e.value,
          );
          const relacaoEv = parsed.find(
            (e: { field: string; value: string }) => e.field === "grau_parentesco" && e.value,
          );
          const msgEv = parsed.find(
            (e: { field: string; value: string }) => e.field === "mensagem_para_ente" && e.value,
          );

          if (nameEv && nameEv.value) setNome(nameEv.value);
          if (enteEv && enteEv.value) setEnte(enteEv.value);
          if (relacaoEv && relacaoEv.value) setRelacao(relacaoEv.value);
          if (msgEv && msgEv.value) {
            setMensagemLivre(msgEv.value);
            setMode("livre");
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const toggleTema = (id: string) => {
    const next = selectedTemas.includes(id)
      ? selectedTemas.filter((t) => t !== id)
      : [...selectedTemas, id];
    setSelectedTemas(next);
    recordInput("carta_temas_selecionados", next.join(", "), {
      userName: nome,
      metadata: { ente, relacao, temas: next },
    });
  };

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Mensagem final que aparece no pergaminho
  const textoPergaminho =
    mode === "guiada"
      ? selectedTemas.length > 0
        ? `Elevo meu coração em oração por você, meu querido(a) ${ente || "ente querido"}.\n\n` +
          selectedTemas
            .map((tId) => {
              const item = TEMAS_GUIADOS.find((t) => t.id === tId);
              return item ? `• ${item.textSnippet}` : "";
            })
            .filter(Boolean)
            .join("\n\n") +
          `\n\nQue a médium Milena Medeiros sintonize a sua luz no oratório e me traga as palavras de acolhimento que a minha alma tanto espera.`
        : `[Selecione pelo menos um tema sagrado ao lado para compor sua carta...]`
      : mensagemLivre ||
        "[Comece a digitar sua mensagem ao lado para ver a caligrafia manuscrita no pergaminho...]";

  const handleSendWhatsApp = () => {
    const textToSend = `*🕯️ CARTA SAGRADA PARA O TEMPLO DE LUZ*\n\n*Consulente:* ${nome}\n*Ente Querido:* ${ente}\n*Vínculo:* ${relacao}\n*Modalidade:* ${mode === "guiada" ? "Intenções Guiadas" : "Mensagem Livre"}\n*Data:* ${dataAtual}\n\n*Conteúdo Consagrado:*\n"${textoPergaminho}"\n\n_Solicito o acolhimento espiritual com a médium Milena Medeiros._`;
    const encoded = encodeURIComponent(textToSend);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleCopy = () => {
    const textToSend = `🕯️ CARTA SAGRADA - TEMPLO DE LUZ\n\nConsulente: ${nome}\nEnte Querido: ${ente}\nData: ${dataAtual}\n\n"${textoPergaminho}"`;
    navigator.clipboard.writeText(textToSend);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#1c0d38] text-white py-6 px-4 md:py-10 selection:bg-accent selection:text-primary-deep">
      {/* Header Superior */}
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-6 pb-4 border-b border-white/15">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          <span>‹ Voltar para o Funil Principal</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
            Simulador de Carta Sagrada
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna 1: Painel de Edição (com as 2 opções de abas) */}
        <div className="lg:col-span-5 bg-[#2a1352]/90 border border-white/15 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-md space-y-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#f2c15c]">
              🕊️ Modo de Redação da Carta
            </span>
            <h1 className="font-display text-xl font-bold text-white mt-1">
              Como deseja compor a sua carta?
            </h1>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              Você pode escolher as intenções sagradas guiadas ou escrever livremente com as suas
              palavras.
            </p>
          </div>

          {/* Abas das 2 Opções de Alta Conversão */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/10 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode("guiada");
                recordInput("modo_redacao_carta", "guiada", { userName: nome });
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "guiada"
                  ? "bg-[#f2c15c] text-[#2a1352] shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <span>🕊️</span>
              <span>1. Escolher Temas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("livre");
                recordInput("modo_redacao_carta", "livre", { userName: nome });
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "livre"
                  ? "bg-[#f2c15c] text-[#2a1352] shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <span>✍️</span>
              <span>2. Escrever Livre</span>
            </button>
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-bold text-[#f2c15c] uppercase mb-1">
                Seu Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  recordInput("carta_nome_consulente", e.target.value, {
                    userName: e.target.value,
                  });
                }}
                className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-[#f2c15c]"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold text-[#f2c15c] uppercase mb-1">
                Nome do Ente Querido
              </label>
              <input
                type="text"
                value={ente}
                onChange={(e) => {
                  setEnte(e.target.value);
                  recordInput("carta_nome_ente", e.target.value, {
                    userName: nome,
                    metadata: { ente: e.target.value },
                  });
                }}
                className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-[#f2c15c]"
              />
            </div>
          </div>

          {/* CONTEÚDO MODO 1: TEMAS GUIADOS */}
          {mode === "guiada" && (
            <div className="space-y-2.5 pt-1">
              <span className="block text-[11px] font-bold text-[#f2c15c] uppercase">
                Selecione os anseios do seu coração:
              </span>
              {TEMAS_GUIADOS.map((tema) => {
                const isChecked = selectedTemas.includes(tema.id);
                return (
                  <button
                    key={tema.id}
                    type="button"
                    onClick={() => toggleTema(tema.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? "bg-white/15 border-[#f2c15c] text-white shadow-sm"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xl">{tema.icon}</span>
                    <div className="flex-1">
                      <strong className="block text-xs font-bold text-white leading-tight">
                        {tema.label}
                      </strong>
                      <p className="text-[11px] text-white/60 mt-0.5 leading-snug">{tema.desc}</p>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold mt-0.5 ${
                        isChecked
                          ? "bg-[#f2c15c] border-[#f2c15c] text-[#2a1352]"
                          : "border-white/40 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* CONTEÚDO MODO 2: ESCRITA LIVRE */}
          {mode === "livre" && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#f2c15c] uppercase">
                    Sua Mensagem do Coração
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFontStyle("handwriting")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        fontStyle === "handwriting"
                          ? "bg-[#f2c15c] text-[#2a1352]"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      Estilo 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontStyle("cursive")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        fontStyle === "cursive"
                          ? "bg-[#f2c15c] text-[#2a1352]"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      Estilo 2
                    </button>
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={mensagemLivre}
                  onChange={(e) => {
                    setMensagemLivre(e.target.value);
                    recordInput("carta_mensagem_livre", e.target.value, {
                      userName: nome,
                      metadata: { ente, msg: e.target.value },
                    });
                  }}
                  placeholder="Escreva como se estivesse conversando com seu ente querido..."
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs leading-relaxed outline-none focus:border-[#f2c15c] resize-y min-h-[120px]"
                />
              </div>

              {/* Sugestões de Inspiração */}
              <div>
                <span className="block text-[10px] font-bold uppercase text-white/60 mb-1.5">
                  💡 Frases de Inspiração (clique para adicionar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const newMsg = mensagemLivre ? `${mensagemLivre}\n\n${sug}` : sug;
                        setMensagemLivre(newMsg);
                        recordInput("carta_mensagem_livre", newMsg, {
                          userName: nome,
                          metadata: { ente, msg: newMsg },
                        });
                      }}
                      className="text-left text-[10.5px] bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg p-1.5 text-white/80 hover:text-white transition-all cursor-pointer"
                    >
                      + "{sug.slice(0, 42)}..."
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="cta-hot w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span className="relative z-10">💌 Enviar Carta para a Médium no WhatsApp</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {copied ? "✓ Copiado!" : "📋 Copiar Texto"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                🖨️ Imprimir Carta
              </button>
            </div>
          </div>
        </div>

        {/* Coluna 2: A CARTA REAL EM PERGAMINHO */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-white/70 mb-2 px-2">
            <span className="flex items-center gap-1 font-semibold">
              <span>📜</span> Prévia Fiel do Pergaminho
            </span>
            <span className="text-[#f2c15c] text-[11px] font-bold">
              100% Manuscrita no Oratório
            </span>
          </div>

          {/* FOLHA DE PERGAMINHO REALISTA */}
          <div className="w-full letter-parchment rounded-2xl p-6 md:p-9 text-[#1c2742] relative overflow-hidden shadow-2xl border border-[#d4af37]/40 min-h-[580px] flex flex-col justify-between">
            {/* Vinco sutil de dobra de carta no meio */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 letter-crease pointer-events-none opacity-40" />

            {/* Carimbo / Selo de Cera no Canto Superior Direito */}
            <div className="absolute top-5 right-5 flex flex-col items-center pointer-events-none select-none opacity-90">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8a1c14] via-[#b82e23] to-[#69110a] border-2 border-[#e6b800] flex items-center justify-center shadow-md rotate-12">
                <span className="text-lg">🕯️</span>
              </div>
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#8a1c14] mt-1 rotate-12">
                Selo Sagrado
              </span>
            </div>

            {/* Cabeçalho da Carta */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between border-b border-[#c5a059]/30 pb-3 mb-4">
                <div>
                  <h3 className="font-display font-black text-sm tracking-wider uppercase text-[#2e1a54]">
                    🕊️ Templo de Luz
                  </h3>
                  <span className="text-[10px] text-[#634e28] font-semibold italic">
                    Oratório de Psicografia e Acolhimento Espiritual
                  </span>
                </div>
                <div className="text-right text-[11px] text-[#4a3b1d] font-semibold mr-16">
                  {dataAtual}
                </div>
              </div>

              <p
                className={`text-xl md:text-2xl text-[#18233c] font-bold ${fontStyle === "cursive" ? "font-cursive" : "font-handwriting"}`}
              >
                Ao meu amado(a) {ente || "Ente Querido"},
              </p>
            </div>

            {/* Corpo da Carta com Caligrafia Realista */}
            <div className="relative z-10 my-6 flex-1">
              <div
                className={`text-[19px] md:text-[23px] leading-[1.65] text-[#1b2744] whitespace-pre-wrap ${
                  fontStyle === "cursive" ? "font-cursive" : "font-handwriting"
                }`}
              >
                {textoPergaminho}
              </div>
            </div>

            {/* Despedida, Assinatura e Carimbo da Médium */}
            <div className="relative z-10 pt-4 border-t border-[#c5a059]/30 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                <p
                  className={`text-lg text-[#18233c] font-semibold ${fontStyle === "cursive" ? "font-cursive" : "font-handwriting"}`}
                >
                  Com todo o meu amor, oração e saudade eterna,
                </p>
                <p
                  className={`text-2xl md:text-3xl text-[#2e1a54] font-bold mt-1 ${fontStyle === "cursive" ? "font-cursive" : "font-handwriting"}`}
                >
                  {nome || "Seu Nome"}
                </p>
              </div>

              {/* Assinatura / Registro da Médium */}
              <div className="text-right border-l md:border-l-0 md:border-t-0 pl-3 md:pl-0 border-[#c5a059]/40">
                <span className="text-[9.5px] uppercase tracking-wider text-[#6b552d] font-bold block">
                  Reconhecido no Oratório
                </span>
                <span className="font-display italic text-xs font-bold text-[#2e1a54]">
                  Médium Milena Medeiros
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-white/50 text-center mt-3 max-w-md">
            ✨ Esta é uma simulação sagrada do pergaminho manuscrito. No momento do recolhimento, a
            médium verte as palavras à mão no papel físico consagrado.
          </p>
        </div>
      </div>
    </div>
  );
}

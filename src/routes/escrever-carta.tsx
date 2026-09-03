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

const WHATSAPP_NUMBER = "5519998316353"; // +55 19 99831-6353 - Milena Medeiros - Templo Da Luz

function parseStoredLogs(logs: string | null) {
  if (!logs) return null;
  try {
    const parsed = JSON.parse(logs);
    if (!Array.isArray(parsed)) return null;
    return {
      nome: parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "nome_consulente" || e.field === "lead_name") && e.value,
      )?.value,
      ente: parsed.find(
        (e: { field: string; value: string }) => e.field === "nome_ente_querido" && e.value,
      )?.value,
      relacao: parsed.find(
        (e: { field: string; value: string }) => e.field === "grau_parentesco" && e.value,
      )?.value,
      mensagem: parsed.find(
        (e: { field: string; value: string }) => e.field === "mensagem_para_ente" && e.value,
      )?.value,
    };
  } catch {
    return null;
  }
}

function parseQuizState(state: string | null) {
  if (!state) return null;
  try {
    return JSON.parse(state);
  } catch {
    return null;
  }
}

function EscreverCartaPage() {
  const [mode, setMode] = useState<"guiada" | "livre">("guiada");
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
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
    if (typeof window === "undefined") return;

    const syncFromQuiz = () => {
      const quiz = parseQuizState(localStorage.getItem("templodeluz_quiz_state"));
      if (!quiz) return;
      if (quiz.nome) setNome(quiz.nome);
      if (quiz.ente) setEnte(quiz.ente);
      if (quiz.relacao) setRelacao(quiz.relacao);
      if (quiz.modoMensagem === "livre" && quiz.mensagem) {
        setMensagemLivre(quiz.mensagem);
        setMode("livre");
      } else if (quiz.temasEscolhidos?.length > 0) {
        setSelectedTemas(quiz.temasEscolhidos);
        setMode("guiada");
      }
    };

    const syncFromLogs = () => {
      const logData = parseStoredLogs(localStorage.getItem("play_and_win_captured_logs"));
      if (!logData) return;
      if (logData.nome) setNome((prev) => (!prev || prev === "Maria Clara" ? logData.nome : prev));
      if (logData.ente) setEnte((prev) => (!prev || prev === "Dona Helena" ? logData.ente : prev));
      if (logData.relacao) setRelacao((prev) => (!prev || prev === "Mãe" ? logData.relacao : prev));
      if (logData.mensagem) {
        setMensagemLivre(logData.mensagem);
        setMode("livre");
      }
    };

    syncFromQuiz();
    syncFromLogs();
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
  const buildTextoPergaminho = (): string => {
    if (mode === "guiada") {
      if (selectedTemas.length === 0) {
        return "[Selecione ao menos um tema sagrado ao lado para compor a mensagem no pergaminho...]";
      }
      const temasText = selectedTemas
        .map((tId) => TEMAS_GUIADOS.find((t) => t.id === tId)?.textSnippet)
        .filter(Boolean)
        .map((snippet) => `• ${snippet}`)
        .join("\n\n");

      return `Elevo meu coração em oração por você, meu amado(a) ${ente || "ente querido"}.\n\n${temasText}\n\nQue a médium Milena Medeiros sintonize a sua luz no oratório sagrado e me traga as palavras de consolo que a minha alma tanto espera.`;
    }

    return (
      mensagemLivre ||
      "[Escreva aqui as palavras que deseja direcionar ao seu ente querido para que a médium sintonize no oratório...]"
    );
  };

  const textoPergaminho = buildTextoPergaminho();

  const handleSendWhatsApp = () => {
    const modalidadeTexto = mode === "guiada" ? "Intenções Guiadas" : "Mensagem Livre";
    const textToSend =
      `🕊️ *TEMPLO DE LUZ — CARTA PSICOGRAFADA*\n` +
      `_Destinatária: Médium Milena Medeiros_\n\n` +
      `Olá, Médium Milena! Que a paz e a luz divina estejam com você. 🙏✨\n\n` +
      `Acabei de redigir minha carta e agendar minha sessão no Templo de Luz. Seguem as informações sagradas do meu pedido:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *DADOS DO CONSULENTE*\n` +
      `• *Meu Nome:* ${nome || "Consulente"}\n` +
      `• *Ente Querido:* ${ente || "Ente Querido"}\n` +
      `• *Grau de Vínculo:* ${relacao || "Familiar / Amado(a)"}\n` +
      `• *Data do Pedido:* ${dataAtual}\n` +
      `• *Modalidade:* ${modalidadeTexto}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📜 *CONTEÚDO DA CARTA EM PERGAMINHO:*\n` +
      `"${textoPergaminho}"\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🤍 _Aguardo com muita fé e serenidade as fotografias da carta manuscrita no oratório sagrado. Que a espiritualidade abençoe sua mediunidade!_`;

    const encoded = encodeURIComponent(textToSend);
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`, "_blank");
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
    <div className="min-h-screen bg-gradient-to-b from-[#fcfbf7] via-[#f7f2ea] to-[#f4eee4] text-[#1f1035] flex flex-col justify-between selection:bg-amber-200 selection:text-[#2d144d] font-sans">
      {/* Barra de Navegação Superior Clara & Refinada */}
      <header className="sticky top-0 z-40 border-b border-[#e8dfd1] bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/como-funciona"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5e4b73] hover:text-[#2d144d] transition-colors"
          >
            <span className="text-base font-bold">‹</span>
            <span>Passo a Passo da Carta</span>
          </Link>

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
            <span>Sessão Agendada</span>
          </div>
        </div>
      </header>

      {/* Seletor Mobile de Visualização (Abas Claras) */}
      <div className="lg:hidden sticky top-[53px] z-30 bg-[#f7f2ea]/95 backdrop-blur-sm border-b border-[#e5dac8] p-2">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#ede4d4] rounded-2xl border border-[#dfd2bc] max-w-sm mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab("editor")}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === "editor"
                ? "bg-white text-[#2d144d] shadow-md font-black"
                : "text-[#6c5a82] hover:text-[#2d144d]"
            }`}
          >
            <span>✍️</span>
            <span>Editar Conteúdo</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === "preview"
                ? "bg-white text-[#2d144d] shadow-md font-black"
                : "text-[#6c5a82] hover:text-[#2d144d]"
            }`}
          >
            <span>📜</span>
            <span>Ver Pergaminho</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* COLUNA 1: FORMULÁRIO E MODO DE ESCRITA */}
          <div
            className={`lg:col-span-5 space-y-4 ${
              mobileTab === "preview" ? "hidden lg:block" : "block"
            }`}
          >
            {/* Card Principal de Configuração */}
            <div className="rounded-3xl border border-[#e8dfd1] bg-white p-5 sm:p-6 shadow-xl shadow-amber-900/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#92400e]">
                  <span>✨</span> Redação Sagrada
                </span>
              </div>
              <h1 className="font-display text-lg sm:text-xl font-black text-[#181126] leading-tight mt-2">
                Como deseja redigir sua carta?
              </h1>
              <p className="text-xs text-[#5e4b73] mt-1 leading-relaxed">
                Você pode selecionar os anseios guiados da sua alma ou escrever livremente com as suas próprias palavras.
              </p>

              {/* Seletor de Modo (Guiada vs Livre) */}
              <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-[#f4ede1] rounded-2xl border border-[#e2d5c0]">
                <button
                  type="button"
                  onClick={() => {
                    setMode("guiada");
                    recordInput("modo_redacao_carta", "guiada", { userName: nome });
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === "guiada"
                      ? "bg-white text-[#2d144d] shadow-sm font-black border border-amber-200/60"
                      : "text-[#6c5a82] hover:text-[#2d144d]"
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
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    mode === "livre"
                      ? "bg-white text-[#2d144d] shadow-sm font-black border border-amber-200/60"
                      : "text-[#6c5a82] hover:text-[#2d144d]"
                  }`}
                >
                  <span>✍️</span>
                  <span>2. Escrever Livre</span>
                </button>
              </div>

              {/* Nomes e Identificação */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div>
                  <label
                    htmlFor="input-seu-nome"
                    className="block text-[10.5px] font-bold text-[#786445] uppercase tracking-wider mb-1"
                  >
                    Seu Nome
                  </label>
                  <input
                    id="input-seu-nome"
                    type="text"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      recordInput("carta_nome_consulente", e.target.value, {
                        userName: e.target.value,
                      });
                    }}
                    placeholder="Seu nome"
                    className="w-full h-10 px-3 rounded-xl bg-[#fdfbf7] border-2 border-[#e2d5c0] text-[#181126] text-xs font-medium outline-hidden focus:border-[#2d144d] transition-colors shadow-2xs placeholder:text-[#9583a6]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-nome-ente"
                    className="block text-[10.5px] font-bold text-[#786445] uppercase tracking-wider mb-1"
                  >
                    Ente Querido
                  </label>
                  <input
                    id="input-nome-ente"
                    type="text"
                    value={ente}
                    onChange={(e) => {
                      setEnte(e.target.value);
                      recordInput("carta_nome_ente", e.target.value, {
                        userName: nome,
                        metadata: { ente: e.target.value },
                      });
                    }}
                    placeholder="Nome do ente querido"
                    className="w-full h-10 px-3 rounded-xl bg-[#fdfbf7] border-2 border-[#e2d5c0] text-[#181126] text-xs font-medium outline-hidden focus:border-[#2d144d] transition-colors shadow-2xs placeholder:text-[#9583a6]"
                  />
                </div>
              </div>

              {/* MODO 1: TEMAS GUIADOS */}
              {mode === "guiada" && (
                <div className="space-y-2.5 mt-5">
                  <span className="block text-[11px] font-bold text-[#78350f] uppercase tracking-wider">
                    Selecione as intenções do seu coração:
                  </span>
                  {TEMAS_GUIADOS.map((tema) => {
                    const isChecked = selectedTemas.includes(tema.id);
                    return (
                      <button
                        key={tema.id}
                        type="button"
                        onClick={() => toggleTema(tema.id)}
                        className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? "bg-[#fffef9] border-amber-400 text-[#181126] shadow-sm"
                            : "bg-[#fcfaf6] border-[#e8dfd1] text-[#4d3a63] hover:border-amber-300 hover:bg-white"
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{tema.icon}</span>
                        <div className="flex-1 min-w-0">
                          <strong className="block text-xs font-bold text-[#181126] leading-tight">
                            {tema.label}
                          </strong>
                          <p className="text-[11px] text-[#5e4b73] mt-1 leading-relaxed">
                            {tema.desc}
                          </p>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 transition-colors ${
                            isChecked
                              ? "bg-amber-400 border-amber-400 text-[#2d144d]"
                              : "border-[#d0c2b0] text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* MODO 2: ESCRITA LIVRE */}
              {mode === "livre" && (
                <div className="space-y-3.5 mt-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="textarea-mensagem-livre"
                        className="block text-[11px] font-bold text-[#78350f] uppercase tracking-wider"
                      >
                        Sua Mensagem do Coração
                      </label>
                      <div className="flex items-center gap-1 bg-[#f0e7d8] p-0.5 rounded-lg border border-[#dfd2bc]">
                        <button
                          type="button"
                          onClick={() => setFontStyle("handwriting")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            fontStyle === "handwriting"
                              ? "bg-white text-[#2d144d] font-black shadow-2xs"
                              : "text-[#6c5a82] hover:text-[#2d144d]"
                          }`}
                        >
                          Letra 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setFontStyle("cursive")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            fontStyle === "cursive"
                              ? "bg-white text-[#2d144d] font-black shadow-2xs"
                              : "text-[#6c5a82] hover:text-[#2d144d]"
                          }`}
                        >
                          Letra 2
                        </button>
                      </div>
                    </div>
                    <textarea
                      id="textarea-mensagem-livre"
                      rows={5}
                      value={mensagemLivre}
                      onChange={(e) => {
                        setMensagemLivre(e.target.value);
                        recordInput("carta_mensagem_livre", e.target.value, {
                          userName: nome,
                          metadata: { ente, msg: e.target.value },
                        });
                      }}
                      placeholder="Escreva livremente como se estivesse conversando com seu ente querido..."
                      className="w-full p-3.5 rounded-xl bg-[#fdfbf7] border-2 border-[#e2d5c0] text-[#181126] text-xs leading-relaxed outline-hidden focus:border-[#2d144d] resize-y min-h-[120px] shadow-2xs placeholder:text-[#9583a6]"
                    />
                  </div>

                  {/* Frases de Inspiração Rápidas */}
                  <div>
                    <span className="block text-[10.5px] font-bold uppercase text-[#786445] mb-1.5">
                      💡 Toque para adicionar frases de carinho:
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
                          className="text-left text-[11px] bg-[#f7f2ea] hover:bg-amber-50 border border-[#dfd2bc] hover:border-amber-300 rounded-xl px-2.5 py-1.5 text-[#4d3a63] hover:text-[#2d144d] transition-all cursor-pointer shadow-2xs"
                        >
                          + "{sug.slice(0, 36)}..."
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação no Painel */}
              <div className="pt-4 border-t border-[#e8dfd1] mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-700/25 transition-transform active:scale-[0.99] cursor-pointer"
                >
                  <span>💌</span>
                  <span>Enviar Carta para a Médium no WhatsApp</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="py-2.5 rounded-xl border-2 border-[#d8caea] bg-white hover:bg-[#f6f0fc] text-[#2d144d] text-xs font-bold transition-colors cursor-pointer text-center shadow-2xs"
                  >
                    {copied ? "✓ Texto Copiado!" : "📋 Copiar Texto"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-2.5 rounded-xl border-2 border-[#d8caea] bg-white hover:bg-[#f6f0fc] text-[#2d144d] text-xs font-bold transition-colors cursor-pointer text-center shadow-2xs"
                  >
                    🖨️ Salvar / Imprimir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA 2: A CARTA SAGRADA EM PERGAMINHO MANUSCRITO */}
          <div
            className={`lg:col-span-7 flex flex-col items-center w-full ${
              mobileTab === "editor" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Header do Pergaminho */}
            <div className="w-full flex items-center justify-between text-xs text-[#5e4b73] mb-2.5 px-2">
              <span className="flex items-center gap-1.5 font-bold text-[#92400e]">
                <span>📜</span> Prévia Fiel do Pergaminho
              </span>
              <span className="text-[11px] font-semibold text-[#786445]">
                100% Manuscrita no Oratório
              </span>
            </div>

            {/* FOLHA DE PERGAMINHO DE ALTA RESOLUÇÃO */}
            <div className="w-full letter-parchment rounded-3xl p-6 sm:p-9 text-[#1c2742] relative overflow-hidden shadow-2xl shadow-amber-950/15 border border-[#d4af37]/50 min-h-[520px] flex flex-col justify-between">
              {/* Vinco Suave Central */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 letter-crease pointer-events-none opacity-30" />

              {/* Selo Sagrado de Cera no Canto Superior */}
              <div className="absolute top-5 right-5 flex flex-col items-center pointer-events-none select-none opacity-90">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#8a1c14] via-[#b82e23] to-[#69110a] border-2 border-[#e6b800] flex items-center justify-center shadow-md rotate-12">
                  <span className="text-base sm:text-lg">🕯️</span>
                </div>
                <span className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-widest text-[#8a1c14] mt-1 rotate-12">
                  Selo Sagrado
                </span>
              </div>

              {/* Cabeçalho da Carta */}
              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between border-b border-[#c5a059]/30 pb-3 mb-4 pr-14">
                  <div>
                    <h3 className="font-display font-black text-sm tracking-wider uppercase text-[#2e1a54]">
                      🕊️ Templo de Luz
                    </h3>
                    <span className="text-[10px] text-[#634e28] font-semibold italic block">
                      Oratório Sagrado de Psicografia & Acolhimento
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-[#4a3b1d] font-semibold">
                    {dataAtual}
                  </div>
                </div>

                <p
                  className={`text-xl sm:text-2xl text-[#18233c] font-bold ${
                    fontStyle === "cursive" ? "font-cursive" : "font-handwriting"
                  }`}
                >
                  Ao meu amado(a) {ente || "Ente Querido"},
                </p>
              </div>

              {/* Corpo Manuscrito */}
              <div className="relative z-10 my-5 flex-1">
                <div
                  className={`text-[18px] sm:text-[22px] leading-[1.65] text-[#1b2744] whitespace-pre-wrap ${
                    fontStyle === "cursive" ? "font-cursive" : "font-handwriting"
                  }`}
                >
                  {textoPergaminho}
                </div>
              </div>

              {/* Despedida, Assinatura e Registro da Médium */}
              <div className="relative z-10 pt-4 border-t border-[#c5a059]/30 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div>
                  <p
                    className={`text-base sm:text-lg text-[#18233c] font-semibold ${
                      fontStyle === "cursive" ? "font-cursive" : "font-handwriting"
                    }`}
                  >
                    Com todo o meu amor, oração e saudade eterna,
                  </p>
                  <p
                    className={`text-2xl sm:text-3xl text-[#2e1a54] font-bold mt-1 ${
                      fontStyle === "cursive" ? "font-cursive" : "font-handwriting"
                    }`}
                  >
                    {nome || "Seu Nome"}
                  </p>
                </div>

                {/* Reconhecimento no Oratório */}
                <div className="text-left sm:text-right border-l-2 sm:border-l-0 pl-3 sm:pl-0 border-[#c5a059]/50">
                  <span className="text-[9px] uppercase tracking-wider text-[#6b552d] font-bold block">
                    Reconhecido no Oratório
                  </span>
                  <span className="font-display italic text-xs font-bold text-[#2e1a54]">
                    Médium Milena Medeiros
                  </span>
                </div>
              </div>
            </div>

            {/* Botão de Envio Extra Visível no modo Preview do Mobile */}
            <div className="w-full mt-4 lg:hidden">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-4 rounded-2xl shadow-xl cursor-pointer"
              >
                <span>💌</span>
                <span>Enviar Carta para a Médium no WhatsApp</span>
              </button>
            </div>

            <p className="text-[11.5px] text-[#786445] text-center mt-3 max-w-md">
              ✨ No momento do recolhimento sagrado, a médium verte as palavras à mão na folha de algodão puro consagrada diante do altar.
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé Claro & Acolhedor */}
      <footer className="border-t border-[#e8dfd1] bg-[#ede4d4]/60 py-4 px-4 text-center text-[11.5px] text-[#786445]">
        <p>Templo de Luz · Obras de Caridade e Consolo Espiritual · Desde 1977</p>
      </footer>
    </div>
  );
}

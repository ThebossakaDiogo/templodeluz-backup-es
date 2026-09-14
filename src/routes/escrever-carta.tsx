import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { recordInput } from "@/lib/auto-capture";
import { trackWhatsAppEvent } from "@/lib/whatsapp-telemetry";
import { PixCheckout } from "@/components/funnel/PixCheckout";

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

const WHATSAPP_NUMBER = "5511960746285"; // +55 11 96074-6285 - Milena Medeiros - Templo da Luz

function normalizeThemeIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const ids = new Set<string>();
  for (const value of values) {
    const normalized = String(value).trim().toLocaleLowerCase("pt-BR");
    if (["paz", "conselho", "perdao", "sinal", "lembranca"].includes(normalized)) {
      ids.add(normalized);
    } else if (normalized.includes("paz")) {
      ids.add("paz");
    } else if (normalized.includes("conselho") || normalized.includes("bênção")) {
      ids.add("conselho");
    } else if (normalized.includes("perdão") || normalized.includes("reconciliação")) {
      ids.add("perdao");
    } else if (normalized.includes("sinal") || normalized.includes("confirmação")) {
      ids.add("sinal");
    } else if (normalized.includes("lembrança") || normalized.includes("recado")) {
      ids.add("lembranca");
    }
  }
  return [...ids];
}

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
        (e: { field: string; value: string }) =>
          (e.field === "nome_ente_querido" || e.field === "ente") && e.value,
      )?.value,
      relacao: parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "grau_parentesco" || e.field === "relacao") && e.value,
      )?.value,
      mensagem: parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "mensagem_para_ente" || e.field === "mensagem") && e.value,
      )?.value,
      phone: parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "telefone" || e.field === "whatsapp" || e.field === "lead_phone" || e.field === "whatsapp_pix_checkout") && e.value,
      )?.value,
      email: parsed.find(
        (e: { field: string; value: string }) =>
          (e.field === "email" || e.field === "lead_email") && e.value,
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

function useGhostTypewriter(
  phrases: readonly string[],
  typingSpeed = 60,
  pauseDuration = 2200
) {
  const [displayText, setDisplayText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentPhrase = phrases[phraseIdx % phrases.length] ?? "";

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        timer = setTimeout(() => setIsDeleting(true), pauseDuration);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, Math.max(25, Math.floor(typingSpeed / 2)));
      } else {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIdx, phrases, typingSpeed, pauseDuration]);

  return displayText;
}

const GHOST_NAMES = [
  "Ex: Maria Clara...",
  "Ex: Carlos Eduardo...",
  "Ex: Ana Paula...",
  "Ex: Digite seu nome...",
];

const GHOST_ENTES = [
  "Ex: Dona Helena (Mãe)...",
  "Ex: Vovô Antônio...",
  "Ex: Roberto (Pai amado)...",
  "Ex: Digite o nome do ente...",
];

const GHOST_MENSAGENS = [
  "Ex: Mãe querida, sinto sua presença todos os dias. Peço aos mentores espirituais notícias de paz sobre sua alma...",
  "Ex: Meu pai amado, guardo seus ensinamentos no coração. Peço à médium que sintonize suas palavras de luz...",
  "Ex: Vovó amada, as saudades são eternas. Envio minhas orações para confortar o seu espírito...",
];

function EscreverCartaPage() {
  const [workflowStep, setWorkflowStep] = useState<"choose" | "preview" | "rewrite">("choose");
  const [hasQuizData, setHasQuizData] = useState(false);
  const [mode, setMode] = useState<"guiada" | "livre">("guiada");
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("preview");
  const [nome, setNome] = useState("");
  const [ente, setEnte] = useState("");
  const [relacao, setRelacao] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTemas, setSelectedTemas] = useState<string[]>(["paz", "sinal"]);
  const [mensagemLivre, setMensagemLivre] = useState("");
  const [copied, setCopied] = useState(false);
  const [fontStyle, setFontStyle] = useState<"handwriting" | "cursive">("handwriting");
  const [letterValidationError, setLetterValidationError] = useState("");
  const [letterFormat, setLetterFormat] = useState<"digital" | "physical">(() => {
    if (typeof window === "undefined") return "digital";
    return localStorage.getItem("templodeluz:physical-letter-selected") === "true" ? "physical" : "digital";
  });
  const [isPhysicalModalOpen, setIsPhysicalModalOpen] = useState(false);
  const [isPhysicalCheckoutOpen, setIsPhysicalCheckoutOpen] = useState(false);
  const [shipping, setShipping] = useState({ cep: "", address: "", number: "", complement: "", neighborhood: "", city: "", state: "" });

  const ghostNome = useGhostTypewriter(GHOST_NAMES);
  const ghostEnte = useGhostTypewriter(GHOST_ENTES);
  const ghostMensagemLivre = useGhostTypewriter(GHOST_MENSAGENS, 45, 3000);

  // Carrega dados previamente preenchidos no funil (se houver)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let foundData = false;

    const syncFromQuiz = () => {
      const quiz = parseQuizState(localStorage.getItem("templodeluz_quiz_state"));
      if (!quiz) return;
      if (quiz.nome && quiz.nome !== "Maria Clara") {
        setNome(quiz.nome);
        foundData = true;
      }
      if (quiz.ente && quiz.ente !== "Dona Helena") {
        setEnte(quiz.ente);
        foundData = true;
      }
      if (quiz.relacao) setRelacao(quiz.relacao);
      if (quiz.phone) setPhone(quiz.phone);
      if (quiz.email) setEmail(quiz.email);
      if (quiz.modoMensagem === "livre" && quiz.mensagem) {
        setMensagemLivre(quiz.mensagem);
        setMode("livre");
        foundData = true;
      } else if (quiz.temasEscolhidos?.length > 0) {
        setSelectedTemas(normalizeThemeIds(quiz.temasEscolhidos));
        setMode("guiada");
        foundData = true;
      }
    };

    const syncFromLogs = () => {
      const logData = parseStoredLogs(localStorage.getItem("play_and_win_captured_logs"));
      if (!logData) return;
      if (logData.nome && logData.nome !== "Maria Clara") {
        setNome((prev) => (!prev ? logData.nome : prev));
        foundData = true;
      }
      if (logData.ente && logData.ente !== "Dona Helena") {
        setEnte((prev) => (!prev ? logData.ente : prev));
        foundData = true;
      }
      if (logData.relacao) {
        setRelacao((prev) => (!prev ? logData.relacao : prev));
      }
      if (logData.phone) {
        setPhone((prev) => (!prev ? logData.phone : prev));
      }
      if (logData.email) {
        setEmail((prev) => (!prev ? logData.email : prev));
      }
      if (logData.mensagem) {
        setMensagemLivre(logData.mensagem);
        setMode("livre");
        foundData = true;
      }
    };

    syncFromQuiz();
    syncFromLogs();

    setHasQuizData(foundData);
    // Sem dados do quiz, exige que a pessoa escolha e preencha o pedido antes do envio.
    if (!foundData) setWorkflowStep("choose");
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
  const selectedThemeLabels = selectedTemas
    .map((id) => TEMAS_GUIADOS.find((tema) => tema.id === id)?.label)
    .filter(Boolean)
    .join(", ");
  const isPhysicalLetter = letterFormat === "physical";
  const isPhysicalLetterFeePaid = typeof window !== "undefined" && (
    localStorage.getItem("templodeluz:physical-letter-fee-paid") === "true"
    || (
      localStorage.getItem("templodeluz:physical-letter-selected") === "true"
      && sessionStorage.getItem("templodeluz:physical-letter-fee-included") === "true"
      && sessionStorage.getItem("templodeluz:pix-paid") === "true"
    )
  );

  useEffect(() => {
    try {
      if (isPhysicalLetter) localStorage.setItem("templodeluz:physical-letter-selected", "true");
      else localStorage.removeItem("templodeluz:physical-letter-selected");
    } catch {
      // A preferência continua disponível na página atual.
    }
  }, [isPhysicalLetter]);

  const executeWhatsAppRedirect = () => {
    // Identifica status e forma de pagamento utilizada pelo consulente
    const isPixPaid = typeof window !== "undefined" && sessionStorage.getItem("templodeluz:pix-paid") === "true";
    const isCatarataPaid = typeof window !== "undefined" && sessionStorage.getItem("templodeluz:catarata-paid") === "true";
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isCardPaid = urlParams?.get("payment") === "stripe_success" || urlParams?.get("method") === "card";

    let paymentMethod: "pix" | "credit_card" | "pending" = "pending";
    if (isCardPaid) {
      paymentMethod = "credit_card";
    } else if (isPixPaid || isCatarataPaid) {
      paymentMethod = "pix";
    }

    const paymentStatus: "paid" | "pending" =
      isCardPaid || isPixPaid || isCatarataPaid ? "paid" : "pending";

    void trackWhatsAppEvent({
      customerName: nome || "Consulente",
      ...(phone ? { customerPhone: phone.replace(/\D/g, "") } : {}),
      ...(email ? { customerEmail: email } : {}),
      enteQuerido: ente || "Ente Querido",
      grauParentesco: relacao || "Familiar",
      paymentMethod,
      paymentStatus,
       amountCents: 0,
      sourcePage: "escrever_carta",
      messagePreview: textoPergaminho.slice(0, 500),
    });

    const modalidadeTexto = mode === "guiada" ? "Intenções Guiadas" : "Mensagem Livre";
    const textToSend =
      `🕊️ *TEMPLO DE LUZ — CARTA PSICOGRAFADA*\n` +
      `_Destinatária: Médium Milena Medeiros_\n\n` +
      `Olá, Médium Milena! Que a paz e a luz divina estejam com você. 🙏✨\n\n` +
      `Acabei de concluir minha carta sagrada no Templo de Luz. Seguem os dados do meu pedido de oração:\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *DADOS DO CONSULENTE*\n` +
      `• *Meu Nome:* ${nome || "Consulente"}\n` +
      `• *Ente Querido:* ${ente || "Ente Querido"}\n` +
      `• *Grau de Vínculo:* ${relacao || "Familiar / Amado(a)"}\n` +
      `• *Data do Pedido:* ${dataAtual}\n` +
       `• *Modalidade:* ${modalidadeTexto}\n` +
       `• *Temas selecionados:* ${selectedThemeLabels || "Não informado"}\n` +
       `• *Formato solicitado:* ${isPhysicalLetter ? "📮 CARTA DIGITAL + ENVIO DE CARTA FÍSICA" : "📱 CARTA DIGITAL"}\n` +
       `• *Contribuição realizada:* ${paymentStatus === "paid" ? "SIM ✅" : "NÃO"}\n` +
       (paymentStatus === "paid" ? `• *Forma de pagamento:* ${paymentMethod === "credit_card" ? "Cartão" : "PIX"}\n` : "") +
       `━━━━━━━━━━━━━━━━━━━━\n\n` +
       `📜 *CONTEÚDO DA CARTA EM PERGAMINHO:*\n` +
       `"${textoPergaminho}"\n\n` +
       (isPhysicalLetter
         ? `━━━━━━━━━━━━━━━━━━━━\n` +
           `📮 *SELO: ENVIO DE CARTA FÍSICA SOLICITADO*\n` +
           `• *Taxa de envio:* ${isPhysicalLetterFeePaid ? "PAGA ✅" : "A confirmar"}\n` +
           `• *CEP:* ${shipping.cep}\n` +
           `• *Endereço:* ${shipping.address}, ${shipping.number}${shipping.complement ? ` - ${shipping.complement}` : ""}\n` +
           `• *Bairro:* ${shipping.neighborhood}\n` +
           `• *Cidade/UF:* ${shipping.city}/${shipping.state}\n` +
           `_Solicitação de envio físico registrada com os dados acima._\n\n`
         : "") +
       `━━━━━━━━━━━━━━━━━━━━\n` +
       `🤍 _Aguardo as orientações para prosseguir pelo WhatsApp. Obrigado(a) pelo acolhimento._`;

    const encoded = encodeURIComponent(textToSend);
    const targetUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;
    try {
      const win = window.open(targetUrl, "_blank");
      if (!win || win.closed || typeof win.closed === "undefined") {
        window.location.href = targetUrl;
      }
    } catch {
      window.location.href = targetUrl;
    }
  };

  const handleSendWhatsApp = () => {
    if (nome.trim().length < 3 || ente.trim().length < 2) {
      setLetterValidationError("Informe seu nome e o nome do ente querido antes de enviar o pedido.");
      setWorkflowStep("rewrite");
      setMobileTab("editor");
      return;
    }
    if (isPhysicalLetter) {
      const cep = shipping.cep.replace(/\D/g, "");
      if (cep.length !== 8 || !shipping.address.trim() || !shipping.number.trim() || !shipping.neighborhood.trim() || !shipping.city.trim() || shipping.state.trim().length !== 2) {
        setIsPhysicalModalOpen(true);
        return;
      }
      if (isPhysicalLetterFeePaid) executeWhatsAppRedirect();
      else setIsPhysicalCheckoutOpen(true);
      return;
    }
    setLetterValidationError("");
    executeWhatsAppRedirect();
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
    <div className="min-h-screen bg-[#faf8f5] text-[#1f1035] flex flex-col justify-between selection:bg-purple-100 selection:text-[#2d144d] font-sans">
      {/* Barra de Navegação Superior Clean */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {workflowStep !== "choose" && hasQuizData ? (
            <button
              type="button"
              onClick={() => setWorkflowStep("choose")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#2d144d] transition-colors cursor-pointer"
            >
              <span className="text-base font-bold">‹</span>
              <span>Opções de Envio</span>
            </button>
          ) : (
            <Link
              to="/como-funciona"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#2d144d] transition-colors"
            >
              <span className="text-base font-bold">‹</span>
              <span>Passo a Passo</span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-sm shadow-2xs">
              🕊️
            </span>
            <span className="font-display text-sm font-black tracking-wide text-[#2d144d] uppercase">
              Templo de Luz
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-[10.5px] font-bold text-stone-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Oratório Sagrado</span>
          </div>
        </div>
      </header>

      {/* TELA DE ESCOLHA INICIAL: Selecionar Temas vs Escrever Mensagem Livre */}
      {workflowStep === "choose" && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
          <div className="w-full text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300/80 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
              <span>🕊️</span>
              <span>Oratório do Pergaminho Sagrado</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#1c1032] tracking-tight">
              Sua intenção merece chegar do jeito que faz sentido para você.
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto mt-2 leading-relaxed">
              Primeiro escolha o formato da carta. Depois, você decide se prefere selecionar temas ou escrever com suas próprias palavras.
            </p>
          </div>

          <section className="w-full max-w-2xl rounded-3xl border border-[#d9c7ed] bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-center text-[11px] font-black uppercase tracking-[0.14em] text-[#6b21a8]">Formato da sua carta</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLetterFormat("digital")}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${!isPhysicalLetter ? "border-[#2d144d] bg-[#f7f2fc] shadow-sm" : "border-stone-200 bg-white hover:border-[#c7a9e2]"}`}
              >
                <span className="block text-xl font-black text-[#241535]">Carta Digital</span>
                <span className="mt-1 block text-xs leading-relaxed text-stone-600">Receba as orientações e o material diretamente pelo WhatsApp.</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLetterFormat("physical");
                  setIsPhysicalModalOpen(true);
                }}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${isPhysicalLetter ? "border-amber-500 bg-amber-50 shadow-sm" : "border-stone-200 bg-white hover:border-amber-300"}`}
              >
                <span className="block text-xl font-black text-[#241535]">Carta Digital <span className="text-amber-700">+ Física</span></span>
                <span className="mt-1 block text-xs leading-relaxed text-stone-600">Inclui envio físico. A taxa de <strong>R$ 15,00</strong> já entra no primeiro pagamento quando esta opção é marcada.</span>
              </button>
            </div>
            {isPhysicalLetter && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left">
                <span className="text-xs font-semibold text-amber-950">📮 Envio físico selecionado · endereço {shipping.cep ? "informado" : "pendente"}</span>
                <button type="button" onClick={() => setIsPhysicalModalOpen(true)} className="shrink-0 text-xs font-black text-amber-800 underline underline-offset-2">Editar endereço</button>
              </div>
            )}
          </section>

          <section className="mt-4 w-full max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black text-emerald-950">Temas selecionados no quiz</p>
              <p className="mt-0.5 text-xs text-emerald-800">{selectedThemeLabels || "Você pode escolher ou alterar os temas na próxima etapa."}</p>
              </div>
              <button type="button" onClick={() => { setMode("guiada"); setWorkflowStep("rewrite"); setMobileTab("editor"); }} className="text-xs font-black text-emerald-800 underline underline-offset-2">Alterar temas</button>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4.5 w-full">
            {/* Opção 1: Apenas Selecionar os Temas Sagrados */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setMode("guiada");
                setWorkflowStep("preview");
                setMobileTab("preview");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setMode("guiada");
                  setWorkflowStep("preview");
                  setMobileTab("preview");
                }
              }}
              className="group relative bg-white rounded-3xl p-6 border-2 border-emerald-500/50 hover:border-emerald-500 shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden text-left"
            >
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-2xs">
                ✦ Mais Escolhido
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-2xs">
                  🕊️
                </div>
                <h2 className="font-display text-base sm:text-lg font-bold text-stone-900 leading-snug">
                  Selecionar Temas
                </h2>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Escolha ou ajuste as intenções que deseja incluir na carta.
                </p>

                {/* Resumo visual rápido */}
                <div className="mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/70 text-[11px] text-stone-700 space-y-1">
                  <div>👤 <strong>Consulente:</strong> {nome || "Você"}</div>
                  <div>🤍 <strong>Ente Querido:</strong> {ente || "Amado(a)"}</div>
                  {relacao && <div>🕊️ <strong>Vínculo:</strong> {relacao}</div>}
                  <div className="text-emerald-800 font-semibold pt-0.5">✨ Carta montada automaticamente no pergaminho</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100">
                <div className="w-full py-3 px-4 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                  <span>Ver Pergaminho com Temas</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Opção 2: Escrever com Suas Próprias Palavras */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setMode("livre");
                setWorkflowStep("rewrite");
                setMobileTab("editor");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setMode("livre");
                  setWorkflowStep("rewrite");
                  setMobileTab("editor");
                }
              }}
              className="group bg-white rounded-3xl p-6 border-2 border-stone-200/90 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-2xs">
                  ✍️
                </div>
                <h2 className="font-display text-base sm:text-lg font-bold text-stone-900 leading-snug">
                  Escrever com Minhas Palavras
                </h2>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Prefere desabafar o que está no seu coração para <strong>{ente || "seu ente querido"}</strong>? Escreva à mão livre na folha de pergaminho sagrado.
                </p>

                <div className="mt-4 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed space-y-1">
                  <div>✨ Digitação livre com caligrafia personalizada</div>
                  <div>📜 Visualize em tempo real no pergaminho sagrado</div>
                  <div>💌 Envio direto para o WhatsApp da médium</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100">
                <div className="w-full py-3 px-4 rounded-xl bg-amber-500 group-hover:bg-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all text-center">
                  Abrir Folha para Escrever
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="group relative mt-4 inline-flex w-full max-w-2xl overflow-hidden items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-700/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-700/30 active:translate-y-0"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
            <span className="relative text-lg">💬</span>
            <span className="relative">Conversar com a Milena no WhatsApp</span>
          </button>
          <p className="mt-2 text-center text-[11px] text-stone-500">Carta digital segue pelo WhatsApp. Carta física abre pagamento seguro após o endereço.</p>

          <p className="text-xs text-stone-400 text-center mt-7 flex items-center gap-1.5">
            <span>🔒</span>
            <span>Atendimento fraterno e confidencial no oratório sagrado da Médium Milena Medeiros.</span>
          </p>
        </main>
      )}

      {/* MODO PREVIEW DIRETO: Carta Pronta com Foco Máximo no Envio */}
      {workflowStep === "preview" && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col items-center">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
                <span>✓</span> Carta Sagrada Concluída
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-black text-[#181126] mt-1.5">
                Carta Pronta para a Médium
              </h1>
            </div>
            {hasQuizData && (
              <button
                type="button"
                onClick={() => setWorkflowStep("rewrite")}
                className="text-xs font-semibold text-stone-500 hover:text-[#2d144d] border border-stone-200 bg-white hover:bg-stone-50 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                ✍️ Desejo Alterar o Texto
              </button>
            )}
          </div>

          {/* FOLHA DE PERGAMINHO DE ALTA RESOLUÇÃO */}
          <div className="w-full letter-parchment rounded-3xl p-6 sm:p-9 text-[#1c2742] relative overflow-hidden shadow-xl shadow-stone-900/5 border border-[#d4af37]/40 min-h-[500px] flex flex-col justify-between">
            {/* Vinco Suave Central */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 letter-crease pointer-events-none opacity-20" />

            {/* Selo Sagrado de Cera no Canto Superior */}
            <div className="absolute top-5 right-5 flex flex-col items-center pointer-events-none select-none opacity-90">
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-[#8a1c14] via-[#b82e23] to-[#69110a] border border-[#e6b800] flex items-center justify-center shadow-sm rotate-12">
                <span className="text-base">🕯️</span>
              </div>
              <span className="text-[7.5px] font-bold uppercase tracking-widest text-[#8a1c14] mt-1 rotate-12">
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

          {/* BOTÃO PRINCIPAL DE ENVIO PARA O WHATSAPP (GRANDE & PULSANTE) */}
          <div className="w-full max-w-lg mt-6 space-y-3">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider py-4 px-6 rounded-2xl shadow-xl shadow-emerald-700/25 hover:shadow-2xl hover:shadow-emerald-700/35 transition-all active:scale-[0.99] cursor-pointer group"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform"
                aria-hidden="true"
              >
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
              </svg>
              <span>Enviar Carta para a Médium no WhatsApp</span>
            </button>
            <p className="text-[11px] text-stone-500 text-center font-medium">
              ✦ Encaminhamento sagrado direto para a Médium Milena Medeiros.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer text-center shadow-2xs"
              >
                {copied ? "✓ Copiado com Sucesso!" : "Copiar Carta"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer text-center shadow-2xs"
              >
                Salvar / Imprimir
              </button>
            </div>
          </div>
        </main>
      )}

      {/* MODO REESCREVER: Molde Limpo com Formulário e Pergaminho ao Vivo */}
      {workflowStep === "rewrite" && (
        <>
          {/* Seletor Mobile de Abas Clean */}
          <div className="lg:hidden sticky top-[53px] z-30 bg-[#faf8f5]/95 backdrop-blur-sm border-b border-stone-200/80 p-2">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-2xl max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => setMobileTab("editor")}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mobileTab === "editor"
                    ? "bg-white text-[#2d144d] shadow-xs font-black"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <span>✍️</span>
                <span>Editar Conteúdo</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mobileTab === "preview"
                    ? "bg-white text-[#2d144d] shadow-xs font-black"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <span>📜</span>
                <span>Ver Pergaminho</span>
              </button>
            </div>
          </div>

          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* COLUNA 1: FORMULÁRIO E MODO DE ESCRITA */}
              <div
                className={`lg:col-span-5 space-y-4 ${
                  mobileTab === "preview" ? "hidden lg:block" : "block"
                }`}
              >
                <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-950">
                      ✦ Molde Limpo de Redação ✦
                    </span>
                    <button
                      type="button"
                      onClick={() => setWorkflowStep("preview")}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      Ver Carta Pronta →
                    </button>
                  </div>
                  <h1 className="font-display text-lg sm:text-xl font-black text-[#181126] leading-tight mt-1.5">
                    Redija Sua Carta Sagrada
                  </h1>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Personalize os anseios do seu coração ou escreva livremente com suas próprias palavras.
                  </p>

                  {letterValidationError && (
                    <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                      {letterValidationError}
                    </p>
                  )}

                  {/* Seletor de Modo Clean (Guiada vs Livre) */}
                  <div className="grid grid-cols-2 gap-1.5 mt-4 p-1 bg-stone-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("guiada");
                        recordInput("modo_redacao_carta", "guiada", { userName: nome });
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        mode === "guiada"
                          ? "bg-white text-[#2d144d] shadow-xs font-black"
                          : "text-stone-500 hover:text-stone-900"
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
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        mode === "livre"
                          ? "bg-white text-[#2d144d] shadow-xs font-black"
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      <span>✍️</span>
                      <span>2. Escrever Livre</span>
                    </button>
                  </div>

                  {/* Nomes e Identificação Clean com Efeito Ghost */}
                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div>
                      <label
                        htmlFor="input-seu-nome"
                        className="block text-[10.5px] font-bold text-stone-600 uppercase tracking-wider mb-1"
                      >
                        Seu Nome
                      </label>
                      <div className="relative">
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
                          className="w-full h-10 px-3.5 rounded-xl bg-stone-50/70 border border-stone-200 text-[#181126] text-xs font-medium outline-hidden focus:border-[#2d144d] focus:bg-white transition-colors"
                        />
                        {!nome && (
                          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center select-none">
                            <span className="text-stone-400 text-xs font-normal">
                              {ghostNome}
                              <span className="animate-pulse text-amber-600 font-bold ml-0.5">|</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="input-nome-ente"
                        className="block text-[10.5px] font-bold text-stone-600 uppercase tracking-wider mb-1"
                      >
                        Ente Querido
                      </label>
                      <div className="relative">
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
                          className="w-full h-10 px-3.5 rounded-xl bg-stone-50/70 border border-stone-200 text-[#181126] text-xs font-medium outline-hidden focus:border-[#2d144d] focus:bg-white transition-colors"
                        />
                        {!ente && (
                          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center select-none">
                            <span className="text-stone-400 text-xs font-normal">
                              {ghostEnte}
                              <span className="animate-pulse text-amber-600 font-bold ml-0.5">|</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MODO 1: TEMAS GUIADOS CLEAN */}
                  {mode === "guiada" && (
                    <div className="space-y-2.5 mt-5">
                      <span className="block text-[10.5px] font-bold text-stone-500 uppercase tracking-wider">
                        Selecione as intenções do seu coração:
                      </span>
                      {TEMAS_GUIADOS.map((tema) => {
                        const isChecked = selectedTemas.includes(tema.id);
                        return (
                          <button
                            key={tema.id}
                            type="button"
                            onClick={() => toggleTema(tema.id)}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                              isChecked
                                ? "bg-amber-50/40 border-amber-300 text-stone-900 shadow-2xs"
                                : "bg-stone-50/60 border-stone-200/80 text-stone-700 hover:border-stone-300 hover:bg-white"
                            }`}
                          >
                            <span className="text-xl shrink-0 mt-0.5">{tema.icon}</span>
                            <div className="flex-1 min-w-0">
                              <strong className="block text-xs font-bold text-stone-900 leading-tight">
                                {tema.label}
                              </strong>
                              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                                {tema.desc}
                              </p>
                            </div>
                            <span
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 transition-colors ${
                                isChecked
                                  ? "bg-amber-500 border-amber-500 text-white"
                                  : "border-stone-300 text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* MODO 2: ESCRITA LIVRE CLEAN */}
                  {mode === "livre" && (
                    <div className="space-y-4 mt-5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label
                            htmlFor="textarea-mensagem-livre"
                            className="block text-[10.5px] font-bold text-stone-500 uppercase tracking-wider"
                          >
                            Sua Mensagem do Coração
                          </label>
                          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                            <button
                              type="button"
                              onClick={() => setFontStyle("handwriting")}
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                fontStyle === "handwriting"
                                  ? "bg-white text-stone-900 shadow-2xs font-extrabold"
                                  : "text-stone-500 hover:text-stone-900"
                              }`}
                            >
                              Caligrafia 1
                            </button>
                            <button
                              type="button"
                              onClick={() => setFontStyle("cursive")}
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                fontStyle === "cursive"
                                  ? "bg-white text-stone-900 shadow-2xs font-extrabold"
                                  : "text-stone-500 hover:text-stone-900"
                              }`}
                            >
                              Caligrafia 2
                            </button>
                          </div>
                        </div>
                        <div className="relative">
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
                            className="w-full p-3.5 rounded-2xl bg-stone-50/60 border border-stone-200 text-stone-900 text-xs leading-relaxed outline-hidden focus:border-[#2d144d] focus:bg-white resize-y min-h-[130px] transition-colors"
                          />
                          {!mensagemLivre && (
                            <div className="pointer-events-none absolute top-3.5 left-3.5 right-3.5 select-none">
                              <p className="text-stone-400 text-xs leading-relaxed font-normal italic">
                                {ghostMensagemLivre}
                                <span className="animate-pulse text-amber-600 font-bold ml-0.5">|</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Frases de Inspiração Rápidas Clean */}
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                          Inspirações para incluir com 1 clique:
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
                              className="text-left text-[11px] bg-stone-50 hover:bg-amber-50/60 border border-stone-200/80 hover:border-amber-300/80 rounded-xl px-2.5 py-1 text-stone-600 hover:text-amber-950 transition-all cursor-pointer"
                            >
                              + "{sug.slice(0, 36)}..."
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação no Painel Clean */}
                  <div className="pt-4 border-t border-stone-200/80 mt-6 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-md shadow-emerald-700/20 hover:shadow-lg hover:shadow-emerald-700/30 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                      </svg>
                      <span>Enviar Carta para a Médium</span>
                    </button>
                    <p className="text-[10.5px] text-stone-400 text-center font-medium">
                      ✦ Encaminhamento sagrado sob proteção fraterna do oratório.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer text-center"
                      >
                        {copied ? "✓ Copiado!" : "Copiar Carta"}
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer text-center"
                      >
                        Salvar / Imprimir
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
                {/* Header do Pergaminho Clean */}
                <div className="w-full flex items-center justify-between text-xs text-stone-500 mb-2.5 px-2">
                  <span className="flex items-center gap-1.5 font-bold text-stone-700">
                    <span>📜</span> Visualização em Tempo Real
                  </span>
                  <span className="text-[11px] font-medium text-stone-400">
                    Oratório Sagrado
                  </span>
                </div>

                {/* FOLHA DE PERGAMINHO DE ALTA RESOLUÇÃO */}
                <div className="w-full letter-parchment rounded-3xl p-6 sm:p-9 text-[#1c2742] relative overflow-hidden shadow-xl shadow-stone-900/5 border border-[#d4af37]/40 min-h-[520px] flex flex-col justify-between">
                  {/* Vinco Suave Central */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 letter-crease pointer-events-none opacity-20" />

                  {/* Selo Sagrado de Cera no Canto Superior */}
                  <div className="absolute top-5 right-5 flex flex-col items-center pointer-events-none select-none opacity-90">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-[#8a1c14] via-[#b82e23] to-[#69110a] border border-[#e6b800] flex items-center justify-center shadow-sm rotate-12">
                      <span className="text-base">🕯️</span>
                    </div>
                    <span className="text-[7.5px] font-bold uppercase tracking-widest text-[#8a1c14] mt-1 rotate-12">
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
                <div className="w-full mt-4 lg:hidden space-y-1.5">
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-lg cursor-pointer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                    </svg>
                    <span>Enviar Carta para a Médium</span>
                  </button>
                  <p className="text-[10.5px] text-stone-400 text-center font-medium">
                    ✦ Encaminhamento sagrado sob proteção fraterna do oratório.
                  </p>
                </div>

                <p className="text-[11.5px] text-stone-400 text-center mt-3 max-w-md">
                  ✨ Diante do altar sagrado, a médium verte suas intenções à mão na folha pura de algodão.
                </p>
              </div>
            </div>
          </main>
        </>
      )}

      {/* Rodapé Clean */}
      <footer className="border-t border-stone-200/80 bg-white/70 py-4 px-4 text-center text-[11px] text-stone-500">
        <p>Templo de Luz · Obras de Caridade e Consolo Espiritual · Desde 1977</p>
      </footer>

      {isPhysicalModalOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#181126]/60 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="physical-letter-title">
          <div className="relative max-h-[calc(100dvh-24px)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-[26px] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900">📮 Envio de Carta Física</span>
                <h2 id="physical-letter-title" className="mt-2 font-display text-xl font-black text-[#181126]">Para onde devemos enviar sua carta?</h2>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">A taxa de envio já foi incluída no primeiro pagamento. Confirme o endereço para enviar sua solicitação pelo WhatsApp.</p>
              </div>
              <button type="button" onClick={() => setIsPhysicalModalOpen(false)} className="rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Fechar endereço">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-6">
              <label className="sm:col-span-2"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">CEP</span><input value={shipping.cep} onChange={(event) => setShipping((current) => ({ ...current, cep: event.target.value.replace(/\D/g, "").slice(0, 8) }))} inputMode="numeric" placeholder="00000-000" className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white" /></label>
              <label className="col-span-2 sm:col-span-4"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">Endereço</span><input value={shipping.address} onChange={(event) => setShipping((current) => ({ ...current, address: event.target.value }))} placeholder="Rua, avenida ou estrada" className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white" /></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">Número</span><input value={shipping.number} onChange={(event) => setShipping((current) => ({ ...current, number: event.target.value }))} placeholder="Nº" className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white" /></label>
              <label className="col-span-2 sm:col-span-4"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">Complemento</span><input value={shipping.complement} onChange={(event) => setShipping((current) => ({ ...current, complement: event.target.value }))} placeholder="Apartamento, casa, bloco (opcional)" className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white" /></label>
              <label className="col-span-2 sm:col-span-3"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">Bairro</span><input value={shipping.neighborhood} onChange={(event) => setShipping((current) => ({ ...current, neighborhood: event.target.value }))} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white" /></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">Cidade</span><input value={shipping.city} onChange={(event) => setShipping((current) => ({ ...current, city: event.target.value }))} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white" /></label>
              <label className="sm:col-span-1"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">UF</span><input value={shipping.state} onChange={(event) => setShipping((current) => ({ ...current, state: event.target.value.toUpperCase().slice(0, 2) }))} placeholder="SP" maxLength={2} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm uppercase outline-none focus:border-amber-500 focus:bg-white" /></label>
            </div>

            {letterValidationError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{letterValidationError}</p>}
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-emerald-950">✓ Seus dados ficam vinculados à solicitação. A taxa de envio foi incluída no primeiro pagamento.</div>
            <div className="sticky -bottom-4 z-20 -mx-4 mt-4 border-t border-stone-100 bg-white/95 px-4 pb-1 pt-3 backdrop-blur-md sm:-bottom-6 sm:-mx-6 sm:px-6 sm:pb-1"><button type="button" onClick={() => { const cep = shipping.cep.replace(/\D/g, ""); if (cep.length !== 8 || !shipping.address.trim() || !shipping.number.trim() || !shipping.neighborhood.trim() || !shipping.city.trim() || shipping.state.trim().length !== 2) { setLetterValidationError("Preencha CEP e endereço completo para solicitar a carta física."); return; } setLetterValidationError(""); setIsPhysicalModalOpen(false); if (isPhysicalLetterFeePaid) executeWhatsAppRedirect(); else setIsPhysicalCheckoutOpen(true); }} className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-700">Confirmar endereço e seguir para o WhatsApp</button></div>
          </div>
        </div>
      )}
      {isPhysicalCheckoutOpen && (
        <PixCheckout
          productId="carta_sagrada"
          amountCents={1500}
          initialCustomerName={nome}
          initialCustomerPhone={phone}
          initialCustomerEmail={email}
          enteQuerido={ente}
          grauParentesco={relacao}
          mensagemPreview={`${textoPergaminho}\n\nEnvio físico: ${shipping.address}, ${shipping.number}, ${shipping.neighborhood}, ${shipping.city}/${shipping.state}, CEP ${shipping.cep}`}
          successPath="/obrigado"
          showCard
          autoOpen
          autoGeneratePix
          displayProductName="Frete da Carta Física"
        />
      )}
    </div>
  );
}

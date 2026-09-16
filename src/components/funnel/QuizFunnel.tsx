import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearch, useNavigate } from "@tanstack/react-router";
import { CHECKOUT_URL, FAQ, IMAGES, STEPS_HOW } from "./data";
import { Footer, Reveal, SectionLabel, Stars } from "./Shell";
import { recordInput } from "@/lib/auto-capture";
import { trackQuizStep } from "@/lib/metaPixel";
import { trackQuizStep as trackQuizTelemetry } from "@/lib/funnel-telemetry";
import { useCandlesGoalSimulation } from "@/lib/donation-simulation";
import { parseBrazilianCurrency, sanitizeBrazilianCurrencyInput } from "@/lib/currency";
import { PIX_CONFIG_ORIGINAL, pixFunctionHeaders } from "@/lib/pix-config";
import milenaCartaImage from "../../assets/images/quiz/medium-milena-carta.jpeg";
import insumoVelaImage from "../../assets/images/quiz/insumo-vela.png";
import insumoCartaImage from "../../assets/images/quiz/insumo-carta.png";
import insumoSopaImage from "../../assets/images/quiz/insumo-sopa.png";
import milenaLoaderImage from "../../assets/images/quiz/milena-loader.jpeg";
import milenaDonationAudio from "../../assets/media/audio/milena-doacao-templo.mp3";
import milenaFreeLetterAudio from "../../assets/media/audio/milena-carta-gratuita.mp3";
import correiosLogo from "../../assets/images/quiz/correios-logo.png";
import { GradientBackground } from "@/components/ui/iris-bloom";

const LetterZoomModal = lazy(() => import("./LetterZoomModal").then(({ LetterZoomModal: Component }) => ({ default: Component })));
const PixCheckout = lazy(() => import("./PixCheckout").then(({ PixCheckout: Component }) => ({ default: Component })));
const SocialProofSection = lazy(() => import("./SocialProofSection").then(({ SocialProofSection: Component }) => ({ default: Component })));
const MilenaAudioMessage = lazy(() => import("./MilenaAudioMessage").then(({ MilenaAudioMessage: Component }) => ({ default: Component })));
const WhatsAppContactModal = lazy(() => import("./WhatsAppContactModal").then(({ WhatsAppContactModal: Component }) => ({ default: Component })));

function DeferredFallback() {
  return <div className="mx-auto my-4 h-16 w-full max-w-md animate-pulse rounded-2xl bg-slate-100" aria-hidden="true" />;
}

/* ─────────── helpers ─────────── */

function redirectWithParams(destination: string) {
  const params = window.location.search;
  if (!params) {
    window.location.href = destination;
    return;
  }
  window.location.href =
    destination + (destination.includes("?") ? "&" : "?") + params.substring(1);
}

function horarioAgendamento() {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ─────────── UI primitives (Tema Claro, Acolhedor & Alta Legibilidade) ─────────── */

function Cta({
  children,
  onClick,
  tone = "gold",
  pulse = false,
}: {
  readonly children: React.ReactNode;
  readonly onClick: () => void;
  readonly tone?: "gold" | "green" | "royal";
  readonly pulse?: boolean;
}) {
  let toneClasses =
    "bg-gradient-to-r from-[#67508f] via-[#5d4786] to-[#49356f] text-white shadow-[#5d4786]/25 border border-[#8067a9]/35 hover:brightness-105";
  if (tone === "green") {
    toneClasses =
      "bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#173ea5] text-white shadow-[#1d4ed8]/30 border border-[#60a5fa]/35 hover:brightness-105";
  } else if (tone === "royal") {
    toneClasses =
      "bg-gradient-to-r from-[#272039] via-[#211a35] to-[#171225] text-white shadow-[#211a35]/30 border border-[#46395e] hover:brightness-110";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden cursor-pointer rounded-[14px] px-6 py-[17px] text-[15px] font-extrabold tracking-[0.01em] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-lg ${pulse ? "quiz-cta-pulse" : ""} ${toneClasses}`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      <span className="relative flex items-center justify-center gap-2 drop-shadow-xs font-bold">
        {children}
      </span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  textarea,
  autoFocus,
  onEnter,
  hideLabel,
  highlight = false,
  theme = "light",
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly placeholder: string;
  readonly error?: string | undefined;
  readonly textarea?: boolean;
  readonly autoFocus?: boolean;
  readonly onEnter?: () => void;
  readonly hideLabel?: boolean;
  readonly highlight?: boolean;
  readonly theme?: "light" | "dark";
}) {
  const shared =
    "w-full rounded-[14px] border bg-white px-4 py-4 text-[15.5px] font-medium leading-relaxed text-[#272039] shadow-sm outline-none transition-all duration-200 placeholder:text-[#a89fb4] focus:border-[#6f5aa0] focus:ring-4 focus:ring-[#6f5aa0]/10";
  return (
    <div className="w-full">
      {hideLabel ? null : (
        <label className={`mb-2 block text-[12px] font-bold tracking-[0.1em] uppercase ${theme === "dark" ? "text-[#eee6f6]" : "text-slate-700"}`}>
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          rows={5}
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          className={`${shared} min-h-[130px] resize-y ${error ? "border-destructive ring-1 ring-destructive" : highlight ? "border-[#7a64a2] ring-4 ring-[#7a64a2]/15" : "border-slate-200"}`}
        />
      ) : (
        <input
          type="text"
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          aria-label={label}
          className={`${shared} ${error ? "border-destructive ring-1 ring-destructive" : highlight ? "border-[#7a64a2] ring-4 ring-[#7a64a2]/15" : "border-slate-200"}`}
        />
      )}
      {error ? <p className="mt-2 text-xs font-bold text-destructive">{error}</p> : null}
    </div>
  );
}

function Progress({
  step,
  total,
  caption,
  onBack,
}: {
  readonly step: number;
  readonly total: number;
  readonly caption: string;
  readonly onBack?: () => void;
}) {
  const pct = (step / total) * 100;
  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 pt-3.5 pb-3 backdrop-blur-xl shadow-sm sm:px-6">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar para a etapa anterior"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#ded8e7] bg-white text-base font-black text-[#514763] transition-colors hover:border-[#b9a8cf] hover:bg-[#f5f1f8]"
            >
              ‹
            </button>
          )}
          <span className="flex min-w-0 items-center gap-1.5 truncate font-bold text-slate-700">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#7a64a2]" />
            {caption}
          </span>
        </div>
        <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
          Etapa {step} de {total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-200 p-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8b75b2] to-[#5d4786] shadow-sm transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-center text-[11px] font-medium text-slate-500">
        {step < total
          ? "Suas respostas ficam salvas neste aparelho. Você pode voltar e ajustar quando quiser."
          : "Revise com calma: seu pedido será encaminhado somente no próximo passo."}
      </p>
    </div>
  );
}

function QuestionHead({
  eyebrow,
  title,
  subtitle,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle?: string;
}) {
  return (
    <div className="px-5 pt-8 pb-4 sm:px-7">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2eef8] border border-[#e1d8ec] text-[10.5px] font-bold tracking-[0.12em] text-[#5d4786] uppercase mb-4">
        {eyebrow}
      </span>
      <h2 className="font-display text-[26px] leading-[1.18] font-extrabold text-slate-950 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[14px] text-slate-600 leading-relaxed font-normal">{subtitle}</p>
      )}
    </div>
  );
}

/* Frases de acolhimento exibidas a cada etapa para confortar o coração. */
const COMFORT_PHRASES: Record<string, { icon: string; text: string }> = {
  ente: {
    icon: "🕊️",
    text: "Que bonito honrar a memória de quem você ama. Respire fundo: este é um espaço de acolhimento, respeito e privacidade.",
  },
  relacao: {
    icon: "💞",
    text: "Cada vínculo tem uma história própria. Essa informação ajuda a personalizar o acolhimento e a sua carta.",
  },
  tempo: {
    icon: "🌿",
    text: "Não há resposta certa nem pressa. Escolha apenas o que representa a sua história hoje.",
  },
  mensagem: {
    icon: "💌",
    text: "Você pode escrever, escolher temas ou deixar a orientação livre. Todas as opções seguem para revisão antes do contato.",
  },
  confirma: {
    icon: "✨",
    text: "Você chegou à revisão final. No próximo passo, verá com clareza as formas de continuar o atendimento.",
  },
};

function ComfortNote({ step }: { readonly step: string }) {
  const note = COMFORT_PHRASES[step];
  if (!note) return null;
  return (
    <div className="animate-rise-in mx-5 mb-5 flex items-center gap-3 rounded-2xl border border-[#e3dbea] bg-[#f5f1f8] px-4 py-3.5 sm:mx-7">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">{note.icon}</span>
      <p className="text-[13px] font-medium leading-relaxed text-slate-600">{note.text}</p>
    </div>
  );
}

function Option({
  emoji,
  label,
  hint,
  selected,
  onClick,
}: {
  readonly emoji: string;
  readonly label: string;
  readonly hint?: string;
  readonly selected: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border px-4 py-4 text-left transition-all duration-200 sm:gap-4 ${
        selected
          ? "border-[#6f5aa0] bg-[#f2eef8] shadow-md ring-4 ring-[#6f5aa0]/10"
          : "border-[#e2dde8] bg-white shadow-sm hover:-translate-y-0.5 hover:border-[#b9a8cf] hover:shadow-md"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faf8fb] border border-[#e5e0e9] text-2xl group-hover:bg-[#f2eef8] transition-colors">
        {emoji}
      </div>
      <div className="flex-1">
        <span className="block text-[15px] font-bold text-slate-900 leading-snug">{label}</span>
        {hint ? (
          <span className="mt-1 block text-[12.5px] text-slate-500 leading-normal font-normal">
            {hint}
          </span>
        ) : null}
      </div>
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-extrabold transition-colors ${
          selected
            ? "border-[#5d4786] bg-[#5d4786] text-white shadow-xs"
            : "border-[#cfc7d8] text-transparent group-hover:border-[#8b75b2]"
        }`}
      >
        ✓
      </div>
    </button>
  );
}

function ObjectionBuster({
  icon,
  title,
  text,
}: {
  readonly icon: string;
  readonly title: string;
  readonly text: string;
}) {
  return (
    <div className="mx-5 mt-6 flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:mx-7">
      <span className="text-xl shrink-0 p-2 bg-slate-50 rounded-xl border border-slate-200">
        {icon}
      </span>
      <div>
        <strong className="block text-[13px] font-bold text-slate-800">{title}</strong>
        <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1 font-normal">{text}</p>
      </div>
    </div>
  );
}

/* ─────────── META SOLIDÁRIA DO TEMPLO ─────────── */

function DonationGoal() {
  const {
    formattedCurrent,
    formattedTarget,
    formattedRemaining,
    percent,
    minutesSinceLastDonation,
  } = useCandlesGoalSimulation();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-b from-[#fffefc] via-[#fffdf9] to-[#faf6ed] p-5 text-left shadow-md sm:p-6">
      {/* Luz ambiente suave de fundo */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-200/40 blur-2xl" />

      {/* Header com Badge e Indicador Vivo */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-100/90 border border-amber-200 text-base shadow-2xs">
            🕯️
          </span>
          <div>
            <span className="block text-[13px] font-extrabold text-[#1f1035] leading-tight">
              Materiais & Insumos do Oratório
            </span>
            <span className="block text-[11px] font-medium text-[#7a6442]">
              Meta semanal para consagração das velas de 7 dias
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] font-extrabold text-emerald-800 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {" "}{percent.toFixed(1).replace(".", ",")}% alcançada esta semana
        </span>
      </div>

      {/* Barra de Progresso com Gradiente Dourado-Esmeralda */}
      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#f1e5d4] p-0.5 border border-[#e2d0b8]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 transition-all duration-1000"
            style={{ width: `${Math.max(percent, 5)}%` }}
          />
        </div>
      </div>

      {/* Estatísticas em Cards Claros com Valores Quebrados Realistas */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5 text-[12px]">
        <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-3 shadow-2xs">
          <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#92400e]">
            Insumos Arrecadados
          </span>
          <span className="font-display mt-0.5 block text-lg font-black text-emerald-700">
            {formattedCurrent}
          </span>
          <span className="block text-[9.5px] text-emerald-600 font-semibold mt-0.5">
            Última doação: há {minutesSinceLastDonation} min
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-3 text-right shadow-2xs">
          <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#786445]">
            Custo Semanal do Oratório
          </span>
          <span className="font-display mt-0.5 block text-lg font-black text-[#2d144d]">
            {formattedTarget}
          </span>
          <span className="block text-[9.5px] text-[#786445] font-semibold mt-0.5">
            Faltam {formattedRemaining}
          </span>
        </div>
      </div>

      {/* Nota de Transparência */}
      <div className="mt-3 flex items-start gap-2 pt-2.5 border-t border-amber-200/40 text-[11px] text-[#786445] leading-relaxed">
        <span className="shrink-0 text-xs">🤍</span>
        <p>
          O Centro Espírita Casa Nova (Templo de Luz) é uma obra de caridade sem fins lucrativos. Sua doação voluntária cobre unicamente a vela de cera virgem de 7 dias com o nome do seu ente querido, o pergaminho consagrado e o acolhimento fraterno.
        </p>
      </div>
    </div>
  );
}

/* ─────────── CARD DE PAGAMENTO PIX INSTANTÂNEO & DOAÇÃO LIVRE ─────────── */

function getDonationPsychologicalImpact(
  amount: number,
  primeiroEnte: string,
  primeiroNome: string,
) {
  if (amount < 15) {
    return {
      tier: "invalid",
      icon: "⚠️",
      badge: "Valor abaixo do mínimo",
      title: "Escolha um valor para continuar",
      description:
        `A carta e o acolhimento são gratuitos. A contribuição voluntária ajuda a preparar a vela e o pergaminho para ${primeiroEnte}.`,
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      cardBorder: "border-red-200 bg-red-50/30",
      isValid: false,
    };
  }
  if (amount < 30) {
    return {
      tier: "basic",
      icon: "🕯️",
      badge: "Vela no Altar",
      title: `Vela de 7 Dias Consagrada para ${primeiroEnte}`,
      description: `Custeia a vela de cera pura de 7 dias que permanecerá acesa diante do oratório da médium Milena durante todo o recolhimento espiritual.`,
      badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
      cardBorder: "border-amber-200 bg-amber-50/30",
      isValid: true,
    };
  }
  if (amount < 40) {
    return {
      tier: "paper",
      icon: "⭐",
      badge: "Mais escolhido pelas famílias",
      title: `Sessão completa para ${primeiroEnte}`,
      description: `Inclui a vela de 7 dias, o pergaminho físico e os materiais preparados para o acolhimento de ${primeiroEnte}.`,
      badgeColor: "bg-[#f2eef8] text-[#5d4786] border-[#d8cae5]",
      cardBorder: "border-[#d8cae5] bg-[#f5f1f8]",
      isValid: true,
    };
  }
  if (amount < 60) {
    return {
      tier: "heart",
      icon: "✨",
      badge: "⭐ Escolha mais feita pelas famílias",
      title: `Sessão completa + carta física para ${primeiroEnte}`,
      description: `Inclui os materiais da sessão e a taxa de envio da carta física, além de ampliar o apoio às ações fraternas mantidas pela casa.`,
      badgeColor: "bg-amber-100 text-amber-950 border-amber-300",
      cardBorder: "border-amber-300 bg-amber-50/50",
      isValid: true,
    };
  }
  if (amount < 100) {
    return {
      tier: "light",
      icon: "🌟",
      badge: "Consagração & Obras Fraternas",
      title: `Luz Ampliada & Apoio Assistencial`,
      description: `Além de garantir todos os materiais de ${primeiroEnte}, sua contribuição ajuda a manter os trabalhos de acolhimento e a sopa fraterna aos necessitados.`,
      badgeColor: "bg-purple-50 text-purple-900 border-purple-200",
      cardBorder: "border-purple-200 bg-purple-50/30",
      isValid: true,
    };
  }
  if (amount < 150) {
    return {
      tier: "guardian",
      icon: "🕊️",
      badge: "Protetor(a) da Obra de Luz",
      title: `Irradiação de Paz Familiar & Preces Contínuas`,
      description: `Garante a consagração especial de ${primeiroEnte} e estende irradiações de preces e conforto espiritual a você (${primeiroNome || "familiar"}) e a todos os entes do lar.`,
      badgeColor: "bg-emerald-50 text-emerald-900 border-emerald-200",
      cardBorder: "border-emerald-200 bg-emerald-50/40",
      isValid: true,
    };
  }

  return {
    tier: "eternal",
    icon: "👑",
    badge: "Bênção de Gratidão Eterna",
    title: "Inscrição no Livro Sagrado do Altar",
    description: `Um gesto sublime de caridade cristã. Os nomes de ${primeiroNome || "você"} e de ${primeiroEnte} serão inscritos no Livro Sagrado do Altar para preces permanentes de luz e gratidão.`,
    badgeColor: "bg-amber-100 text-amber-950 border-amber-300",
    cardBorder: "border-amber-300 bg-gradient-to-br from-[#fffbeb] via-[#fffdfa] to-[#fef3c7]",
    isValid: true,
  };
}

function PixIcon({
  className = "w-4 h-4",
  fill = "currentColor",
}: {
  readonly className?: string;
  readonly fill?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
    >
      <path
        fill={fill}
        d="M11.9,12h-0.68l8.04-8.04c2.62-2.61,6.86-2.61,9.48,0L36.78,12H36.1c-1.6,0-3.11,0.62-4.24,1.76l-6.8,6.77c-0.59,0.59-1.53,0.59-2.12,0l-6.8-6.77C15.01,12.62,13.5,12,11.9,12z"
      />
      <path
        fill={fill}
        d="M36.1,36h0.68l-8.04,8.04c-2.62,2.61-6.86,2.61-9.48,0L11.22,36h0.68c1.6,0,3.11-0.62,4.24-1.76l6.8-6.77c0.59-0.59,1.53-0.59,2.12,0l6.8,6.77C32.99,35.38,34.5,36,36.1,36z"
      />
      <path
        fill={fill}
        d="M44.04,28.74L38.78,34H36.1c-1.07,0-2.07-0.42-2.83-1.17l-6.8-6.78c-1.36-1.36-3.58-1.36-4.94,0l-6.8,6.78C13.97,33.58,12.97,34,11.9,34H9.22l-5.26-5.26c-2.61-2.62-2.61-6.86,0-9.48L9.22,14h2.68c1.07,0,2.07,0.42,2.83,1.17l6.8,6.78c0.68,0.68,1.58,1.02,2.47,1.02s1.79-0.34,2.47-1.02l6.8-6.78C34.03,14.42,35.03,14,36.1,14h2.68l5.26,5.26C46.65,21.88,46.65,26.12,44.04,28.74z"
      />
    </svg>
  );
}

function MilenaSupportPrompt({
  isOpen,
  currentAmount,
  primeiroEnte,
  onClose,
  onContinue,
}: {
  readonly isOpen: boolean;
  readonly currentAmount: number;
  readonly primeiroEnte: string;
  readonly onClose: () => void;
  readonly onContinue: (amount: number) => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState(currentAmount);
  const [customExtraInput, setCustomExtraInput] = useState("");
  const [supportStats, setSupportStats] = useState<{ supporters: number; raisedCents: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedAmount(currentAmount);
    setCustomExtraInput("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controller = new AbortController();
    const params = new URLSearchParams({
      select: "id,amount_cents",
      quiz_origin: "eq.original",
      product_id: "eq.cirurgia_milena",
      status: "eq.paid",
      limit: "1000",
    });
    void fetch(`${PIX_CONFIG_ORIGINAL.supabaseUrl}/rest/v1/pix_orders?${params}`, {
      headers: pixFunctionHeaders(PIX_CONFIG_ORIGINAL),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`SUPPORT_STATS_${response.status}`);
        return response.json() as Promise<Array<{ id: string; amount_cents: number }>>;
      })
      .then((orders) => {
        setSupportStats({
          supporters: orders.length,
          raisedCents: orders.reduce((total, order) => total + Number(order.amount_cents || 0), 0),
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSupportStats(null);
      });
    return () => {
      controller.abort();
      document.body.style.overflow = previousOverflow;
    };
  }, [currentAmount, isOpen]);

  if (!isOpen) return null;

  const suggestions = [
    { amount: currentAmount, label: "Manter valor" },
    { amount: currentAmount + 10, label: "+ R$ 10" },
    { amount: currentAmount + 20, label: "+ R$ 20" },
  ];
  const customExtra = parseBrazilianCurrency(customExtraInput);
  const invalidCustomExtra = customExtraInput.length > 0 && customExtra < 10;
  const surgeryTargetCents = 850_000;
  const raisedCents = supportStats?.raisedCents ?? 0;
  const goalPercent = Math.min(100, (raisedCents / surgeryTargetCents) * 100);
  const remainingCents = Math.max(0, surgeryTargetCents - raisedCents);
  const formatCurrency = (cents: number) => (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[#171225]/70 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="milena-support-title">
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div className="relative z-10 flex h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-[26px] border border-[#ded3e8] bg-[#fffefd] shadow-2xl sm:max-w-[580px]">
        <button type="button" onClick={onClose} aria-label="Fechar janela" className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#171225]/75 text-white backdrop-blur-md hover:bg-[#171225]">✕</button>

        <header className="shrink-0 border-b border-[#3d3152] bg-[#211a35]">
          <div className="h-[104px] w-full bg-[#171225] p-2 sm:h-[122px]">
            <img src={IMAGES.milenaCatarata} alt="Milena Medeiros" className="h-full w-full object-contain object-center" loading="lazy" />
          </div>
          <div className="px-4 pb-3 pt-2 text-left sm:px-5 sm:pb-4 sm:pt-3">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#eadcf5]">Antes de continuar</span>
            <h3 id="milena-support-title" className="mt-1 max-w-[380px] font-display text-[18px] font-black leading-tight text-white sm:text-[20px]">Se quiser, amplie seu gesto de apoio</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#cec1db]">Escolha opcional para apoiar o tratamento oftalmológico da Milena.</p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-5 sm:p-4 sm:pb-5">

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-[#e3dbea] bg-[#f5f1f8] p-2.5 text-center">
              <span className="block text-[17px] font-black text-[#5d4786]">{supportStats?.supporters ?? 0}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#6b6175]">apoios confirmados</span>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-center">
              <span className="block text-[17px] font-black text-emerald-700">{formatCurrency(raisedCents)}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">arrecadados</span>
            </div>
          </div>

          <section className="mt-3 rounded-2xl border border-[#e3dbea] bg-white p-3 shadow-sm" aria-label="Meta da cirurgia">
            <div className="flex items-end justify-between gap-3">
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#6b6175]">Meta do tratamento</span>
                <strong className="mt-0.5 block text-[16px] text-[#272039]">{formatCurrency(surgeryTargetCents)}</strong>
              </div>
              <span className="rounded-full bg-[#f2eef8] px-2.5 py-1 text-[10.5px] font-black text-[#5d4786]">{goalPercent.toFixed(1).replace(".", ",")}%</span>
            </div>
            <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[#eee9f2] p-0.5 ring-1 ring-[#e3dbea]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8b75b2] via-[#6f5aa0] to-[#4b8b7e] transition-[width] duration-700" style={{ width: `${goalPercent}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[10.5px] font-semibold text-slate-500">
              <span>{formatCurrency(raisedCents)} confirmados</span>
              <span>Faltam {formatCurrency(remainingCents)}</span>
            </div>
          </section>

          <div className="mt-3 rounded-2xl border border-[#e3dbea] bg-[#f5f1f8] p-3 text-left">
            <p className="text-[12.5px] leading-relaxed text-[#514763] sm:text-[13px]">
              Milena está em acompanhamento para tratar a catarata, que afeta sua leitura e o trabalho com as cartas. A casa mantém uma corrente de apoio para exames, tratamento e recuperação.
            </p>
            <p className="mt-1.5 text-[11.5px] font-bold text-[#6b6175]">É opcional. Manter o valor atual não muda o acolhimento ou o atendimento.</p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-2.5">
          {suggestions.map((suggestion) => {
            const selected = suggestion.amount === selectedAmount && customExtraInput.length === 0;
            return (
              <button key={suggestion.amount} type="button" onClick={() => { setCustomExtraInput(""); setSelectedAmount(suggestion.amount); }} className={`min-h-[68px] rounded-2xl border px-1 py-2 text-center transition-all sm:px-2 sm:py-2.5 ${selected ? "border-[#6f5aa0] bg-[#f2eef8] ring-4 ring-[#6f5aa0]/10" : "border-slate-200 bg-white hover:border-[#b9a8cf]"}`}>
                <span className="block text-[16px] font-black text-[#272039]">R$ {suggestion.amount.toFixed(0)}</span>
                <span className={`mt-1 block text-[9.5px] font-bold ${selected ? "text-[#5d4786]" : "text-slate-500"}`}>
                  {suggestion.label}
                </span>
              </button>
            );
          })}
          </div>

          <div className={`mt-3 rounded-2xl border bg-white p-3 transition-all ${customExtraInput ? "border-[#6f5aa0] ring-4 ring-[#6f5aa0]/10" : "border-slate-200"}`}>
          <label htmlFor="custom-support-extra" className="block text-left text-[11.5px] font-bold text-[#514763]">Deseja somar outro valor? <span className="font-medium text-slate-500">Mínimo de R$ 10</span></label>
          <div className="relative mt-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-black text-[#5d4786]">R$</span>
            <input
              id="custom-support-extra"
              value={customExtraInput}
              onChange={(event) => {
                const value = sanitizeBrazilianCurrencyInput(event.target.value);
                setCustomExtraInput(value);
                const extra = parseBrazilianCurrency(value);
                setSelectedAmount(extra >= 10 ? currentAmount + extra : currentAmount);
              }}
              inputMode="decimal"
              placeholder="Digite o valor adicional"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-[15px] font-black text-[#272039] outline-none focus:border-[#6f5aa0] focus:bg-white"
            />
          </div>
          {invalidCustomExtra && <p className="mt-1.5 text-[10.5px] font-bold text-red-700">O apoio adicional deve ser de pelo menos R$ 10.</p>}
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-[#fffefd] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_28px_-22px_rgba(39,32,57,0.55)] sm:px-5">
          <button type="button" disabled={invalidCustomExtra} onClick={() => onContinue(selectedAmount)} className="w-full rounded-[14px] bg-gradient-to-r from-[#4b8b7e] via-[#39776c] to-[#2d665e] px-5 py-3.5 text-[14px] font-black text-white shadow-lg shadow-[#39776c]/25 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
            Continuar com R$ {selectedAmount.toFixed(2).replace(".", ",")}
          </button>
          {selectedAmount !== currentAmount && (
            <button type="button" onClick={() => onContinue(currentAmount)} className="mt-1.5 w-full py-2 text-[11.5px] font-bold text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800">
              Prefiro manter R$ {currentAmount.toFixed(2).replace(".", ",")}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function PixInstantBox({
  primeiroNome = "Você",
  primeiroEnte = "seu ente querido",
  nomeCompleto,
  enteCompleto,
  relacao,
  mensagem,
  temas = [],
  horario,
}: {
  readonly primeiroNome?: string;
  readonly primeiroEnte?: string;
  readonly nomeCompleto?: string;
  readonly enteCompleto?: string;
  readonly relacao?: string;
  readonly mensagem?: string;
  readonly temas?: string[];
  readonly horario?: string;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number>(35);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<boolean>(false);
  const [freeLetterAudioOpen, setFreeLetterAudioOpen] = useState(false);
  const [physicalLetterRequested, setPhysicalLetterRequested] = useState(() => {
    if (typeof window === "undefined") return false;
    const storedPreference = sessionStorage.getItem("templodeluz:physical-letter-selected");
    return storedPreference === null || storedPreference === "true";
  });

  const activeAmount = isCustom ? parseBrazilianCurrency(customInput) : selectedAmount;
  const physicalLetterFee = physicalLetterRequested && activeAmount < 40 ? 15 : 0;
  const checkoutAmount = activeAmount + physicalLetterFee;
  const impact = getDonationPsychologicalImpact(activeAmount, primeiroEnte, primeiroNome);


  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true);
    const nextValue = sanitizeBrazilianCurrencyInput(e.target.value);
    setCustomInput(nextValue);
    if (parseBrazilianCurrency(nextValue) > 0) handlePhysicalLetterPreference(true);
  };

  const handlePhysicalLetterPreference = (checked: boolean) => {
    setPhysicalLetterRequested(checked);
    try {
      if (checked) {
        sessionStorage.setItem("templodeluz:physical-letter-selected", "true");
        sessionStorage.setItem("templodeluz:physical-letter-fee-included", "true");
      } else {
        sessionStorage.removeItem("templodeluz:physical-letter-selected");
        sessionStorage.removeItem("templodeluz:physical-letter-fee-included");
      }
    } catch {
      // A escolha continua ativa durante a sessão atual.
    }
  };

  const handleSelectPreset = (val: number, includesPhysical = false) => {
    setSelectedAmount(val);
    setIsCustom(false);
    setCustomInput("");
    handlePhysicalLetterPreference(includesPhysical);
  };

  const continueToPergaminho = () => {
    setFreeLetterAudioOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("templodeluz:initial-payment-skipped", "true");
    }
    try {
      trackQuizTelemetry({
        stepIndex: 99,
        stepName: "checkout_skipped",
        leadName: primeiroNome,
        enteQuerido: primeiroEnte,
      });
    } catch (err) {
      console.warn("[TELEMETRY]", err);
    }
    redirectWithParams("/chamada-ao-vivo-milena?source=skipped&next=%2Fescrever-carta");
  };

  const handleIrParaPergaminho = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setFreeLetterAudioOpen(true);
  };

  const presets = [
    { val: 20, label: "R$ 20", tag: "Vela + papel" },
    { val: 30, label: "R$ 30", tag: "Vela + pergaminho" },
    { val: 35, label: "R$ 35", tag: "Sessão completa", highlight: true },
    { val: 40, label: "R$ 40", tag: "Carta física incluída", physicalIncluded: true },
    { val: 60, label: "R$ 60", tag: "Luz da casa" },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-[#f7f8fb] shadow-[0_24px_60px_-34px_rgba(15,23,42,0.5)] text-center">
      <div className="relative overflow-hidden bg-[#211a35] px-5 py-6 text-left text-white sm:px-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#9d82c4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-[#c49a52]/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-extrabold tracking-[0.12em] text-[#e9ddf5] uppercase backdrop-blur-sm">
            <PixIcon className="h-3.5 w-3.5" />
            PIX ou cartão
          </span>
          <h3 className="mt-4 max-w-[360px] font-display text-[24px] font-extrabold leading-[1.15] text-white">
            Sua carta é gratuita. Escolha como apoiar os materiais da sessão.
          </h3>
          <p className="mt-2 max-w-[370px] text-[13px] leading-relaxed text-slate-300">
            A partir de R$20, sua contribuição voluntária ajuda a preparar vela, pergaminho e o acolhimento da casa para {primeiroEnte}.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#ded3e8] bg-white p-3 text-left shadow-sm">
        <img src={IMAGES.medium} alt="Milena Medeiros" className="h-14 w-14 shrink-0 rounded-2xl border-2 border-[#d8cae5] object-cover object-top shadow-sm" loading="lazy" decoding="async" />
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#5d4786]">Mensagem da Milena</span>
          <span className="mt-0.5 block text-[13px] font-extrabold text-[#272039]">Escute antes de doar</span>
          <audio controls preload="none" aria-label="Mensagem da Milena antes da contribuição" className="mt-2 w-full accent-[#5d4786]">
            <source src={milenaDonationAudio} type="audio/mpeg" />
            Seu navegador não oferece suporte à reprodução deste áudio.
          </audio>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
        {[
          ["1", "Escolha o valor"],
          ["2", "PIX ou cartão"],
          ["3", "Confirmação"],
        ].map(([step, label]) => (
          <div key={step} className="min-w-0">
            <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#312742] text-[10px] font-black text-white">{step}</span>
            <span className="mt-1.5 block text-[10.5px] font-bold leading-tight text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 text-left">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <span className="text-[12px] font-extrabold tracking-[0.08em] text-slate-700 uppercase">Defina o valor</span>
          <span className="text-[10.5px] font-semibold text-slate-500">Escolha livre</span>
        </div>

        <div className={`mb-5 rounded-2xl border-2 bg-white p-4 shadow-[0_14px_28px_-20px_rgba(93,71,134,0.6)] transition-all ${isCustom ? "border-[#6f5aa0] ring-4 ring-[#6f5aa0]/10" : "border-[#cfc2df]"}`}>
          <label htmlFor="custom-donation-input" className="block">
            <span className="inline-flex rounded-full bg-[#f2eef8] px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] text-[#5d4786]">Valor livre</span>
            <span className="mt-2 block text-[15px] font-extrabold text-slate-900">Escolha o valor que fizer sentido para você</span>
            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-500">Você pode digitar o valor que preferir a partir de R$15 ou usar uma sugestão abaixo.</span>
          </label>
          <div className="relative mt-3 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-slate-700">R$</span>
              <input
                id="custom-donation-input"
                type="text"
                inputMode="decimal"
                value={customInput}
                onFocus={() => setIsCustom(true)}
                onChange={handleCustomChange}
                placeholder="Ex.: 50,00"
                className="w-full rounded-xl border border-[#d8cae5] bg-[#faf9fb] py-4 pl-12 pr-4 text-[22px] font-black text-[#272039] outline-none transition-all placeholder:text-slate-300 focus:border-[#6f5aa0] focus:bg-white"
            />
          </div>
          {isCustom && customInput.length > 0 && activeAmount < 15 && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
              Esse valor não cobre os materiais mínimos da vela e do pergaminho. Ajuste para pelo menos R$15 para continuar.
            </p>
          )}
        </div>

        <div className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Valores sugeridos</div>
        <div className="grid grid-cols-2 gap-3">
          {presets.map((item) => {
            const isSelected = !isCustom && selectedAmount === item.val;
            return (
              <button
                key={item.val}
                type="button"
                onClick={() => handleSelectPreset(item.val, true)}
                className={`group relative flex min-h-[96px] flex-col items-start justify-center rounded-2xl px-4 py-3 text-left transition-all duration-200 cursor-pointer ${item.highlight ? "col-span-2 min-h-[112px]" : ""} ${
                  isSelected
                    ? "border-2 border-[#6f5aa0] bg-[#f2eef8] text-[#272039] shadow-[0_16px_30px_-16px_rgba(93,71,134,0.72)] ring-4 ring-[#6f5aa0]/10"
                    : "border border-slate-200 bg-white text-[#272039] shadow-sm hover:border-[#b9a8cf] hover:bg-[#f7f4fa]"
                }`}
              >
                {item.highlight && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#c49a52] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-sm">
                    Mais escolhida
                  </span>
                )}
                <span className={`block font-black leading-tight tracking-tight ${item.highlight ? "text-[26px]" : "text-[20px]"}`}>
                  {item.label}
                </span>
                <span className={`mt-1 block font-semibold leading-tight ${item.highlight ? "text-[13px]" : "text-[11.5px]"} ${isSelected ? "text-[#5d4786]" : "text-slate-500"}`}>
                  {item.tag}
                </span>
                {isSelected && <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#5d4786]"><span>✓</span> Selecionado</span>}
              </button>
            );
          })}

        </div>
      </div>
      </div>

      <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-all ${physicalLetterRequested ? "border-[#6f5aa0] bg-[#f2eef8] ring-4 ring-[#6f5aa0]/10" : "border-slate-200 bg-white hover:border-[#b9a8cf]"}`}>
        <input
          type="checkbox"
          checked={physicalLetterRequested}
          onChange={(event) => handlePhysicalLetterPreference(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#5d4786]"
        />
        <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[14px] font-extrabold text-[#272039]">
              <span>Quero receber a carta física</span>
            <span className="rounded-full bg-[#fffefd] px-2 py-0.5 text-[10px] font-black text-[#5d4786] ring-1 ring-[#d8cae5]">{physicalLetterRequested ? (physicalLetterFee === 0 ? "INCLUÍDA NO VALOR" : "+ R$ 15 ENTREGA") : "+ R$ 15 ENTREGA"}</span>
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
            {physicalLetterRequested ? (physicalLetterFee === 0 ? "A taxa já está incluída neste valor. Na próxima página, você informa apenas o endereço." : "R$15 serão incluídos automaticamente no total do PIX/cartão. Na próxima página, você informa apenas o endereço de entrega.") : "Marque esta opção para incluir R$15 de envio e receber a carta física pelos Correios."}
          </p>
          {physicalLetterRequested && (
            <div className="mt-4 border-t border-[#d8cae5] pt-4">
              <div className="flex h-20 justify-center overflow-hidden rounded-2xl bg-white px-5 shadow-sm ring-1 ring-[#e1d8ec]">
                <img src={correiosLogo} alt="Correios" className="h-16 w-full scale-[2.35] object-contain" loading="lazy" decoding="async" />
              </div>
              <div className="mt-3 text-left">
                <span className="block text-[12px] font-black text-[#2d144d]">Envio pelos Correios</span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#6b6175]">Postagem estimada em 2–3 dias úteis após confirmar o endereço. O prazo final depende do CEP.</span>
              </div>
            </div>
          )}
        </div>
      </label>

      {physicalLetterRequested && impact.isValid && (
        <div className="mt-3 rounded-2xl border border-[#e3dbea] bg-[#f5f1f8] p-3 text-left">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-bold text-[#514763]">Total para pagar agora</span>
            <span className="text-[18px] font-black text-[#5d4786]">R$ {checkoutAmount.toFixed(2).replace(".", ",")}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#6b6175]">R$ {activeAmount.toFixed(2).replace(".", ",")} de contribuição + R$ 15,00 da taxa de envio físico.</p>
        </div>
      )}

      {/* Card de Impacto Espiritual Refinado */}
      <div
        className={`mt-4 rounded-2xl border p-4 text-left shadow-2xs transition-all duration-300 ${impact.cardBorder}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide border ${impact.badgeColor}`}
          >
            <span>{impact.icon}</span>
            {impact.badge}
          </span>
          <span className="text-[13px] font-black text-[#1f1035]">
            R$ {activeAmount > 0 ? activeAmount.toFixed(2).replace(".", ",") : "0,00"}
          </span>
        </div>

        <h4 className="text-[13.5px] font-extrabold text-[#181126] leading-snug">{impact.title}</h4>
        <p className="text-[12px] text-[#5e4b73] mt-1 leading-relaxed">{impact.description}</p>

        {activeAmount < 15 && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-red-100/80 border border-red-200 text-red-900 text-[11.5px] font-bold leading-tight">
            O valor mínimo de R$15 ajuda a cobrir a vela de 7 dias e o pergaminho físico.
          </div>
        )}
      </div>

      {impact.isValid ? (
        <Suspense fallback={<DeferredFallback />}>
          <PixCheckout
            productId="carta_sagrada"
            amountCents={Math.round(checkoutAmount * 100)}
            initialCustomerName={nomeCompleto || primeiroNome}
            enteQuerido={enteCompleto || primeiroEnte}
            grauParentesco={relacao}
            mensagemPreview={mensagem}
            successPath="/chamada-ao-vivo-milena?source=paid&next=%2Fobrigado"
            includePaymentParams={false}
            displayProductName={physicalLetterRequested ? "Contribuição + envio de carta física" : undefined}
            onPaymentConfirmed={(receipt) => {
              if (physicalLetterRequested && receipt.orderId) {
                sessionStorage.setItem("templodeluz:physical-letter-fee-receipt", JSON.stringify({
                  orderId: receipt.orderId,
                  amountCents: receipt.amountCents,
                  paidAt: new Date().toISOString(),
                }));
              }
            }}
          />
        </Suspense>
      ) : (
        <div className="mt-5 p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
          Por favor, selecione ou digite um valor a partir de R$ 15 para continuar.
        </div>
      )}

      {/* Continuidade após o pagamento */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[11.5px] text-[#786445] text-center leading-relaxed">
          Após confirmar a doação via PIX ou Cartão, você será redirecionado(a) automaticamente.
        </p>
      </div>

      {/* Botão de WhatsApp Oficial - Espaçoso, Elegante e Direto */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setWhatsAppModalOpen(true)}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#128C7E] via-[#25D366] to-[#075E54] p-3.5 sm:p-4 text-white shadow-md shadow-emerald-900/15 hover:shadow-lg hover:shadow-emerald-900/25 active:scale-[0.99] transition-all text-left cursor-pointer"
        >
          {/* Brilho suave deslizante */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

          <div className="flex items-center gap-3 relative z-10">
            {/* Ícone WhatsApp com Ponto Online Vivo */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#25D366] shadow-sm">
              <svg
                className="w-6 h-6 text-[#25D366]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.107-.07-.251-.08-.574-.188-.988-.369-1.758-.767-2.903-2.545-2.991-2.663-.088-.118-.718-.956-.718-1.822 0-.866.453-1.293.614-1.469.161-.177.351-.221.468-.221.117 0 .234.001.336.006.107.005.251-.041.393.298.146.351.498 1.214.542 1.303.044.088.073.192.015.308-.059.117-.088.19-.176.293-.088.103-.186.23-.265.31-.088.088-.18.184-.078.36.103.176.458.756.983 1.224.676.602 1.246.789 1.422.877.176.088.279.074.382-.044.103-.117.439-.512.556-.688.117-.176.235-.147.396-.088.161.059 1.026.484 1.202.572.176.088.293.132.337.206.044.074.044.43-.1 1.035z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.523 3.664 1.435 5.186L2.1 22l4.98-1.306A9.958 9.958 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.635 0-3.15-.494-4.414-1.343l-.316-.214-2.95.774.787-2.876-.234-.336A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-80" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#25D366] border-2 border-white" />
              </span>
            </div>

            {/* Textos sem aperto */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100 bg-black/15 px-2 py-0.5 rounded-md">
                  WhatsApp Oficial
                </span>
                <span className="text-[10.5px] font-semibold text-emerald-100/90">
                  Médium Milena
                </span>
              </div>
              <div className="text-[14px] sm:text-[15px] font-black text-white leading-snug mt-0.5">
                Falar com a Médium no WhatsApp
              </div>
              <p className="text-[11.5px] text-emerald-100/90 leading-tight mt-0.5 truncate">
                Dúvidas ou prefere atendimento direto? Toque aqui
              </p>
            </div>

            {/* Seta direta e limpa */}
            <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-white/20 text-white font-black text-sm group-hover:bg-white group-hover:text-emerald-700 transition-all">
              ›
            </div>
          </div>
        </button>
      </div>

      <Suspense fallback={null}><WhatsAppContactModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        nomeConsulente={nomeCompleto || primeiroNome}
        nomeEnte={enteCompleto || primeiroEnte}
        grauParentesco={relacao}
        mensagemPreview={mensagem}
        temas={temas}
        horario={horario}
        onSelectDonateNow={() => {
          setWhatsAppModalOpen(false);
          const pixSection = document.getElementById("pix-section");
          if (pixSection) {
            pixSection.scrollIntoView({ behavior: "smooth" });
          }
        }}
      /></Suspense>


      {/* Box Nobre do Pergaminho: Elegante, Espaçoso e Acolhedor */}
      <div className="mt-5 pt-4 border-t border-slate-200/70">
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-b from-[#fffefc] to-[#faf5ea] p-4 sm:p-5 text-left shadow-xs">
          {/* Badge & Título */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-950">
              📜 Oratório Sagrado
            </span>
            <span className="text-[11px] font-bold text-amber-800">
              Acesso Liberado
            </span>
          </div>

          <h4 className="text-[14px] sm:text-[15px] font-black text-stone-900 leading-snug">
            Desejo redigir minha carta no pergaminho sem realizar a contribuição da vela agora
          </h4>

          <p className="mt-1 text-[12px] text-stone-600 leading-relaxed">
            Sua mensagem será salva no pergaminho sagrado e você poderá redigi-la antes de enviar à médium.
          </p>

          {/* Opções de Escolha em Linhas Espaçosas e Agradáveis */}
          <div className="mt-3.5 space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-950">
              ✨ Lá dentro você decide livremente:
            </div>

            {/* Opção 1 */}
            <div className="flex items-start gap-3 rounded-xl bg-white/90 border border-amber-200/70 p-3 shadow-2xs">
              <span className="text-lg shrink-0 mt-0.5">🕊️</span>
              <div className="min-w-0">
                <span className="text-xs font-black text-stone-900 block leading-tight">
                  1. Apenas selecionar os temas espirituais
                </span>
                <span className="text-[11.5px] text-stone-600 leading-relaxed block mt-0.5">
                  Não quer escrever nada? Basta marcar os temas (paz, conselho, sinal) e a médium conduzirá as orações na sessão.
                </span>
              </div>
            </div>

            {/* Opção 2 */}
            <div className="flex items-start gap-3 rounded-xl bg-white/90 border border-amber-200/70 p-3 shadow-2xs">
              <span className="text-lg shrink-0 mt-0.5">✍️</span>
              <div className="min-w-0">
                <span className="text-xs font-black text-stone-900 block leading-tight">
                  2. Escrever com suas próprias palavras
                </span>
                <span className="text-[11.5px] text-stone-600 leading-relaxed block mt-0.5">
                  Prefere desabafar e deixar um relato especial para <strong>{primeiroEnte}</strong>? Escreva à mão livre no pergaminho.
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Destaque Limpo, Amigável e 100% Desbloqueado */}
          <div className="mt-4 pt-1 space-y-2">
            <button
              type="button"
              onClick={handleIrParaPergaminho}
              className="group relative w-full overflow-hidden flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4b8b7e] via-[#39776c] to-[#2d665e] p-3.5 text-center text-white font-extrabold text-xs sm:text-[13px] uppercase tracking-wider shadow-lg shadow-[#39776c]/25 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all cursor-pointer border-0"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              <span className="relative">Acessar Pergaminho & Preencher Carta</span>
              <span className="relative text-sm font-bold">→</span>
            </button>

            <div className="text-center pt-0.5">
              <p className="text-[11.5px] font-semibold text-amber-900/90">
                Você seguirá para a chamada ao vivo e depois para o pergaminho.
              </p>
            </div>
          </div>

          {freeLetterAudioOpen && (
            <div className="free-letter-audio-backdrop fixed inset-0 z-[230] flex items-center justify-center bg-[#0c1512]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="free-letter-audio-title">
              <button type="button" aria-label="Fechar" onClick={() => setFreeLetterAudioOpen(false)} className="absolute inset-0 cursor-default" />
              <div className="free-letter-audio-card relative z-10 w-full max-w-[430px] overflow-hidden rounded-[28px] border border-[#d8cae5] bg-[#fffefd] shadow-[0_28px_80px_-28px_rgba(0,0,0,0.9)]">
                <div className="relative overflow-hidden bg-[#14201c] px-5 py-7 text-center text-white">
                  <div className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-[#a8d3c0]/20 blur-3xl" />
                  <div className="pointer-events-none absolute -right-10 bottom-0 h-24 w-24 rounded-full bg-[#c49a52]/20 blur-3xl" />
                  <span className="relative inline-flex rounded-full border border-[#f5d285]/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f5d285]">Mensagem da Milena</span>
                  <h2 id="free-letter-audio-title" className="relative mt-3 font-display text-[22px] font-black leading-tight">OUÇA ANTES DE SAIR PARA RECEBER A CARTA</h2>
                  <p className="relative mt-2 text-[12px] leading-relaxed text-[#e0eee7]">A carta continua gratuita. Esta mensagem é opcional e pode ser ignorada.</p>
                </div>
                <div className="p-5">
                  <div className="free-letter-audio-player rounded-2xl border border-[#d8e9e3] bg-[#eff8f3] p-3">
                    <audio controls preload="none" aria-label="Mensagem da Milena sobre receber a carta" className="w-full accent-[#39776c]">
                      <source src={milenaFreeLetterAudio} type="audio/mpeg" />
                      Seu navegador não oferece suporte à reprodução deste áudio.
                    </audio>
                  </div>
                  <button type="button" onClick={continueToPergaminho} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#4b8b7e] via-[#39776c] to-[#2d665e] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#39776c]/25 transition-all hover:-translate-y-0.5">
                    Continuar para o pergaminho
                  </button>
                  <button type="button" onClick={continueToPergaminho} className="mt-2 w-full py-2 text-[11.5px] font-bold text-slate-500 underline decoration-slate-300 underline-offset-2">
                    Ignorar áudio e continuar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SecurityGuaranteeSeal() {
  return (
    <div className="mt-7 pt-5 border-t border-[#ece4f4] space-y-3.5 text-left">
      {/* Título da Seção dos Selos */}
      <div className="text-center">
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[#b45309]">
          ✦ Atendimento e segurança ✦
        </span>
        <h3 className="font-display text-[16px] font-extrabold text-[#181126] mt-0.5">
          Transparência em cada etapa
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Card 1: Selo da Paz */}
        <div className="flex flex-col items-center rounded-2xl border border-amber-200/80 bg-gradient-to-b from-[#fffef9] to-[#fef8ea] p-4 text-center shadow-xs transition-transform duration-300 hover:scale-[1.01]">
          <div className="relative mb-2 flex items-center justify-center">
            <img
              src={IMAGES.seloPomba}
              alt="Selo de Paz Espiritual e Fé - Templo de Luz"
              className="h-28 w-28 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-widest text-[#b45309] block">
            Paz & Acolhimento
          </span>
          <h4 className="font-display text-[14.5px] font-extrabold text-[#181126] leading-tight mt-0.5">
            Selo de Paz Espiritual
          </h4>
          <p className="mt-1 text-[11.5px] text-[#786445] leading-relaxed">
            Sua intenção é registrada com cuidado para o atendimento e a oração da casa.
          </p>
        </div>

        {/* Card 2: Selo de Garantia */}
        <div className="flex flex-col items-center rounded-2xl border border-[#dcd1e8] bg-gradient-to-b from-[#fdfbfe] to-[#f2eef8] p-4 text-center shadow-xs transition-transform duration-300 hover:scale-[1.01]">
          <div className="relative mb-2 flex items-center justify-center">
            <img
              src={IMAGES.seloCheckout}
              alt="Selo de Garantia Incondicional de 7 Dias"
              className="h-28 w-28 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-widest text-[#5d4786] block">
            Pagamento seguro
          </span>
          <h4 className="font-display text-[14.5px] font-extrabold text-[#181126] leading-tight mt-0.5">
            Processamento protegido
          </h4>
          <p className="mt-1 text-[11.5px] text-[#5e4b73] leading-relaxed">
            PIX e cartão são processados por provedores de pagamento; você vê o método antes de confirmar.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────── páginas ─────────── */

function Intro({
  nome,
  setNome,
  error,
  next,
}: {
  readonly nome: string;
  readonly setNome: (v: string) => void;
  readonly error?: string | undefined;
  readonly next: () => void;
}) {
  const [letterModalOpen, setLetterModalOpen] = useState(false);

  return (
    <div className="jungle-intro animate-rise-in min-h-screen bg-[#07142f]">
       <header className="overflow-hidden bg-[#07142f]">
        <div className="w-full p-3 sm:p-4">
          <img
            src={milenaCartaImage}
            alt="Milena Medeiros escrevendo uma carta no oratório"
            className="mx-auto block h-auto w-full max-w-[620px] rounded-2xl object-contain"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div className="px-4 pb-6 pt-5">
          <div className="mx-auto max-w-[680px] rounded-[26px] border border-[#8bb8ff]/35 bg-[#10275a] p-5 shadow-[0_24px_56px_-28px_rgba(0,0,0,0.9)] text-center sm:p-7">
            <Stars className="mb-3" />
            <span className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#e6efff]">Templo de Luz · Acolhimento privado</span>
            <h1 className="font-display text-[25px] sm:text-[32px] leading-[1.12] font-medium text-white tracking-[-0.03em]">
              Organize uma intenção de carta para quem você ama,{" "}
              <span className="text-[#9cc4ff] underline decoration-[#f5d285] decoration-2 underline-offset-4">
                com acolhimento da médium Milena
              </span>
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-[#d9e6ff] font-normal">
              Um espaço de acolhimento para registrar sua história, sua saudade e o que deseja expressar.
            </p>
          </div>
        </div>
      </header>

      {/* Faixa de Prova Social */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-y border-white/10 bg-[#0b1d44] px-4 py-3 text-[11.5px] text-[#e7efff] sm:text-[12.5px]">
        <span className="font-bold">💌 Atendimento acolhedor</span>
        <span className="h-3 w-px bg-white/20" />
        <span className="font-bold">✍️ Carta e pergaminho</span>
        <span className="h-3 w-px bg-white/20" />
        <span className="text-[#f5d285] font-extrabold">🔒 Dados protegidos</span>
      </div>

      <div className="flex flex-col items-center px-4 pt-6 pb-10 sm:px-6">
        {/* Formulário + CTA imediatamente (micro-compromisso acima da dobra) */}
        <Reveal className="w-full">
          <div className="rounded-[26px] border border-[#f0d79b] bg-[#fffdf8] p-6 shadow-[0_26px_55px_-30px_rgba(0,0,0,0.72)]">
            <div className="text-center mb-5">
              <span className="inline-flex rounded-full bg-[#f6ead0] px-3 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-[#7b5717]">
                Seu pedido começa aqui
              </span>
              <h2 className="mt-3 font-display text-[22px] font-bold text-[#171225] leading-snug">
                Comece pelo que você deseja guardar nesta carta
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5a5263] font-normal">
                Responda a poucas perguntas, no seu ritmo. Você poderá revisar sua intenção antes de seguir para o atendimento.
              </p>
            </div>

            <div id="intro-name-field" className="relative">
              <Field
                label="Como podemos chamar você? (Seu nome)"
                value={nome}
                onChange={setNome}
                placeholder="Digite seu nome completo"
                error={error}
                onEnter={next}
                highlight
                theme="light"
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-center">
                <span className="rounded-full border border-[#39776c]/20 bg-[#e7f5ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#286254]">Etapa 1 de 6 · leva poucos segundos</span>
              </div>
              <Cta onClick={next} tone="green" pulse>💫 Começar meu pedido</Cta>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11.5px] font-medium text-[#5a5263]">
              <span>🔒 Privacidade</span>
              <span>↩️ Você pode revisar</span>
              <span>💬 Atendimento humano</span>
            </div>
          </div>
        </Reveal>

        {/* Depoimento curto */}
        <Reveal delay={80} className="mt-6 w-full">
          <p className="font-display mx-auto max-w-[310px] text-center text-[14px] italic text-[#e9e0f1] leading-relaxed font-medium">
            “Pude colocar em palavras o que estava guardado no coração e fui acolhida com muito respeito.”
          </p>
        </Reveal>

        {/* Exemplo de carta (prova visual com zoom) */}
        <Reveal delay={80} className="mt-6 w-full">
          <button
            type="button"
            onClick={() => setLetterModalOpen(true)}
            aria-label="Toque para ampliar exemplo de carta psicografada"
            className="group relative block w-full mx-auto max-w-[300px] rounded-2xl p-1 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-xl cursor-zoom-in transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl text-left"
          >
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={IMAGES.carta}
                alt="Exemplo real de carta psicografada manuscrita"
                className="w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center p-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11.5px] font-black text-[#2d144d] shadow-xl backdrop-blur-xs border border-amber-300/80">
                  <span>🔍</span> Ver exemplo real
                </span>
              </div>
            </div>
          </button>
        </Reveal>

        <Suspense fallback={null}><LetterZoomModal
          isOpen={letterModalOpen}
          onClose={() => setLetterModalOpen(false)}
          onCtaClick={next}
        /></Suspense>

        {/* Como funciona */}
        <Reveal className="mt-10 w-full">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#f5d285]">Como acontece o reencontro</p>
          <div className="flex flex-col gap-3.5">
            {STEPS_HOW.map((s, i) => (
              <div
                key={s.title}
                className="flex items-start gap-4 rounded-2xl border border-[#e6d8bc] bg-[#fffdf8] p-4 shadow-[0_14px_28px_-22px_rgba(0,0,0,0.65)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ecd69f] bg-[#fbf2d9] text-xl shadow-sm">
                  {s.icon}
                </span>
                <div>
                  <span className="block text-[14.5px] font-bold text-[#211a35]">
                    {i + 1}. {s.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-[#665c70] font-normal">
                    {s.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-8 w-full">
          <Cta onClick={next} tone="green">💫 Iniciar Psicografia com a Médium</Cta>
        </Reveal>
      </div>
    </div>
  );
}

function Loading({
  nome,
  ente,
  relacao: _relacao,
  dorPrincipal,
  onDone,
}: {
  readonly nome: string;
  readonly ente: string;
  readonly relacao?: string;
  readonly dorPrincipal?: string | undefined;
  readonly onDone: () => void;
}) {
  const [pct, setPct] = useState(0);
  const primeiroNome = nome.split(" ")[0] || "você";
  const primeiroEnte = ente.split(" ")[0] || "seu ente";

  let intentionDetail = "Preparando sua intenção com cuidado e privacidade.";
  if (dorPrincipal) {
    const isLong = dorPrincipal.length > 48;
    const truncatedText = dorPrincipal.slice(0, 48);
    intentionDetail = `Preparando sua intenção: “${truncatedText}${isLong ? "..." : ""}”`;
  }

  const stages = useMemo(
    () => [
      {
        title: "Registrando sua intenção",
        detail: `Acolhendo o pedido de ${primeiroNome} por ${primeiroEnte}.`,
      },
      {
        title: "Organizando as informações",
        detail: intentionDetail,
      },
      {
        title: "Preparando o oratório",
        detail: "Separando o pergaminho e os materiais para a sessão.",
      },
      {
        title: "Reserva concluída",
        detail: "Seu pedido está pronto para ser apresentado à médium Milena.",
      },
    ],
    [primeiroNome, primeiroEnte, intentionDetail],
  );
  const activeStage = Math.min(Math.floor(pct / 25), stages.length - 1);

  useEffect(() => {
    const iv = setInterval(() => setPct((p) => Math.min(p + 5, 100)), 55);
    const done = setTimeout(onDone, 1800);
    return () => {
      clearInterval(iv);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#211a35] px-4 py-8 text-center text-white sm:px-6">
      <div className="w-full max-w-[390px] rounded-[26px] border border-white/12 bg-[#29213b] p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] sm:p-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#c8b5db]/30 bg-white/5 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#e5d6f3]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c49a52]" />
          Preparando seu pedido
        </span>

        <div className="mx-auto mt-5 w-full overflow-hidden rounded-2xl border border-[#d8c7e9]/25 bg-[#171225] shadow-[0_12px_28px_-16px_rgba(0,0,0,0.7)]">
          <img src={milenaLoaderImage} alt="Milena Medeiros" className="block h-auto w-full object-contain" loading="eager" decoding="async" />
        </div>

        <h2 className="relative mx-auto max-w-[330px] font-display text-[25px] font-black leading-[1.12] text-white sm:max-w-none sm:text-[27px]">
          Estamos preparando seu pedido, {primeiroNome}
        </h2>
        <p className="relative mx-auto mt-2.5 max-w-[330px] text-[13px] leading-relaxed text-[#d9cce7]">
          “Respire com calma. Estou esperando você com carinho para este momento.” — Milena
        </p>

        <div className="mx-auto mt-4 flex w-fit flex-col items-center">
          <span className="block h-7 w-4 rounded-[50%_50%_45%_45%] bg-gradient-to-t from-[#f59e0b] via-[#fde68a] to-white shadow-[0_-4px_14px_rgba(251,191,36,0.8)]" />
          <span className="block h-12 w-7 rounded-t-[10px] bg-[#f8f3e6] shadow-[0_8px_16px_rgba(0,0,0,0.25)]" />
          <span className="block h-2 w-16 rounded-full bg-black/25 blur-[1px]" />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-3.5 text-left">
          <progress
            value={pct}
            max={100}
            aria-label="Preparação do pedido"
            className="sr-only"
          />
          <div
            aria-hidden="true"
            className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/45 p-0.5 shadow-inner"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#a88bc8] via-[#8064a7] to-[#c49a52] shadow-[0_0_14px_rgba(139,117,178,0.4)] transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10.5px] font-bold text-[#cfc0dc]">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />{stages[activeStage]?.title}</span>
            <span className="rounded-full bg-[#d8c7e9]/10 px-2 py-0.5 text-[#e5d6f3]">{pct}%</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#cfc0dc]">{stages[activeStage]?.detail}</p>
        </div>

        <p className="mt-4 text-[10.5px] font-semibold text-[#bba9ca]">
          Seus dados permanecem privados durante todo o processo.
        </p>
      </div>
    </div>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-2.5">
      {FAQ.map((item, i) => (
        <div
          key={item.q}
          className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between p-4 text-left text-[14px] font-bold text-slate-900"
          >
            <span>{item.q}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f2eef8] text-base text-[#5d4786]">{open === i ? "−" : "+"}</span>
          </button>
          {open === i ? (
            <p className="animate-rise-in px-4 pb-4 text-[13px] leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
              {item.a}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Result({
  nome = "",
  ente = "",
  relacao = "",
  dorPrincipal = "",
  horario = "",
  mensagem = "",
  temasEscolhidos = [],
}: {
  readonly nome?: string;
  readonly ente?: string;
  readonly relacao?: string;
  readonly dorPrincipal?: string;
  readonly horario?: string;
  readonly mensagem?: string;
  readonly temasEscolhidos?: string[];
}) {
  const go = () => redirectWithParams(CHECKOUT_URL);
  const primeiro: string = (nome?.trim() ? nome.trim().split(" ")[0] : "Você") || "Você";
  const primeiroEnte: string = (ente?.trim() ? ente.trim().split(" ")[0] : "seu ente querido") || "seu ente querido";
  const nomeEnteCompleto: string = ente?.trim() || "seu ente querido";
  const horarioExibicao: string = horario?.trim() || horarioAgendamento();
  const scrollToMaterials = () => {
    document.getElementById("materiais-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const hopeMessages = [
    "Você não precisa atravessar esse momento sozinho(a).",
    "Cada história merece tempo, cuidado e respeito.",
    "Sua carta continua gratuita; você escolhe como seguir.",
    "Seu pedido pode ser revisado antes de qualquer confirmação.",
  ];
  const [hopeMessageIndex, setHopeMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setHopeMessageIndex((index) => (index + 1) % hopeMessages.length), 4_500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="animate-rise-in pb-28 text-slate-900 bg-[#f5f7fb]">
      {/* Header com Confirmação Espiritual com a Foto Nítida e Card de Texto */}
      <header className="relative bg-[#211a35] text-white overflow-hidden border-b border-[#ded8e7]">
        {/* Foto completa, sem elementos sobrepostos */}
        <div className="w-full bg-[#171225] p-3 sm:p-4">
          <img
            src={milenaCartaImage}
            alt="Milena Medeiros escrevendo uma carta no oratório"
            className="mx-auto block h-auto w-full max-w-[620px] rounded-2xl object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Texto separado da foto para preservar o enquadramento */}
        <div className="relative z-10 px-4 pb-7 pt-5">
          <div className="relative mx-auto max-w-[420px] overflow-hidden rounded-[26px] border border-white/15 bg-[#211a35] p-5 sm:p-6 shadow-2xl text-center">
            <div className="pointer-events-none absolute -left-14 -top-12 h-32 w-44 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-28 w-52 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9c9eb]/10 blur-2xl" />
            <div className="relative z-10 animate-float-soft text-[40px] mb-1">🕊️</div>
            <h1 className="relative z-10 font-display text-[23px] sm:text-[25px] leading-snug font-extrabold text-white">
              {primeiro}, seu pedido para{" "}
              <em className="text-[#dcc8f0] not-italic underline decoration-[#c49a52] decoration-2 underline-offset-4">
                {nomeEnteCompleto}
              </em>{" "}
              está pronto para revisão
            </h1>
            <p className="relative z-10 mx-auto mt-3 text-[13.5px] leading-relaxed text-zinc-100 font-normal">
              Revise sua intenção, conheça o atendimento e escolha com calma como deseja continuar. Nada é confirmado até você concluir o próximo passo.
            </p>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white px-4 py-3.5">
        <div className="mx-auto grid max-w-[460px] grid-cols-3 gap-2 text-center">
          {[
            ["✓", "Intenção", "organizada"],
            ["2", "Escolha", "como continuar"],
            ["3", "Confirmação", "após o pagamento"],
          ].map(([number, title, detail], index) => (
            <div key={title} className={`rounded-xl border px-2 py-2 ${index === 1 ? "border-[#c8b5db] bg-[#f2eef8]" : "border-slate-200 bg-slate-50"}`}>
              <span className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? "bg-[#39776c] text-white" : index === 1 ? "bg-[#5d4786] text-white" : "bg-slate-200 text-slate-600"}`}>{number}</span>
              <span className="mt-1 block text-[11px] font-extrabold text-slate-800">{title}</span>
              <span className="block text-[9.5px] leading-tight text-slate-500">{detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-[#e5daf0] bg-[#f8f5fb] px-4 py-2.5 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d4786]">Uma mensagem para você</span>
        <p key={hopeMessageIndex} className="mt-1 animate-rise-in text-[12.5px] font-semibold text-[#3e3450]">{hopeMessages[hopeMessageIndex]}</p>
      </div>

      <div className="px-4 pt-7 sm:px-6">
        {/* Card Personalizado com base no Quiz */}
        {dorPrincipal && (
          <Reveal className="p-4 rounded-2xl bg-white border border-[#e3dbea] mb-6 text-center shadow-sm">
            <span className="text-[11px] font-bold text-[#5d4786] block uppercase tracking-wider">
              🕊️ Intenção Registrada para a Sessão
            </span>
            <p className="text-[13.5px] text-[#2d144d] mt-1 font-semibold italic">
              "{dorPrincipal}"
            </p>
          </Reveal>
        )}

        <Suspense fallback={<DeferredFallback />}><SocialProofSection /></Suspense>

        <Reveal>
          <SectionLabel>A médium responsável</SectionLabel>
          <h2 className="font-display text-[25px] font-extrabold text-[#181126]">
            Milena Medeiros
          </h2>
        </Reveal>

        <Reveal
          delay={80}
          className="relative my-4 flex flex-col items-center justify-center text-center"
        >
          {/* Aura de Nuvem e Luz */}
          <div className="absolute inset-0 -m-6 rounded-full cloud-aura blur-2xl pointer-events-none opacity-80" />

          {/* Foto Nítida com Máscara de Nuvem */}
          <div className="relative w-full max-w-[380px] flex justify-center cloud-mask-ethereal">
            <img
              src={IMAGES.medium}
              alt="Milena Medeiros, médium do Templo de Luz"
              className="w-full h-auto max-h-[340px] object-cover object-center drop-shadow-md"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="mt-2.5 max-w-[360px] px-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#ded3e8] text-[11px] font-extrabold text-[#5d4786] uppercase shadow-xs">
              <span>✦</span> MÉDIUM TITULAR DA CASA NOVA (DESDE 1993)
            </span>
            <p className="mt-2 text-[13px] text-[#5e4b73] leading-relaxed font-medium">
              Há 33 anos dedicando sua vida à missão de consolar corações. Milena jamais cobra por psicografia — cada mensagem é vertida à mão como ato de amor e caridade pura.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { n: "33", l: "anos de caridade" },
            { n: "+12k", l: "cartas manuscritas" },
            { n: "4,9★", l: "de consolo real" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm"
            >
              <span className="font-display block text-[22px] font-extrabold text-[#5d4786]">
                {s.n}
              </span>
              <span className="mt-0.5 block text-[11.5px] font-medium text-[#6c5a82]">{s.l}</span>
            </div>
          ))}
        </Reveal>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={scrollToMaterials}
            className="group inline-flex items-center gap-3 rounded-2xl border border-[#d8cae5] bg-gradient-to-r from-[#fffefd] via-[#f7f2fb] to-[#fffefd] px-5 py-3 text-[14px] font-black text-[#432d68] shadow-[0_14px_26px_-18px_rgba(93,71,134,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#a98cc8] hover:shadow-[0_18px_30px_-16px_rgba(93,71,134,0.8)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5d4786] text-base text-white shadow-sm">📜</span>
            <span>Ver como a carta é preparada</span>
            <span className="text-lg transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
          </button>
        </div>

        {/* ── SEÇÃO DE COPY PERSUASIVA & QUEBRA DE OBJEÇÃO ANTES DA DOAÇÃO ── */}
        <Reveal delay={130} className="mt-8">
          <div id="materiais-section" className="scroll-mt-24 rounded-[26px] border border-slate-200 bg-white p-5 sm:p-7 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.5)] text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2eef8] border border-[#e1d8ec] text-[#5d4786] text-[10.5px] font-extrabold uppercase tracking-wider mb-3">
              <span>🕊️</span>
              <span>Compromisso Sagrado de Caridade</span>
            </div>

            <h2 className="font-display text-[21px] sm:text-[23px] font-extrabold text-[#1f1035] leading-snug">
              Por que a psicografia de {primeiroEnte} é 100% gratuita, mas a vela no altar precisa ser mantida com a sua ajuda?
            </h2>

            <div className="mt-4 space-y-4 text-[16px] sm:text-[17px] text-[#4a3b60] leading-[1.75] font-normal">
              <p>
                A mediunidade de Milena Medeiros é um dom divino guiado pela caridade pura de Allan Kardec e Chico Xavier — por isso, <strong className="text-[#1f1035] font-extrabold">você jamais pagará por uma linha sequer da psicografia</strong>. A mensagem de quem você ama é um presente sagrado dos céus.
              </p>
              <p>
                No entanto, para que a médium consiga realizar o recolhimento espiritual e sintonizar a presença de {primeiroEnte} aqui na Terra, o oratório necessita de <strong className="text-[#1f1035] font-extrabold">insumos físicos consagrados</strong> que não são gratuitos na matéria:
              </p>
            </div>

            {/* Foto da Médium Milena no Oratório com Vela e Pergaminho */}
            <div className="my-4 overflow-hidden rounded-2xl border border-amber-300/80 bg-white shadow-md">
              <img
                src={IMAGES.milenaOratorio}
                alt="Médium Milena Medeiros em recolhimento e oração no Templo de Luz"
                className="w-full h-auto max-h-[380px] object-cover object-center"
                loading="lazy"
                decoding="async"
              />
              <div className="p-2.5 bg-gradient-to-r from-amber-50 via-white to-amber-50 text-center border-t border-amber-200/60">
                <span className="text-[11px] font-bold text-[#78350f] italic">
                  🕊️ Médium Milena Medeiros durante o recolhimento sagrado no Templo de Luz
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-orange-300 bg-orange-100 px-4 py-3 text-center text-[12px] font-black leading-relaxed tracking-[0.04em] text-orange-950 uppercase shadow-sm">
              A CARTA E O TRABALHO DA MÉDIUM SÃO GRATUITOS. A CONTRIBUIÇÃO VOLUNTÁRIA DESTINA-SE AOS MATERIAIS DO ORATÓRIO E ÀS AÇÕES FRATERNAS DA CASA.
            </div>

            {/* 3 Pilares Visuais da Doação */}
            <div className="mt-4 space-y-2.5">
              <div className="flex items-stretch gap-3 overflow-hidden rounded-2xl border border-amber-200/60 bg-white/90 shadow-2xs">
                <img src={insumoVelaImage} alt="Vela de sete dias no altar" className="h-auto w-24 shrink-0 object-cover sm:w-28" loading="lazy" decoding="async" />
                <div className="py-3 pr-3">
                  <h4 className="text-[13px] font-extrabold text-[#1f1035]">
                    1. Vela de 7 Dias em Nome de {primeiroEnte}
                  </h4>
                  <p className="text-[11.5px] text-[#6c5a82] mt-0.5 leading-relaxed">
                    A cera pura de 7 dias é consagrada e permanece acesa diante do altar durante todo o recolhimento, funcionando como ponto de ancoragem e farol de luz para a sintonia.
                  </p>
                </div>
              </div>

              <div className="flex items-stretch gap-3 overflow-hidden rounded-2xl border border-amber-200/60 bg-white/90 shadow-2xs">
                <img src={insumoCartaImage} alt="Papel especial de algodão e pergaminho" className="h-auto w-24 shrink-0 object-cover sm:w-28" loading="lazy" decoding="async" />
                <div className="py-3 pr-3">
                  <h4 className="text-[13px] font-extrabold text-[#1f1035]">
                    2. Papel Especial de Algodão Puro
                  </h4>
                  <p className="text-[11.5px] text-[#6c5a82] mt-0.5 leading-relaxed">
                    Folhas de pergaminho físico de alta gramatura onde a letra manuscrita, os traços originais e as assinaturas de {primeiroEnte} são vertidos fisicamente.
                  </p>
                </div>
              </div>

              <div className="flex items-stretch gap-3 overflow-hidden rounded-2xl border border-amber-200/60 bg-white/90 shadow-2xs">
                <img src={insumoSopaImage} alt="Sopa fraterna e manutenção da casa" className="h-auto w-24 shrink-0 object-cover sm:w-28" loading="lazy" decoding="async" />
                <div className="py-3 pr-3">
                  <h4 className="text-[13px] font-extrabold text-[#1f1035]">
                    3. Sopa Fraterna & Manutenção da Casa
                  </h4>
                  <p className="text-[11.5px] text-[#6c5a82] mt-0.5 leading-relaxed">
                    O Centro Espírita Casa Nova é mantido unicamente pelas doações das famílias acolhidas, alimentando semanalmente dezenas de irmãos necessitados.
                  </p>
                </div>
              </div>
            </div>

            {/* Chamada de Fechamento Confortadora */}
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-[12px] text-[#78350f] font-medium leading-relaxed">
              ✨ <strong>Milena doa seu tempo, sua prece e sua mediunidade sem pedir nada em troca.</strong> Seu gesto voluntário de manter os insumos hoje é o que permite a este altar continuar aceso para você e para quem mais busca alívio na dor.
            </div>
          </div>
        </Reveal>

        <Reveal delay={135}>
          <Suspense fallback={<DeferredFallback />}><MilenaAudioMessage /></Suspense>
        </Reveal>

        {/* ── META DE MATERIAIS DO ORATÓRIO (APÓS A EXPLICAÇÃO) ── */}
        <Reveal delay={140} className="mt-6">
          <DonationGoal />
        </Reveal>

        {/* ── CARD DE DOAÇÃO SOLIDÁRIA COM PIX NA PÁGINA ── */}
        <Reveal className="relative mt-8 overflow-hidden rounded-3xl p-4 text-center shadow-xl border border-slate-200/90 bg-white sm:p-6">
          <div id="pix-section" className="absolute -top-16" />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#92400e]">
              ★ Caridade Fraterna
            </span>
            <span className="inline-flex rounded-full border border-[#e5daf0] bg-[#f6f0fc] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#2d144d]">
              Sustentação do Oratório
            </span>
          </div>

          <h2 className="font-display mt-4 text-[20px] leading-[1.35] font-extrabold text-[#181126] sm:text-[22px]">
            Consagre a vela e os materiais da sessão de {primeiroEnte}
          </h2>

          <p className="mx-auto mt-2 text-[13px] leading-relaxed text-[#5e4b73] font-normal max-w-md">
            Escolha abaixo com o coração o valor da sua contribuição para os insumos do oratório da médium Milena Medeiros:
          </p>

          {/* Integração do Seletor de Doação Livre & PIX Instantâneo */}
          <PixInstantBox
            primeiroNome={primeiro}
            primeiroEnte={primeiroEnte}
            nomeCompleto={nome}
            enteCompleto={ente}
            relacao={relacao}
          mensagem={mensagem}
            temas={temasEscolhidos}
            horario={horarioExibicao}
          />

          {/* Selo de Garantia Sagrada e Segurança Premium */}
          <SecurityGuaranteeSeal />

        </Reveal>

        <Reveal className="mt-10">
          <SectionLabel>Dúvidas frequentes e acolhimento</SectionLabel>
          <Faq />
        </Reveal>
      </div>

      {/* CTA fixa inferior para PIX / Doação */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] border-t border-[#ded8e7] bg-[#fffefd]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl shadow-[0_-14px_35px_-22px_rgba(33,26,53,0.4)]">
        <button
          type="button"
          onClick={() => {
            scrollToMaterials();
          }}
          className="cta-hot w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#4b8b7e] via-[#39776c] to-[#2d665e] px-5 py-3 text-[14px] font-extrabold tracking-wide text-white shadow-lg shadow-[#39776c]/25 transition-transform hover:-translate-y-0.5"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>Ver como a carta é preparada</span>
          </span>
        </button>

      </div>
    </div>
  );
}

/* ─────────── funil principal ─────────── */

type Step = "intro" | "ente" | "relacao" | "tempo" | "mensagem" | "confirma" | "loading" | "result";

const QUIZ_STORAGE_KEY = "templodeluz_quiz_state";

export function QuizFunnel() {
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const [step, setStep] = useState<Step>((search.step as Step) || "intro");
  const trackedStepsRef = useRef(new Set<Step>());
  const telemetrySnapshotRef = useRef<Record<string, unknown>>({});

  const [nome, setNome] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).nome || "" : "";
    } catch {
      return "";
    }
  });

  const [ente, setEnte] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).ente || "" : "";
    } catch {
      return "";
    }
  });

  const [relacao, setRelacao] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).relacao || "" : "";
    } catch {
      return "";
    }
  });

  const [tempo, setTempo] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).tempo || "" : "";
    } catch {
      return "";
    }
  });

  const [dorPrincipal, setDorPrincipal] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).dorPrincipal || "" : "";
    } catch {
      return "";
    }
  });

  const [mensagem, setMensagem] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).mensagem || "" : "";
    } catch {
      return "";
    }
  });

  const [modoMensagem, setModoMensagem] = useState<"temas" | "livre">(() => {
    if (typeof window === "undefined") return "temas";
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).modoMensagem || "temas" : "temas";
    } catch {
      return "temas";
    }
  });

  const [temasEscolhidos, setTemasEscolhidos] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).temasEscolhidos || [] : [];
    } catch {
      return [];
    }
  });

  const [horario, setHorario] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
      return saved ? JSON.parse(saved).horario || "" : "";
    } catch {
      return "";
    }
  });

  const [erroNome, setErroNome] = useState<string>();
  const [erroEnte, setErroEnte] = useState<string>();

  // Sincroniza step com search param caso a URL mude externamente
  useEffect(() => {
    if (search.step && search.step !== step) {
      setStep(search.step as Step);
    }
  }, [search.step]);

  // Salva no localStorage em tempo real qualquer alteração
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        QUIZ_STORAGE_KEY,
        JSON.stringify({
          nome,
          ente,
          relacao,
          tempo,
          dorPrincipal,
          mensagem,
          modoMensagem,
          temasEscolhidos,
          horario,
        }),
      );
    } catch {
      // ignore
    }
  }, [nome, ente, relacao, tempo, dorPrincipal, mensagem, modoMensagem, temasEscolhidos, horario]);

  telemetrySnapshotRef.current = {
    nome,
    ente,
    relacao,
    tempo,
    dorPrincipal,
    mensagem,
    temasEscolhidos,
  };

  // Cada etapa é registrada uma vez por sessão. Antes, cada tecla digitada
  // repetia eventos de pixel e inserções de telemetria para a mesma etapa.
  useEffect(() => {
    if (trackedStepsRef.current.has(step)) return;
    trackedStepsRef.current.add(step);

    const snapshot = telemetrySnapshotRef.current;
    trackQuizStep(step, {
      nome_consulente: (snapshot["nome"] as string) || undefined,
      nome_ente: (snapshot["ente"] as string) || undefined,
      relacao: (snapshot["relacao"] as string) || undefined,
      tempo: (snapshot["tempo"] as string) || undefined,
      dor: (snapshot["dorPrincipal"] as string) || undefined,
    });

    const stepOrderMap: Record<Step, number> = {
      intro: 1,
      ente: 2,
      relacao: 3,
      tempo: 4,
      mensagem: 5,
      confirma: 6,
      loading: 7,
      result: 8,
    };

    trackQuizTelemetry({
      stepIndex: stepOrderMap[step] || 1,
      stepName: step,
      leadName: (snapshot["nome"] as string) || undefined,
      enteQuerido: (snapshot["ente"] as string) || undefined,
      grauParentesco: (snapshot["relacao"] as string) || undefined,
      mensagemPreview: (snapshot["mensagem"] as string) || undefined,
      temas: Array.isArray(snapshot["temasEscolhidos"]) && snapshot["temasEscolhidos"].length > 0
        ? (snapshot["temasEscolhidos"] as string[])
        : undefined,
      completed: step === "result",
    });
  }, [step]);

  const goto = (s: Step) => {
    setStep(s);
    navigate({ search: { step: s }, replace: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const primeiroEnte = ente?.trim() ? ente.trim().split(" ")[0] : "seu ente querido";
  const primeiroNome = nome?.trim() ? nome.trim().split(" ")[0] : "você";

  return (
    <div className="jungle-quiz quiz-modern relative isolate mx-auto flex min-h-screen w-full max-w-[520px] flex-col overflow-hidden bg-transparent text-[#272039] shadow-[0_0_70px_-30px_rgba(33,26,53,0.4)] border-x border-white/15">
      <div className="absolute inset-0 z-0"><GradientBackground className="h-full w-full" /></div>
      <main className="relative z-10 flex flex-1 flex-col">
        {/* ETAPA 1: NOME */}
        {step === "intro" && (
          <Intro
            nome={nome}
            setNome={(v) => {
              setNome(v);
              setErroNome(undefined);
              recordInput("nome_consulente", v, { userName: v, currentScreen: "intro" }, 350);
            }}
            error={erroNome}
            next={() => {
              if (!nome.trim()) {
                setErroNome("Informe seu nome para continuar.");
                window.requestAnimationFrame(() => {
                  const field = document.getElementById("intro-name-field");
                  field?.scrollIntoView({ behavior: "smooth", block: "center" });
                  field?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
                });
                return;
              }
              goto("ente");
            }}
          />
        )}

        {/* ETAPA 2: ENTE QUERIDO */}
        {step === "ente" && (
          <div className="flex flex-1 flex-col animate-rise-in">
            <Progress
              step={2}
              total={6}
              caption="Seu pedido"
              onBack={() => goto("intro")}
            />
            <QuestionHead
              eyebrow="🕯️ Elo de Saudade e Amor"
              title={`${primeiroNome}, quem é a pessoa amada que já partiu e você deseja reencontrar através da carta?`}
              subtitle="O nome é o elo vibracional usado pela médium para sintonizar a frequência certa no plano espiritual."
            />
            <ComfortNote step="ente" />
            <div className="px-6 pb-16">
              <Field
                label="Nome completo de quem partiu"
                value={ente}
                onChange={(v) => {
                  setEnte(v);
                  setErroEnte(undefined);
                  recordInput(
                    "nome_ente_querido",
                    v,
                    { userName: nome, metadata: { ente: v }, currentScreen: "ente" },
                    350,
                  );
                }}
                placeholder="Digite o nome dele(a)"
                error={erroEnte}
                autoFocus
                onEnter={() =>
                  ente.trim()
                    ? goto("relacao")
                    : setErroEnte("Por favor, informe o nome para a sintonia.")
                }
              />

              <div className="mt-6">
                <Cta
                  onClick={() => {
                    if (!ente.trim())
                      return setErroEnte("Por favor, informe o nome para a sintonia.");
                    goto("relacao");
                  }}
                >
                  💫 Prosseguir com Amor
                </Cta>
              </div>

              <ObjectionBuster
                icon="🔒"
                title="Sigilo Sagrado e Respeito"
                text="Este nome é levado exclusivamente ao oratório da médium Milena Medeiros no momento do recolhimento espiritual."
              />
            </div>
          </div>
        )}

        {/* ETAPA 3: VÍNCULO ADAPTATIVO */}
        {step === "relacao" && (
          <div className="flex flex-1 flex-col animate-rise-in">
            <Progress
              step={3}
              total={6}
              caption="Seu pedido"
              onBack={() => goto("ente")}
            />
            <QuestionHead
              eyebrow="💞 Laço Sagrado"
              title={`Qual é o vínculo de alma que une você e ${primeiroEnte}?`}
              subtitle="Cada laço possui uma frequência única. Isso ajuda a médium a reconhecer as memórias e formas de tratamento do espírito."
            />
            <ComfortNote step="relacao" />
            <div className="flex flex-col gap-3 px-6 pb-6">
              {[
                { e: "👩", l: "Mãe ou Pai", h: "O laço sagrado de quem nos deu a vida e a bênção" },
                {
                  e: "🧒",
                  l: "Filho ou Filha",
                  h: "O amor mais puro, que nem a distância física apaga",
                },
                {
                  e: "💍",
                  l: "Esposo(a) ou Companheiro(a)",
                  h: "O reencontro das almas que se escolheram para amar",
                },
                {
                  e: "🤝",
                  l: "Avô(ó), Tio(a) ou Irmão(ã)",
                  h: "As raízes de afeto e as memórias da nossa família",
                },
                {
                  e: "🕊️",
                  l: "Amigo(a) ou outro laço querido",
                  h: "A sintonia sincera e eterna do coração",
                },
              ].map((o) => (
                <Option
                  key={o.l}
                  emoji={o.e}
                  label={o.l}
                  hint={o.h}
                  selected={relacao === o.l}
                  onClick={() => {
                    setRelacao(o.l);
                    recordInput(
                      "grau_parentesco",
                      o.l,
                      {
                        userName: nome,
                        metadata: { ente, relacao: o.l },
                        currentScreen: "relacao",
                      },
                      0,
                    );
                    setTimeout(() => goto("tempo"), 80);
                  }}
                />
              ))}
            </div>

            <div className="pb-16">
              <ObjectionBuster
                icon="🕊️"
                title="O amor transcende a matéria"
                text="A psicografia manifesta expressões e apelidos carinhosos característicos que vocês dois usavam em vida."
              />
            </div>
          </div>
        )}

        {/* ETAPA 4: TEMPO DE PARTIDA */}
        {step === "tempo" && (
          <div className="flex flex-1 flex-col animate-rise-in">
            <Progress
              step={4}
              total={6}
              caption="Seu pedido"
              onBack={() => goto("relacao")}
            />
            <QuestionHead
              eyebrow="⏳ Tempo de Transição"
              title={`Há quanto tempo ${primeiroEnte} fez a passagem para o plano espiritual?`}
              subtitle="Não existe tempo mínimo para a oração e para receber o conforto de um recado espiritual."
            />
            <ComfortNote step="tempo" />
            <div className="flex flex-col gap-3 px-6 pb-6">
              {[
                {
                  e: "🕯️",
                  l: "Menos de 6 meses",
                  h: "A dor ainda está recente e o coração busca consolo urgente",
                },
                {
                  e: "🌿",
                  l: "Entre 6 meses e 2 anos",
                  h: "A saudade aperta nos momentos do dia a dia",
                },
                {
                  e: "✨",
                  l: "Mais de 2 anos",
                  h: "O tempo passou, mas o amor e a lembrança permanecem vivos",
                },
              ].map((t) => (
                <Option
                  key={t.l}
                  emoji={t.e}
                  label={t.l}
                  hint={t.h}
                  selected={tempo === t.l}
                  onClick={() => {
                    setTempo(t.l);
                    recordInput(
                      "tempo_desencarne",
                      t.l,
                      {
                        userName: nome,
                        metadata: { ente, relacao, tempo: t.l },
                        currentScreen: "tempo",
                      },
                      0,
                    );
                    setTimeout(() => goto("mensagem"), 80);
                  }}
                />
              ))}
            </div>

            <div className="pb-16">
              <ObjectionBuster
                icon="💡"
                title="Dúvida Comum: 'Preciso esperar anos para psicografar?'"
                text="Não. Espíritos acolhidos na luz recebem permissão para enviar recados de paz a qualquer momento para acalentar familiares em sofrimento."
              />
            </div>
          </div>
        )}

        {/* ETAPA 5: ORIENTAÇÃO DA CARTA — 2 OPÇÕES: TEMAS SAGRADOS OU MENSAGEM LIVRE */}
        {step === "mensagem" && (
          <div className="flex flex-1 flex-col animate-rise-in">
            <Progress
              step={5}
              total={6}
              caption="Seu pedido"
              onBack={() => goto("tempo")}
            />
            <QuestionHead
              eyebrow="💌 Conexão do Coração"
              title={`Como você deseja orientar a médium Milena para a carta de ${primeiroEnte}?`}
              subtitle="Você pode escolher os temas sagrados para a canalização ou redigir uma mensagem com suas próprias palavras."
            />
            <ComfortNote step="mensagem" />

            <div className="px-6 pb-16">
              {/* 2 Abas Modernas Luminous & Intuitive */}
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5 border border-slate-200 mb-5">
                <button
                  type="button"
                  onClick={() => setModoMensagem("temas")}
                  className={`flex-1 py-3 px-2.5 rounded-xl text-[13.5px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    modoMensagem === "temas"
                      ? "bg-white text-[#5d4786] shadow-sm border border-[#ded8e7] font-bold"
                      : "text-slate-500 hover:text-slate-800 font-medium"
                  }`}
                >
                  <span>🕊️</span>
                  <span>Escolher Temas</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2eef8] text-[#5d4786] border border-[#e1d8ec] font-bold">
                    Mais fácil
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoMensagem("livre")}
                  className={`flex-1 py-3 px-2.5 rounded-xl text-[13.5px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    modoMensagem === "livre"
                      ? "bg-white text-[#5d4786] shadow-sm border border-[#ded8e7] font-bold"
                      : "text-slate-500 hover:text-slate-800 font-medium"
                  }`}
                >
                  <span>✍️</span>
                  <span>Escrever Livremente</span>
                </button>
              </div>

              {/* MODO 1: ESCOLHER TEMAS SAGRADOS */}
              {modoMensagem === "temas" && (
                <div className="space-y-2.5">
                  <p className="text-[13px] text-[#6c5a82] font-normal mb-2">
                    Toque nos pontos que você mais anseia ouvir de {primeiroEnte}:
                  </p>
                  {[
                    {
                      id: "paz",
                      emoji: "🕊️",
                      titulo: `Saber se ${primeiroEnte} está em paz e como foi acolhido(a) na luz`,
                      desc: "Notícias sobre o estado de descanso e serenidade espiritual",
                    },
                    {
                      id: "conselho",
                      emoji: "🌟",
                      titulo: "Receber um conselho ou bênção para confortar minha vida",
                      desc: "Orientação e força para quem continua a jornada na Terra",
                    },
                    {
                      id: "perdao",
                      emoji: "🤍",
                      titulo: "Perdão, reconciliação e cura de culpas ou palavras não ditas",
                      desc: "Alívio no peito e paz para o coração de ambos",
                    },
                    {
                      id: "sinal",
                      emoji: "✨",
                      titulo: `Um sinal ou confirmação clara de que ${primeiroEnte} está ao meu lado`,
                      desc: "Sentir que a união de vocês continua viva além da matéria",
                    },
                    {
                      id: "lembranca",
                      emoji: "🌸",
                      titulo: "Uma lembrança íntima e recado de afeto característico",
                      desc: "Detalhes e carinho que apenas vocês dois reconhecem",
                    },
                  ].map((tema) => {
                    const isSelected = temasEscolhidos.includes(tema.id);
                    return (
                      <button
                        key={tema.id}
                        type="button"
                        onClick={() => {
                          const novos = isSelected
                            ? temasEscolhidos.filter((t) => t !== tema.id)
                            : [...temasEscolhidos, tema.id];
                          setTemasEscolhidos(novos);
                          const textoDor = novos.join(" · ");
                          setDorPrincipal(textoDor);
                          recordInput(
                            "temas_orientacao_medium",
                            textoDor,
                            {
                              userName: nome,
                              metadata: { ente, relacao, tempo, temas: novos },
                              currentScreen: "mensagem",
                            },
                            0,
                          );
                        }}
                        className={`group relative flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-[#6f5aa0] bg-[#f2eef8] shadow-sm ring-4 ring-[#6f5aa0]/10"
                            : "border-slate-200 bg-white hover:border-[#b9a8cf] hover:shadow-sm"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-xl group-hover:bg-[#f2eef8] transition-colors">
                          {tema.emoji}
                        </div>
                        <div className="flex-1">
                          <span className="block text-[14.5px] font-bold text-[#181126] leading-snug">
                            {tema.titulo}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-[#6c5a82] leading-normal font-normal">
                            {tema.desc}
                          </span>
                        </div>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-extrabold ${
                            isSelected
                              ? "border-[#5d4786] bg-[#5d4786] text-white"
                              : "border-slate-300 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* MODO 2: ESCREVER LIVREMENTE */}
              {modoMensagem === "livre" && (
                <div className="space-y-4">
                  <p className="text-[13px] text-[#6c5a82] font-normal">
                    Escreva como se estivesse conversando com {primeiroEnte}:
                  </p>

                  <Field
                    label="Sua mensagem sincera"
                    hideLabel
                    value={mensagem}
                    onChange={(v) => {
                      setMensagem(v);
                      setDorPrincipal(v);
                      recordInput(
                        "mensagem_para_ente",
                        v,
                        {
                          userName: nome,
                          metadata: { ente, relacao, tempo, mensagem: v },
                          currentScreen: "mensagem",
                        },
                        350,
                      );
                    }}
                    placeholder={`Escreva aqui o que está guardado no seu peito para ${primeiroEnte}: a saudade, um agradecimento, um pedido de perdão ou consolo...`}
                    textarea
                  />

                  {/* Sugestões rápidas de toque único */}
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#5d4786] block mb-2">
                      💡 Toque para adicionar inspirações à sua mensagem:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Sinto sua falta todos os dias...",
                        "Obrigado por ter sido meu porto seguro...",
                        "Peço que me envie um sinal de paz...",
                        "Estamos bem e cuidando uns dos outros aqui...",
                      ].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            const novo = mensagem ? `${mensagem}\n${sug}` : sug;
                            setMensagem(novo);
                            setDorPrincipal(novo);
                          }}
                          className="rounded-full bg-[#f2eef8] border border-[#e1d8ec] px-3 py-1 text-[12px] font-medium text-[#5d4786] hover:bg-[#e9e1f2] transition-colors text-left"
                        >
                          + "{sug}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Cta
                  onClick={() => {
                    if (modoMensagem === "temas" && temasEscolhidos.length === 0 && !dorPrincipal) {
                      setDorPrincipal(`Saber se ${primeiroEnte} está em paz no plano espiritual`);
                    }
                    goto("confirma");
                  }}
                >
                  💫 Consagrar Intenção e Avançar
                </Cta>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMensagem("");
                  setDorPrincipal("Canalização espontânea dos mentores de luz");
                  goto("confirma");
                }}
                className="mt-4 w-full cursor-pointer text-center text-[12.5px] font-medium text-[#6c5a82] underline decoration-[#f59e0b]/50 underline-offset-4 hover:text-[#2d144d]"
              >
                Prefiro deixar a médium canalizar 100% livremente
              </button>

              <ObjectionBuster
                icon="🔮"
                title="Canalização Pura e Sagrada"
                text={`Seja por temas ou por palavras livres, a médium Milena Medeiros sintoniza com respeito máximo a frequência espiritual de ${primeiroEnte}.`}
              />
            </div>
          </div>
        )}

        {/* ETAPA 7: CONFIRMAÇÃO & HORÁRIO */}
        {step === "confirma" && (
          <div className="flex flex-1 flex-col animate-rise-in">
            <Progress
              step={6}
              total={6}
              caption="Seu pedido"
              onBack={() => goto("mensagem")}
            />
            <QuestionHead
              eyebrow="✨ Revisão final do pedido"
              title={`Deseja encaminhar seu pedido para ${primeiroEnte} agora?`}
              subtitle="Você verá os detalhes do acolhimento, exemplos e formas de continuar antes de qualquer contribuição."
            />
            <ComfortNote step="confirma" />
            <div className="flex flex-col gap-3 px-6 pb-6">
              <Option
                emoji="💌"
                label="Quero encaminhar meu pedido agora"
                hint="Você seguirá para a página de revisão, relatos e opções de continuidade"
                selected={false}
                onClick={() => {
                  const h = horarioAgendamento();
                  setHorario(h);
                  recordInput(
                    "deseja_receber_hoje",
                    "Quero encaminhar meu pedido agora",
                    {
                      userName: nome,
                      metadata: { ente, relacao, tempo, dorPrincipal, horario: h },
                      currentScreen: "confirma",
                    },
                    0,
                  );
                  goto("loading");
                }}
              />
              <Option
                emoji="🕊️"
                label="Quero conhecer os detalhes antes de continuar"
                hint="Você verá a apresentação da médium, relatos e o resumo do pedido"
                selected={false}
                onClick={() => {
                  const h = horarioAgendamento();
                  setHorario(h);
                  recordInput(
                    "deseja_receber_hoje",
                    "Quero conhecer os detalhes antes de continuar",
                    {
                      userName: nome,
                      metadata: { ente, relacao, tempo, dorPrincipal, horario: h },
                      currentScreen: "confirma",
                    },
                    0,
                  );
                  goto("loading");
                }}
              />
            </div>

            <div className="pb-16">
              <ObjectionBuster
                icon="🛡️"
                title="Você continua no seu ritmo"
                text="Na próxima tela, você poderá revisar sua intenção, ver como funciona o atendimento e escolher livremente a melhor forma de seguir."
              />
            </div>
          </div>
        )}
      </main>

      {step === "loading" && (
        <div className="relative z-10"><Loading
          nome={nome}
          ente={ente}
          relacao={relacao}
          dorPrincipal={dorPrincipal}
          onDone={() => goto("result")}
        /></div>
      )}

      {step === "result" && (
        <div className="relative z-10"><Result
          nome={nome}
          ente={ente}
          relacao={relacao}
          dorPrincipal={dorPrincipal}
          horario={horario}
          mensagem={mensagem}
          temasEscolhidos={temasEscolhidos}
        /></div>
      )}

      {step !== "loading" && <div className="relative z-10"><Footer /></div>}
    </div>
  );
}

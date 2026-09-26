import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { FAQ, IMAGES, STEPS_HOW } from "./data";
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
import milenaFreeLetterAudio from "../../assets/media/audio/milena-carta-gratuita.mp3";
import correiosLogo from "../../assets/images/quiz/correios-logo.png";
import { CustomAudioPlayer } from "./CustomAudioPlayer";
import { Check, Flame, Loader2, Scroll, ShieldCheck, Sparkles } from "lucide-react";

const LetterZoomModal = lazy(() =>
  import("./LetterZoomModal").then(({ LetterZoomModal: Component }) => ({ default: Component })),
);
const PixCheckout = lazy(() =>
  import("./PixCheckout").then(({ PixCheckout: Component }) => ({ default: Component })),
);
const SocialProofSection = lazy(() =>
  import("./SocialProofSection").then(({ SocialProofSection: Component }) => ({
    default: Component,
  })),
);
const MilenaAudioMessage = lazy(() =>
  import("./MilenaAudioMessage").then(({ MilenaAudioMessage: Component }) => ({
    default: Component,
  })),
);
const WhatsAppContactModal = lazy(() =>
  import("./WhatsAppContactModal").then(({ WhatsAppContactModal: Component }) => ({
    default: Component,
  })),
);

function DeferredFallback() {
  return (
    <div
      className="mx-auto my-4 h-16 w-full max-w-md animate-pulse rounded-2xl bg-slate-100"
      aria-hidden="true"
    />
  );
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

function horarioAgendamento(): string {
  if (typeof window !== "undefined") {
    try {
      const stored =
        sessionStorage.getItem("templodeluz_horario_entrega") ||
        localStorage.getItem("templodeluz_horario_entrega");
      const storedTimestamp =
        sessionStorage.getItem("templodeluz_horario_entrega_ts") ||
        localStorage.getItem("templodeluz_horario_entrega_ts");

      if (stored && stored.includes("h") && storedTimestamp) {
        const diffMinutes = (Date.now() - Number(storedTimestamp)) / 60000;
        if (diffMinutes < 100) {
          return stored.trim();
        }
      }
    } catch {
      // ignore
    }
  }

  // Horário oficial de Brasília e São Paulo (America/Sao_Paulo)
  const now = new Date();
  const spString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const d = new Date(spString);

  // Sempre 2 horas à frente (120 minutos)
  d.setMinutes(d.getMinutes() + 120);
  const rem = d.getMinutes() % 5;
  if (rem !== 0) {
    d.setMinutes(d.getMinutes() + (5 - rem));
  }
  const formatted = `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("templodeluz_horario_entrega", formatted);
      localStorage.setItem("templodeluz_horario_entrega", formatted);
      sessionStorage.setItem("templodeluz_horario_entrega_ts", String(Date.now()));
      localStorage.setItem("templodeluz_horario_entrega_ts", String(Date.now()));
    } catch {
      // ignore
    }
  }
  return formatted;
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
    "bg-gradient-to-r from-[#6d4e94] via-[#5d3f82] to-[#4b3070] text-white shadow-[#4b3070]/25 border border-[#8b6ab5]/35 hover:brightness-105";
  if (tone === "green") {
    toneClasses =
      "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-emerald-700/25 border border-emerald-400/35 hover:brightness-105";
  } else if (tone === "gold") {
    toneClasses =
      "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 shadow-amber-950/20 border border-amber-300/60 hover:brightness-105";
  } else if (tone === "royal") {
    toneClasses =
      "bg-gradient-to-r from-[#2c1d42] via-[#221535] to-[#180e28] text-white shadow-[#180e28]/30 border border-[#523875] hover:brightness-110";
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
  const shared = `w-full rounded-[14px] border px-4 py-4 text-[15.5px] font-medium leading-relaxed shadow-sm outline-none transition-all duration-200 ${
    theme === "dark"
      ? "bg-white text-[#342b3e] placeholder:text-[#a399aa] focus:border-[#8a729d] focus:ring-4 focus:ring-[#8a729d]/10"
      : "bg-white text-[#272039] placeholder:text-[#a89fb4] focus:border-[#6f5aa0] focus:ring-4 focus:ring-[#6f5aa0]/10"
  }`;
  let borderStyle = theme === "dark" ? "border-[#d9cee2]" : "border-slate-200";
  if (error) {
    borderStyle = "border-destructive ring-1 ring-destructive";
  } else if (highlight) {
    borderStyle = "border-[#7a64a2] ring-4 ring-[#7a64a2]/15";
  }

  return (
    <div className="w-full">
      {hideLabel ? null : (
        <label
          className={`mb-2 block text-[12px] font-bold tracking-[0.1em] uppercase ${theme === "dark" ? "text-[#655470]" : "text-slate-700"}`}
        >
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
          className={`${shared} min-h-[130px] resize-y ${borderStyle}`}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          aria-label={label}
          autoFocus={autoFocus}
          className={`${shared} ${borderStyle}`}
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
    <div className="sticky top-0 z-30 border-b border-[#ddd3e5] bg-[#fbf8fd]/95 px-4 pt-3.5 pb-3 text-[#3b3244] backdrop-blur-xl shadow-[0_12px_34px_-24px_rgba(82,67,99,0.3)] sm:px-6">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar para a etapa anterior"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d6c9df] bg-white text-base font-black text-[#6d587c] transition-colors hover:border-[#aa96b8] hover:bg-[#f3edf7]"
            >
              ‹
            </button>
          )}
          <span className="flex min-w-0 items-center gap-1.5 truncate font-bold text-[#574c60]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#82a99b] shadow-[0_0_8px_rgba(130,169,155,0.4)]" />
            Sala reservada · {caption}
          </span>
        </div>
        <span className="rounded-full border border-[#d6c9df] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#6d6077]">
          Etapa {step} de {total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-[#ddd3e5] bg-[#eee8f2] p-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#86aa9d] via-[#8d79a0] to-[#c6a866] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-center text-[11px] font-medium text-[#766b7e]">
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
    <div className="px-5 pb-4 pt-8 sm:px-7">
      <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-[#f2ecf6] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#725b83]">
        {eyebrow}
      </span>
      <h2 className="font-display text-[26px] font-extrabold leading-[1.18] tracking-tight text-[#342b3e]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[14px] font-normal leading-relaxed text-[#6b6173]">{subtitle}</p>
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
    <div className="animate-rise-in mx-5 mb-5 flex items-center gap-3 rounded-2xl border border-[#d8cfe0] bg-[#f8f4fa] px-4 py-3.5 shadow-[0_18px_40px_-30px_rgba(82,67,99,0.3)] sm:mx-7">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ddd3e5] bg-white text-xl shadow-sm">
        {note.icon}
      </span>
      <p className="text-[13px] font-medium leading-relaxed text-[#665b6f]">{note.text}</p>
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
          ? "border-[#8a729d] bg-[#f1eaf6] shadow-[0_16px_34px_-22px_rgba(111,90,136,0.35)] ring-4 ring-[#8a729d]/10"
          : "border-[#ddd3e5] bg-white shadow-sm hover:-translate-y-0.5 hover:border-[#b9a8c6] hover:bg-[#faf7fc] hover:shadow-md"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e1d9e7] bg-[#f8f4fa] text-2xl transition-colors group-hover:bg-[#f1eaf6]">
        {emoji}
      </div>
      <div className="flex-1">
        <span className="block text-[15px] font-bold leading-snug text-[#3b3244]">{label}</span>
        {hint ? (
          <span className="mt-1 block text-[12.5px] font-normal leading-normal text-[#716777]">
            {hint}
          </span>
        ) : null}
      </div>
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-extrabold transition-colors ${
          selected
            ? "border-[#789c90] bg-[#789c90] text-white shadow-xs"
            : "border-[#c9bdcf] text-transparent group-hover:border-[#9a83aa]"
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
    <div className="mx-5 mt-6 flex items-start gap-3.5 rounded-2xl border border-[#ddd3e5] bg-white p-4 text-left shadow-sm sm:mx-7">
      <span className="shrink-0 rounded-xl border border-[#e1d9e7] bg-[#f8f4fa] p-2 text-xl">
        {icon}
      </span>
      <div>
        <strong className="block text-[13px] font-bold text-[#44394c]">{title}</strong>
        <p className="mt-1 text-[12.5px] font-normal leading-relaxed text-[#716777]">{text}</p>
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
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
          {percent.toFixed(1).replace(".", ",")}% alcançada esta semana
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
          O Centro Espírita Casa Nova (Templo de Luz) é uma obra de caridade sem fins lucrativos.
          Sua doação voluntária cobre unicamente a vela de cera virgem de 7 dias com o nome do seu
          ente querido, o pergaminho consagrado e o acolhimento fraterno.
        </p>
      </div>
    </div>
  );
}

/* ─────────── CARD DE PAGAMENTO PIX INSTANTÂNEO & DOAÇÃO LIVRE ─────────── */

function getDonationPsychologicalImpact(
  amount: number,
  primeiroEnte: string,
) {
  if (amount < 15) {
    return {
      tier: "invalid",
      icon: "⚠️",
      badge: "Valor abaixo do mínimo",
      title: "Escolha um valor para continuar",
      description: `A carta e o acolhimento são gratuitos. A contribuição voluntária ajuda a preparar a vela e o pergaminho para ${primeiroEnte}.`,
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      cardBorder: "border-red-200 bg-red-50/30",
      isValid: false,
    };
  }
  if (amount < 30) {
    return {
      tier: "basic",
      icon: "🕯️",
      badge: "Apoio essencial",
      title: `Ajuda com a vela de 7 dias para ${primeiroEnte}`,
      description: "Contribui para a vela utilizada no período de oração e acolhimento no oratório.",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      cardBorder: "border-amber-200 bg-amber-50/50",
      isValid: true,
    };
  }
  if (amount < 40) {
    return {
      tier: "paper",
      icon: "⭐",
      badge: "Materiais do pedido",
      title: `Ajuda com vela e pergaminho para ${primeiroEnte}`,
      description: "Contribui para os principais materiais usados no registro e na preparação do pedido.",
      badgeColor: "bg-[#f1eaf6] text-[#705b80] border-[#d7c9e1]",
      cardBorder: "border-[#d7c9e1] bg-[#f8f4fa]",
      isValid: true,
    };
  }
  if (amount < 60) {
    return {
      tier: "heart",
      icon: "✨",
      badge: "Escolha mais completa",
      title: `Materiais + carta física para ${primeiroEnte}`,
      description: "Ajuda com vela, pergaminho e preparação do pedido. A carta física pode ser incluída conforme o valor escolhido.",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      cardBorder: "border-amber-200 bg-[#fffaf0]",
      isValid: true,
    };
  }
  if (amount < 100) {
    return {
      tier: "light",
      icon: "🌟",
      badge: "Apoio ampliado",
      title: "Materiais e ações fraternas da casa",
      description: `Além dos materiais relacionados a ${primeiroEnte}, ajuda nas atividades de acolhimento e assistência informadas pela instituição.`,
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      cardBorder: "border-purple-200 bg-purple-50/50",
      isValid: true,
    };
  }
  if (amount < 150) {
    return {
      tier: "guardian",
      icon: "🕊️",
      badge: "Apoio solidário",
      title: "Ajuda ampliada à manutenção da casa",
      description: `Apoia os materiais de ${primeiroEnte} e amplia a contribuição para as atividades fraternas mantidas pela instituição.`,
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      cardBorder: "border-emerald-200 bg-emerald-50/50",
      isValid: true,
    };
  }

  return {
    tier: "eternal",
    icon: "👑",
    badge: "Apoio extraordinário",
    title: "Contribuição ampliada aos materiais e à obra fraterna",
    description: `Ajuda a manter os materiais de ${primeiroEnte}, o acolhimento da casa e as ações assistenciais informadas pela instituição.`,
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    cardBorder: "border-amber-200 bg-gradient-to-br from-[#fffdf7] via-[#fffaf0] to-[#f8f1df]",
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
  const [supportStats, setSupportStats] = useState<{
    supporters: number;
    raisedCents: number;
  } | null>(null);

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
  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-[#e6ddeb]/88 p-3 backdrop-blur-sm sm:p-5"
      aria-modal="true"
      aria-labelledby="milena-support-title"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative z-10 flex h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-[26px] border border-[#ded3e8] bg-[#fffefd] shadow-2xl sm:max-w-[580px]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela"
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cce2] bg-white/90 text-[#655470] backdrop-blur-md hover:bg-[#f3edf7]"
        >
          ✕
        </button>

        <header className="shrink-0 border-b border-[#ddd3e5] bg-[#f3edf7]">
          <div className="h-[104px] w-full bg-[#ebe3f1] p-2 sm:h-[122px]">
            <img
              src={IMAGES.milenaCatarata}
              alt="Milena Medeiros"
              className="h-full w-full object-contain object-center"
              loading="lazy"
            />
          </div>
          <div className="px-4 pb-3 pt-2 text-left sm:px-5 sm:pb-4 sm:pt-3">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#705b80]">
              Antes de continuar
            </span>
            <h3
              id="milena-support-title"
              className="mt-1 max-w-[380px] font-display text-[18px] font-black leading-tight text-[#342b3e] sm:text-[20px]"
            >
              Se quiser, amplie seu gesto de apoio
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#716777]">
              Escolha opcional para apoiar o tratamento oftalmológico da Milena.
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-5 sm:p-4 sm:pb-5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-[#e3dbea] bg-[#f5f1f8] p-2.5 text-center">
              <span className="block text-[17px] font-black text-[#5d4786]">
                {supportStats?.supporters ?? 0}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#6b6175]">
                apoios confirmados
              </span>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-center">
              <span className="block text-[17px] font-black text-emerald-700">
                {formatCurrency(raisedCents)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                arrecadados
              </span>
            </div>
          </div>

          <section
            className="mt-3 rounded-2xl border border-[#e3dbea] bg-white p-3 shadow-sm"
            aria-label="Meta da cirurgia"
          >
            <div className="flex items-end justify-between gap-3">
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#6b6175]">
                  Meta do tratamento
                </span>
                <strong className="mt-0.5 block text-[16px] text-[#272039]">
                  {formatCurrency(surgeryTargetCents)}
                </strong>
              </div>
              <span className="rounded-full bg-[#f2eef8] px-2.5 py-1 text-[10.5px] font-black text-[#5d4786]">
                {goalPercent.toFixed(1).replace(".", ",")}%
              </span>
            </div>
            <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[#eee9f2] p-0.5 ring-1 ring-[#e3dbea]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8b75b2] via-[#6f5aa0] to-[#4b8b7e] transition-[width] duration-700"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[10.5px] font-semibold text-slate-500">
              <span>{formatCurrency(raisedCents)} confirmados</span>
              <span>Faltam {formatCurrency(remainingCents)}</span>
            </div>
          </section>

          <div className="mt-3 rounded-2xl border border-[#e3dbea] bg-[#f5f1f8] p-3 text-left">
            <p className="text-[12.5px] leading-relaxed text-[#514763] sm:text-[13px]">
              Milena está em acompanhamento para tratar a catarata, que afeta sua leitura e o
              trabalho com as cartas. A casa mantém uma corrente de apoio para exames, tratamento e
              recuperação.
            </p>
            <p className="mt-1.5 text-[11.5px] font-bold text-[#6b6175]">
              É opcional. Manter o valor atual não muda o acolhimento ou o atendimento.
            </p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-2.5">
            {suggestions.map((suggestion) => {
              const selected =
                suggestion.amount === selectedAmount && customExtraInput.length === 0;
              return (
                <button
                  key={suggestion.amount}
                  type="button"
                  onClick={() => {
                    setCustomExtraInput("");
                    setSelectedAmount(suggestion.amount);
                  }}
                  className={`min-h-[68px] rounded-2xl border px-1 py-2 text-center transition-all sm:px-2 sm:py-2.5 ${selected ? "border-[#6f5aa0] bg-[#f2eef8] ring-4 ring-[#6f5aa0]/10" : "border-slate-200 bg-white hover:border-[#b9a8cf]"}`}
                >
                  <span className="block text-[16px] font-black text-[#272039]">
                    R$ {suggestion.amount.toFixed(0)}
                  </span>
                  <span
                    className={`mt-1 block text-[9.5px] font-bold ${selected ? "text-[#5d4786]" : "text-slate-500"}`}
                  >
                    {suggestion.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={`mt-3 rounded-2xl border bg-white p-3 transition-all ${customExtraInput ? "border-[#6f5aa0] ring-4 ring-[#6f5aa0]/10" : "border-slate-200"}`}
          >
            <label
              htmlFor="custom-support-extra"
              className="block text-left text-[11.5px] font-bold text-[#514763]"
            >
              Deseja somar outro valor?{" "}
              <span className="font-medium text-slate-500">Mínimo de R$ 10</span>
            </label>
            <div className="relative mt-2">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-black text-[#5d4786]">
                R$
              </span>
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
            {invalidCustomExtra && (
              <p className="mt-1.5 text-[10.5px] font-bold text-red-700">
                O apoio adicional deve ser de pelo menos R$ 10.
              </p>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-[#fffefd] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_28px_-22px_rgba(39,32,57,0.55)] sm:px-5">
          <button
            type="button"
            disabled={invalidCustomExtra}
            onClick={() => onContinue(selectedAmount)}
            className="w-full rounded-[14px] bg-gradient-to-r from-[#4b8b7e] via-[#39776c] to-[#2d665e] px-5 py-3.5 text-[14px] font-black text-white shadow-lg shadow-[#39776c]/25 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar com R$ {selectedAmount.toFixed(2).replace(".", ",")}
          </button>
          {selectedAmount !== currentAmount && (
            <button
              type="button"
              onClick={() => onContinue(currentAmount)}
              className="mt-1.5 w-full py-2 text-[11.5px] font-bold text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
            >
              Prefiro manter R$ {currentAmount.toFixed(2).replace(".", ",")}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function useCheckoutPosition(isValid: boolean, hasUserSelectedOption: boolean) {
  const [isCheckoutInView, setIsCheckoutInView] = useState<boolean>(false);
  const [checkoutPosition, setCheckoutPosition] = useState<"above" | "below">("below");

  useEffect(() => {
    const getCheckoutTarget = () =>
      document.getElementById("botao-pagamento-checkout") ||
      document.querySelector<HTMLElement>("#area-pagamento-pix button.utmify-initiate-checkout") ||
      document.getElementById("area-pagamento-pix");

    let rafId: number | null = null;

    const checkPosition = () => {
      const el = getCheckoutTarget();
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      const inView = rect.top < viewportHeight - 50 && rect.bottom > 50;
      setIsCheckoutInView(inView);
      setCheckoutPosition(rect.top < 0 ? "above" : "below");
    };

    const handleScrollOrResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(checkPosition);
    };

    checkPosition();
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isValid, hasUserSelectedOption]);

  return { isCheckoutInView, checkoutPosition };
}

function resolvePhysicalLetterDescription(requested: boolean, fee: number): string {
  if (!requested) {
    return "Marque esta opção para incluir R$15 de envio e receber a carta física pelos Correios.";
  }
  return fee === 0
    ? "A taxa já está incluída neste valor. Na próxima página, você informa apenas o endereço."
    : "R$15 serão incluídos automaticamente no total do PIX/cartão. Na próxima página, você informa apenas o endereço de entrega.";
}

function PixInstantBox({
  primeiroNome = "Você",
  primeiroEnte = "seu ente querido",
  nomeCompleto,
  enteCompleto,
  relacao,
  tempoPassagem,
  intencaoPrincipal,
  mensagem,
  temas = [],
  horario,
}: {
  readonly primeiroNome?: string;
  readonly primeiroEnte?: string;
  readonly nomeCompleto?: string;
  readonly enteCompleto?: string;
  readonly relacao?: string;
  readonly tempoPassagem?: string;
  readonly intencaoPrincipal?: string;
  readonly mensagem?: string;
  readonly temas?: string[];
  readonly horario?: string;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number>(35);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<boolean>(false);
  const [freeLetterAudioOpen, setFreeLetterAudioOpen] = useState(false);
  const [hasUserSelectedOption, setHasUserSelectedOption] = useState<boolean>(false);
  const [physicalLetterRequested, setPhysicalLetterRequested] = useState(() => {
    if (typeof window === "undefined") return false;
    const storedPreference = sessionStorage.getItem("templodeluz:physical-letter-selected");
    return storedPreference === "true";
  });

  const activeAmount = isCustom ? parseBrazilianCurrency(customInput) : selectedAmount;
  const physicalLetterFee = physicalLetterRequested && activeAmount < 40 ? 15 : 0;
  const checkoutAmount = activeAmount + physicalLetterFee;
  const impact = getDonationPsychologicalImpact(activeAmount, primeiroEnte);
  const { isCheckoutInView, checkoutPosition } = useCheckoutPosition(impact.isValid, hasUserSelectedOption);
  const physicalLetterDescription = resolvePhysicalLetterDescription(physicalLetterRequested, physicalLetterFee);
  const physicalLetterBadge =
    physicalLetterRequested && physicalLetterFee === 0 ? "INCLUÍDA NO VALOR" : "+ R$ 15 ENTREGA";

  const scrollToCheckout = () => {
    const payBtn =
      document.getElementById("botao-pagamento-checkout") ||
      document.querySelector<HTMLButtonElement>("#area-pagamento-pix button.utmify-initiate-checkout") ||
      document.getElementById("area-pagamento-pix");

    if (payBtn) {
      payBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      payBtn.classList.add("ring-4", "ring-emerald-400", "scale-[1.015]");
      window.setTimeout(() => {
        payBtn.classList.remove("ring-4", "ring-emerald-400", "scale-[1.015]");
      }, 1600);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true);
    const nextValue = sanitizeBrazilianCurrencyInput(e.target.value);
    setCustomInput(nextValue);
    setHasUserSelectedOption(true);
  };

  const handlePhysicalLetterPreference = (checked: boolean) => {
    setPhysicalLetterRequested(checked);
    setHasUserSelectedOption(true);
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
    setHasUserSelectedOption(true);
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

  useEffect(() => {
    if (!freeLetterAudioOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFreeLetterAudioOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [freeLetterAudioOpen]);

  const presets = [
    {
      val: 20,
      label: "R$ 20",
      tag: "Ajuda com a vela de 7 dias",
    },
    {
      val: 30,
      label: "R$ 30",
      tag: "Ajuda com vela e pergaminho",
    },
    {
      val: 35,
      label: "R$ 35",
      tag: "Ajuda ampliada aos materiais",
      highlight: true,
    },
    {
      val: 40,
      label: "R$ 40",
      tag: "Materiais + carta física incluída",
      physicalIncluded: true,
    },
    {
      val: 60,
      label: "R$ 60",
      tag: "Materiais + apoio às ações fraternas",
    },
  ];

  return (
    <div className="mt-4 overflow-hidden rounded-[30px] border border-[#d9cee2] bg-[#fffefd] text-center shadow-[0_28px_80px_-36px_rgba(82,67,99,0.35)]">
      <div className="relative overflow-hidden border-b border-[#ddd3e5] bg-gradient-to-br from-[#eee6f4] via-[#f7f2fa] to-[#fff9ed] px-5 py-7 text-left text-[#342b3e] sm:px-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#9d82c4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-[#c49a52]/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7c9e1] bg-white/80 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#705b80] backdrop-blur-sm">
            Contribuição voluntária
          </span>
          <h3 className="mt-3 max-w-[360px] font-display text-[22px] font-extrabold leading-[1.2] text-[#342b3e]">
            {primeiroNome}, escolha como deseja apoiar os materiais de {primeiroEnte}
          </h3>
          <p className="mt-2 max-w-[390px] text-[13px] leading-relaxed text-[#665b70]">
            Cada valor mostra de forma simples o que sua contribuição ajuda a manter. A psicografia continua sem cobrança.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#e2cf9f] bg-[#fff7df] px-3 py-1.5 text-[11.5px] font-semibold text-[#765a24]">
            <span>⏱️ Previsão de recebimento: <strong>Hoje às {horario || "18h00"} (Horário de Brasília)</strong></span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#e1d8e7] bg-[#f8f4fa] p-3 text-center shadow-sm">
          {[
            ["1", "Escolha o valor"],
            ["2", "PIX ou cartão"],
            ["3", "Confirmação"],
          ].map(([step, label]) => (
            <div key={step} className="min-w-0">
              <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full border border-[#cdbfda] bg-white text-[10px] font-black text-[#705b80]">
                {step}
              </span>
              <span className="mt-1.5 block text-[10.5px] font-bold leading-tight text-[#716777]">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 text-left">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#554a5e]">
              Escolha o seu gesto
            </span>
            <span className="text-[10.5px] font-semibold text-[#817687]">Você decide o valor</span>
          </div>

          <div
            className={`mb-5 rounded-2xl border-2 bg-white p-4 shadow-[0_14px_28px_-20px_rgba(82,67,99,0.25)] transition-all ${isCustom ? "border-[#8a729d] ring-4 ring-[#8a729d]/10" : "border-[#e1d8e7]"}`}
          >
            <label htmlFor="custom-donation-input" className="block">
              <span className="inline-flex rounded-full border border-[#d8cce2] bg-[#f3edf7] px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] text-[#705b80]">
                Valor livre
              </span>
              <span className="mt-2 block text-[15px] font-extrabold text-[#3b3244]">
                Ou escolha outro valor
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-relaxed text-[#716777]">
                A partir de R$ 15 para os materiais da vela e do pergaminho.
              </span>
            </label>
            <div className="relative mt-3 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-black text-[#705b80]">
                R$
              </span>
              <input
                id="custom-donation-input"
                type="text"
                inputMode="decimal"
                value={customInput}
                onFocus={() => {
                  setIsCustom(true);
                  setHasUserSelectedOption(true);
                }}
                onChange={handleCustomChange}
                placeholder="Ex.: 50,00"
                className="w-full rounded-xl border border-[#d9cee2] bg-[#fbf9fc] py-4 pl-12 pr-4 text-[22px] font-black text-[#342b3e] outline-none transition-all placeholder:text-[#aaa0b0] focus:border-[#8a729d] focus:bg-white"
              />
            </div>
            {isCustom && customInput.length > 0 && activeAmount < 15 && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
                O valor sugerido a partir de R$ 15 ajuda a cobrir os materiais mínimos do oratório.
              </p>
            )}
          </div>

          <div className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#716777]">
            Veja o que cada valor ajuda a manter
          </div>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((item) => {
              const isSelected = !isCustom && selectedAmount === item.val;
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handleSelectPreset(item.val, Boolean(item.physicalIncluded))}
                  className={`group relative flex min-h-[112px] flex-col justify-center overflow-hidden rounded-2xl text-left transition-all duration-200 cursor-pointer ${item.highlight ? "col-span-2 min-h-[132px]" : ""} ${
                    isSelected
                      ? "border-2 border-[#8a729d] bg-[#f0e9f5] text-[#342b3e] shadow-[0_18px_40px_-18px_rgba(111,90,136,0.35)] ring-4 ring-[#8a729d]/10"
                      : "border border-[#ddd3e5] bg-white text-[#342b3e] shadow-sm hover:border-[#b6a5c2] hover:bg-[#faf7fc]"
                  }`}
                >
                  {item.highlight && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#c49a52] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-sm">
                      Mais escolhida
                    </span>
                  )}
                  <div className="flex flex-1 flex-col justify-center p-4">
                    <span className={`block font-black leading-tight tracking-tight text-[#6c557d] ${item.highlight ? "text-[28px]" : "text-[21px]"}`}>
                      {item.label}
                    </span>
                    <span className={`mt-1 block font-semibold leading-snug ${item.highlight ? "text-[13px]" : "text-[11.5px]"} ${isSelected ? "text-[#655470]" : "text-[#766d7d]"}`}>
                      {item.tag}
                    </span>
                    {isSelected && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#55796e]">
                        <span>✓</span> Escolhido
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <label
        className={`mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-all ${physicalLetterRequested ? "border-[#8a729d] bg-[#f0e9f5] ring-4 ring-[#8a729d]/10" : "border-[#ddd3e5] bg-white hover:border-[#b6a5c2]"}`}
      >
        <input
          type="checkbox"
          checked={physicalLetterRequested}
          onChange={(event) => handlePhysicalLetterPreference(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#789c90]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[14px] font-extrabold text-[#3b3244]">
            <span>Quero receber a carta física</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#705b80] ring-1 ring-[#d8cce2]">
              {physicalLetterBadge}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#716777]">
            {physicalLetterDescription}
          </p>
          {physicalLetterRequested && (
            <div className="mt-4 border-t border-[#d8cce2] pt-4">
              <div className="flex h-20 justify-center overflow-hidden rounded-2xl bg-white px-5 shadow-sm ring-1 ring-[#5b476a]">
                <img
                  src={correiosLogo}
                  alt="Correios"
                  className="h-16 w-full scale-[2.35] object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="mt-3 text-left">
                <span className="block text-[12px] font-black text-[#44394c]">
                  Envio pelos Correios
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#716777]">
                  Postagem estimada em 2–3 dias úteis após confirmar o endereço. O prazo final
                  depende do CEP.
                </span>
              </div>
            </div>
          )}
        </div>
      </label>

      {physicalLetterRequested && impact.isValid && (
        <div className="mt-3 rounded-2xl border border-[#d8cce2] bg-[#f8f4fa] p-3 text-left">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-bold text-[#655a70]">Total para confirmar</span>
            <span className="text-[18px] font-black text-[#705b80]">
              R$ {checkoutAmount.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#766d7d]">
            R$ {activeAmount.toFixed(2).replace(".", ",")} de contribuição + R$ 15,00 da taxa de
            envio físico.
          </p>
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
          <span className="text-[13px] font-black text-[#6c557d]">
            R$ {activeAmount > 0 ? activeAmount.toFixed(2).replace(".", ",") : "0,00"}
          </span>
        </div>

        <h4 className="text-[13.5px] font-extrabold leading-snug text-[#3b3244]">{impact.title}</h4>
        <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">{impact.description}</p>

        {activeAmount < 15 && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-red-100/80 border border-red-200 text-red-900 text-[11.5px] font-bold leading-tight">
            O valor mínimo de R$15 ajuda a cobrir a vela de 7 dias e o pergaminho físico.
          </div>
        )}
      </div>

      <div id="area-pagamento-pix" className="scroll-mt-14">
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
              displayProductName={
                physicalLetterRequested ? "Contribuição + envio de carta física" : undefined
              }
              onPaymentConfirmed={(receipt) => {
                if (physicalLetterRequested && receipt.orderId) {
                  sessionStorage.setItem(
                    "templodeluz:physical-letter-fee-receipt",
                    JSON.stringify({
                      orderId: receipt.orderId,
                      amountCents: receipt.amountCents,
                      paidAt: new Date().toISOString(),
                    }),
                  );
                }
              }}
            />
          </Suspense>
        ) : (
          <div className="mt-5 p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
            Por favor, selecione ou digite um valor a partir de R$ 15 para continuar.
          </div>
        )}
      </div>

      {/* Continuidade após o pagamento */}
      <div className="mt-4 border-t border-[#e3dbe9] pt-3">
        <p className="text-center text-[11.5px] leading-relaxed text-[#766d7d]">
          Após confirmar a contribuição via PIX ou cartão, você será redirecionado(a) automaticamente.
        </p>
      </div>

      {/* Linha de Apoio via WhatsApp - Sutil, elegante e sem roubar o foco do pagamento */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setWhatsAppModalOpen(true)}
          className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#b9d9cd] bg-gradient-to-r from-[#eff8f4] via-[#e6f4ee] to-[#f7fbf9] p-3 text-left shadow-[0_16px_34px_-22px_rgba(58,126,101,0.3)] transition-all hover:border-[#8fc3af] hover:brightness-[1.02] sm:p-3.5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-xs">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.107-.07-.251-.08-.574-.188-.988-.369-1.758-.767-2.903-2.545-2.991-2.663-.088-.118-.718-.956-.718-1.822 0-.866.453-1.293.614-1.469.161-.177.351-.221.468-.221.117 0 .234.001.336.006.107.005.251-.041.393.298.146.351.498 1.214.542 1.303.044.088.073.192.015.308-.059.117-.088.19-.176.293-.088.103-.186.23-.265.31-.088.088-.18.184-.078.36.103.176.458.756.983 1.224.676.602 1.246.789 1.422.877.176.088.279.074.382-.044.103-.117.439-.512.556-.688.117-.176.235-.147.396-.088.161.059 1.026.484 1.202.572.176.088.293.132.337.206.044.074.044.43-.1 1.035z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.523 3.664 1.435 5.186L2.1 22l4.98-1.306A9.958 9.958 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.635 0-3.15-.494-4.414-1.343l-.316-.214-2.95.774.787-2.876-.234-.336A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-emerald-200 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-950">
                  Suporte
                </span>
                <span className="text-[12px] font-bold leading-tight text-[#335f50]">
                  Dúvidas com seu pedido? Fale no WhatsApp
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] leading-tight text-[#5f796f]">
                Atendimento fraterno com a equipe da Médium Milena
              </p>
            </div>
          </div>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition-all group-hover:bg-emerald-50">
            ›
          </span>
        </button>
      </div>

      <Suspense fallback={null}>
        <WhatsAppContactModal
          isOpen={whatsAppModalOpen}
          onClose={() => setWhatsAppModalOpen(false)}
          nomeConsulente={nomeCompleto || primeiroNome}
          nomeEnte={enteCompleto || primeiroEnte}
          grauParentesco={relacao}
          tempoPassagem={tempoPassagem}
          intencaoPrincipal={intencaoPrincipal}
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
        />
      </Suspense>

      {/* A alternativa gratuita permanece disponível, sem disputar o foco da contribuição. */}
      <div className="mt-7 border-t border-[#e3dbe9] pt-5">
        <div className="rounded-2xl border border-[#e1d8e7] bg-[#f8f4fa] p-4 text-center shadow-xs">
          <p className="text-[11.5px] leading-relaxed text-[#766d7d]">
            A contribuição é voluntária. Se este não for o seu momento, você ainda pode seguir para o pergaminho.
          </p>

          <div className="mt-3">
            <button
              type="button"
              onClick={handleIrParaPergaminho}
              className="w-full cursor-pointer rounded-xl border border-[#cfc3d8] bg-white px-4 py-3 text-[11.5px] font-bold text-[#655470] transition-colors hover:border-[#aa96b8] hover:bg-[#f3edf7] hover:text-[#4f405a]"
            >
              Seguir sem contribuir neste momento
            </button>
          </div>

          {freeLetterAudioOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                className="free-letter-audio-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-[#e6ddeb]/90 p-3 backdrop-blur-sm sm:p-5"
                aria-modal="true"
                aria-labelledby="free-letter-audio-title"
              >
                <div
                  className="fixed inset-0"
                  onClick={() => setFreeLetterAudioOpen(false)}
                  aria-hidden="true"
                />
                <div className="free-letter-audio-card relative z-10 max-h-[calc(100dvh-24px)] w-full max-w-[420px] overflow-y-auto overscroll-contain rounded-[26px] border border-[#d8cae5] bg-[#fffefd] shadow-2xl text-center pb-2">
                  {/* Topo Elegante com Botão Fechar */}
                  <div className="relative overflow-hidden border-b border-[#d5e5df] bg-gradient-to-br from-[#e9f5f0] via-[#f7fbf9] to-[#fff8e8] px-5 pb-5 pt-6 text-center text-[#342b3e]">
                    <button
                      type="button"
                      onClick={() => setFreeLetterAudioOpen(false)}
                      aria-label="Fechar"
                      className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#d8cce2] bg-white text-sm font-bold text-[#655470] transition-all hover:bg-[#f3edf7] active:scale-95"
                    >
                      ✕
                    </button>
                    <div className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-[#a8d3c0]/20 blur-3xl" />
                    <div className="pointer-events-none absolute -right-10 bottom-0 h-24 w-24 rounded-full bg-[#c49a52]/20 blur-3xl" />

                    <span className="relative inline-flex items-center gap-1 rounded-full border border-[#dec99a] bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#765a24]">
                      <span>🕊️</span> Mensagem da Milena
                    </span>

                    <h2
                      id="free-letter-audio-title"
                      className="relative mt-2.5 font-display text-[19px] sm:text-[21px] font-black leading-snug"
                    >
                      OUÇA ANTES DE SEGUIR PARA O PERGAMINHO
                    </h2>
                    <p className="relative mt-1 text-[11.5px] leading-relaxed text-[#63746e]">
                      Sua carta continua 100% gratuita. Ouça este breve recado especial da médium
                      antes de você redigir.
                    </p>
                  </div>

                  {/* Conteúdo do Modal */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <CustomAudioPlayer
                      src={milenaFreeLetterAudio}
                      title="Áudio de acolhimento"
                      subtitle="Mensagem de orientação da Médium"
                      autoPlay={true}
                      defaultDuration={61}
                      theme="emerald"
                      ariaLabel="Mensagem da Milena sobre receber a carta"
                    />

                    <button
                      type="button"
                      onClick={continueToPergaminho}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4b8b7e] via-[#39776c] to-[#2d665e] py-3.5 px-5 text-sm font-black text-white uppercase tracking-wider shadow-lg shadow-[#39776c]/30 hover:shadow-xl hover:shadow-[#39776c]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                    >
                      <span>Continuar para o pergaminho</span>
                      <span className="text-base">→</span>
                    </button>

                    <button
                      type="button"
                      onClick={continueToPergaminho}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-3 transition-colors cursor-pointer"
                    >
                      Ignorar áudio e ir direto ao pergaminho
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

      {/* ── BARRA FLUTUANTE DE PAGAMENTO RÁPIDO (PIX / CARTÃO) ── */}
      {hasUserSelectedOption &&
        impact.isValid &&
        !isCheckoutInView &&
        !freeLetterAudioOpen &&
        !whatsAppModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <aside
            className="float-bar-enter fixed bottom-0 left-0 right-0 z-[9990] border-t border-[#ded4eb] bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(33,26,53,0.22)] backdrop-blur-md transition-all sm:px-6"
            aria-label="Pagamento Rápido"
          >
            <div className="mx-auto flex max-w-[480px] items-center justify-between gap-3">
              <div className="min-w-0 flex-1 text-left">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                  {physicalLetterRequested ? "Total com envio:" : "Valor selecionado:"}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[21px] sm:text-[24px] font-black text-[#2e1d4a] leading-none">
                    R$ {checkoutAmount.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="inline-flex text-[9.5px] font-extrabold text-[#5d4786] bg-[#f2eef8] border border-[#e1d8ec] px-1.5 py-0.5 rounded-md">
                    PIX / Cartão
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={scrollToCheckout}
                className="group relative cursor-pointer flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-5 py-3 text-white font-black text-[13px] sm:text-[14px] uppercase tracking-wider shadow-lg shadow-emerald-950/20 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <PixIcon className="w-4 h-4 fill-white shrink-0" />
                <span>PAGAR AGORA</span>
                <span
                  aria-hidden="true"
                  className={`text-emerald-100 text-base leading-none transition-transform ${
                    checkoutPosition === "above"
                      ? "group-hover:-translate-y-0.5"
                      : "group-hover:translate-y-0.5"
                  }`}
                >
                  {checkoutPosition === "above" ? "↑" : "↓"}
                </span>
              </button>
            </div>
          </aside>,
          document.body,
        )}
        </div>
      </div>
    </div>
  );
}

function SecurityGuaranteeSeal() {
  return (
    <div className="mt-7 space-y-3.5 border-t border-[#e3dbe9] pt-5 text-left">
      {/* Título da Seção dos Selos */}
      <div className="text-center">
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-[#b45309]">
          ✦ Atendimento e segurança ✦
        </span>
        <h3 className="font-display mt-0.5 text-[16px] font-extrabold text-[#342b3e]">
          Transparência em cada etapa
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Card 1: Selo da Paz */}
        <div className="flex flex-col items-center rounded-2xl border border-[#ead9b0] bg-gradient-to-b from-[#fffdf8] to-[#fff8e9] p-4 text-center shadow-xs transition-transform duration-300 hover:scale-[1.01]">
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
          <h4 className="font-display mt-0.5 text-[14.5px] font-extrabold leading-tight text-[#3b3244]">
            Selo de Paz Espiritual
          </h4>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#746956]">
            Sua intenção é registrada com cuidado para o atendimento e a oração da casa.
          </p>
        </div>

        {/* Card 2: Selo de Garantia */}
        <div className="flex flex-col items-center rounded-2xl border border-[#ddd3e5] bg-gradient-to-b from-white to-[#f5f0f8] p-4 text-center shadow-xs transition-transform duration-300 hover:scale-[1.01]">
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
          <h4 className="font-display mt-0.5 text-[14.5px] font-extrabold leading-tight text-[#3b3244]">
            Processamento protegido
          </h4>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#716777]">
            PIX e cartão são processados por provedores de pagamento; você vê o método antes de
            confirmar.
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
    <div className="jungle-intro animate-rise-in min-h-screen bg-[#f5f1f8]">
      <header className="overflow-hidden bg-gradient-to-b from-[#ede5f3] to-[#f8f4fa]">
        <div className="w-full p-3 sm:p-4">
          <img
            src={milenaCartaImage}
            alt="Milena Medeiros escrevendo uma carta no oratório"
            className="mx-auto block h-auto w-full max-w-[620px] rounded-2xl object-contain shadow-[0_20px_45px_-26px_rgba(0,0,0,0.82)]"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div className="px-4 pb-6 pt-5">
          <div className="mx-auto max-w-[680px] rounded-[26px] border border-[#d8cce2] bg-white/90 p-5 text-center shadow-[0_24px_56px_-28px_rgba(82,67,99,0.35)] sm:p-7">
            <Stars className="mb-3" />
            <span className="mb-3 inline-flex rounded-full border border-[#d9cee2] bg-[#f4eff7] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#6e5a7e]">
              Templo de Luz · Acolhimento privado
            </span>
            <h1 className="font-display text-[25px] font-medium leading-[1.12] tracking-[-0.03em] text-[#342b3e] sm:text-[32px]">
              O que você ainda gostaria de dizer a quem ama?{" "}
              <span className="text-[#745b86] underline decoration-[#cbb39b] decoration-2 underline-offset-4">
                Comece por uma resposta simples
              </span>
            </h1>
            <p className="mt-3 text-[14px] font-normal leading-relaxed text-[#665c70]">
              Você não precisa saber o que escrever agora. Responda com calma e organize sua intenção antes de decidir como seguir.
            </p>
          </div>
        </div>
      </header>

      {/* Faixa de Prova Social */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-y border-[#ddd3e5] bg-[#eee8f3] px-4 py-3 text-[11.5px] text-[#554a5e] sm:text-[12.5px]">
        <span className="font-bold">💌 Atendimento acolhedor</span>
        <span className="h-3 w-px bg-[#cfc3d8]" />
        <span className="font-bold">✍️ Carta e pergaminho</span>
        <span className="h-3 w-px bg-[#cfc3d8]" />
        <span className="font-extrabold text-[#55796e]">🔒 Dados protegidos</span>
      </div>

      <div className="flex flex-col items-center px-4 pt-6 pb-10 sm:px-6">
        {/* Formulário + CTA imediatamente (micro-compromisso acima da dobra) */}
        <div className="w-full">
          <div className="rounded-[26px] border border-[#ddd3e5] bg-[#fffefd] p-6 shadow-[0_26px_55px_-30px_rgba(82,67,99,0.35)]">
            <div className="text-center mb-5">
              <span className="inline-flex rounded-full border border-[#d9cee2] bg-[#f3edf7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-[#705b80]">
                Primeiro passo · leva poucos minutos
              </span>
              <h2 className="mt-3 font-display text-[22px] font-bold leading-snug text-[#342b3e]">
                Vamos começar pelo seu nome
              </h2>
              <p className="mt-2 text-[13px] font-normal leading-relaxed text-[#675d70]">
                Seu nome deixa as próximas perguntas mais pessoais. Você responde no seu ritmo e pode revisar tudo antes de continuar.
              </p>
            </div>

            <div id="intro-name-field" className="relative">
              <Field
                label="Como podemos chamar você?"
                value={nome}
                onChange={setNome}
                placeholder="Ex.: Maria Aparecida Silva"
                error={error}
                onEnter={next}
                autoFocus
                highlight
                theme="dark"
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-center">
                <span className="rounded-full border border-[#c9ded6] bg-[#edf6f2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#4e7166]">
                  Etapa 1 de 6 · seu progresso fica salvo
                </span>
              </div>
              <Cta onClick={next} tone="green" pulse>
                Continuar para a próxima pergunta →
              </Cta>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11.5px] font-medium text-[#716777]">
              <span>🔒 Dados protegidos</span>
              <span>↩️ Respostas revisáveis</span>
              <span>💬 Suporte humano</span>
            </div>
          </div>
        </div>

        {/* Depoimento curto */}
        <Reveal delay={80} className="mt-6 w-full">
          <p className="font-display mx-auto max-w-[310px] text-center text-[14px] font-medium italic leading-relaxed text-[#675d70]">
            “Pude colocar em palavras o que estava guardado no coração e fui acolhida com muito
            respeito.”
          </p>
        </Reveal>

        {/* Exemplo de carta (prova visual com zoom) */}
        <Reveal delay={80} className="mt-6 w-full">
          <button
            type="button"
            onClick={() => setLetterModalOpen(true)}
            aria-label="Toque para ampliar exemplo de carta psicografada"
            className="group relative mx-auto block w-full max-w-[300px] cursor-zoom-in overflow-hidden rounded-2xl border border-[#dfcfa9] bg-[#fffefd] text-left shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
          >
            <div className="relative bg-white p-2">
              <img
                src={IMAGES.carta}
                alt="Exemplo real de carta psicografada manuscrita"
                className="w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.035]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-[#eadbb8] bg-[#fff8e8] px-3 py-3 text-center text-[11.5px] font-black text-[#765a24]">
              <span>🔍</span> Ver exemplo real
            </div>
          </button>
        </Reveal>

        {letterModalOpen && (
          <Suspense fallback={null}>
            <LetterZoomModal
              isOpen={letterModalOpen}
              onClose={() => setLetterModalOpen(false)}
              onCtaClick={next}
            />
          </Suspense>
        )}

        {/* Como funciona */}
        <Reveal className="mt-10 w-full">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#705b80]">
            Como acontece o reencontro
          </p>
          <div className="flex flex-col gap-3.5">
            {STEPS_HOW.map((s, i) => (
              <div
                key={s.title}
                className="flex items-start gap-4 rounded-2xl border border-[#ddd3e5] bg-white p-4 shadow-[0_14px_28px_-22px_rgba(82,67,99,0.3)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e0d6e7] bg-[#f6f1f9] text-xl shadow-sm">
                  {s.icon}
                </span>
                <div>
                  <span className="block text-[14.5px] font-bold text-[#44394c]">
                    {i + 1}. {s.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] font-normal leading-relaxed text-[#716777]">
                    {s.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-8 w-full">
          <Cta onClick={next} tone="green">
            💫 Iniciar Psicografia com a Médium
          </Cta>
        </Reveal>
      </div>
    </div>
  );
}

function getLoadingCurrentStageText(pct: number): string {
  if (pct < 35) return "Sintonizando oratório espiritual...";
  if (pct < 72) return "Consagrando pergaminho e vela de altar...";
  if (pct < 100) return "Confirmando com a médium Milena...";
  return "Tudo pronto! Abrindo seu acolhimento...";
}

function getStageCardClass(isCompleted: boolean, isActive: boolean): string {
  if (isCompleted) {
    return "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white shadow-sm";
  }
  if (isActive) {
    return "border-amber-300 bg-gradient-to-r from-amber-50 to-[#f8f3fb] shadow-sm ring-1 ring-amber-200";
  }
  return "border-[#e3dbe9] bg-white/70 opacity-70";
}

function getStageIconClass(isCompleted: boolean, isActive: boolean): string {
  if (isCompleted) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }
  if (isActive) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }
  return "border-[#ddd3e5] bg-[#f5f1f8] text-stone-500";
}

function getStageTitleClass(isCompleted: boolean, isActive: boolean): string {
  if (isCompleted) return "text-emerald-800";
  if (isActive) return "text-[#3b3244]";
  return "text-stone-500";
}

function getStageBadgeClass(isCompleted: boolean, isActive: boolean): string {
  if (isCompleted) {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (isActive) {
    return "border border-amber-200 bg-amber-50 text-amber-700 animate-pulse";
  }
  return "border border-[#e3dbe9] bg-[#f5f1f8] text-stone-500";
}

function getStageBadgeText(
  isCompleted: boolean,
  isActive: boolean,
  doneStatus: string,
  activeStatus: string,
): string {
  if (isCompleted) return doneStatus;
  if (isActive) return activeStatus;
  return "Aguardando";
}

function Loading({
  nome,
  ente,
  relacao: _relacao,
  dorPrincipal: _dorPrincipal,
  onDone,
}: {
  readonly nome: string;
  readonly ente: string;
  readonly relacao?: string;
  readonly dorPrincipal?: string | undefined;
  readonly onDone: () => void;
}) {
  const [pct, setPct] = useState(0);
  const primeiroNome = nome.split(" ")[0] || "Você";
  const primeiroEnte = ente.split(" ")[0] || "seu ente querido";

  // Duração realista: 5.2s + 700ms de confirmação final
  useEffect(() => {
    const startTime = Date.now();
    const duration = 5200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setPct(progress);

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 40);

    const timeout = setTimeout(() => {
      onDone();
    }, 5900);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onDone]);

  // 3 Etapas Realistas
  const stages = [
    {
      id: 1,
      title: "1. Acolhimento & Sintonização Espiritual",
      detail: `Sintonizando as preces de ${primeiroNome} em memória de ${primeiroEnte}.`,
      icon: Flame,
      isActive: pct < 35,
      isCompleted: pct >= 35,
      activeStatus: "Sintonizando...",
      doneStatus: "✓ Sintonizado",
    },
    {
      id: 2,
      title: "2. Consagração dos Materiais Sagrados",
      detail: `Preparando a vela de 7 dias e o pergaminho consagrado no altar.`,
      icon: Scroll,
      isActive: pct >= 35 && pct < 72,
      isCompleted: pct >= 72,
      activeStatus: "Consagrando...",
      doneStatus: "✓ Consagrado",
    },
    {
      id: 3,
      title: "3. Confirmação com Milena Medeiros",
      detail: "Apresentando sua intenção para a sessão de psicografia e acolhimento.",
      icon: ShieldCheck,
      isActive: pct >= 72 && pct < 100,
      isCompleted: pct >= 100,
      activeStatus: "Confirmando...",
      doneStatus: "✓ Confirmado",
    },
  ];

  const currentStageText = getLoadingCurrentStageText(pct);

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#eee7f3] via-[#f8f4fa] to-[#fffaf1] px-4 py-8 text-center text-[#342b3e] sm:px-6">
      {/* Luz ambiente e aura sagrada de fundo */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[460px] rounded-[32px] border border-[#ded4e6] bg-white/90 p-6 shadow-[0_24px_70px_-20px_rgba(82,67,99,0.3)] backdrop-blur-2xl sm:p-8">
        {/* Badge Nobre Superior */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dccba5] bg-gradient-to-r from-[#fff6dd] via-[#f3edf7] to-[#fff6dd] px-4 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#705b80] shadow-sm">
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            <span>Templo de Luz • Oratório Sagrado</span>
          </span>
        </div>

        {/* Foto da Médium Milena Medeiros em Destaque Nobre (Tamanho Ampliado e Acolhedor) */}
        <div className="mx-auto mt-5 flex flex-col items-center">
          <div className="relative">
            {/* Aura de luz sagrada que respira suavemente */}
            <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-tr from-amber-500/25 via-purple-500/20 to-amber-300/30 blur-xl animate-pulse" />

            <div className="relative h-44 w-44 sm:h-52 sm:w-52 overflow-hidden rounded-[28px] border-2 border-amber-400/80 shadow-[0_0_45px_rgba(245,158,11,0.35)] ring-4 ring-amber-400/25">
              <img
                src={milenaLoaderImage}
                alt="Médium Milena Medeiros em prece e acolhimento"
                className="h-full w-full object-cover object-center scale-105 transition-transform duration-700"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Selo flutuante de acolhimento maternal */}
            <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#d8c39a] bg-white/95 px-4 py-1 text-xs font-extrabold text-[#705b80] shadow-xl backdrop-blur-md">
              <Flame size={14} className="animate-pulse fill-amber-400 text-amber-300" />
              <span>Médium Milena Medeiros</span>
            </div>
          </div>
        </div>

        {/* Títulos com Classe, Calor Humano e Serenidade */}
        <h2 className="mt-6 font-display text-[22px] font-bold leading-tight text-[#342b3e] sm:text-[25px]">
          Estamos preparando sua sessão, <span className="text-[#705b80]">{primeiroNome}</span>
        </h2>
        <p className="mt-2 text-[13.5px] italic leading-relaxed text-[#716777]">
          “Respire fundo e acalme seu coração. Já estou no oratório preparando a vela e o altar para
          acolher você e {primeiroEnte}.”
        </p>

        {/* Barra de Progresso Chamativa, Espiritual e Leve */}
        <div className="mt-5 rounded-2xl border border-[#e3d4af] bg-[#fffaf0] p-4 text-left shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12.5px] font-bold text-[#765a24] sm:text-[13px]">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" />
              {currentStageText}
            </span>
            <span className="font-mono text-base font-black text-[#765a24] sm:text-lg">
              {pct}%
            </span>
          </div>

          <div
            aria-hidden="true"
            className="relative mt-3 h-3.5 w-full overflow-hidden rounded-full border border-[#e4d3ad] bg-[#eee5d2] p-0.5 shadow-inner"
          >
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.85)] transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            >
              {/* Ponto guia luminoso na ponta da barra */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_10px_#fff,0_0_18px_#f59e0b] -mr-1 animate-pulse" />
            </div>
          </div>
        </div>

        {/* As 3 Etapas Sendo Carregadas */}
        <div className="mt-4 space-y-2.5 text-left">
          {stages.map((st) => {
            const IconComponent = st.icon;
            return (
              <div
                key={st.id}
                className={`relative flex items-start gap-3 rounded-xl border p-3 transition-all duration-300 ${getStageCardClass(
                  st.isCompleted,
                  st.isActive,
                )}`}
              >
                {/* Ícone de Status da Etapa */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${getStageIconClass(
                    st.isCompleted,
                    st.isActive,
                  )}`}
                >
                  {st.isCompleted && (
                    <Check size={16} strokeWidth={2.5} className="text-emerald-700" />
                  )}
                  {!st.isCompleted && st.isActive && (
                    <Loader2 size={16} className="animate-spin text-amber-400" />
                  )}
                  {!st.isCompleted && !st.isActive && <IconComponent size={15} />}
                </div>

                {/* Conteúdo da Etapa */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3
                      className={`text-xs font-bold leading-snug ${getStageTitleClass(
                        st.isCompleted,
                        st.isActive,
                      )}`}
                    >
                      {st.title}
                    </h3>

                    {/* Badge de Status à Direita */}
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${getStageBadgeClass(
                        st.isCompleted,
                        st.isActive,
                      )}`}
                    >
                      {getStageBadgeText(
                        st.isCompleted,
                        st.isActive,
                        st.doneStatus,
                        st.activeStatus,
                      )}
                    </span>
                  </div>

                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#716777]">{st.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Aviso de Conclusão ou Sigilo */}
        {pct >= 100 ? (
          <div className="mt-4 animate-pulse rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-center text-xs font-bold text-emerald-700 shadow-sm">
            ✨ Sessão consagrada com sucesso. Abrindo acolhimento...
          </div>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#766d7d]">
            <span>🔒</span>
            <span>Momento sagrado: Seus sentimentos e dados são guardados em sigilo fraterno.</span>
          </p>
        )}
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
          className="overflow-hidden rounded-2xl border border-[#ddd3e5] bg-white shadow-sm"
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between p-4 text-left text-[14px] font-bold text-[#3b3244]"
          >
            <span>{item.q}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d8cce2] bg-[#f3edf7] text-base text-[#705b80]">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i ? (
            <p className="animate-rise-in border-t border-[#ebe4ef] px-4 pb-4 pt-3 text-[13px] leading-relaxed text-[#716777]">
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
  tempo = "",
  dorPrincipal = "",
  horario = "",
  mensagem = "",
  temasEscolhidos = [],
}: {
  readonly nome?: string;
  readonly ente?: string;
  readonly relacao?: string;
  readonly tempo?: string;
  readonly dorPrincipal?: string;
  readonly horario?: string;
  readonly mensagem?: string;
  readonly temasEscolhidos?: string[];
}) {
  const primeiro: string = (nome?.trim() ? nome.trim().split(" ")[0] : "Você") || "Você";
  const primeiroEnte: string =
    (ente?.trim() ? ente.trim().split(" ")[0] : "seu ente querido") || "seu ente querido";
  const nomeEnteCompleto: string = ente?.trim() || "seu ente querido";
  const horarioExibicao: string = horario?.trim() || horarioAgendamento();
  const hopeMessages = [
    "Você não precisa atravessar esse momento sozinho(a).",
    "Cada história merece tempo, cuidado e respeito.",
    "Seu gesto ajuda a transformar intenção em cuidado concreto.",
    "Seu pedido pode ser revisado antes de qualquer confirmação.",
  ];
  const [hopeMessageIndex, setHopeMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setHopeMessageIndex((index) => (index + 1) % hopeMessages.length),
      4_500,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && horarioExibicao) {
      try {
        sessionStorage.setItem("templodeluz_horario_entrega", horarioExibicao);
        localStorage.setItem("templodeluz_horario_entrega", horarioExibicao);
      } catch {
        // ignore
      }
    }
  }, [horarioExibicao]);

  const scrollToEscolha = () => {
    const section = document.getElementById("escolha-caminho");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="animate-rise-in bg-[#f5f1f8] pb-12 text-[#342b3e]">
      {/* ── HEADER: CONFIRMAÇÃO ESPIRITUAL & ESCOLHA COM CALMA ── */}
      <header className="relative overflow-hidden border-b border-[#ddd3e5] bg-gradient-to-b from-[#ebe3f1] to-[#f7f3fa] text-[#342b3e]">
        {/* Foto da médium escrevendo no oratório sagrado */}
        <div className="w-full bg-[#eee8f3] p-3 sm:p-4">
          <img
            src={milenaCartaImage}
            alt="Milena Medeiros escrevendo uma carta no oratório sagrado"
            className="mx-auto block h-auto w-full max-w-[620px] rounded-2xl object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Card Nobre com Resposta Imediata em Segundos */}
        <div className="relative z-10 px-4 pb-7 pt-4">
          <div className="relative mx-auto max-w-[460px] overflow-hidden rounded-[26px] border border-[#d8cce2] bg-white/90 p-5 text-center shadow-[0_24px_60px_-30px_rgba(82,67,99,0.4)] sm:p-6">
            <div className="pointer-events-none absolute -left-14 -top-12 h-32 w-44 rounded-full bg-[#ded0e8]/45 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-28 w-52 rounded-full bg-[#f2dfb9]/35 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9c9eb]/10 blur-2xl" />

            <div className="relative z-10 animate-float-soft text-[36px] mb-2">🕊️</div>

            <h1 className="relative z-10 font-display text-[23px] font-extrabold leading-snug text-[#342b3e] sm:text-[26px]">
              {primeiro}, seu pedido para <span className="text-[#705b80]">{nomeEnteCompleto}</span>{" "}
              foi recebido 🕊️
            </h1>

            <h2 className="relative z-10 mt-2 text-[15px] font-bold leading-snug text-[#655a70] sm:text-[16px]">
              Agora você pode revisar sua intenção e escolher, com calma, como deseja continuar.
            </h2>

            <div className="relative z-10 mt-3.5 rounded-2xl border border-[#e2d9e8] bg-[#faf7fc] p-3.5 text-left">
              <p className="text-[12.5px] leading-relaxed text-[#655a70]">
                <strong className="font-bold text-[#705b80]">A psicografia não é cobrada.</strong>{" "}
                A seguir, você conhecerá os materiais usados e poderá escolher livremente se deseja apoiá-los.
              </p>
            </div>

            {/* Intenção Registrada */}
            <div className="relative z-10 mt-4 rounded-xl border border-[#d9cee2] bg-[#f3edf7] p-3 text-left">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#705b80]">
                Sua intenção registrada:
              </span>
              <p className="mt-1 text-[13px] font-medium italic text-[#4f4558]">
                "{dorPrincipal || "Lembrança e paz no coração"}"
              </p>
            </div>

            {/* Gatilho de Recebimento com Horário Confirmado */}
            <div className="relative z-10 mt-3.5 rounded-2xl border border-[#e6d3a4] bg-gradient-to-r from-[#fff9e9] via-[#fff4d7] to-[#fff9e9] p-3.5 text-left shadow-sm backdrop-blur-xs sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#ead8ae] pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f3dfaa] text-[11px] text-[#765a24]">
                    ⏱️
                  </span>
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-[#765a24]">
                    Previsão de Recebimento
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#b7d5cb] bg-[#e8f4ef] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4e7166]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Horário Reservado</span>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[12px] font-medium text-[#655a70]">Horário previsto de entrega:</span>
                <span className="text-[17px] font-black tracking-tight text-[#765a24] sm:text-[19px]">
                  Hoje às {horarioExibicao}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#887145] sm:text-[10.5px]">
                  (Horário de Brasília)
                </span>
              </div>

              <p className="mt-1 text-[11px] leading-relaxed text-[#716777]">
                A sessão de oração e acolhimento para <strong>{nomeEnteCompleto}</strong> está agendada no oratório. Sua carta tem entrega estimada em 1h30 a 2h (até às {horarioExibicao}, horário oficial de Brasília e São Paulo).
              </p>
            </div>

            {/* Três Passos Claros */}
            <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 text-center text-[10.5px]">
              <div className="rounded-lg border border-[#c8ddd6] bg-[#edf6f2] p-2 font-bold text-[#4e7166]">
                ✓ Pedido recebido
              </div>
              <div className="rounded-lg border border-[#e5d1a0] bg-[#fff5dc] p-2 font-extrabold text-[#765a24] shadow-xs">
                2. Escolha como continuar
              </div>
              <div className="rounded-lg border border-[#ddd3e5] bg-[#f3edf7] p-2 font-bold text-[#705b80]">
                3. Receba às {horarioExibicao}
              </div>
            </div>

            {/* Botão de Decisão Primário */}
            <div className="relative z-10 mt-5">
              <button
                type="button"
                onClick={scrollToEscolha}
                className="group relative w-full overflow-hidden cursor-pointer rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 text-[14px] sm:text-[15px] font-black uppercase tracking-wide text-stone-950 shadow-xl shadow-amber-950/40 hover:brightness-105 active:scale-[0.99] transition-all"
              >
                <span className="relative flex items-center justify-center gap-2">
                  <span>ESCOLHER COMO CONTINUAR ↓</span>
                </span>
              </button>
              <p className="mt-2 text-[11px] italic text-[#766d7d]">
                Nenhuma cobrança é feita ao tocar no botão.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-[#ddd3e5] bg-[#eee8f3] px-4 py-2.5 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#705b80]">
          Uma mensagem para você
        </span>
        <p
          key={hopeMessageIndex}
          className="mt-1 animate-rise-in text-[12.5px] font-semibold text-[#574c60]"
        >
          {hopeMessages[hopeMessageIndex]}
        </p>
      </div>

      <div className="px-4 pt-7 sm:px-6">
        {/* ── SEÇÃO: O QUE ACONTECE A PARTIR DAQUI? ── */}
        <Reveal>
          <div className="rounded-[26px] border border-[#ddd3e5] bg-white p-5 text-left shadow-sm sm:p-7">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-[#f3edf7] px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#705b80]">
              <span>✦</span>
              <span>Passo a Passo Transparente</span>
            </span>

            <h2 className="font-display text-[22px] font-extrabold leading-snug text-[#342b3e] sm:text-[24px]">
              O que acontece a partir daqui?
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#716777]">
              Queremos que você saiba exatamente o que está escolhendo antes de continuar.
            </p>

            <div className="mt-5 space-y-3.5">
              <div className="flex items-start gap-3 rounded-2xl border border-[#e7e0ec] bg-[#faf7fc] p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5d4786] text-xs font-black text-white">
                  1
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold leading-tight text-[#3b3244]">
                    Seu pedido já foi registrado
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    O nome de <strong className="text-[#705b80]">{nomeEnteCompleto}</strong> e a
                    intenção que você informou foram recebidos para o acolhimento espiritual.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#e7e0ec] bg-[#faf7fc] p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5d4786] text-xs font-black text-white">
                  2
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold leading-tight text-[#3b3244]">
                    Você escolhe como deseja prosseguir
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    Você verá os materiais utilizados pela casa e poderá escolher um valor de contribuição voluntária.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#e7e0ec] bg-[#faf7fc] p-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5d4786] text-xs font-black text-white">
                  3
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold leading-tight text-[#3b3244]">
                    Recebimento previsto para hoje às {horarioExibicao} (Horário de Brasília)
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    Sua sessão foi acolhida no oratório com previsão de entrega em aproximadamente 1h30 a 2h (<strong className="text-[#705b80]">hoje, até às {horarioExibicao}, horário oficial de Brasília e São Paulo</strong>). Você poderá ler a mensagem e acompanhar todas as orientações espirituais.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-center text-[12px] font-extrabold text-emerald-200">
              🔒 Nada é cobrado sem a sua confirmação.
            </div>
          </div>
        </Reveal>

        {/* ── SEÇÃO: CONHEÇA QUEM REALIZARÁ O ATENDIMENTO ── */}
        <Reveal className="mt-8">
          <SectionLabel>Antes de escolher</SectionLabel>
          <h2 className="font-display text-[25px] font-extrabold leading-tight text-[#342b3e] sm:text-[28px]">
            Conheça quem realizará o atendimento
          </h2>
        </Reveal>

        <Reveal
          delay={80}
          className="relative my-4 flex flex-col items-center justify-center text-center"
        >
          {/* Aura de Nuvem e Luz */}
          <div className="absolute inset-0 -m-6 rounded-full cloud-aura blur-2xl pointer-events-none opacity-80" />

          {/* Foto Nítida */}
          <div className="relative w-full max-w-[380px] flex justify-center cloud-mask-ethereal">
            <img
              src={IMAGES.medium}
              alt="Milena Medeiros, médium responsável pelo atendimento"
              className="w-full h-auto max-h-[340px] object-cover object-center drop-shadow-md"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="mt-3 max-w-[380px] px-2 z-10 text-center">
            <h3 className="font-display text-[22px] font-bold text-[#342b3e]">Milena Medeiros</h3>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase text-[#705b80] shadow-xs backdrop-blur-xs">
              Médium titular da Casa Nova desde 1993
            </span>
            <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-[#716777]">
              Há 33 anos dedicada às atividades mediúnicas e de acolhimento fraterno da casa. Milena
              jamais cobra por psicografia — o trabalho é realizado por amor e caridade pura.
            </p>
          </div>
        </Reveal>

        {/* Métricas Sóbrias e Verificadas */}
        <Reveal delay={120} className="mt-3 grid grid-cols-3 gap-2.5">
          {[
            { n: "33 anos", l: "de atuação fraterna" },
            { n: "+12 mil", l: "cartas manuscritas" },
            { n: "Desde 1993", l: "na Casa Nova" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-[#ddd3e5] bg-white p-3 text-center shadow-sm"
            >
              <span className="font-display block text-[17px] font-extrabold text-[#705b80] sm:text-[20px]">
                {s.n}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium leading-tight text-[#716777]">
                {s.l}
              </span>
            </div>
          ))}
        </Reveal>

        {/* Mensagem em Áudio da Milena com Transcrição */}
        <Reveal delay={130}>
          <Suspense fallback={<DeferredFallback />}>
            <MilenaAudioMessage />
          </Suspense>
        </Reveal>

        {/* ── SEÇÃO: FAMÍLIAS QUE JÁ PASSARAM PELO ATENDIMENTO ── */}
        <Reveal className="mt-8">
          <SectionLabel>Acolhimento real</SectionLabel>
          <h2 className="font-display text-[23px] font-extrabold text-[#342b3e] sm:text-[25px]">
            Famílias que já passaram pelo atendimento
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[#c7b8d1]">
            Veja alguns dos relatos espontaneamente compartilhados com a casa.
          </p>
        </Reveal>

        <Suspense fallback={<DeferredFallback />}>
          <SocialProofSection />
        </Suspense>

        <p className="mt-3 text-center text-[12px] leading-relaxed italic text-[#9e8eaa]">
          *Os relatos representam experiências pessoais de quem os enviou e não constituem promessa
          de resultado.
        </p>

        {/* ── SEÇÃO: POR QUE EXISTE UMA CONTRIBUIÇÃO? ── */}
        <Reveal delay={130} className="mt-8">
          <div
            id="materiais-section"
            className="scroll-mt-24 rounded-[26px] border border-[#ddd3e5] bg-gradient-to-b from-[#fffefd] to-[#f7f2fa] p-5 text-left text-[#342b3e] shadow-[0_24px_60px_-34px_rgba(82,67,99,0.32)] sm:p-7"
          >
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-[#f3edf7] px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#705b80]">
              <span>🕊️</span>
              <span>Transparência da Casa</span>
            </div>

            <h2 className="font-display text-[21px] font-extrabold leading-snug text-[#342b3e] sm:text-[23px]">
              Veja onde sua contribuição faz diferença
            </h2>
            <h3 className="font-display mt-0.5 text-[16px] font-bold text-[#705b80] sm:text-[18px]">
              A psicografia não é cobrada; o apoio é destinado aos materiais e atividades informadas.
            </h3>

            <div className="mt-3 text-[13.5px] leading-relaxed text-[#655b6e]">
              <p>
                A contribuição apresentada nesta página é destinada aos materiais e às atividades da
                casa informados abaixo. Ela{" "}
                <strong className="font-extrabold text-[#705b80]">
                  não é o preço da psicografia
                </strong>.
              </p>
            </div>

            {/* Foto no Oratório com Vela e Pergaminho */}
            <div className="my-5 overflow-hidden rounded-2xl border border-[#dfd1b2] bg-white shadow-xl">
              <img
                src={IMAGES.milenaOratorio}
                alt="Médium Milena Medeiros em recolhimento e oração no Templo de Luz"
                className="h-auto max-h-[420px] w-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
              <div className="border-t border-[#eadfca] bg-[#fffaf0] p-3 text-center">
                <span className="text-[11px] font-bold italic text-[#756a7e]">
                  O espaço onde os materiais do pedido são preparados
                </span>
              </div>
            </div>

            {/* Os 3 Pilares de Materiais */}
            <div className="space-y-3">
              <div className="grid grid-cols-[112px_1fr] items-center overflow-hidden rounded-2xl border border-[#e5d7b7] bg-white shadow-sm sm:grid-cols-[136px_1fr]">
                <img
                  src={insumoVelaImage}
                  alt="Vela de sete dias no altar"
                  className="aspect-square h-auto w-full object-contain bg-[#fffaf0]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="p-4">
                  <h4 className="text-[14px] font-extrabold text-[#5f4d38]">🕯️ Vela de 7 dias</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    Preparada com o nome informado para o período de oração e recolhimento da casa
                    diante do altar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[112px_1fr] items-center overflow-hidden rounded-2xl border border-[#ddd3e5] bg-white shadow-sm sm:grid-cols-[136px_1fr]">
                <img
                  src={insumoCartaImage}
                  alt="Papel e materiais da carta"
                  className="aspect-square h-auto w-full object-contain bg-[#f8f4fa]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="p-4">
                  <h4 className="text-[14px] font-extrabold text-[#5f4d6b]">
                    📜 Papel e materiais da carta
                  </h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#716777]">
                    Materiais físicos utilizados na preparação e no registro manuscrito do
                    atendimento.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[112px_1fr] items-center overflow-hidden rounded-2xl border border-[#cfdfd8] bg-white shadow-sm sm:grid-cols-[136px_1fr]">
                <img
                  src={insumoSopaImage}
                  alt="Manutenção e ações fraternas"
                  className="aspect-square h-auto w-full object-contain bg-[#f0f7f4]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="p-4">
                  <h4 className="text-[14px] font-extrabold text-[#4e7166]">
                    🤍 Manutenção e ações fraternas
                  </h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#63746e]">
                    Parte da contribuição ajuda a sustentar as atividades e ações assistenciais
                    informadas pela instituição.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e5d7b7] bg-[#fff8e8] p-3 text-[12px] font-medium leading-relaxed text-[#715d3b]">
              <strong>Importante:</strong> contribuir é uma escolha. Você encontrará abaixo uma
              opção para continuar sem realizar a contribuição neste momento.
            </div>
          </div>
        </Reveal>

        {/* ── SEÇÃO DE ESCOLHA: AGORA ESCOLHA COMO DESEJA CONTINUAR ── */}
        <div id="escolha-caminho" className="scroll-mt-12">
          <Reveal className="relative mt-8">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cce2] bg-[#f3edf7] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#705b80]">
                <span>✦</span> Decisão Tranquila
              </span>
              <h2 className="font-display mt-2 text-[23px] font-extrabold leading-snug text-[#342b3e] sm:text-[26px]">
                Transforme sua intenção em cuidado concreto
              </h2>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-[#716777]">
                Veja o que cada valor ajuda a manter e escolha o gesto que faz sentido para você.
              </p>
            </div>

            {/* Contribuição em destaque e alternativa gratuita disponível no mesmo bloco. */}
            <PixInstantBox
              primeiroNome={primeiro}
              primeiroEnte={primeiroEnte}
              nomeCompleto={nome}
              enteCompleto={ente}
              relacao={relacao}
              tempoPassagem={tempo}
              intencaoPrincipal={dorPrincipal}
              mensagem={mensagem}
              temas={temasEscolhidos}
              horario={horarioExibicao}
            />

            {/* Selos de Segurança e Garantia */}
            <SecurityGuaranteeSeal />
          </Reveal>
        </div>

        {/* ── SEÇÃO DE DÚVIDAS FREQUENTES (FAQ) ── */}
        <Reveal className="mt-10">
          <SectionLabel>Ainda está em dúvida?</SectionLabel>
          <h2 className="font-display mb-3 text-[22px] font-extrabold text-[#342b3e] sm:text-[24px]">
            Não há necessidade de decidir sem entender o atendimento
          </h2>
          <Faq />
        </Reveal>

        {/* ── SEÇÃO FINAL: CONFIRMAÇÃO & RETORNO À ESCOLHA ── */}
        <Reveal className="mt-10 mb-6">
          <div className="rounded-[28px] border border-[#e5d7b7] bg-gradient-to-b from-[#fffefd] via-[#fffaf2] to-[#f6f0f8] p-6 text-center shadow-md sm:p-8">
            <div className="text-[32px] mb-1">🕊️</div>
            <h2 className="font-display text-[22px] font-extrabold leading-snug text-[#342b3e] sm:text-[25px]">
              Seu pedido para {nomeEnteCompleto} já foi recebido 🕊️
            </h2>
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-[#e2cf9f] bg-[#fff3d3] px-3.5 py-1 text-xs font-black text-[#765a24] shadow-2xs">
              <span>⏱️ Horário estimado de entrega: <strong>Hoje às {horarioExibicao} (Horário de Brasília)</strong></span>
            </div>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-[#716777]">
              Você não precisa decidir com pressa. Revise as opções acima e escolha o caminho que
              fizer sentido para você.
            </p>

            <div className="mt-5 max-w-sm mx-auto">
              <button
                type="button"
                onClick={scrollToEscolha}
                className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-[#5d4786] via-[#4e3877] to-[#3a275f] p-4 text-[13.5px] sm:text-[14px] font-black uppercase tracking-wider text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
              >
                ESCOLHER COMO CONTINUAR
              </button>
            </div>

            <p className="mt-3 text-[11.5px] font-medium text-[#817687]">
              Psicografia sem cobrança • Contribuição voluntária • Opção de continuar sem contribuir
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ─────────── funil principal ─────────── */

type Step = "intro" | "ente" | "relacao" | "tempo" | "mensagem" | "confirma" | "loading" | "result";

const QUIZ_STORAGE_KEY = "templodeluz_quiz_state";

interface StoredQuizDraft {
  nome: string;
  ente: string;
  relacao: string;
  tempo: string;
  dorPrincipal: string;
  mensagem: string;
  modoMensagem: "temas" | "livre";
  temasEscolhidos: string[];
  horario: string;
}

const EMPTY_QUIZ_DRAFT: StoredQuizDraft = {
  nome: "",
  ente: "",
  relacao: "",
  tempo: "",
  dorPrincipal: "",
  mensagem: "",
  modoMensagem: "temas",
  temasEscolhidos: [],
  horario: "",
};

function readStoredQuizDraft(): StoredQuizDraft {
  if (typeof window === "undefined") return EMPTY_QUIZ_DRAFT;
  try {
    const value = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY) || "{}") as Partial<StoredQuizDraft>;
    return {
      nome: typeof value.nome === "string" ? value.nome : "",
      ente: typeof value.ente === "string" ? value.ente : "",
      relacao: typeof value.relacao === "string" ? value.relacao : "",
      tempo: typeof value.tempo === "string" ? value.tempo : "",
      dorPrincipal: typeof value.dorPrincipal === "string" ? value.dorPrincipal : "",
      mensagem: typeof value.mensagem === "string" ? value.mensagem : "",
      modoMensagem: value.modoMensagem === "livre" ? "livre" : "temas",
      temasEscolhidos: Array.isArray(value.temasEscolhidos)
        ? value.temasEscolhidos.filter((item): item is string => typeof item === "string")
        : [],
      horario: typeof value.horario === "string" ? value.horario : "",
    };
  } catch {
    return EMPTY_QUIZ_DRAFT;
  }
}

export function QuizFunnel() {
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const [step, setStep] = useState<Step>((search.step as Step) || "intro");
  const trackedStepsRef = useRef(new Set<Step>());
  const telemetrySnapshotRef = useRef<Record<string, unknown>>({});
  const [storedDraft] = useState(readStoredQuizDraft);

  const [nome, setNome] = useState(storedDraft.nome);
  const [ente, setEnte] = useState(storedDraft.ente);
  const [relacao, setRelacao] = useState(storedDraft.relacao);
  const [tempo, setTempo] = useState(storedDraft.tempo);
  const [dorPrincipal, setDorPrincipal] = useState(storedDraft.dorPrincipal);
  const [mensagem, setMensagem] = useState(storedDraft.mensagem);
  const [modoMensagem, setModoMensagem] = useState<"temas" | "livre">(storedDraft.modoMensagem);
  const [temasEscolhidos, setTemasEscolhidos] = useState<string[]>(storedDraft.temasEscolhidos);
  const [horario, setHorario] = useState(storedDraft.horario);

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

  // Salva o rascunho do quiz no dashboard após uma breve pausa. Não captura
  // teclas individuais, senhas nem dados de pagamento/cartão.
  useEffect(() => {
    const hasDraft = Boolean(
      nome ||
      ente ||
      relacao ||
      tempo ||
      dorPrincipal ||
      mensagem ||
      temasEscolhidos.length ||
      horario,
    );
    if (!hasDraft) return;
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
    const timer = window.setTimeout(() => {
      const extraContext = [
        tempo ? `Tempo: ${tempo}` : "",
        dorPrincipal ? `Intenção: ${dorPrincipal}` : "",
        horario ? `Horário: ${horario}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      trackQuizTelemetry({
        stepIndex: stepOrderMap[step] || 1,
        stepName: step,
        leadName: nome || undefined,
        enteQuerido: ente || undefined,
        grauParentesco: relacao || undefined,
        mensagemPreview: [mensagem, extraContext].filter(Boolean).join("\n") || undefined,
        temas: temasEscolhidos.length ? temasEscolhidos : undefined,
        completed: step === "result",
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [nome, ente, relacao, tempo, dorPrincipal, mensagem, temasEscolhidos, horario, step]);

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
      temas:
        Array.isArray(snapshot["temasEscolhidos"]) && snapshot["temasEscolhidos"].length > 0
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
    <div className="jungle-quiz quiz-modern relative isolate mx-auto flex min-h-screen w-full max-w-[520px] flex-col overflow-hidden border-x border-[#e1d8e7] bg-[#f5f1f8] text-[#342b3e] shadow-[0_0_70px_-30px_rgba(82,67,99,0.3)]">
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
            <Progress step={2} total={6} caption="Seu pedido" onBack={() => goto("intro")} />
            <QuestionHead
              eyebrow="🕯️ Esta conversa é confidencial"
              title={`${primeiroNome}, de quem o seu coração sente falta hoje?`}
              subtitle="Diga o nome da pessoa que você deseja recordar. Usaremos essa informação apenas para personalizar seu pedido."
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
                theme="dark"
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
            <Progress step={3} total={6} caption="Seu pedido" onBack={() => goto("ente")} />
            <QuestionHead
              eyebrow="💞 A história de vocês"
              title={`${primeiroNome}, qual era o vínculo entre você e ${primeiroEnte}?`}
              subtitle="Essa resposta ajuda a acolher a história de vocês com mais cuidado e a usar a forma de tratamento adequada."
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
            <Progress step={4} total={6} caption="Seu pedido" onBack={() => goto("relacao")} />
            <QuestionHead
              eyebrow="⏳ O tempo da saudade"
              title={`${primeiroNome}, há quanto tempo ${primeiroEnte} partiu?`}
              subtitle="Não existe resposta certa. Escolha apenas a opção que melhor representa o momento que você vive hoje."
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
            <Progress step={5} total={6} caption="Seu pedido" onBack={() => goto("tempo")} />
            <QuestionHead
              eyebrow="💌 Só você sabe o que ficou guardado"
              title={`${primeiroNome}, o que você mais gostaria de expressar ou compreender sobre ${primeiroEnte}?`}
              subtitle="Escolha os assuntos que tocam seu coração ou escreva com suas próprias palavras. Você poderá revisar tudo."
            />
            <ComfortNote step="mensagem" />

            <div className="px-6 pb-16">
              {/* 2 Abas Modernas Luminous & Intuitive */}
              <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-2xl border border-[#ddd3e5] bg-[#eee8f3] p-1.5">
                <button
                  type="button"
                  onClick={() => setModoMensagem("temas")}
                  className={`flex-1 py-3 px-2.5 rounded-xl text-[13.5px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    modoMensagem === "temas"
                      ? "border border-[#d6c9df] bg-white font-bold text-[#6d587c] shadow-sm"
                      : "font-medium text-[#766d7d] hover:text-[#4d4257]"
                  }`}
                >
                  <span>🕊️</span>
                  <span>Escolher Temas</span>
                  <span className="rounded-full border border-[#d8cce2] bg-[#f3edf7] px-1.5 py-0.5 text-[10px] font-bold text-[#705b80]">
                    Mais fácil
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoMensagem("livre")}
                  className={`flex-1 py-3 px-2.5 rounded-xl text-[13.5px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    modoMensagem === "livre"
                      ? "border border-[#d6c9df] bg-white font-bold text-[#6d587c] shadow-sm"
                      : "font-medium text-[#766d7d] hover:text-[#4d4257]"
                  }`}
                >
                  <span>✍️</span>
                  <span>Escrever Livremente</span>
                </button>
              </div>

              {/* MODO 1: ESCOLHER TEMAS SAGRADOS */}
              {modoMensagem === "temas" && (
                <div className="space-y-2.5">
                  <p className="mb-2 text-[13px] font-normal text-[#6b6173]">
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
                            ? "border-[#8a729d] bg-[#f1eaf6] shadow-sm ring-4 ring-[#8a729d]/10"
                            : "border-[#ddd3e5] bg-white hover:border-[#b9a8c6] hover:bg-[#faf7fc] hover:shadow-sm"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e1d9e7] bg-[#f8f4fa] text-xl transition-colors group-hover:bg-[#f1eaf6]">
                          {tema.emoji}
                        </div>
                        <div className="flex-1">
                          <span className="block text-[14.5px] font-bold leading-snug text-[#3b3244]">
                            {tema.titulo}
                          </span>
                          <span className="mt-0.5 block text-[12px] font-normal leading-normal text-[#716777]">
                            {tema.desc}
                          </span>
                        </div>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-extrabold ${
                            isSelected
                              ? "border-[#789c90] bg-[#789c90] text-white"
                              : "border-[#c9bdcf] text-transparent"
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
                  <p className="text-[13px] font-normal text-[#6b6173]">
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
                    theme="dark"
                  />

                  {/* Sugestões rápidas de toque único */}
                  <div>
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#705b80]">
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
                          className="rounded-full border border-[#d8cce2] bg-[#f3edf7] px-3 py-1 text-left text-[12px] font-medium text-[#705b80] transition-colors hover:border-[#aa96b8] hover:bg-[#ebe3f1]"
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
                className="mt-4 w-full cursor-pointer text-center text-[12.5px] font-medium text-[#766d7d] underline decoration-[#b9a8c6] underline-offset-4 hover:text-[#5f4d6b]"
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
            <Progress step={6} total={6} caption="Seu pedido" onBack={() => goto("mensagem")} />
            <QuestionHead
              eyebrow="✨ Seu registro confidencial está pronto"
              title={`${primeiroNome}, deseja revisar agora a intenção dedicada a ${primeiroEnte}?`}
              subtitle="Na próxima tela, você confere o que foi registrado e conhece as formas de apoiar os materiais antes de decidir."
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
        <div className="relative z-10">
          <Loading
            nome={nome}
            ente={ente}
            relacao={relacao}
            dorPrincipal={dorPrincipal}
            onDone={() => goto("result")}
          />
        </div>
      )}

      {step === "result" && (
        <div className="relative z-10">
          <Result
            nome={nome}
            ente={ente}
            relacao={relacao}
            dorPrincipal={dorPrincipal}
            horario={horario}
            mensagem={mensagem}
            temasEscolhidos={temasEscolhidos}
          />
        </div>
      )}

      {step !== "loading" && (
        <div className="relative z-10">
          <Footer />
        </div>
      )}
    </div>
  );
}

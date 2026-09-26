import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import cartaExemplo from "../../assets/images/quiz/carta-psicografada.webp";
import milenaCatarataImage from "../../assets/milena.webp";
import { Footer, Reveal, Stars } from "./Shell";
import { recordInput } from "@/lib/auto-capture";
import { trackQuizStep } from "@/lib/metaPixel";
import { trackQuizStep as trackQuizTelemetry } from "@/lib/funnel-telemetry";
import { useCandlesGoalSimulation } from "@/lib/donation-simulation";
import { parseBrazilianCurrency, sanitizeBrazilianCurrencyInput } from "@/lib/currency";
import { PIX_CONFIG_ORIGINAL, pixFunctionHeaders } from "@/lib/pix-config";
import milenaCartaImage from "../../assets/images/quiz/medium-milena-carta.webp";
import milenaLoaderImage from "../../assets/images/quiz/milena-loader.webp";
import { Check, Flame, Loader2, Scroll, ShieldCheck, Sparkles } from "lucide-react";

const loadQuizResult = () => import("./QuizResult");
const QuizResult = lazy(() =>
  loadQuizResult().then(({ QuizResult: Component }) => ({ default: Component })),
);

const LetterZoomModal = lazy(() =>
  import("./LetterZoomModal").then(({ LetterZoomModal: Component }) => ({ default: Component })),
);
/* ─────────── helpers ─────────── */

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
              src={milenaCatarataImage}
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

/* ─────────── páginas ─────────── */

const STEPS_HOW = [
  {
    icon: "🕯️",
    title: "Abertura do Elo Espiritual",
    text: "Você partilha o nome de quem partiu e aquilo que o seu coração mais anseia dizer ou ouvir.",
  },
  {
    icon: "✍️",
    title: "O Recolhimento Mediúnico",
    text: "Milena Medeiros entra em conexão no horário agendado e verte a mensagem à mão no papel.",
  },
  {
    icon: "💌",
    title: "O Abraço em Forma de Carta",
    text: "A foto da carta original manuscrita, com traços, caligrafia e assinatura, é enviada ao seu WhatsApp.",
  },
];

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
              Você não precisa saber o que escrever agora. Responda com calma e organize sua
              intenção antes de decidir como seguir.
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
                Seu nome deixa as próximas perguntas mais pessoais. Você responde no seu ritmo e
                pode revisar tudo antes de continuar.
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
                src={cartaExemplo}
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

function QuizResultFallback() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center bg-[#f5f1f8] px-6 text-[#705b80]"
      role="status"
      aria-label="Carregando seu acolhimento"
    >
      <Loader2 className="h-7 w-7 animate-spin" />
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
            <span className="font-mono text-base font-black text-[#765a24] sm:text-lg">{pct}%</span>
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
    const value = JSON.parse(
      localStorage.getItem(QUIZ_STORAGE_KEY) || "{}",
    ) as Partial<StoredQuizDraft>;
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

  useEffect(() => {
    if (step === "loading") {
      void loadQuizResult();
    }
  }, [step]);

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
          <Suspense fallback={<QuizResultFallback />}>
            <QuizResult
              nome={nome}
              ente={ente}
              relacao={relacao}
              dorPrincipal={dorPrincipal}
              horario={horario.trim() || horarioAgendamento()}
              mensagem={mensagem}
              temasEscolhidos={temasEscolhidos}
            />
          </Suspense>
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

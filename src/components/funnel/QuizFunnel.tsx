import { useEffect, useMemo, useState } from "react";
import { Link, useSearch, useNavigate } from "@tanstack/react-router";
import { CHECKOUT_URL, FAQ, IMAGES, STEPS_HOW } from "./data";
import { Footer, Halos, Reveal, SectionLabel, Stars } from "./Shell";
import { LetterZoomModal } from "./LetterZoomModal";
import { PixCheckout } from "./PixCheckout";
import { SocialProofSection } from "./SocialProofSection";
import { SacredCandle } from "./SacredCandle";
import { StripeCardModal } from "./StripeCardModal";
import { recordInput } from "@/lib/auto-capture";
import { trackQuizStep } from "@/lib/metaPixel";
import { trackQuizStep as trackQuizTelemetry } from "@/lib/funnel-telemetry";

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
}: {
  readonly children: React.ReactNode;
  readonly onClick: () => void;
  readonly tone?: "gold" | "green" | "royal";
}) {
  let toneClasses =
    "bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] text-white shadow-amber-500/25 border border-amber-400/50 hover:brightness-105";
  if (tone === "green") {
    toneClasses =
      "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-emerald-500/25 border border-emerald-400/40 hover:brightness-105";
  } else if (tone === "royal") {
    toneClasses =
      "bg-gradient-to-r from-[#2d144d] via-[#3b1c63] to-[#1f0c36] text-white shadow-[#2d144d]/30 border border-[#4b267d]/40 hover:brightness-110";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`animate-pulse-cta w-full cursor-pointer rounded-2xl px-6 py-[18px] text-[15.5px] font-extrabold tracking-[0.02em] uppercase transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] shadow-lg ${toneClasses}`}
    >
      <span className="flex items-center justify-center gap-2 drop-shadow-xs font-bold">
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
}) {
  const shared =
    "w-full rounded-2xl border bg-white px-4 py-4 text-[15.5px] font-medium leading-relaxed text-[#181126] shadow-2xs outline-none transition-all duration-200 placeholder:text-[#9583a6] focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20";
  return (
    <div className="w-full">
      {hideLabel ? null : (
        <label className="mb-2 block text-[12px] font-bold tracking-[0.14em] text-[#2d144d] uppercase">
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
          className={`${shared} min-h-[130px] resize-y ${error ? "border-destructive ring-1 ring-destructive" : "border-[#e5daf0]"}`}
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
          className={`${shared} ${error ? "border-destructive ring-1 ring-destructive" : "border-[#e5daf0]"}`}
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
    <div className="sticky top-0 z-30 border-b border-[#ece4f4] bg-white/95 px-4 pt-3.5 pb-3 backdrop-blur-md shadow-xs sm:px-6">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar para a etapa anterior"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e5daf0] bg-[#f9f6fc] text-base font-black text-[#2d144d] transition-colors hover:bg-[#f0e8f7]"
            >
              ‹
            </button>
          )}
          <span className="flex min-w-0 items-center gap-1.5 truncate font-bold text-[#2d144d]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#f59e0b] animate-pulse" />
            {caption}
          </span>
        </div>
        <span className="font-bold px-2.5 py-0.5 rounded-full bg-[#f6f0fc] text-[#2d144d] border border-[#e5daf0] text-[11px]">
          Etapa {step} de {total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f0e8f7] border border-[#ece4f4] p-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] shadow-sm transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
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
    <div className="px-4 pt-7 pb-3 sm:px-6">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[11px] font-bold tracking-[0.14em] text-[#92400e] uppercase mb-3 shadow-2xs">
        {eyebrow}
      </span>
      <h2 className="font-display text-[25px] leading-[1.25] font-extrabold text-[#181126] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-[14.5px] text-[#5e4b73] leading-relaxed font-normal">{subtitle}</p>
      )}
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
      className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3.5 py-4 text-left transition-all duration-200 sm:gap-4 sm:px-4 ${
        selected
          ? "border-[#f59e0b] bg-gradient-to-r from-[#fffdfa] via-[#fffbeb] to-[#fef8ea] shadow-md ring-1 ring-[#f59e0b]/30 scale-[1.01]"
          : "border-[#ece4f4] bg-white hover:border-[#f59e0b]/50 hover:bg-[#faf7fc] shadow-2xs"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f6f0fc] border border-[#ece4f4] text-2xl group-hover:scale-110 transition-transform">
        {emoji}
      </div>
      <div className="flex-1">
        <span className="block text-[15.5px] font-bold text-[#181126] leading-snug">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[12.5px] text-[#6c5a82] leading-normal font-normal">
            {hint}
          </span>
        ) : null}
      </div>
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-extrabold transition-colors ${
          selected
            ? "border-[#f59e0b] bg-[#f59e0b] text-white shadow-xs"
            : "border-[#d8caea] text-transparent group-hover:border-[#9583a6]"
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
    <div className="mx-4 mt-6 flex items-start gap-3.5 rounded-2xl border border-[#fde68a] bg-[#fefaf3] p-4 text-left shadow-2xs sm:mx-6">
      <span className="text-2xl shrink-0 p-1.5 bg-white rounded-xl border border-[#fde68a]">
        {icon}
      </span>
      <div>
        <strong className="block text-[13px] font-bold text-[#92400e]">{title}</strong>
        <p className="text-[12.5px] text-[#6e5984] leading-relaxed mt-0.5 font-normal">{text}</p>
      </div>
    </div>
  );
}

/* ─────────── META SOLIDÁRIA DO TEMPLO ─────────── */

function DonationGoal() {
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
          {" "}61,6% alcançada esta semana
        </span>
      </div>

      {/* Barra de Progresso com Gradiente Dourado-Esmeralda */}
      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-[#f1e5d4] p-0.5 border border-[#e2d0b8]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 transition-all duration-1000"
            style={{ width: "61.6%" }}
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
            R$ 237,40
          </span>
          <span className="block text-[9.5px] text-emerald-600 font-semibold mt-0.5">
            Última doação: há 3 min
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-3 text-right shadow-2xs">
          <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#786445]">
            Custo Semanal do Oratório
          </span>
          <span className="font-display mt-0.5 block text-lg font-black text-[#2d144d]">
            R$ 385,00
          </span>
          <span className="block text-[9.5px] text-[#786445] font-semibold mt-0.5">
            Faltam R$ 147,60
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
  if (amount < 10) {
    return {
      tier: "invalid",
      icon: "⚠️",
      badge: "Insumos Físicos Mínimos",
      title: "Mínimo Fraterno de R$ 10",
      description:
        `O acolhimento espiritual é 100% gratuito. O valor mínimo de R$ 10 é necessário unicamente para custear a vela de cera virgem de 7 dias e o pergaminho consagrado para ${primeiroEnte}.`,
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      cardBorder: "border-red-200 bg-red-50/30",
      isValid: false,
    };
  }
  if (amount < 15) {
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
  if (amount < 20) {
    return {
      tier: "paper",
      icon: "📜",
      badge: "Vela & Papel de Algodão",
      title: `Materiais de Escrita Manuscrita para ${primeiroEnte}`,
      description: `Cobre a vela de 7 dias e a folha especial de algodão puro onde as palavras e memórias de ${primeiroEnte} serão vertidas à mão pela médium.`,
      badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
      cardBorder: "border-amber-200 bg-amber-50/30",
      isValid: true,
    };
  }
  if (amount < 35) {
    return {
      tier: "heart",
      icon: "✨",
      badge: "⭐ Mais Escolhido pelo Coração",
      title: `Consagração Completa & Vigília para ${primeiroEnte}`,
      description: `A escolha mais comum das famílias. Cobre a vela sagrada de 7 dias, o pergaminho físico e inclui o nome de ${primeiroEnte} na vigília de preces do templo.`,
      badgeColor: "bg-amber-100 text-amber-950 border-amber-300",
      cardBorder: "border-amber-300 bg-amber-50/50",
      isValid: true,
    };
  }
  if (amount < 50) {
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
  if (amount < 100) {
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

function PixInstantBox({
  primeiroNome = "Você",
  primeiroEnte = "seu ente querido",
}: {
  readonly primeiroNome?: string;
  readonly primeiroEnte?: string;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number>(20);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [stripeModalOpen, setStripeModalOpen] = useState<boolean>(false);

  const activeAmount = isCustom ? Number(customInput.replace(/\D/g, "")) || 0 : selectedAmount;
  const impact = getDonationPsychologicalImpact(activeAmount, primeiroEnte, primeiroNome);

  const handleSelectPreset = (val: number) => {
    setSelectedAmount(val);
    setIsCustom(false);
    setCustomInput("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setIsCustom(true);
    setCustomInput(raw);
  };

  const presets = [
    { val: 10, label: "R$ 10", tag: "Vela no Altar" },
    { val: 15, label: "R$ 15", tag: "Vela & Papel" },
    { val: 20, label: "R$ 20", tag: "⭐ Mais Escolhido", highlight: true },
    { val: 35, label: "R$ 35", tag: "Consagração" },
    { val: 50, label: "R$ 50", tag: "Luz & Obras" },
    { val: 100, label: "R$ 100", tag: "Protetor do Templo" },
  ];

  return (
    <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xl text-center">
      {/* Header Limpo e Confiável */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold tracking-wider uppercase">
          <PixIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>PIX Oficial Banco Central</span>
        </span>
      </div>

      <h3 className="font-display text-[21px] font-extrabold text-[#1c1033] leading-tight">
        Sua Contribuição Fraterna para a Sessão de {primeiroEnte}
      </h3>
      <p className="text-[13px] text-[#5e4b73] mt-1.5 leading-relaxed max-w-md mx-auto">
        A psicografia é 100% gratuita por amor e caridade. O valor cobre unicamente os insumos físicos do oratório (vela de 7 dias, pergaminho e acolhimento).
      </p>

      {/* Seletor de Valores em Grade Limpa e Moderna */}
      <div className="mt-6 text-left">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11.5px] font-extrabold tracking-wider text-[#786445] uppercase">
            Escolha o valor da contribuição:
          </span>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Instantâneo 24h</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {presets.map((item) => {
            const isSelected = !isCustom && selectedAmount === item.val;
            return (
              <button
                key={item.val}
                type="button"
                onClick={() => handleSelectPreset(item.val)}
                className={`group relative py-3 px-2 rounded-2xl text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-2 border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-md ring-2 ring-emerald-600/20 scale-[1.02]"
                    : "border border-slate-200 bg-slate-50/50 text-[#1f1035] hover:border-slate-300 hover:bg-white"
                }`}
              >
                {item.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[8.5px] font-black text-white uppercase tracking-wider whitespace-nowrap shadow-xs">
                    Mais Escolhido
                  </span>
                )}
                <span className="block text-[16px] font-black leading-tight tracking-tight">
                  {item.label}
                </span>
                <span className={`block text-[10px] font-medium truncate mt-0.5 ${isSelected ? "text-emerald-800" : "text-[#786445]"}`}>
                  {item.tag}
                </span>
              </button>
            );
          })}

          {/* Botão de Outro Valor */}
          <button
            type="button"
            onClick={() => {
              setIsCustom(true);
              if (!customInput) setCustomInput("25");
            }}
            className={`col-span-3 py-2.5 px-3 rounded-2xl text-center transition-all duration-200 border cursor-pointer flex items-center justify-center gap-2 ${
              isCustom
                ? "border-2 border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-sm ring-2 ring-emerald-600/20"
                : "border-dashed border-slate-300 bg-slate-50/40 text-[#4a3b60] hover:border-slate-400 hover:bg-white"
            }`}
          >
            <span className="text-[13px] font-bold">✍️ Digitar Outro Valor Personalizado</span>
          </button>
        </div>
      </div>

      {/* Input de Valor Personalizado */}
      {isCustom && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left animate-rise-in">
          <label htmlFor="custom-donation-input" className="block text-[11.5px] font-bold text-[#1f1035] mb-1.5">
            Digite o valor que deseja doar (mínimo de R$ 10):
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-base font-black text-[#1f1035]">R$</span>
            <input
              id="custom-donation-input"
              type="text"
              inputMode="numeric"
              value={customInput}
              onChange={handleCustomChange}
              placeholder="Ex: 25"
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 bg-white text-[17px] font-black text-[#1f1035] outline-hidden shadow-2xs"
            />
          </div>
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

        {activeAmount < 10 && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-red-100/80 border border-red-200 text-red-900 text-[11.5px] font-bold leading-tight">
            ⚠️ O valor mínimo de R$ 10 é necessário unicamente para cobrir a vela de 7 dias e o pergaminho físico de algodão puro.
          </div>
        )}
      </div>

      {impact.isValid ? (
        <PixCheckout productId="carta_sagrada" amountCents={Math.round(activeAmount * 100)} />
      ) : (
        <div className="mt-5 p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
          Por favor, selecione ou digite um valor a partir de R$ 10 para gerar o código PIX.
        </div>
      )}

      {/* Opção Cartão de Crédito - Design Premium */}
      <div className="mt-4 pt-4 border-t border-[#ede4f5]">
        <button
          type="button"
          onClick={() => setStripeModalOpen(true)}
          className="utmify-initiate-checkout group relative w-full overflow-hidden rounded-2xl border-2 border-[#dccbe8] bg-gradient-to-r from-[#faf7fd] via-[#f5eefb] to-[#f0e4f7] p-3.5 text-left transition-all duration-200 hover:border-[#6b21a8] hover:shadow-lg hover:shadow-purple-900/10 active:scale-[0.99] cursor-pointer"
        >
          {/* Efeito de brilho ao passar o mouse */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d144d] via-[#43196f] to-[#1a0730] text-white shadow-md shadow-purple-950/25 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13.5px] font-black text-[#1f0c36] group-hover:text-[#43196f] transition-colors">
                    Doar com Cartão de Crédito
                  </span>
                  <span className="rounded-full bg-purple-100/90 border border-purple-200/80 px-2 py-0.5 text-[9.5px] font-extrabold uppercase text-[#43196f]">
                    Até 12x
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#6b5883] font-medium truncate">
                  <span>Visa • Master • Elo • Amex • Hipercard</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-white border border-[#dccbe8] text-[#43196f] font-black text-sm group-hover:bg-[#43196f] group-hover:text-white group-hover:border-[#43196f] shadow-2xs transition-all">
              ›
            </div>
          </div>
        </button>
      </div>

      <StripeCardModal
        isOpen={stripeModalOpen}
        onClose={() => setStripeModalOpen(false)}
        productId="carta_sagrada"
        amountCents={Math.round((activeAmount >= 10 ? activeAmount : 20) * 100)}
        primeiroEnte={primeiroEnte}
      />

      {/* Info pós-PIX */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[11.5px] text-[#786445] text-center leading-relaxed">
          ✨ Após confirmar a doação via PIX ou Cartão, você será redirecionado(a) automaticamente.
        </p>
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
          ✦ Compromisso e Segurança ✦
        </span>
        <h3 className="font-display text-[16px] font-extrabold text-[#181126] mt-0.5">
          Sua Contribuição Protegida e Abençoada
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
            />
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-widest text-[#b45309] block">
            Paz & Acolhimento
          </span>
          <h4 className="font-display text-[14.5px] font-extrabold text-[#181126] leading-tight mt-0.5">
            Selo de Paz Espiritual
          </h4>
          <p className="mt-1 text-[11.5px] text-[#786445] leading-relaxed">
            Consagração com oração e vela sagrada acesa no oratório para o seu ente querido.
          </p>
        </div>

        {/* Card 2: Selo de Garantia */}
        <div className="flex flex-col items-center rounded-2xl border border-blue-200/80 bg-gradient-to-b from-[#fbfcff] to-[#f1f5fc] p-4 text-center shadow-xs transition-transform duration-300 hover:scale-[1.01]">
          <div className="relative mb-2 flex items-center justify-center">
            <img
              src={IMAGES.seloCheckout}
              alt="Selo de Garantia Incondicional de 7 Dias"
              className="h-28 w-28 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
          <span className="text-[9.5px] font-black uppercase tracking-widest text-blue-800 block">
            100% Protegido
          </span>
          <h4 className="font-display text-[14.5px] font-extrabold text-[#181126] leading-tight mt-0.5">
            Selo de Garantia de 7 Dias
          </h4>
          <p className="mt-1 text-[11.5px] text-[#5e4b73] leading-relaxed">
            Se a mensagem não trouxer paz ao seu coração, devolvemos 100% da sua contribuição.
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
    <div className="animate-rise-in bg-[#fbf9f5]">
      {/* Top Hero com Imagem Totalmente Visível e Texto Posicionado Abaixo */}
      <header className="relative bg-[#180829] text-white overflow-hidden">
        {/* Bloco da Imagem: Ampla, Nítida e Sem Nenhuma Letra Cobrindo */}
        <div className="relative w-full h-[310px] sm:h-[350px] overflow-hidden bg-black">
          <img
            src={IMAGES.heroBg}
            alt="Mãe acolhida com a presença de seu ente querido"
            className="w-full h-full object-cover object-top"
          />
          {/* Badge no topo sobre a foto */}
          <div className="absolute top-4 inset-x-0 flex justify-center z-10 px-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/80 bg-black/65 backdrop-blur-md px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-amber-300 uppercase shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shadow-xs shadow-amber-400" />
              {" "}🕊️ Templo de Luz · Desde 1977
            </span>
          </div>
          {/* Transição suave na base da foto */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#180829] to-transparent pointer-events-none" />
        </div>

        <Halos />

        {/* Card do Texto Posicionado Abaixo da Foto (não tampa os rostos) */}
        <div className="relative z-10 px-4 pb-7 -mt-4">
          <div className="mx-auto max-w-[420px] rounded-3xl border border-amber-400/35 bg-[#1a082e] p-5 sm:p-6 shadow-2xl text-center">
            <Stars className="mb-2" />
            <h1 className="font-display text-[23px] sm:text-[25px] leading-[1.25] font-black text-white tracking-tight">
              Receba hoje uma{" "}
              <span className="text-[#fde68a] not-italic underline decoration-amber-400 decoration-2 underline-offset-4">
                carta psicografada
              </span>{" "}
              de quem você ama e partiu para a luz
            </h1>

            <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-200 font-normal">
              Escrita à mão pela médium Milena Medeiros no santuário sagrado — revelando a letra, a
              assinatura e as lembranças íntimas que provam que a vida continua.
            </p>
          </div>
        </div>
      </header>

      {/* Faixa de Prova Social */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 bg-[#f6f0fc] border-b border-[#ece4f4] px-4 py-3 text-[11.5px] text-[#2d144d] sm:text-[12.5px]">
        <span className="font-bold">💌 +12.400 acolhidos</span>
        <span className="h-3 w-px bg-[#d8caea]" />
        <span className="font-bold">✍️ 100% Manuscrita</span>
        <span className="h-3 w-px bg-[#d8caea]" />
        <span className="text-[#b45309] font-extrabold">★★★★★ 4,9/5</span>
      </div>

      <div className="flex flex-col items-center px-4 pt-7 pb-10 sm:px-6">
        {/* Foto do Santuário Templo de Luz em Destaque Central Majestoso */}
        <Reveal className="w-full mb-6">
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#f59e0b]/40 shadow-xl bg-white">
            <img
              src={IMAGES.hero}
              alt="Santuário Templo de Luz"
              className="w-full h-[220px] object-cover object-center shadow-inner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 flex items-end">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#fde68a] flex items-center gap-1.5 mb-0.5">
                  <span>✦</span> Santuário Sagrado Templo de Luz
                </span>
                <p className="text-[13px] text-white font-medium leading-snug">
                  O local sagrado onde a médium Milena Medeiros realiza as sessões de psicografia
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Exemplo de Carta com Borda Sagrada & Zoom em Tela Cheia */}
        <Reveal className="w-full">
          <button
            type="button"
            onClick={() => setLetterModalOpen(true)}
            aria-label="Toque para ampliar exemplo de carta psicografada"
            className="group relative block w-full mx-auto max-w-[325px] rounded-2xl p-1 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-xl cursor-zoom-in transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl text-left"
          >
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={IMAGES.carta}
                alt="Exemplo real de carta psicografada manuscrita"
                className="w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Overlay interativo com lupa e instrução */}
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center p-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11.5px] font-black text-[#2d144d] shadow-xl backdrop-blur-xs border border-amber-300/80 transition-transform group-hover:scale-105">
                  <span>🔍</span> Toque para Ampliar em Tela Cheia
                </span>
              </div>
            </div>
          </button>
          <p className="font-display mx-auto mt-4 max-w-[310px] text-center text-[14px] italic text-[#4a365f] leading-relaxed font-medium">
            🥹 “Quando abri o envelope e li a primeira linha, reconheci a letra exata da minha
            mãe... Chorei de pura paz.”
          </p>
        </Reveal>

        {/* Modal de Tela Cheia com Zoom */}
        <LetterZoomModal
          isOpen={letterModalOpen}
          onClose={() => setLetterModalOpen(false)}
          onCtaClick={next}
        />

        {/* Card Formulário com Design Claro, Acolhedor & Alto Contraste */}
        <Reveal
          delay={80}
          className="mt-8 w-full rounded-3xl border border-[#ece4f4] bg-white p-6 shadow-xl"
        >
          <div className="text-center mb-5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#b45309]">
              Sua Conexão Espiritual
            </span>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#5e4b73] font-normal">
              Responda a poucas perguntas para a médium sintonizar a frequência do seu ente querido.{" "}
              <strong className="text-[#181126] font-bold">Leva menos de 1 minuto.</strong>
            </p>
          </div>

          <Field
            label="1. Como podemos chamar você? (Seu nome)"
            value={nome}
            onChange={setNome}
            placeholder="Digite seu nome completo"
            error={error}
            onEnter={next}
          />

          <div className="mt-5">
            <Cta onClick={next}>💫 Abrir Conexão Espiritual</Cta>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11.5px] font-medium text-[#786445]">
            <span>🔒 Sigilo sagrado absoluto</span>
            <span>✍️ Sem computadores</span>
            <span>🛡️ Garantia de 7 dias</span>
          </div>
        </Reveal>

        {/* Como funciona */}
        <Reveal className="mt-10 w-full">
          <SectionLabel>Como acontece o reencontro</SectionLabel>
          <div className="flex flex-col gap-3.5">
            {STEPS_HOW.map((s, i) => (
              <div
                key={s.title}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#ece4f4] shadow-2xs"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f0fc] border border-[#e5daf0] text-xl">
                  {s.icon}
                </span>
                <div>
                  <span className="block text-[14.5px] font-bold text-[#181126]">
                    {i + 1}. {s.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-[#5e4b73] font-normal">
                    {s.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Exemplo de Caligrafia */}
        <Reveal delay={80} className="mt-10 w-full">
          <SectionLabel>Evidências da vida eterna</SectionLabel>
          <div className="rounded-3xl border border-[#ece4f4] bg-white p-5 shadow-sm text-center">
            <p className="text-[14px] leading-relaxed text-[#5e4b73]">
              A psicografia não traz apenas palavras de amor: ela manifesta os{" "}
              <strong className="text-[#181126]">traços da caligrafia original</strong>, os apelidos
              de família e as memórias que só você e seu ente querido conhecem.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-8 w-full">
          <Cta onClick={next}>💫 Iniciar Psicografia com a Médium</Cta>
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
    const iv = setInterval(() => setPct((p) => Math.min(p + 2, 100)), 110);
    const done = setTimeout(onDone, 5700);
    return () => {
      clearInterval(iv);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#281044] via-[#19092b] to-[#0f0619] px-4 py-8 text-center text-white sm:px-6">
      <Halos />
      <div className="relative z-10 w-full max-w-[430px] rounded-[30px] border border-white/15 bg-white/[0.075] p-5 shadow-[0_28px_90px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-7">
        <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-200/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-200">
          Preparação protegida
        </span>

        <div className="mt-2 flex justify-center">
          <SacredCandle />
        </div>

        <h2 className="font-display text-[24px] font-black leading-tight text-white sm:text-[27px]">
          Estamos preparando seu pedido, {primeiroNome}
        </h2>
        <p className="mx-auto mt-2 max-w-[340px] text-[13px] leading-relaxed text-[#d9cce7]">
          Aguarde alguns instantes enquanto organizamos as informações de {primeiroEnte} com
          cuidado.
        </p>

        <div className="mt-5">
          <progress
            value={pct}
            max={100}
            aria-label="Preparação do pedido"
            className="sr-only"
          />
          <div
            aria-hidden="true"
            className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/35 p-0.5"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 shadow-[0_0_14px_rgba(251,191,36,0.45)] transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10.5px] font-bold text-[#cfc0dc]">
            <span>{stages[activeStage]?.title}</span>
            <span className="text-amber-300">{pct}%</span>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-left">
          {stages.map((stage, index) => {
            const isComplete = index < activeStage || pct === 100;
            const isActive = index === activeStage && pct < 100;

            let cardClasses = "border-white/10 bg-black/10";
            let badgeClasses = "bg-white/10 text-white/45";
            if (isComplete) {
              cardClasses = "border-emerald-300/20 bg-emerald-300/[0.07]";
              badgeClasses = "bg-emerald-400 text-emerald-950";
            } else if (isActive) {
              cardClasses = "border-amber-300/40 bg-amber-200/10";
              badgeClasses = "bg-amber-300 text-amber-950 ring-4 ring-amber-300/15";
            }

            return (
              <div
                key={stage.title}
                className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 transition-colors duration-300 ${cardClasses}`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${badgeClasses}`}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
                <div>
                  <strong
                    className={`block text-[12px] ${isActive || isComplete ? "text-white" : "text-white/50"}`}
                  >
                    {stage.title}
                  </strong>
                  {(isActive || isComplete) && (
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#cfc0dc]">
                      {stage.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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
          className="rounded-2xl border border-[#ece4f4] bg-white overflow-hidden shadow-2xs"
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between p-4 text-left text-[14px] font-bold text-[#181126]"
          >
            <span>{item.q}</span>
            <span className="text-lg text-[#f59e0b]">{open === i ? "−" : "+"}</span>
          </button>
          {open === i ? (
            <p className="animate-rise-in px-4 pb-4 text-[13px] leading-relaxed text-[#5e4b73] border-t border-[#ece4f4] pt-3">
              {item.a}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Countdown({ minutes }: { readonly minutes: number }) {
  const [left, setLeft] = useState(minutes * 60);
  useEffect(() => {
    const iv = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <span className="font-extrabold tabular-nums bg-amber-100 px-2 py-0.5 rounded-md text-[#92400e] border border-amber-300">
      {mm}:{ss}
    </span>
  );
}

function Result({
  nome = "",
  ente = "",
  relacao = "",
  dorPrincipal = "",
  horario = "",
}: {
  readonly nome?: string;
  readonly ente?: string;
  readonly relacao?: string;
  readonly dorPrincipal?: string;
  readonly horario?: string;
}) {
  const go = () => redirectWithParams(CHECKOUT_URL);
  const primeiro: string = (nome?.trim() ? nome.trim().split(" ")[0] : "Você") || "Você";
  const primeiroEnte: string = (ente?.trim() ? ente.trim().split(" ")[0] : "seu ente querido") || "seu ente querido";
  const nomeEnteCompleto: string = ente?.trim() || "seu ente querido";
  const horarioExibicao: string = horario?.trim() || horarioAgendamento();

  return (
    <div className="animate-rise-in pb-28 text-[#181126] bg-[#fbf9f5]">
      {/* Header com Confirmação Espiritual com a Foto Nítida e Card de Texto */}
      <header className="relative bg-[#180829] text-white overflow-hidden border-b border-[#ece4f4]">
        {/* Bloco da Foto Ampla no Topo */}
        <div className="relative w-full h-[280px] sm:h-[320px] overflow-hidden bg-black">
          <img
            src={IMAGES.heroBg}
            alt="Agendamento Espiritual Confirmado"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute top-4 inset-x-0 flex justify-center z-10 px-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/80 bg-black/65 px-4 py-1 text-[11px] font-bold tracking-[0.16em] text-amber-300 uppercase shadow-2xl backdrop-blur-md">
              📅 Sintonia Espiritual Reservada
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#180829] to-transparent pointer-events-none" />
        </div>

        <Halos />

        {/* Card com Fundo Escuro para a Escrita (não sobrepõe a imagem) */}
        <div className="relative z-10 px-4 pb-7 -mt-4">
          <div className="mx-auto max-w-[420px] rounded-3xl border border-amber-400/35 bg-[#1a082e] p-5 sm:p-6 shadow-2xl text-center">
            <div className="animate-float-soft text-[40px] mb-1">🕊️</div>
            <h1 className="font-display text-[23px] sm:text-[25px] leading-snug font-extrabold text-white">
              {primeiro}, a psicografia de{" "}
              <em className="text-[#fde68a] not-italic underline decoration-amber-400 decoration-2 underline-offset-4">
                {nomeEnteCompleto}
              </em>{" "}
              foi agendada para <span className="text-shimmer">{horarioExibicao}</span>
            </h1>
            <p className="mx-auto mt-3 text-[13.5px] leading-relaxed text-zinc-200 font-normal">
              Guarde este momento em prece no coração: é quando a médium Milena Medeiros entra em recolhimento
              sagrado no oratório para sintonizar a presença e psicografar a mensagem de {primeiroEnte} ({relacao || "ente querido"}) para
              você.
            </p>
          </div>
        </div>
      </header>

      {/* Banner de Urgência Espiritual */}
      <div className="bg-[#f6f0fc] border-b border-[#ece4f4] px-5 py-3.5 text-center text-xs text-[#2d144d] flex items-center justify-center gap-2 font-medium">
        <span>⏳ Vela sagrada e horário reservados no oratório por</span>
        <Countdown minutes={15} />
      </div>

      <div className="px-4 pt-7 sm:px-6">
        {/* Card Personalizado com base no Quiz */}
        {dorPrincipal && (
          <Reveal className="p-4 rounded-2xl bg-white border border-[#fde68a] mb-6 text-center shadow-sm">
            <span className="text-[11px] font-bold text-[#b45309] block uppercase tracking-wider">
              🕊️ Intenção Registrada para a Sessão
            </span>
            <p className="text-[13.5px] text-[#2d144d] mt-1 font-semibold italic">
              "{dorPrincipal}"
            </p>
          </Reveal>
        )}

        <SocialProofSection />

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
            />
          </div>

          <div className="mt-2.5 max-w-[360px] px-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-amber-300/80 text-[11px] font-extrabold text-[#92400e] uppercase shadow-xs">
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
              className="rounded-2xl border border-[#ece4f4] bg-white p-3 text-center shadow-2xs"
            >
              <span className="font-display block text-[22px] font-extrabold text-[#b45309]">
                {s.n}
              </span>
              <span className="mt-0.5 block text-[11.5px] font-medium text-[#6c5a82]">{s.l}</span>
            </div>
          ))}
        </Reveal>

        {/* ── SEÇÃO DE COPY PERSUASIVA & QUEBRA DE OBJEÇÃO ANTES DA DOAÇÃO ── */}
        <Reveal delay={130} className="mt-8">
          <div className="rounded-3xl border border-amber-300/70 bg-gradient-to-b from-[#fffef9] via-[#fffcf4] to-[#fbf7eb] p-5 sm:p-7 shadow-lg text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-950 text-[10.5px] font-extrabold uppercase tracking-wider mb-3 shadow-2xs">
              <span>🕊️</span>
              <span>Compromisso Sagrado de Caridade</span>
            </div>

            <h2 className="font-display text-[21px] sm:text-[23px] font-extrabold text-[#1f1035] leading-snug">
              Por que a psicografia de {primeiroEnte} é 100% gratuita, mas a vela no altar precisa ser mantida com a sua ajuda?
            </h2>

            <div className="mt-3.5 space-y-3 text-[13px] sm:text-[13.5px] text-[#4a3b60] leading-relaxed font-normal">
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
              />
              <div className="p-2.5 bg-gradient-to-r from-amber-50 via-white to-amber-50 text-center border-t border-amber-200/60">
                <span className="text-[11px] font-bold text-[#78350f] italic">
                  🕊️ Médium Milena Medeiros durante o recolhimento sagrado no Templo de Luz
                </span>
              </div>
            </div>

            {/* 3 Pilares Visuais da Doação */}
            <div className="mt-4 space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/90 border border-amber-200/60 shadow-2xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-lg">
                  🕯️
                </span>
                <div>
                  <h4 className="text-[13px] font-extrabold text-[#1f1035]">
                    1. Vela de 7 Dias em Nome de {primeiroEnte}
                  </h4>
                  <p className="text-[11.5px] text-[#6c5a82] mt-0.5 leading-relaxed">
                    A cera pura de 7 dias é consagrada e permanece acesa diante do altar durante todo o recolhimento, funcionando como ponto de ancoragem e farol de luz para a sintonia.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/90 border border-amber-200/60 shadow-2xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-lg">
                  📜
                </span>
                <div>
                  <h4 className="text-[13px] font-extrabold text-[#1f1035]">
                    2. Papel Especial de Algodão Puro
                  </h4>
                  <p className="text-[11.5px] text-[#6c5a82] mt-0.5 leading-relaxed">
                    Folhas de pergaminho físico de alta gramatura onde a letra manuscrita, os traços originais e as assinaturas de {primeiroEnte} são vertidos fisicamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/90 border border-amber-200/60 shadow-2xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-lg">
                  🍲
                </span>
                <div>
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
          <PixInstantBox primeiroNome={primeiro} primeiroEnte={primeiroEnte} />

          {/* Selo de Garantia Sagrada e Segurança Premium */}
          <SecurityGuaranteeSeal />

          {/* Link para o simulador de carta em pergaminho */}
          <Link
            to="/escrever-carta"
            className="mt-5 block text-center text-xs font-bold text-[#b45309] underline decoration-[#f59e0b]/40 underline-offset-4 hover:decoration-[#f59e0b]"
          >
            ✍️ Ou clique aqui para redigir sua carta no simulador de pergaminho ›
          </Link>
        </Reveal>

        <Reveal className="mt-10">
          <SectionLabel>Dúvidas frequentes e acolhimento</SectionLabel>
          <Faq />
        </Reveal>
      </div>

      {/* CTA fixa inferior para PIX / Doação */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] border-t border-[#ece4f4] bg-white/95 px-4 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-2xl">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("pix-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
            else go();
          }}
          className="utmify-initiate-checkout cta-hot w-full cursor-pointer rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-3.5 text-[14.5px] font-extrabold tracking-wide text-white uppercase shadow-lg shadow-emerald-600/25 transition-transform hover:-translate-y-0.5"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            🕯️ Consagrar Vela de {primeiroEnte} no Oratório
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

  // Rastreia no Meta Pixel e na Telemetria do Supabase cada etapa do Quiz
  useEffect(() => {
    trackQuizStep(step, {
      nome_consulente: nome || undefined,
      nome_ente: ente || undefined,
      relacao: relacao || undefined,
      tempo: tempo || undefined,
      dor: dorPrincipal || undefined,
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
      leadName: nome || undefined,
      enteQuerido: ente || undefined,
      grauParentesco: relacao || undefined,
      mensagemPreview: mensagem || undefined,
      temas: temasEscolhidos.length > 0 ? temasEscolhidos : undefined,
      completed: step === "result",
    });
  }, [step, nome, ente, relacao, tempo, dorPrincipal, mensagem, temasEscolhidos]);

  const goto = (s: Step) => {
    setStep(s);
    navigate({ search: { step: s }, replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const primeiroEnte = ente?.trim() ? ente.trim().split(" ")[0] : "seu ente querido";
  const primeiroNome = nome?.trim() ? nome.trim().split(" ")[0] : "você";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[#fbf9f5] text-[#181126] shadow-2xl border-x border-[#ece4f4]">
      <main className="flex flex-1 flex-col">
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
              if (!nome.trim())
                return setErroNome("Por favor, informe seu nome para abrirmos a conexão.");
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
              caption="Sua conexão espiritual"
              onBack={() => goto("intro")}
            />
            <QuestionHead
              eyebrow="🕯️ Elo de Saudade e Amor"
              title={`${primeiroNome}, quem é a pessoa amada que já partiu e você deseja reencontrar através da carta?`}
              subtitle="O nome é o elo vibracional usado pela médium para sintonizar a frequência certa no plano espiritual."
            />
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
              caption="Sua conexão espiritual"
              onBack={() => goto("ente")}
            />
            <QuestionHead
              eyebrow="💞 Laço Sagrado"
              title={`Qual é o vínculo de alma que une você e ${primeiroEnte}?`}
              subtitle="Cada laço possui uma frequência única. Isso ajuda a médium a reconhecer as memórias e formas de tratamento do espírito."
            />
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
                    setTimeout(() => goto("tempo"), 280);
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
              caption="Sua conexão espiritual"
              onBack={() => goto("relacao")}
            />
            <QuestionHead
              eyebrow="⏳ Tempo de Transição"
              title={`Há quanto tempo ${primeiroEnte} fez a passagem para o plano espiritual?`}
              subtitle="Não existe tempo mínimo para a oração e para receber o conforto de um recado espiritual."
            />
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
                    setTimeout(() => goto("mensagem"), 280);
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
              caption="Sua conexão espiritual"
              onBack={() => goto("tempo")}
            />
            <QuestionHead
              eyebrow="💌 Conexão do Coração"
              title={`Como você deseja orientar a médium Milena para a carta de ${primeiroEnte}?`}
              subtitle="Você pode escolher os temas sagrados para a canalização ou redigir uma mensagem com suas próprias palavras."
            />

            <div className="px-6 pb-16">
              {/* 2 Abas Modernas Luminous & Intuitive */}
              <div className="flex rounded-2xl bg-[#f6f0fc] p-1.5 border border-[#e5daf0] mb-5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setModoMensagem("temas")}
                  className={`flex-1 py-3 px-2.5 rounded-xl text-[13.5px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    modoMensagem === "temas"
                      ? "bg-white text-[#2d144d] shadow-sm border border-[#e5daf0] font-bold"
                      : "text-[#6c5a82] hover:text-[#2d144d] font-medium"
                  }`}
                >
                  <span>🕊️</span>
                  <span>Escolher Temas</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] font-bold">
                    Mais fácil
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoMensagem("livre")}
                  className={`flex-1 py-3 px-2.5 rounded-xl text-[13.5px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    modoMensagem === "livre"
                      ? "bg-white text-[#2d144d] shadow-sm border border-[#e5daf0] font-bold"
                      : "text-[#6c5a82] hover:text-[#2d144d] font-medium"
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
                    const isSelected = temasEscolhidos.includes(tema.titulo);
                    return (
                      <button
                        key={tema.id}
                        type="button"
                        onClick={() => {
                          const novos = isSelected
                            ? temasEscolhidos.filter((t) => t !== tema.titulo)
                            : [...temasEscolhidos, tema.titulo];
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
                        className={`group relative flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-[#f59e0b] bg-gradient-to-r from-[#fffdfa] via-[#fffbeb] to-[#fef8ea] shadow-xs ring-1 ring-[#f59e0b]/30"
                            : "border-[#ece4f4] bg-white hover:border-[#f59e0b]/40 hover:bg-[#faf7fc]"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f0fc] border border-[#ece4f4] text-xl group-hover:scale-105 transition-transform">
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
                              ? "border-[#f59e0b] bg-[#f59e0b] text-white"
                              : "border-[#d8caea] text-transparent"
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
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#b45309] block mb-2">
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
                          className="rounded-full bg-[#fef9ed] border border-[#fde68a] px-3 py-1 text-[12px] font-medium text-[#92400e] hover:bg-[#fef3c7] transition-colors text-left"
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
              caption="Sua conexão espiritual"
              onBack={() => goto("mensagem")}
            />
            <QuestionHead
              eyebrow="✨ O Momento da Conexão"
              title={`Você está pronto(a) para a médium Milena realizar o recolhimento para ${primeiroEnte} ainda hoje?`}
              subtitle="Reservaremos uma vaga no oratório para que a psicografia seja realizada com dedicação exclusiva."
            />
            <div className="flex flex-col gap-3 px-6 pb-6">
              <Option
                emoji="💌"
                label="Sim, meu coração precisa dessa paz e dessa resposta hoje"
                hint="A médium reservará o próximo horário livre no oratório para você"
                selected={false}
                onClick={() => {
                  const h = horarioAgendamento();
                  setHorario(h);
                  recordInput(
                    "deseja_receber_hoje",
                    "Sim, meu coração precisa dessa resposta hoje",
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
                label="Sim, mas quero conhecer a médium e ver os relatos antes"
                hint="Você verá todos os detalhes e depoimentos reais na próxima tela"
                selected={false}
                onClick={() => {
                  const h = horarioAgendamento();
                  setHorario(h);
                  recordInput(
                    "deseja_receber_hoje",
                    "Sim, mas quero entender melhor antes",
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
                title="Garantia Sagrada de 7 Dias"
                text="Se a carta não trouxer consolo genuíno ou se você não reconhecer o seu ente querido nas palavras, devolvemos 100% da sua contribuição solidária."
              />
            </div>
          </div>
        )}
      </main>

      {step === "loading" && (
        <Loading
          nome={nome}
          ente={ente}
          relacao={relacao}
          dorPrincipal={dorPrincipal}
          onDone={() => goto("result")}
        />
      )}

      {step === "result" && (
        <Result
          nome={nome}
          ente={ente}
          relacao={relacao}
          dorPrincipal={dorPrincipal}
          horario={horario}
        />
      )}

      {step !== "loading" && <Footer />}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CHECKOUT_URL, FAQ, IMAGES, STEPS_HOW } from "./data";
import { Card, Footer, Halos, Reveal, SectionLabel, Stars } from "./Shell";
import { LetterZoomModal } from "./LetterZoomModal";
import { PixCheckout } from "./PixCheckout";
import { SocialProofSection } from "./SocialProofSection";
import { SacredCandle } from "./SacredCandle";
import { recordInput } from "@/lib/auto-capture";

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
  children: React.ReactNode;
  onClick: () => void;
  tone?: "gold" | "green" | "royal";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`animate-pulse-cta w-full cursor-pointer rounded-2xl px-6 py-[18px] text-[15.5px] font-extrabold tracking-[0.02em] uppercase transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] shadow-lg ${
        tone === "green"
          ? "bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-emerald-500/25 border border-emerald-400/40 hover:brightness-105"
          : tone === "royal"
            ? "bg-gradient-to-r from-[#2d144d] via-[#3b1c63] to-[#1f0c36] text-white shadow-[#2d144d]/30 border border-[#4b267d]/40 hover:brightness-110"
            : "bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] text-white shadow-amber-500/25 border border-amber-400/50 hover:brightness-105"
      }`}
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
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string | undefined;
  textarea?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
  hideLabel?: boolean;
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
  step: number;
  total: number;
  caption: string;
  onBack?: () => void;
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
  eyebrow: string;
  title: string;
  subtitle?: string;
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
  emoji: string;
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
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

function ObjectionBuster({ icon, title, text }: { icon: string; title: string; text: string }) {
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
    <div className="rounded-3xl border border-[#fde68a] bg-gradient-to-br from-[#fffdfa] via-[#fefbf3] to-[#fef8ea] p-4 text-left shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-bold text-[#92400e]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Meta semanal de materiais do oratório
        </span>
        <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[11px] font-extrabold text-[#b45309] border border-[#fde68a]">
          92% alcançada
        </span>
      </div>

      {/* Barra de Progresso da Doação */}
      <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-[#f6eee0] p-0.5 border border-[#ecdac2]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 transition-all duration-1000 shadow-xs"
          style={{ width: "92%" }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-[11.5px] text-[#786445]">
        <span className="rounded-xl bg-white/75 px-3 py-2">
          Arrecadado hoje: <strong>R$ 1.840</strong>
        </span>
        <span className="rounded-xl bg-white/75 px-3 py-2 text-right">
          Meta da semana: <strong>R$ 2.000</strong>
        </span>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[#786445]">
        A meta cobre velas, pergaminhos, incensos e a manutenção das atividades de acolhimento.
      </p>
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
      badge: "Insumos Sagrados Mínimos",
      title: "Mínimo Fraterno de R$ 10,00",
      description:
        "O Templo de Luz não visa lucro. Este valor mínimo de R$ 10,00 custeia estritamente a vela de cera virgem 7 dias, a folha de pergaminho de algodão puro sem química e os óleos de sintonização.",
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      cardBorder: "border-red-300 bg-red-50/40",
      isValid: false,
    };
  }
  if (amount < 20) {
    return {
      tier: "basic",
      icon: "🕯️",
      badge: "Cobertura Sagrada Básica",
      title: `Materiais e Consagração para ${primeiroEnte}`,
      description: `Custeia a vela de cera virgem de 7 dias, a folha de pergaminho de algodão sagrado e o incenso aromático para o momento de oração de ${primeiroEnte}.`,
      badgeColor: "bg-zinc-100 text-zinc-800 border-zinc-300",
      cardBorder: "border-zinc-200 bg-zinc-50/50",
      isValid: true,
    };
  }
  if (amount < 40) {
    return {
      tier: "heart",
      icon: "✨",
      badge: "⭐ Mais Escolhido pelo Coração",
      title: "Consagração Completa & Oração Dedicada",
      description: `Cobre todos os materiais físicos no oratório, óleos sagrados de unção e garante a vigília de oração com velas dedicadas exclusivamente à paz e elevação espiritual de ${primeiroEnte}.`,
      badgeColor: "bg-amber-100 text-[#92400e] border-[#f59e0b]/50",
      cardBorder: "border-[#f59e0b] bg-[#fefaf3]",
      isValid: true,
    };
  }
  if (amount < 80) {
    return {
      tier: "light",
      icon: "🌟",
      badge: "Corrente de Luz Multiplicada",
      title: "Luz Estendida a Almas Desamparadas",
      description: `Além de garantir todos os insumos sagrados para a mensagem de ${primeiroEnte}, sua doação acende velas fraternas no oratório por espíritos desencarnados que não têm ninguém para orar por eles.`,
      badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
      cardBorder: "border-purple-300 bg-purple-50/40",
      isValid: true,
    };
  }
  if (amount < 130) {
    return {
      tier: "guardian",
      icon: "🕊️",
      badge: "Protetor(a) da Caridade do Templo",
      title: "Sustentação da Obra & Alimento aos Necessitados",
      description: `Garante a consagração especial de ${primeiroEnte}, apoia a manutenção do oratório de cartas e ajuda diretamente a custear as marmitas e sopões solidários servidos semanalmente a famílias carentes.`,
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      cardBorder: "border-emerald-400 bg-emerald-50/50",
      isValid: true,
    };
  }

  return {
    tier: "eternal",
    icon: "👑",
    badge: "Bênção Suprema & Mantenedor Perpétuo",
    title: "Inscrição no Livro Sagrado de Orações Diárias",
    description: `Um gesto sublime de amor e caridade. Os nomes de ${primeiroNome || "você"} e de ${primeiroEnte} serão inscritos no Livro Sagrado do Altar Principal para receberem preces diárias e irradiação de luz por 1 ano.`,
    badgeColor:
      "bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 border-amber-400 shadow-xs",
    cardBorder: "border-amber-400 bg-gradient-to-br from-[#fffbeb] via-[#fffdfa] to-[#fef3c7]",
    isValid: true,
  };
}

function PixInstantBox({
  primeiroNome,
  primeiroEnte,
}: {
  primeiroNome: string;
  primeiroEnte: string;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number>(29);
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const activeAmount = isCustom ? Number(customInput) || 0 : selectedAmount;
  const impact = getDonationPsychologicalImpact(activeAmount, primeiroEnte, primeiroNome);

  const handleSelectPreset = (val: number) => {
    setSelectedAmount(val);
    setIsCustom(false);
    setCustomInput("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setIsCustom(true);
    setCustomInput(raw);
  };

  return (
    <div className="mt-6 rounded-3xl border-2 border-[#f59e0b]/50 bg-white p-4 sm:p-6 shadow-xl text-center">
      {/* Badge Topo */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-[#fde68a] text-[#92400e] text-[11px] font-extrabold tracking-wider uppercase mb-3">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
        🤍 Escolha o Valor do Seu Coração
      </div>

      <h3 className="font-display text-[20px] font-extrabold text-[#181126] leading-tight">
        Sua Doação Fraterna para os Materiais de {primeiroEnte}
      </h3>
      <p className="text-[13px] text-[#5e4b73] mt-1 leading-snug">
        A mensagem é gratuita. O valor cobre os custos de velas consagradas de 7 dias, pergaminho e
        caridade.
      </p>

      {/* Seletor de Valores em Botões Rápidos */}
      <div className="mt-5 text-left">
        <span className="block text-[11px] font-bold tracking-wider text-[#786445] uppercase mb-2">
          Sugestões de contribuição fraterna:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 19, tag: "Básico" },
            { val: 29, tag: "⭐ Mais Escolhido", highlight: true },
            { val: 49, tag: "🌟 Luz Expandida" },
            { val: 97, tag: "🕊️ Protetor(a)" },
            { val: 150, tag: "👑 Guardião" },
          ].map((item) => {
            const isSelected = !isCustom && selectedAmount === item.val;
            return (
              <button
                key={item.val}
                type="button"
                onClick={() => handleSelectPreset(item.val)}
                className={`relative py-2.5 px-2 rounded-2xl text-center transition-all duration-200 border-2 cursor-pointer ${
                  isSelected
                    ? "border-[#f59e0b] bg-[#fef3c7] text-[#92400e] shadow-md scale-[1.02]"
                    : "border-[#ece4f4] bg-white text-[#2d144d] hover:border-[#f59e0b]/50"
                }`}
              >
                {item.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#b45309] px-2 py-0.5 text-[8.5px] font-black text-white uppercase tracking-wider whitespace-nowrap shadow-xs">
                    Popular
                  </span>
                )}
                <span className="block text-[15px] font-black leading-tight">R$ {item.val}</span>
                <span className="block text-[9.5px] font-semibold text-[#786445] truncate mt-0.5">
                  {item.tag}
                </span>
              </button>
            );
          })}

          {/* Botão para Ativar Valor Personalizado */}
          <button
            type="button"
            onClick={() => {
              setIsCustom(true);
              if (!customInput) setCustomInput("35");
            }}
            className={`py-2.5 px-2 rounded-2xl text-center transition-all duration-200 border-2 cursor-pointer ${
              isCustom
                ? "border-[#f59e0b] bg-[#fef3c7] text-[#92400e] shadow-md scale-[1.02]"
                : "border-[#ece4f4] bg-white text-[#2d144d] hover:border-[#f59e0b]/50"
            }`}
          >
            <span className="block text-[14px] font-black leading-tight">✍️ Outro</span>
            <span className="block text-[9.5px] font-semibold text-[#786445] mt-0.5">
              Digitar Valor
            </span>
          </button>
        </div>
      </div>

      {/* Input de Valor Personalizado caso ativado */}
      {isCustom && (
        <div className="mt-3.5 p-3 rounded-2xl bg-[#fbf9f5] border border-[#fde68a] text-left animate-rise-in">
          <label className="block text-[11.5px] font-bold text-[#2d144d] mb-1">
            Digite o valor que deseja doar (mínimo de R$ 10,00):
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-base font-black text-[#2d144d]">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={customInput}
              onChange={handleCustomChange}
              placeholder="Ex: 50"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-[#e5daf0] focus:border-[#f59e0b] bg-white text-[16px] font-black text-[#181126] outline-hidden shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* ── CARD PSICOLÓGICO DINÂMICO CONFORME O VALOR ESCOLHIDO ── */}
      <div
        className={`mt-4 rounded-2xl border-2 p-4 text-left shadow-xs transition-all duration-300 ${impact.cardBorder}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide border ${impact.badgeColor}`}
          >
            <span>{impact.icon}</span>
            {impact.badge}
          </span>
          <span className="text-[13px] font-black text-[#2d144d]">
            R${" "}
            {activeAmount > 0
              ? activeAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
              : "0,00"}
          </span>
        </div>

        <h4 className="text-[13.5px] font-extrabold text-[#181126] leading-snug">{impact.title}</h4>
        <p className="text-[12px] text-[#5e4b73] mt-1 leading-relaxed">{impact.description}</p>

        {/* Motivo transparente do mínimo de R$ 10 */}
        {activeAmount < 10 && (
          <div className="mt-2.5 p-2 rounded-xl bg-red-100/70 border border-red-200 text-red-900 text-[11.5px] font-bold leading-tight">
            ⚠️ O valor mínimo de R$ 10,00 é necessário apenas para cobrir a vela de 7 dias e o
            pergaminho especial de algodão puro.
          </div>
        )}
      </div>

      {impact.isValid ? (
        <PixCheckout productId="carta_sagrada" amountCents={Math.round(activeAmount * 100)} />
      ) : (
        <div className="mt-5 p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold">
          Por favor, selecione ou digite um valor a partir de R$ 10,00 para gerar o código PIX.
        </div>
      )}

      {/* Botão Pós-PIX com Acesso Imediato */}
      <div className="mt-5 pt-4 border-t border-[#ece4f4]">
        <Link
          to="/ajuda-milena"
          className="w-full block py-4 px-4 rounded-2xl bg-[#2d144d] hover:bg-[#1f0c36] text-white font-extrabold text-[14px] uppercase tracking-wide transition-colors shadow-md text-center"
        >
          ✅ Já realizei o PIX · Confirmar e Prosseguir ›
        </Link>
        <span className="mt-2 block text-[11.5px] text-[#786445]">
          A médium Milena Medeiros já iniciará a canalização sagrada para {primeiroEnte}.
        </span>
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
  nome: string;
  setNome: (v: string) => void;
  error?: string | undefined;
  next: () => void;
}) {
  const [letterModalOpen, setLetterModalOpen] = useState(false);

  return (
    <div className="animate-rise-in bg-[#fbf9f5]">
      {/* Top Hero com Destaque Central do Santuário Templo de Luz */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#2d144d] via-[#1f0c36] to-[#120422] px-6 pt-10 pb-9 text-center text-white">
        <Halos />
        <div className="relative z-10 flex flex-col items-center">
          <Stars />
          <span className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-white/10 backdrop-blur-md px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-amber-300 uppercase shadow-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shadow-xs shadow-amber-400" />
            🕊️ Templo de Luz · Desde 1977
          </span>

          <h1 className="font-display mt-5 text-[28px] leading-[1.2] font-black text-white tracking-tight drop-shadow-md">
            Receba hoje uma{" "}
            <span className="text-[#fde68a] not-italic underline decoration-amber-400/60 decoration-2 underline-offset-4">
              carta psicografada
            </span>{" "}
            de quem você ama e partiu para a luz
          </h1>

          <p className="mt-3 max-w-[350px] text-[14.5px] leading-relaxed text-zinc-200 font-normal">
            Escrita à mão pela médium Milena Medeiros no santuário sagrado — revelando a letra, a
            assinatura e as lembranças íntimas que provam que a vida continua.
          </p>
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
          <div
            onClick={() => setLetterModalOpen(true)}
            className="group relative mx-auto max-w-[325px] rounded-2xl p-1 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-xl cursor-zoom-in transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
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
          </div>
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
  dorPrincipal,
  onDone,
}: {
  nome: string;
  ente: string;
  relacao?: string;
  dorPrincipal?: string | undefined;
  onDone: () => void;
}) {
  const [pct, setPct] = useState(0);
  const primeiroNome = nome.split(" ")[0] || "você";
  const primeiroEnte = ente.split(" ")[0] || "seu ente";

  const stages = useMemo(
    () => [
      {
        title: "Registrando sua intenção",
        detail: `Acolhendo o pedido de ${primeiroNome} por ${primeiroEnte}.`,
      },
      {
        title: "Organizando as informações",
        detail: dorPrincipal
          ? `Preparando sua intenção: “${dorPrincipal.slice(0, 48)}${dorPrincipal.length > 48 ? "..." : ""}”`
          : "Preparando sua intenção com cuidado e privacidade.",
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
    [primeiroNome, primeiroEnte, dorPrincipal],
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
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Preparação do pedido"
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
            return (
              <div
                key={stage.title}
                className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 transition-colors duration-300 ${
                  isActive
                    ? "border-amber-300/40 bg-amber-200/10"
                    : isComplete
                      ? "border-emerald-300/20 bg-emerald-300/[0.07]"
                      : "border-white/10 bg-black/10"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    isComplete
                      ? "bg-emerald-400 text-emerald-950"
                      : isActive
                        ? "bg-amber-300 text-amber-950 ring-4 ring-amber-300/15"
                        : "bg-white/10 text-white/45"
                  }`}
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

function Countdown({ minutes }: { minutes: number }) {
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
  nome,
  ente,
  relacao,
  dorPrincipal,
  horario,
}: {
  nome: string;
  ente: string;
  relacao: string;
  dorPrincipal: string;
  horario: string;
}) {
  const go = () => redirectWithParams(CHECKOUT_URL);
  const primeiro = nome.split(" ")[0] || "você";
  const primeiroEnte = ente.split(" ")[0] || "seu ente querido";

  return (
    <div className="animate-rise-in pb-28 text-[#181126] bg-[#fbf9f5]">
      {/* Header com Confirmação Espiritual */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#2d144d] via-[#1f0c36] to-[#120422] px-6 pt-10 pb-9 text-center text-white border-b border-[#ece4f4]">
        <Halos />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-white/10 px-4 py-1 text-[11px] font-bold tracking-[0.16em] text-amber-300 uppercase shadow-md">
            📅 Agendamento Espiritual Confirmado
          </span>
          <div className="animate-float-soft mt-5 text-[52px]">🕊️</div>
          <h1 className="font-display mt-3 text-[26px] leading-snug font-extrabold text-white">
            {primeiro}, a psicografia de <em className="text-[#fde68a] not-italic">{ente}</em> foi
            agendada para <span className="text-shimmer">{horario}</span>
          </h1>
          <p className="mx-auto mt-3.5 max-w-[330px] text-[14px] leading-relaxed text-zinc-200 font-normal">
            Guarde este momento no coração: é quando a médium Milena Medeiros entra em recolhimento
            sagrado para psicografar a mensagem de {primeiroEnte} ({relacao || "ente querido"}) para
            você.
          </p>
        </div>
      </header>

      {/* Banner de Urgência */}
      <div className="bg-[#f6f0fc] border-b border-[#ece4f4] px-5 py-3.5 text-center text-xs text-[#2d144d] flex items-center justify-center gap-2 font-medium">
        <span>⏳ Vaga reservada no oratório por</span>
        <Countdown minutes={15} />
      </div>

      <div className="px-4 pt-7 sm:px-6">
        {/* Card Personalizado com base no Quiz */}
        {dorPrincipal && (
          <Reveal className="p-4 rounded-2xl bg-white border border-[#fde68a] mb-6 text-center shadow-sm">
            <span className="text-[11px] font-bold text-[#b45309] block uppercase tracking-wider">
              🕊️ Intenção Registrada para a Médium
            </span>
            <p className="text-[13.5px] text-[#2d144d] mt-1 font-semibold italic">
              "{dorPrincipal}"
            </p>
          </Reveal>
        )}

        <SocialProofSection />

        {/* Meta de materiais do oratório */}
        <Reveal className="mb-6">
          <DonationGoal />
        </Reveal>

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
              <span>✦</span> MÉDIUM TITULAR DESDE 1993
            </span>
            <p className="mt-2 text-[13px] text-[#5e4b73] leading-relaxed font-medium">
              Milena já verteu mais de 12 mil cartas manuscritas, trazendo alívio, confirmação e
              consolo a famílias de todo o Brasil.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            { n: "33", l: "anos de missão" },
            { n: "+12k", l: "cartas entregues" },
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

        {/* ── CARD DE DOAÇÃO SOLIDÁRIA COM PIX NA PÁGINA ── */}
        <Reveal className="relative mt-9 overflow-hidden rounded-3xl p-4 text-center shadow-xl border-2 border-[#f59e0b] bg-white sm:p-6">
          <div id="pix-section" className="absolute -top-16" />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#fde68a] bg-[#fef3c7] px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#92400e]">
              ★ Ação solidária
            </span>
            <span className="inline-flex rounded-full border border-[#e5daf0] bg-[#f6f0fc] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#2d144d]">
              Contribuição de manutenção
            </span>
          </div>

          <h2 className="font-display mt-4 text-[20px] leading-[1.35] font-extrabold text-[#181126] sm:text-[22px]">
            A mensagem de {primeiroEnte} é sagrada e gratuita — você escolhe com o coração o valor
            da sua contribuição fraterna
          </h2>

          <p className="mx-auto mt-3 text-[13.5px] leading-relaxed text-[#5e4b73] font-normal">
            O Templo de Luz mantém as portas abertas por caridade. Sua contribuição custeia a vela
            de 7 dias acesa no oratório, a folha de algodão puro para psicografia e apoia as obras
            assistenciais da casa.
          </p>

          {/* Integração do Seletor de Doação Livre & PIX Instantâneo */}
          <PixInstantBox primeiroNome={primeiro} primeiroEnte={primeiroEnte} />

          {/* Opção Cartão de Crédito / Checkout Cakto */}
          <div className="mt-4 pt-3 border-t border-[#ece4f4]">
            <a
              href={CHECKOUT_URL}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-[#5e4b73] hover:text-[#2d144d] font-semibold underline decoration-[#d8caea] underline-offset-4 transition-colors"
            >
              💳 Prefere contribuir via Cartão de Crédito? Clique aqui
            </a>
          </div>

          {/* Link para o simulador de carta em pergaminho */}
          <Link
            to="/escrever-carta"
            className="mt-4 block text-center text-xs font-bold text-[#b45309] underline decoration-[#f59e0b]/40 underline-offset-4 hover:decoration-[#f59e0b]"
          >
            ✍️ Ou clique aqui para redigir sua carta no simulador de pergaminho ›
          </Link>

          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[12px] font-medium text-[#786445]">
            <span>🛡️ 7 dias de Garantia Sagrada</span>
            <span>🔒 Doação segura e transparente</span>
            <span>💬 Acompanhamento no WhatsApp</span>
          </div>
        </Reveal>

        <Reveal className="mt-10">
          <SectionLabel>Dúvidas frequentes e acolhimento</SectionLabel>
          <Faq />
        </Reveal>

        <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-900 shadow-2xs">
          <p className="text-[13px] leading-relaxed font-medium">
            <strong className="text-emerald-800">
              Garantia Sagrada e Incondicional de 7 dias.
            </strong>{" "}
            Se as palavras da carta não tocarem profundamente o seu coração e não trouxerem paz,
            devolvemos 100% da sua doação imediatamente.
          </p>
        </div>
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
          className="cta-hot w-full cursor-pointer rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-3.5 text-[14.5px] font-extrabold tracking-wide text-white uppercase shadow-lg shadow-emerald-600/25 transition-transform hover:-translate-y-0.5"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            🕯️ Fazer Doação Fraterna de {primeiroEnte}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ─────────── funil principal ─────────── */

type Step = "intro" | "ente" | "relacao" | "tempo" | "mensagem" | "confirma" | "loading" | "result";

export function QuizFunnel() {
  const [step, setStep] = useState<Step>("intro");
  const [nome, setNome] = useState("");
  const [ente, setEnte] = useState("");
  const [relacao, setRelacao] = useState("");
  const [tempo, setTempo] = useState("");
  const [dorPrincipal, setDorPrincipal] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [modoMensagem, setModoMensagem] = useState<"temas" | "livre">("temas");
  const [temasEscolhidos, setTemasEscolhidos] = useState<string[]>([]);
  const [erroNome, setErroNome] = useState<string>();
  const [erroEnte, setErroEnte] = useState<string>();
  const [horario, setHorario] = useState("");

  const goto = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const primeiroEnte = ente.split(" ")[0] || "seu ente querido";
  const primeiroNome = nome.split(" ")[0] || "você";

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

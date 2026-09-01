import { useEffect, useState } from "react";

const LIVE_EVENTS = [
  {
    name: "Dona Lourdes M.",
    city: "Campinas/SP",
    action: "solicitou a Carta Psicografada para seu filho",
    time: "há 2 minutos",
    icon: "🕊️",
  },
  {
    name: "Roberto S.",
    city: "São Paulo/SP",
    action: "acendeu uma vela no oratório e confirmou sua carta",
    time: "há 4 minutos",
    icon: "🕯️",
  },
  {
    name: "Cláudia F.",
    city: "Rio de Janeiro/RJ",
    action: "enviou sua intenção de oração para a médium Milena",
    time: "há 1 minuto",
    icon: "✨",
  },
  {
    name: "Paulo H.",
    city: "Belo Horizonte/MG",
    action: "consagrou a doação fraterna dos materiais",
    time: "há 3 minutos",
    icon: "🤍",
  },
  {
    name: "Juliana A.",
    city: "Curitiba/PR",
    action: "garantiu o horário de recolhimento espiritual",
    time: "há 5 minutos",
    icon: "💌",
  },
  {
    name: "Dona Francisca",
    city: "Porto Alegre/RS",
    action: "consagrou sua prece no oratório de luz",
    time: "há instantes",
    icon: "🙏",
  },
  {
    name: "Márcio T.",
    city: "Brasília/DF",
    action: "solicitou a psicografia para sua mãe",
    time: "há 2 minutos",
    icon: "🕊️",
  },
];

export function LiveActivityToast() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Primeiro toast aparece após 3.5 segundos
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 3500);

    // Intervalo de ciclo: 5s visível, 4s invisível antes do próximo
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % LIVE_EVENTS.length);
        setVisible(true);
      }, 4000);
    }, 9500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed || !visible) return null;

  const ev = LIVE_EVENTS[currentIdx];

  return (
    <aside
      aria-label="Atividade recente no Templo de Luz"
      className="fixed bottom-24 left-4 right-4 z-40 max-w-[370px] animate-rise-in sm:bottom-4 sm:right-auto"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-[#fde68a] bg-white/95 backdrop-blur-md p-3.5 shadow-2xl shadow-purple-950/15">
        {/* Ícone com Aura */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fefaf3] border border-[#fde68a] text-lg shadow-2xs">
          {ev.icon}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11.5px] font-black text-[#181126] truncate">
              {ev.name} <span className="text-[#8e7a60] font-medium">({ev.city})</span>
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-[#5e4b73] leading-snug">{ev.action}</p>
          <span className="mt-1 block text-[10px] font-semibold text-[#b45309]">
            {ev.time} · Templo de Luz
          </span>
        </div>

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-zinc-400 hover:text-zinc-700 text-xs p-1 -mr-1 -mt-1 cursor-pointer transition-colors"
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}

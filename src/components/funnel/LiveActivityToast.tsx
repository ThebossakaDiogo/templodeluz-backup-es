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

    // Primeiro toast aparece após 4 segundos
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Intervalo de ciclo: 4s visível, 6s invisível antes do próximo
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % LIVE_EVENTS.length);
        setVisible(true);
      }, 6000);
    }, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  const ev = LIVE_EVENTS[currentIdx];
  if (dismissed || !visible || !ev) return null;

  return (
    <aside
      aria-label="Atividade recente no Templo de Luz"
      className="fixed bottom-3 left-3 right-auto z-40 max-w-[310px] sm:max-w-[340px] pointer-events-auto animate-fade-in"
    >
      <div className="flex items-center gap-2 rounded-full border border-amber-300/70 bg-white/95 backdrop-blur-md py-1.5 px-3 shadow-lg shadow-purple-950/10 text-left">
        {/* Ponto de Pulso e Ícone */}
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs">
          {ev.icon}
        </span>

        {/* Texto em linha compacta */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1 leading-none truncate">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10.5px] font-black text-[#181126] truncate">
              {ev.name}
            </span>
            <span className="text-[9.5px] text-[#8e7a60] font-medium shrink-0">
              ({ev.city})
            </span>
          </div>
          <p className="text-[10px] text-[#5e4b73] font-medium truncate mt-0.5 leading-none">
            {ev.action} · <span className="text-[#b45309] font-bold">{ev.time}</span>
          </p>
        </div>

        {/* Botão Fechar Discreto */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-zinc-400 hover:text-zinc-700 text-[10px] p-0.5 rounded-full hover:bg-zinc-100 cursor-pointer transition-colors shrink-0"
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}

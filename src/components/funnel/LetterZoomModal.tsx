import { useEffect, useRef, useState } from "react";
import { IMAGES } from "./data";

interface LetterZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCtaClick?: () => void;
}

export function LetterZoomModal({ isOpen, onClose, onCtaClick }: LetterZoomModalProps) {
  const [zoomLevel, setZoomLevel] = useState<1 | 1.65 | 2.2>(1);
  const viewportRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Bloqueia o scroll do body enquanto aberto
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    requestAnimationFrame(() => {
      viewport.scrollTo({
        top: 0,
        left: Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2),
        behavior: "smooth",
      });
    });
  }, [zoomLevel]);

  if (!isOpen) return null;

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.65 : prev === 1.65 ? 2.2 : 1));
  };

  const zoomWidth = zoomLevel === 1 ? undefined : `${zoomLevel * 92}vw`;
  const zoomMaxWidth = zoomLevel === 1 ? undefined : `${zoomLevel * 420}px`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de Carta Psicografada em Tela Cheia"
      className="fixed inset-0 z-[100] grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden bg-[#09090b]/97 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-white select-none backdrop-blur-md animate-fade-in sm:gap-3 sm:p-4"
    >
      {/* Barra Superior de Controles */}
      <header className="relative z-20 mx-auto flex w-full max-w-[640px] items-center justify-between gap-2 rounded-2xl border border-white/15 bg-black/55 px-2 py-2 shadow-lg backdrop-blur-lg sm:px-3 sm:py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 text-sm border border-amber-400/40">
            📜
          </span>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
              Carta Psicografada Manuscrita
            </h3>
            <span className="hidden text-[10px] text-amber-300 font-semibold sm:block">
              ✦ Templo de Luz · Médium Milena Medeiros
            </span>
          </div>
        </div>

        {/* Botões de Ação e Zoom */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleZoom}
            className="flex items-center gap-1 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-2.5 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
            title="Aumentar / Diminuir Zoom"
          >
            <span>🔍</span>
            <span>
              {zoomLevel === 1 ? "Ampliar" : zoomLevel === 1.65 ? "Zoom 2.2x" : "Ajustar"}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 hover:bg-red-500/80 text-white font-bold text-sm transition-colors cursor-pointer"
            aria-label="Fechar tela cheia"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Área Central da Imagem com Scroll/Pan e Zoom Suave */}
      <main
        ref={viewportRef}
        className={`relative z-10 min-h-0 w-full overflow-auto overscroll-contain rounded-2xl bg-white/[0.025] touch-pan-x touch-pan-y ${zoomLevel === 1 ? "cursor-zoom-in" : "cursor-zoom-out"}`}
        onClick={toggleZoom}
      >
        <div
          className={
            zoomLevel === 1
              ? "flex min-h-full min-w-full items-center justify-center p-1.5 sm:p-2"
              : "min-h-full min-w-full w-max p-2 sm:p-3"
          }
        >
          <div
            className={`relative mx-auto shrink-0 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 shadow-2xl transition-[width] duration-300 ease-out sm:p-1.5 ${zoomLevel === 1 ? "w-fit max-w-full" : ""}`}
            style={{ width: zoomWidth, maxWidth: zoomMaxWidth }}
          >
            <img
              src={IMAGES.carta}
              alt="Carta psicografada escrita à mão por Milena Medeiros em alta definição"
              draggable={false}
              className={`h-auto rounded-xl object-contain shadow-inner ${zoomLevel === 1 ? "max-h-[calc(100dvh-11rem)] max-w-[92vw] sm:max-w-[420px]" : "w-full max-w-none"}`}
            />
          </div>
        </div>
      </main>

      {/* Barra Inferior com Citação e Botão de Ação */}
      <footer className="relative z-20 mx-auto w-full max-w-[640px] rounded-2xl border border-white/15 bg-black/60 px-2 py-2 text-center shadow-lg backdrop-blur-lg sm:px-3 sm:py-2.5">
        <p className="hidden text-[11px] italic leading-tight text-amber-200/90 sm:block sm:text-[12px]">
          « O amor de mãe não morre, apenas se transforma... Sinto a sua presença a cada oração. »
        </p>

        <div className="flex items-center justify-center gap-2 sm:mt-2.5">
          {onCtaClick ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCtaClick();
              }}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-amber-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
            >
              💫 Quero Iniciar a Carta do Meu Ente Querido
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs uppercase transition-colors cursor-pointer"
            >
              Voltar ao Quiz
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

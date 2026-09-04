import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IMAGES } from "./data";

interface LetterZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCtaClick?: () => void;
}

export function LetterZoomModal({ isOpen, onClose, onCtaClick }: LetterZoomModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const viewportRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false);
      return;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    requestAnimationFrame(() => {
      viewport.scrollTo({
        top: 0,
        left: isZoomed ? Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2) : 0,
      });
    });
  }, [isZoomed]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador da carta psicografada"
      className="fixed inset-0 z-[300] grid h-[100dvh] w-screen grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden bg-[#09090b]/98 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-white backdrop-blur-md sm:gap-3 sm:p-3"
    >
      <header className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/70 px-3 py-2.5 shadow-xl">
        <div className="min-w-0 text-left">
          <h3 className="truncate text-sm font-extrabold text-white sm:text-base">
            Carta Psicografada Manuscrita
          </h3>
          <p className="hidden text-[11px] font-semibold text-amber-300 sm:block">
            Templo de Luz - Médium Milena Medeiros
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setIsZoomed((current) => !current)}
            className="cursor-pointer rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs font-extrabold text-white transition-colors hover:bg-white/25"
          >
            {isZoomed ? "Ajustar" : "Ampliar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-sm font-extrabold text-white transition-colors hover:bg-red-600"
            aria-label="Fechar visualizador"
          >
            X
          </button>
        </div>
      </header>

      <main
        ref={viewportRef}
        className="no-scrollbar min-h-0 w-full overflow-auto overscroll-contain rounded-2xl touch-pan-x touch-pan-y"
      >
        <div
          className={
            isZoomed
              ? "mx-auto w-max min-w-full px-2 py-1 sm:px-3"
              : "flex min-h-full min-w-full items-center justify-center p-1 sm:p-2"
          }
        >
          <div
            className={
              isZoomed
                ? "mx-auto w-[155vw] max-w-[980px] rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 shadow-2xl sm:w-[96vw] lg:w-[980px]"
                : "w-fit max-w-full rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 shadow-2xl"
            }
          >
            <img
              src={IMAGES.carta}
              alt="Carta psicografada escrita à mão por Milena Medeiros"
              draggable={false}
              decoding="async"
              onClick={() => setIsZoomed((current) => !current)}
              className={
                isZoomed
                  ? "block h-auto w-full cursor-zoom-out rounded-xl"
                  : "block h-auto w-auto max-h-[calc(100dvh-10.5rem)] max-w-[calc(100vw-1.5rem)] cursor-zoom-in rounded-xl object-contain"
              }
            />
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[720px] rounded-2xl border border-white/15 bg-black/75 px-2.5 py-2 text-center shadow-xl sm:px-4 sm:py-2.5">
        <p className="hidden text-[11px] italic leading-tight text-amber-200 sm:block sm:text-xs">
          O amor de mãe não morre, apenas se transforma. Sinto a sua presença a cada oração.
        </p>
        <div className="sm:mt-2">
          {onCtaClick ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCtaClick();
              }}
              className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-amber-950 shadow-lg sm:w-auto"
            >
              Quero iniciar a carta do meu ente querido
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full cursor-pointer rounded-xl bg-white/20 px-5 py-2.5 text-xs font-bold uppercase text-white transition-colors hover:bg-white/30 sm:w-auto"
            >
              Voltar ao quiz
            </button>
          )}
        </div>
      </footer>
    </div>,
    document.body,
  );
}

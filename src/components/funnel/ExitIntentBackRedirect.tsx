import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Exit-Intent de Retenção — notificação persuasiva (sem mídia).
 *
 * Dispara uma única vez quando o usuário tenta sair, oferecendo continuidade
 * sem bloquear a navegação ou criar urgência artificial.
 */

const SESSION_FLAG_KEY = "templodeluz:exit-intent:shown";

interface ExitIntentBackRedirectProps {
  readonly stayTitle?: string;
  readonly stayBody?: string;
  readonly stayCta?: string;
  readonly leaveLabel?: string;
  readonly enabled?: boolean;
}

export function ExitIntentBackRedirect({
  stayTitle = "Sua intenção ficou salva",
  stayBody = "Você pode continuar agora ou voltar mais tarde neste mesmo aparelho. Seus dados do quiz permanecem disponíveis para revisão.",
  stayCta = "Continuar com minha intenção",
  leaveLabel = "Fechar por enquanto",
  enabled = true,
}: Readonly<ExitIntentBackRedirectProps>) {
  const [visible, setVisible] = useState(false);
  const triggeredRef = useRef(false);

  const trigger = useCallback(() => {
    if (!enabled || triggeredRef.current) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_FLAG_KEY) === "true") return;
    triggeredRef.current = true;
    sessionStorage.setItem(SESSION_FLAG_KEY, "true");
    setVisible(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget && event.clientY <= 0) trigger();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") trigger();
    };

    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, trigger]);

  const close = useCallback(() => setVisible(false), []);

  if (!enabled) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="exit-intent"
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/70 bg-[#fffdf8] shadow-2xl"
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 12, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#111827] via-[#172033] to-[#0f172a] px-4 py-2.5 text-[11px] font-bold tracking-widest text-blue-100 uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Progresso salvo com segurança
            </div>

            <div className="flex flex-col items-center gap-3 px-6 py-7 text-center">
              <motion.span
                className="text-5xl"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
              >
                🕊️
              </motion.span>

              <h2
                id="exit-intent-title"
                className="font-display text-[22px] font-black leading-tight text-slate-950"
              >
                {stayTitle}
              </h2>

              <p className="text-[14px] leading-relaxed text-slate-600">{stayBody}</p>

              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500">
                <span>🔒 Privacidade</span>
                <span>↩️ Você pode revisar</span>
                <span>💬 Atendimento humano</span>
              </div>

              <button
                type="button"
                onClick={close}
                className="mt-2 w-full cursor-pointer rounded-[14px] bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-[15px] text-[15px] font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {stayCta}
              </button>

              <button
                type="button"
                onClick={close}
                className="cursor-pointer text-[12.5px] font-semibold text-slate-400 underline-offset-4 hover:text-slate-700 hover:underline"
              >
                {leaveLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

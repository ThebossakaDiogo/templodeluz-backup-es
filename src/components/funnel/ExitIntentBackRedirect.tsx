import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Exit-Intent de Retenção — notificação persuasiva (sem mídia).
 *
 * Dispara quando o usuário tenta sair da página (mouse saindo pelo topo no
 * desktop, ou troca de aba no mobile) e exibe um aviso exclusivo e urgente
 * para convencê-lo a continuar o quiz — sem bloqueio forçado.
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
  stayTitle = "Espere! Sua conexão espiritual ainda não terminou",
  stayBody = "A médium Milena já começou a sintonizar a frequência do seu ente querido no oratório sagrado. Se você sair agora, a sua vaga de hoje será liberada para outra pessoa.",
  stayCta = "Continuar meu Quiz Sagrado",
  leaveLabel = "Não quero receber minha carta hoje",
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
            {/* Faixa de urgência */}
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#2d144d] via-[#3b1c63] to-[#1f0c36] px-4 py-2.5 text-[11px] font-bold tracking-widest text-amber-300 uppercase">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Oportunidade de hoje · vagas limitadas
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
                className="font-display text-[22px] font-black leading-tight text-[#181126]"
              >
                {stayTitle}
              </h2>

              <p className="text-[14px] leading-relaxed text-[#5e4b73]">{stayBody}</p>

              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[#786445]">
                <span>🔒 Sigilo absoluto</span>
                <span>🛡️ Garantia de 7 dias</span>
                <span>✍️ 100% manuscrita</span>
              </div>

              <button
                type="button"
                onClick={close}
                className="mt-2 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-[15px] text-[15px] font-extrabold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {stayCta}
              </button>

              <button
                type="button"
                onClick={close}
                className="cursor-pointer text-[12.5px] font-semibold text-[#9a8bb5] underline-offset-4 hover:text-[#6c5a82] hover:underline"
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

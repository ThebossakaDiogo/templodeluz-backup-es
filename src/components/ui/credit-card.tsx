import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const PERSPECTIVE = 400;
const CARD_ANIMATION_DURATION = 0.5;
const INITIAL_DELAY = 0.2;

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 30,
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export interface CreditCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  readonly cardNumber: string;
  readonly cardHolder: string;
  readonly expiryDate: string;
  readonly variant?: "default" | "dark" | "gold";
}

export const CreditCard = React.forwardRef<HTMLDivElement, CreditCardProps>(
  ({ className, cardNumber, cardHolder, expiryDate, variant = "dark", ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const getMaskedNumber = (number: string) => {
      if (!number || number.includes("4242")) {
        return "•••• •••• •••• ••••";
      }
      const clean = number.replace(/\s/g, "");
      const lastFour = clean.slice(-4);
      return `•••• •••• •••• ${lastFour}`;
    };

    const variants = {
      default: "bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white border border-emerald-400/30",
      dark: "bg-gradient-to-br from-[#241242] via-[#1b0b33] to-[#0f051d] text-white border border-purple-400/30",
      gold: "bg-gradient-to-br from-amber-600 via-amber-700 to-yellow-800 text-white border border-amber-400/40",
    };

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        transition={{ duration: CARD_ANIMATION_DURATION }}
        style={{ perspective: PERSPECTIVE }}
        className={cn("relative touch-none flex justify-center select-none", className)}
        {...props}
      >
        <motion.div
          className={cn(
            "relative h-44 w-full max-w-[320px] overflow-hidden rounded-2xl p-5 shadow-2xl flex flex-col justify-between",
            variants[variant]
          )}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: CARD_ANIMATION_DURATION }}
        >
          {/* Luz de fundo do chip */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

          <div className="flex items-center justify-between relative z-10">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: INITIAL_DELAY, duration: CARD_ANIMATION_DURATION }}
            >
              {/* Chip de Cartão Realista */}
              <div className="h-7 w-9 rounded-md bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-500 border border-amber-400 shadow-xs flex items-center justify-center">
                <div className="h-4 w-6 border border-amber-600/40 rounded-xs opacity-60" />
              </div>
              <span className="text-xs font-black tracking-widest uppercase text-amber-200/90">
                TEMPLO DE LUZ
              </span>
            </motion.div>

            <motion.button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, ...springTransition }}
              onClick={() => setIsVisible(!isVisible)}
              aria-label={isVisible ? "Ocultar dados do cartão" : "Mostrar dados do cartão"}
            >
              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </motion.button>
          </div>

          <motion.div
            className="my-1 font-mono text-[17px] font-extrabold tracking-[0.18em] text-white/95 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isVisible ? cardNumber : getMaskedNumber(cardNumber)}
          </motion.div>

          <div className="flex justify-between items-end relative z-10 pt-1 border-t border-white/15">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: CARD_ANIMATION_DURATION }}
            >
              <div className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">
                Titular da Doação
              </div>
              <div className="text-xs font-bold text-white uppercase truncate max-w-[170px]">
                {cardHolder || "SEU NOME"}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: CARD_ANIMATION_DURATION }}
              className="text-right"
            >
              <div className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">
                Validade
              </div>
              <div className="text-xs font-bold text-white font-mono">
                {isVisible ? expiryDate : "••/••"}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

CreditCard.displayName = "CreditCard";

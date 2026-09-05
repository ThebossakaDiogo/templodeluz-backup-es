import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { EvolutionLocalControl } from "./EvolutionLocalControl";

interface EvolutionQRModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConnectionChange?: (connected: boolean) => void;
}

export function EvolutionQRModal({ isOpen, onClose, onConnectionChange }: EvolutionQRModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="evolution-control-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dashboard-root evolution-control-dialog-scope">
        <section className="evolution-control-dialog" role="dialog" aria-modal="true" aria-labelledby="evolution-dialog-title">
          <header>
            <div>
              <span className="section-kicker">Controle local seguro</span>
              <h2 id="evolution-dialog-title">Evolution Local</h2>
              <p>O QR Code e a configuração da instância ficam no Manager local.</p>
            </div>
            <button type="button" className="btn topbar-icon-button" onClick={onClose} aria-label="Fechar controle Evolution">
              <X size={18} />
            </button>
          </header>
          <EvolutionLocalControl onConnectionChange={onConnectionChange} />
        </section>
      </div>
    </div>,
    document.body,
  );
}

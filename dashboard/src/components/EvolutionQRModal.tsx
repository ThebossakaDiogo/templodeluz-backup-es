import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Cloud, ExternalLink, X } from "lucide-react";

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
              <span className="section-kicker">Conexão em nuvem</span>
              <h2 id="evolution-dialog-title">Evolution Railway</h2>
              <p>O QR Code e o status agora ficam no WhatsApp Chat, disponíveis de qualquer lugar.</p>
            </div>
            <button type="button" className="btn topbar-icon-button" onClick={onClose} aria-label="Fechar controle Evolution">
              <X size={18} />
            </button>
          </header>
          <section className="card p-5 text-center">
            <Cloud className="mx-auto text-emerald-500" size={32} />
            <h3 className="mt-3 text-base font-black">Não é mais necessário abrir o Docker local</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[var(--text-muted)]">Abra a página WhatsApp Chat, escolha o perfil Meta ou TikTok e conecte o número correspondente.</p>
            <a href="/whatsapp" className="btn btn-emerald mt-4 inline-flex" onClick={() => { onConnectionChange?.(false); onClose(); }}>Abrir WhatsApp Chat <ExternalLink size={14} /></a>
          </section>
        </section>
      </div>
    </div>,
    document.body,
  );
}

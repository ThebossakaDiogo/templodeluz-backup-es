import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertOctagon,
  BarChart3,
  CreditCard,
  LayoutGrid,
  Menu,
  MessageCircle,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import type { Section } from "@/App";

interface MobileBottomNavProps {
  readonly currentSection: Section;
  readonly onSelect: (section: Section) => void;
  readonly unreadWhatsAppCount?: number;
}

const PRIMARY_ITEMS = [
  { id: "visao-geral" as Section, label: "Visão geral", Icon: LayoutGrid },
  { id: "whatsapp" as Section, label: "WhatsApp Chat", Icon: MessageCircle },
  { id: "rastreamento" as Section, label: "Funil", Icon: Activity },
  { id: "pedidos" as Section, label: "Pedidos", Icon: CreditCard },
];

const MORE_ITEMS = [
  { id: "anuncios" as Section, label: "Gastos & Lucro", detail: "Gastos em anúncios, receita e ROI", Icon: TrendingUp },
  { id: "abandonos" as Section, label: "Abandono e recuperação", detail: "PIX e checkouts pendentes", Icon: AlertOctagon },
  { id: "relatorios" as Section, label: "Relatórios", detail: "Canais, UTMs e exportação", Icon: BarChart3 },
  { id: "perfil" as Section, label: "Meu perfil", detail: "Conta e preferências", Icon: User },
];

export function MobileBottomNav({
  currentSection,
  onSelect,
  unreadWhatsAppCount = 0,
}: MobileBottomNavProps) {
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!showMore) return;
    const originalOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMore(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showMore]);

  const navigate = (section: Section) => {
    setShowMore(false);
    onSelect(section);
  };

  const moreIsActive = MORE_ITEMS.some((item) => item.id === currentSection);
  const moreSheet = showMore && typeof document !== "undefined" ? createPortal(
    <div className="mobile-more-backdrop">
      <button
        type="button"
        className="mobile-backdrop-dismiss"
        onClick={() => setShowMore(false)}
        aria-label="Fechar modal de opções"
        style={{ position: "absolute", inset: 0, border: 0, background: "transparent", cursor: "default", width: "100%", height: "100%" }}
      />
      <dialog open className="mobile-more-sheet" aria-labelledby="mobile-more-title">
        <header>
          <div>
            <h2 id="mobile-more-title">Mais opções</h2>
            <p>Acesse as demais áreas administrativas.</p>
          </div>
          <button type="button" onClick={() => setShowMore(false)} aria-label="Fechar menu">
            <X size={19} />
          </button>
        </header>
        <div className="mobile-more-list">
          {MORE_ITEMS.map(({ id, label, detail, Icon }) => (
            <button
              key={id}
              type="button"
              className={currentSection === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <span><Icon size={20} /></span>
              <span><strong>{label}</strong><small>{detail}</small></span>
            </button>
          ))}
        </div>
      </dialog>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        {PRIMARY_ITEMS.map(({ id, label, Icon }) => {
          const active = currentSection === id;
          return (
            <button
              key={id}
              type="button"
              className={active ? "active" : ""}
              onClick={() => navigate(id)}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-nav-icon">
                <Icon size={21} strokeWidth={active ? 2.2 : 1.7} />
                {id === "whatsapp" && unreadWhatsAppCount > 0 && <i>{Math.min(unreadWhatsAppCount, 99)}</i>}
              </span>
              <strong>{label}</strong>
            </button>
          );
        })}
        <button type="button" className={moreIsActive ? "active" : ""} onClick={() => setShowMore(true)}>
          <span className="mobile-nav-icon"><Menu size={21} /></span>
          <strong>Mais</strong>
        </button>
      </nav>
      {moreSheet}
    </>
  );
}

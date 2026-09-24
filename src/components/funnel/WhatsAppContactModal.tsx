import { useState } from "react";
import { createPortal } from "react-dom";
import { trackWhatsAppEvent } from "@/lib/whatsapp-telemetry";

const WHATSAPP_NUMBER = "5511960746285"; // Médium Milena Medeiros - Templo de Luz

export type DonationChoice = "already_donated" | "want_to_donate" | "free_charity";

export interface WhatsAppContactModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly nomeConsulente?: string | undefined;
  readonly nomeEnte?: string | undefined;
  readonly grauParentesco?: string | undefined;
  readonly tempoPassagem?: string | undefined;
  readonly intencaoPrincipal?: string | undefined;
  readonly mensagemPreview?: string | undefined;
  readonly temas?: string[] | undefined;
  readonly horario?: string | undefined;
  readonly onSelectDonateNow?: (() => void) | undefined;
  readonly quizOrigin?: ("original" | "mirrored") | undefined;
}

export function WhatsAppContactModal({
  isOpen,
  onClose,
  nomeConsulente = "Consulente",
  nomeEnte = "Ente Querido",
  grauParentesco = "Familiar",
  mensagemPreview,
  onSelectDonateNow,
  quizOrigin = "original",
}: WhatsAppContactModalProps) {
  const [donationChoice, setDonationChoice] = useState<DonationChoice>("want_to_donate");

  if (!isOpen) return null;

  const primeiroNome = nomeConsulente?.trim() ? nomeConsulente.trim().split(" ")[0] : "Consulente";
  const primeiroEnte = nomeEnte?.trim() ? nomeEnte.trim().split(" ")[0] : "Ente Querido";

  // Sem pagamento confirmado, o pedido chega sem detalhes pessoais ao WhatsApp.
  const buildWhatsAppMessage = (): string => {
    return "Olá, gostaria de receber orientação para continuar meu atendimento pelo WhatsApp.";
  };

  const handleOpenWhatsApp = () => {
    const textToSend = buildWhatsAppMessage();

    // Registra telemetria de WhatsApp
    // A escolha no modal é apenas uma declaração. A equipe confirma pagamentos pelo pedido.
    const paymentStatus = donationChoice === "free_charity" ? "none" : "pending";

    void trackWhatsAppEvent({
      customerName: nomeConsulente,
      enteQuerido: nomeEnte,
      grauParentesco,
      paymentMethod: donationChoice === "free_charity" ? "none" : "pending",
      paymentStatus,
      amountCents: 0,
      sourcePage: `quiz_contact_popup_${quizOrigin}_${donationChoice}`,
      ...(mensagemPreview ? { messagePreview: mensagemPreview.slice(0, 300) } : {}),
    });

    const encoded = encodeURIComponent(textToSend);
    const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;

    // Abre diretamente de forma confiável
    try {
      window.location.href = waUrl;
    } catch {
      window.open(waUrl, "_blank");
    }
  };

  const handleDonateNowClick = () => {
    onClose();
    if (onSelectDonateNow) {
      onSelectDonateNow();
    } else {
      const pixSection = document.getElementById("pix-section");
      if (pixSection) {
        pixSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-whatsapp-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[440px] rounded-[28px] bg-[#f8fafc] p-5 sm:p-6 text-left shadow-[0_30px_80px_-20px_rgba(15,23,42,0.55)] border border-slate-200 animate-rise-in max-h-[92vh] overflow-y-auto">
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800 transition-colors text-lg font-bold cursor-pointer"
        >
          ×
        </button>

        {/* Topo Acolhedor com Ícone de WhatsApp & Bênção */}
        <div className="flex items-center gap-3 pr-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4b8b7e] to-[#2d665e] text-white shadow-md shadow-[#39776c]/20">
            {/* Logo WhatsApp SVG Oficial */}
            <svg
              className="w-7 h-7 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.107-.07-.251-.08-.574-.188-.988-.369-1.758-.767-2.903-2.545-2.991-2.663-.088-.118-.718-.956-.718-1.822 0-.866.453-1.293.614-1.469.161-.177.351-.221.468-.221.117 0 .234.001.336.006.107.005.251-.041.393.298.146.351.498 1.214.542 1.303.044.088.073.192.015.308-.059.117-.088.19-.176.293-.088.103-.186.23-.265.31-.088.088-.18.184-.078.36.103.176.458.756.983 1.224.676.602 1.246.789 1.422.877.176.088.279.074.382-.044.103-.117.439-.512.556-.688.117-.176.235-.147.396-.088.161.059 1.026.484 1.202.572.176.088.293.132.337.206.044.074.044.43-.1 1.035z" />
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.523 3.664 1.435 5.186L2.1 22l4.98-1.306A9.958 9.958 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.635 0-3.15-.494-4.414-1.343l-.316-.214-2.95.774.787-2.876-.234-.336A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5d4786] block">
              Canal de atendimento
            </span>
            <h3 id="modal-whatsapp-title" className="font-display text-[18px] font-black text-slate-950 leading-tight">
              Seu pedido está pronto para o WhatsApp
            </h3>
          </div>
        </div>

        {/* Resumo de continuidade */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#f2eef8] border border-[#e1d8ec] text-[12.5px] leading-relaxed text-slate-700">
          <p className="font-semibold">
            Olá, <strong>{primeiroNome}</strong>. Sua intenção para {primeiroEnte} foi organizada com cuidado.
          </p>
          <p className="mt-1 text-slate-500 text-[12px]">
            Escolha como deseja continuar para que a conversa comece com as informações certas.
          </p>
        </div>

        {/* Seleção de Situação da Doação (Caixinhas Interativas) */}
        <div className="mt-4 space-y-2">
          <label className="block text-[11.5px] font-extrabold text-[#181126] uppercase tracking-wider">
            Como você deseja continuar?
          </label>

          {/* Opção 1: Já doei */}
          <div
            onClick={() => setDonationChoice("already_donated")}
            className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
              donationChoice === "already_donated"
                ? "border-[#6f5aa0] bg-[#f2eef8] shadow-sm ring-4 ring-[#6f5aa0]/10"
                : "border-slate-200 bg-white hover:border-[#b9a8cf] hover:bg-[#f7f4fa]"
            }`}
          >
            <input
              type="radio"
              name="donation_choice"
              checked={donationChoice === "already_donated"}
              onChange={() => setDonationChoice("already_donated")}
              className="mt-1 h-4 w-4 text-emerald-600 accent-emerald-600 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <span className="block text-[13px] font-extrabold text-emerald-950 leading-tight">
                  Já realizei minha contribuição
              </span>
              <span className="block text-[11px] text-emerald-800/90 mt-0.5 leading-normal">
                  Vou enviar o comprovante diretamente no WhatsApp.
              </span>
            </div>
          </div>

          {/* Opção 2: Ainda não doei, mas quero doar agora */}
          <div
            onClick={() => setDonationChoice("want_to_donate")}
            className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
              donationChoice === "want_to_donate"
                ? "border-[#6f5aa0] bg-[#f2eef8] shadow-sm ring-4 ring-[#6f5aa0]/10"
                : "border-slate-200 bg-white hover:border-[#b9a8cf] hover:bg-[#f7f4fa]"
            }`}
          >
            <input
              type="radio"
              name="donation_choice"
              checked={donationChoice === "want_to_donate"}
              onChange={() => setDonationChoice("want_to_donate")}
              className="mt-1 h-4 w-4 text-amber-600 accent-amber-600 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="block text-[13px] font-extrabold text-[#78350f] leading-tight">
                  Desejo escolher uma contribuição
                </span>
                <span className="rounded-full bg-amber-200/80 text-[#78350f] font-black text-[9.5px] px-2 py-0.5 uppercase">
                  Recomendado
                </span>
              </div>
              <span className="block text-[11px] text-[#92400e]/90 mt-0.5 leading-normal">
                  Quero ver PIX e cartão antes de iniciar a conversa.
              </span>
              {donationChoice === "want_to_donate" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDonateNowClick();
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-xs hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  <span>⚡ Contribuir via PIX agora mesmo ›</span>
                </button>
              )}
            </div>
          </div>

          {/* Opção 3: Atendimento caritativo sem doação agora */}
          <div
            onClick={() => setDonationChoice("free_charity")}
            className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
              donationChoice === "free_charity"
                ? "border-[#6f5aa0] bg-[#f2eef8] shadow-sm ring-4 ring-[#6f5aa0]/10"
                : "border-slate-200 bg-white hover:border-[#b9a8cf] hover:bg-[#f7f4fa]"
            }`}
          >
            <input
              type="radio"
              name="donation_choice"
              checked={donationChoice === "free_charity"}
              onChange={() => setDonationChoice("free_charity")}
              className="mt-1 h-4 w-4 text-purple-600 accent-purple-600 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <span className="block text-[13px] font-extrabold text-[#2d144d] leading-tight">
                  Quero falar com a equipe primeiro
              </span>
              <span className="block text-[11px] text-[#5b21b6]/90 mt-0.5 leading-normal">
                  Minha intenção será enviada para acolhimento e orientação.
              </span>
            </div>
          </div>
        </div>

        {/* Prévia da Mensagem que vai para a Médium */}
        <div className="mt-4 p-3 rounded-2xl bg-white border border-stone-200 text-left shadow-2xs">
          <div className="flex items-center justify-between text-[10.5px] font-extrabold text-stone-500 uppercase tracking-wider mb-1.5">
            <span>💬 Mensagem Pronta no WhatsApp:</span>
            <span className="text-emerald-700 font-bold">100% Automática</span>
          </div>
          <div className="rounded-xl bg-stone-50 p-2.5 text-[11px] font-mono text-stone-700 leading-relaxed max-h-24 overflow-y-auto border border-stone-100">
            {buildWhatsAppMessage()}
          </div>
        </div>

        {/* Botão de Envio para o WhatsApp */}
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full cursor-pointer rounded-[14px] bg-gradient-to-r from-[#4b8b7e] via-[#39776c] to-[#2d665e] py-3.5 px-4 text-center font-extrabold text-white text-[14px] shadow-lg shadow-[#39776c]/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 flex items-center justify-center gap-2.5"
          >
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.107-.07-.251-.08-.574-.188-.988-.369-1.758-.767-2.903-2.545-2.991-2.663-.088-.118-.718-.956-.718-1.822 0-.866.453-1.293.614-1.469.161-.177.351-.221.468-.221.117 0 .234.001.336.006.107.005.251-.041.393.298.146.351.498 1.214.542 1.303.044.088.073.192.015.308-.059.117-.088.19-.176.293-.088.103-.186.23-.265.31-.088.088-.18.184-.078.36.103.176.458.756.983 1.224.676.602 1.246.789 1.422.877.176.088.279.074.382-.044.103-.117.439-.512.556-.688.117-.176.235-.147.396-.088.161.059 1.026.484 1.202.572.176.088.293.132.337.206.044.074.044.43-.1 1.035z" />
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.523 3.664 1.435 5.186L2.1 22l4.98-1.306A9.958 9.958 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.635 0-3.15-.494-4.414-1.343l-.316-.214-2.95.774.787-2.876-.234-.336A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z" />
            </svg>
            <span>Abrir conversa no WhatsApp</span>
          </button>

          <p className="text-center text-[10.5px] text-[#786445]">
            Ao clicar, seu aplicativo do WhatsApp será aberto diretamente com a mensagem pronta.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

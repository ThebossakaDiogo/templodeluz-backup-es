import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Send,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { PaymentOrder, Lead } from "@/types";
import {
  sendProductDeliveryMessage,
  testEvolutionConnection,
  formatPhoneForEvolution,
} from "@/services/evolution";

interface ProductDeliveryModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly order: PaymentOrder | null;
  readonly leads?: readonly Lead[];
  readonly onOpenQRModal?: () => void;
  readonly onDeliverySuccess?: (orderId: string) => void;
}

const DELIVERED_ORDERS_KEY = "templodeluz:delivered-orders";

export function getDeliveredOrders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DELIVERED_ORDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markOrderAsDelivered(orderId: string): void {
  if (typeof window === "undefined") return;
  const current = getDeliveredOrders();
  current[orderId] = new Date().toISOString();
  localStorage.setItem(DELIVERED_ORDERS_KEY, JSON.stringify(current));
}

export function ProductDeliveryModal({
  isOpen,
  onClose,
  order,
  leads = [],
  onOpenQRModal,
  onDeliverySuccess,
}: ProductDeliveryModalProps) {
  const [phone, setPhone] = useState<string>("");
  const [enteQuerido, setEnteQuerido] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; text: string } | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Inicializa os dados do pedido ao abrir
  useEffect(() => {
    if (!isOpen || !order) return;

    // Busca dados complementares nos leads
    const matchedLead = leads.find(
      (l) =>
        (l.lead_email && l.lead_email.toLowerCase() === order.customer_email.toLowerCase()) ||
        (l.lead_name && l.lead_name.toLowerCase() === order.customer_name.toLowerCase())
    );

    const initialPhone = order.customer_phone || matchedLead?.lead_phone || "";
    const initialEnte = matchedLead?.ente_querido || "";

    setPhone(initialPhone);
    setEnteQuerido(initialEnte);
    setSendResult(null);

    // Mensagem de consagração e entrega espiritual
    const firstName = order.customer_name.trim().split(" ")[0] || "Consulente";
    const enteText = initialEnte ? ` em memória de seu ente amado ${initialEnte}` : "";
    const prodText = order.product_name ? ` (${order.product_name})` : "";

    const text = `Olá, ${firstName}!\n\nAqui é da equipe do Templo de Luz da médium Milena Medeiros.\n\nPassando para confirmar com profunda gratidão e carinho que sua doação${prodText}${enteText} foi consagrada com sucesso em nosso oratório sagrado.\n\nA médium Milena já iniciou as preces e a consagração espiritual da sua carta. Que as bênçãos de luz, paz, consolo e renovação envolvam você e seu lar neste momento sagrado.\n\nQualquer dúvida ou nova intenção de oração, nossa equipe está à inteira disposição para acolher você aqui no WhatsApp.\n\nMuita paz, saúde e bênçãos de luz!`;

    setMessage(text);

    // Verifica status da Evolution API
    testEvolutionConnection().then((res) => {
      setIsConnected(res.success && res.state === "open");
    });
  }, [isOpen, order, leads]);

  // Trava scroll da página e fecha com ESC
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSend = async () => {
    if (!order || !phone.trim() || !message.trim()) return;

    setIsSending(true);
    setSendResult(null);

    const res = await sendProductDeliveryMessage({
      customerName: order.customer_name,
      customerPhone: phone.trim(),
      enteQuerido: enteQuerido.trim() || undefined,
      productName: order.product_name,
    });

    setIsSending(false);

    if (res.success) {
      setSendResult({
        success: true,
        text: "Mensagem de entrega e consagração enviada com sucesso no WhatsApp do consulente!",
      });
      markOrderAsDelivered(order.id);
      onDeliverySuccess?.(order.id);
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setSendResult({
        success: false,
        text: res.error || "Erro no envio via Evolution API. Verifique a conexão com o WhatsApp.",
      });
    }
  };

  // Link direto WhatsApp Web caso precise de fallback
  const getWhatsAppWebFallback = (): string => {
    const raw = phone.replace(/\D/g, "");
    const formatted = formatPhoneForEvolution(raw);
    return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
  };

  if (!isOpen || !order || typeof document === "undefined") return null;

  const modalContent = (
    <div
      className="modal-glass-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(3, 7, 18, 0.76)",
        backdropFilter: "blur(18px) saturate(190%)",
        WebkitBackdropFilter: "blur(18px) saturate(190%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "20px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-glass-card"
        style={{
          width: "100%",
          maxWidth: "min(540px, 100%)",
          margin: "auto",
          background: "linear-gradient(135deg, rgba(20, 24, 35, 0.92) 0%, rgba(10, 13, 20, 0.96) 100%)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px -10px rgba(16, 185, 129, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
          boxSizing: "border-box",
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
                flexShrink: 0,
              }}
            >
              <Sparkles style={{ width: "22px", height: "22px" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Entregar Carta no WhatsApp
              </h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "3px 0 0" }}>
                Consagração do pedido de <strong style={{ color: "var(--text-primary)" }}>{order.customer_name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "var(--surface-1, #1e202e)",
              border: "1px solid var(--border-subtle, #2c2f42)",
              borderRadius: "8px",
              padding: "6px",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* Status da Conexão Evolution API */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: isConnected ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
            border: isConnected ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11.5px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: isConnected ? "#10B981" : "#F59E0B",
                boxShadow: isConnected ? "0 0 6px rgba(16, 185, 129, 0.7)" : "none",
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {isConnected
                ? "Evolution API Conectada (Disparo Direto)"
                : "WhatsApp Não Conectado na Evolution API"}
            </span>
          </div>

          {!isConnected && onOpenQRModal && (
            <button
              type="button"
              onClick={onOpenQRModal}
              style={{
                background: "#F59E0B",
                color: "#000",
                fontSize: "10.5px",
                fontWeight: 800,
                border: "none",
                borderRadius: "6px",
                padding: "4px 9px",
                cursor: "pointer",
              }}
            >
              Escanear QR Code
            </button>
          )}
        </div>

        {/* Informações do Consulente */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
            gap: "10px",
            background: "var(--surface-1, #171926)",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <label style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", display: "block" }}>
              Telefone WhatsApp:
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(DDD) 99999-9999"
              style={{
                width: "100%",
                fontSize: "16px",
                padding: "6px 8px",
                marginTop: "3px",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", display: "block" }}>
              Ente Querido (Homenagem):
            </label>
            <input
              type="text"
              value={enteQuerido}
              onChange={(e) => setEnteQuerido(e.target.value)}
              placeholder="Ex: Mãe Maria, Pai João..."
              style={{
                width: "100%",
                fontSize: "16px",
                padding: "6px 8px",
                marginTop: "3px",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Mensagem a ser enviada */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
            Mensagem de Entrega / Consagração:
          </label>
          <textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: "100%",
              fontSize: "12px",
              lineHeight: "1.5",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-1)",
              color: "var(--text-primary)",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </div>

        {/* Feedback de Envio */}
        {sendResult && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: sendResult.success ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              border: sendResult.success ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
              color: sendResult.success ? "#10B981" : "#EF4444",
              fontSize: "11.5px",
              fontWeight: 600,
            }}
          >
            {sendResult.text}
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginTop: "4px" }}>
          {/* Link Fallback WhatsApp Web */}
          {phone.trim() && (
            <a
              href={getWhatsAppWebFallback()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                fontSize: "11px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <ExternalLink style={{ width: "12px", height: "12px" }} />
              WhatsApp Web
            </a>
          )}

          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{
                fontSize: "12px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !phone.trim() || !message.trim()}
              className="btn"
              style={{
                fontSize: "12px",
                padding: "8px 18px",
                borderRadius: "8px",
                background: "#10B981",
                border: "none",
                color: "#FFFFFF",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Send style={{ width: "13px", height: "13px" }} />
              {isSending ? "Consagrando & Enviando..." : "Disparar Entrega"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

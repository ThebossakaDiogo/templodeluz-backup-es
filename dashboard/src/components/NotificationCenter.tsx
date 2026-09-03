import { useState, useRef, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  DollarSign,
  UserPlus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Section } from "../App";

export interface DashboardNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "lead" | "payment" | "system";
  targetSection?: Section;
}

interface NotificationCenterProps {
  onNavigate?: (section: Section) => void;
  onlineCount?: number;
}

const INITIAL_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: "notif-1",
    title: "Consulente na Etapa 7",
    description: "Lead preencheu os dados do formulário e avançou para a preparação.",
    timestamp: "Há 2 min",
    read: false,
    type: "lead",
    targetSection: "rastreamento",
  },
  {
    id: "notif-2",
    title: "Doação no PIX Confirmada",
    description: "Doação de R$ 49,90 recebida e compensada com sucesso.",
    timestamp: "Há 14 min",
    read: false,
    type: "payment",
    targetSection: "pedidos",
  },
  {
    id: "notif-3",
    title: "Telemetria OD Shield Ativa",
    description: "Gateways PIX e Stripe sincronizados. Sem anomalias de checkout.",
    timestamp: "Há 45 min",
    read: true,
    type: "system",
    targetSection: "visao-geral",
  },
];

export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: DashboardNotification) => {
    // Marca como lida
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.targetSection && onNavigate) {
      onNavigate(notif.targetSection);
      setIsOpen(false);
    }
  };

  return (
    <div className="notification-center-container" ref={dropdownRef} style={{ position: "relative" }}>
      {/* Botão de Disparo do Sininho */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn notif-trigger-btn ${isOpen ? "active" : ""}`}
        title="Central de Notificações de Telemetria"
        aria-label="Notificações"
        style={{
          position: "relative",
          width: "36px",
          height: "36px",
          padding: 0,
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell style={{ width: "15px", height: "15px" }} strokeWidth={1.7} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              minWidth: "16px",
              height: "16px",
              padding: "0 4px",
              borderRadius: "999px",
              background: "var(--accent-strong, #7C5CFF)",
              color: "#FFFFFF",
              fontSize: "9.5px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--topbar-bg, #0D0F15)",
              boxShadow: "0 2px 6px rgba(124, 92, 255, 0.4)",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Suspenso de Notificações */}
      {isOpen && (
        <div
          className="notif-dropdown-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "360px",
            maxWidth: "92vw",
            background: "var(--surface-1, #0D0E17)",
            border: "1px solid var(--border-strong, #2B2E3E)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-dock, 0 16px 40px rgba(0,0,0,0.35))",
            zIndex: 1000,
            overflow: "hidden",
            animation: "dropdownFadeIn 0.18s ease-out",
          }}
        >
          {/* Cabeçalho do Popover */}
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border-subtle, #1E202B)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                Notificações
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "var(--accent-strong, #7C5CFF)",
                    background: "var(--accent-soft-bg, rgba(124, 92, 255, 0.1))",
                    padding: "1px 7px",
                    borderRadius: "999px",
                  }}
                >
                  {unreadCount} novas
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn"
                  title="Marcar todas como lidas"
                  style={{ height: "26px", padding: "0 8px", fontSize: "11px", borderRadius: "6px" }}
                >
                  <CheckCheck style={{ width: "12px", height: "12px" }} />
                  <span>Ler tudo</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="btn"
                  title="Limpar todas as notificações"
                  style={{ height: "26px", width: "26px", padding: 0, borderRadius: "6px" }}
                >
                  <Trash2 style={{ width: "11px", height: "11px" }} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn"
                title="Fechar"
                style={{ height: "26px", width: "26px", padding: 0, borderRadius: "6px" }}
              >
                <X style={{ width: "12px", height: "12px" }} />
              </button>
            </div>
          </div>

          {/* Lista de Notificações */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center" }}>
                <Sparkles style={{ width: "28px", height: "28px", color: "var(--text-muted)", margin: "0 auto 8px", opacity: 0.6 }} />
                <p style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px" }}>
                  Nenhuma notificação pendente
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  A telemetria do quiz está operando sem alertas.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const getIcon = () => {
                  switch (notif.type) {
                    case "lead":
                      return <UserPlus style={{ width: "14px", height: "14px", color: "#8A79FF" }} />;
                    case "payment":
                      return <DollarSign style={{ width: "14px", height: "14px", color: "#2EDB6F" }} />;
                    case "system":
                      return <ShieldCheck style={{ width: "14px", height: "14px", color: "#BDB4EF" }} />;
                  }
                };

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      gap: "12px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-subtle, #1E202B)",
                      background: notif.read ? "transparent" : "var(--surface-hover, rgba(255,255,255,0.03))",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-hover, rgba(255,255,255,0.06))";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read
                        ? "transparent"
                        : "var(--surface-hover, rgba(255,255,255,0.03))";
                    }}
                  >
                    {/* Ícone */}
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        background: "var(--surface-3, #161722)",
                        border: "1px solid var(--border-subtle, #282A36)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {getIcon()}
                    </div>

                    {/* Conteúdo */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: notif.read ? 500 : 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {notif.title}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {notif.timestamp}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          margin: 0,
                          lineHeight: 1.35,
                        }}
                      >
                        {notif.description}
                      </p>
                    </div>

                    {/* Ponto indicador de não lida */}
                    {!notif.read && (
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "var(--accent-strong, #7C5CFF)",
                          marginTop: "6px",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé do Popover */}
          <div
            style={{
              padding: "10px 16px",
              background: "var(--surface-3, #161722)",
              borderTop: "1px solid var(--border-subtle, #1E202B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            <span>OD Shield Telemetria Ativa</span>
            {onNavigate && (
              <button
                onClick={() => {
                  onNavigate("rastreamento");
                  setIsOpen(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-primary, #BDB4EF)",
                  fontWeight: 500,
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: 0,
                }}
              >
                Ver ao vivo <ExternalLink style={{ width: "10px", height: "10px" }} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

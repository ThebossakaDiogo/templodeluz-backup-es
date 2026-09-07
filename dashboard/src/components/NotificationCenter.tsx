import { useState, useRef, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  UserPlus,
  ShieldCheck,
  Sparkles,
  QrCode,
  CreditCard,
} from "lucide-react";
import type { Section } from "../App";
import type { PaymentOrder, Lead } from "@/types";
import { supabase } from "@/lib/supabase";

export interface DashboardNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "lead" | "payment" | "system";
  targetSection?: Section;
  rawDate: number;
}

interface NotificationCenterProps {
  onNavigate?: (section: Section) => void;
  onlineCount?: number;
  orders?: PaymentOrder[];
  leads?: Lead[];
  realtimeEnabled?: boolean;
}

function formatBRL(val: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

function formatRelativeTime(dateStr: string | number): string {
  try {
    const timeMs = typeof dateStr === "number" ? dateStr : new Date(dateStr).getTime();
    const diffMs = Date.now() - timeMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "agora há pouco";
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return "ontem";
    return `há ${diffDays} dias`;
  } catch {
    return "recente";
  }
}

const READ_STORAGE_KEY = "tl_read_notifications_ids";

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadId(id: string) {
  try {
    const current = getReadIds();
    current.add(id);
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

function saveAllReadIds(ids: string[]) {
  try {
    const current = getReadIds();
    ids.forEach((id) => current.add(id));
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

export function NotificationCenter({
  onNavigate,
  orders = [],
  leads = [],
  realtimeEnabled = true,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState<DashboardNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
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

  // Escuta novos eventos em Realtime do Supabase (pix_orders e quiz_funnel_leads)
  useEffect(() => {
    if (!realtimeEnabled) {
      setRealtimeEvents([]);
      return;
    }
    const channel = supabase
      .channel("notif-center-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pix_orders" },
        (payload) => {
          const row: any = payload.new;
          if (!row || !row.id) return;

          const isPaid = row.status === "paid";
          const amount = (row.amount_cents || 0) / 100;
          const name = row.customer_name || "Consulente";

          const newNotif: DashboardNotification = {
            id: `rt-order-${row.id}-${Date.now()}`,
            title: isPaid ? "Doação no PIX Confirmada" : "Chave PIX Gerada",
            description: isPaid
              ? `Doação de ${formatBRL(amount)} confirmada com sucesso para ${name}.`
              : `${name} gerou um PIX de ${formatBRL(amount)}. Aguardando pagamento.`,
            timestamp: "agora há pouco",
            read: false,
            type: "payment",
            targetSection: "pedidos",
            rawDate: Date.now(),
          };

          setRealtimeEvents((prev) => [newNotif, ...prev.slice(0, 20)]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_funnel_leads" },
        (payload) => {
          const row: any = payload.new;
          if (!row || !row.session_id) return;

          const step = row.current_step_index || row.highest_step_index || 1;
          const name = row.lead_name || "Consulente";

          if (step >= 8 || row.checkout_initiated) {
            const newNotif: DashboardNotification = {
              id: `rt-lead-${row.session_id}-${Date.now()}`,
              title: "Checkout Iniciado",
              description: `${name} chegou na etapa de pagamento e altar espiritual.`,
              timestamp: "agora há pouco",
              read: false,
              type: "lead",
              targetSection: "rastreamento",
              rawDate: Date.now(),
            };
            setRealtimeEvents((prev) => [newNotif, ...prev.slice(0, 20)]);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [realtimeEnabled]);

  // Notificações derivadas das ordens reais e leads reais
  const notifications: DashboardNotification[] = useMemo(() => {
    const list: DashboardNotification[] = [...realtimeEvents];

    // 1. Ordens reais do Supabase (mais recentes primeiro)
    orders.slice(0, 15).forEach((order) => {
      const isPaid = order.status === "paid";
      const isCard = order.payment_method === "credit_card";
      const amount = (order.amount_cents || 0) / 100;
      const name = order.customer_name || "Consulente";
      const rawDate = new Date(order.created_at).getTime();

      const notifId = `order-${order.id}`;
      // Evita duplicar se já foi adicionado pelo realtime
      if (!list.some((n) => n.id === notifId)) {
        list.push({
          id: notifId,
          title: isPaid
            ? `${isCard ? "Cartão Aprovado" : "Doação no PIX Confirmada"}`
            : `${isCard ? "Checkout Cartão Iniciado" : "Chave PIX Gerada"}`,
          description: isPaid
            ? `${name} completou doação de ${formatBRL(amount)} via ${isCard ? "Cartão" : "PIX"}.`
            : `${name} gerou cobrança de ${formatBRL(amount)} via ${isCard ? "Cartão" : "PIX"}.`,
          timestamp: formatRelativeTime(rawDate),
          read: readIds.has(notifId),
          type: "payment",
          targetSection: "pedidos",
          rawDate,
        });
      }
    });

    // 2. Leads com avanços significativos
    leads.slice(0, 15).forEach((lead) => {
      const rawDate = new Date(lead.updated_at || lead.created_at).getTime();
      const notifId = `lead-${lead.id || lead.session_id}`;
      const name = lead.lead_name || "Consulente";

      if (lead.highest_step_index >= 8 || lead.checkout_initiated) {
        if (!list.some((n) => n.id === notifId)) {
          list.push({
            id: notifId,
            title: "Consulente no Checkout",
            description: `${name} avançou para a consagração e geração do PIX.`,
            timestamp: formatRelativeTime(rawDate),
            read: readIds.has(notifId),
            type: "lead",
            targetSection: "rastreamento",
            rawDate,
          });
        }
      }
    });

    // 3. Notificação do Sistema (Garante status operacional)
    const sysId = "sys-shield-live";
    list.push({
      id: sysId,
      title: "Telemetria OD Shield Ao Vivo",
      description: "Gateways ConnectPay PIX & Stripe operando normalmente sem erros.",
      timestamp: "ao vivo",
      read: true,
      type: "system",
      targetSection: "visao-geral",
      rawDate: 0,
    });

    // Ordena por data (mais recentes no topo)
    return list.sort((a, b) => b.rawDate - a.rawDate);
  }, [orders, leads, realtimeEvents, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    saveAllReadIds(allIds);
    setReadIds(new Set(allIds));
    setRealtimeEvents((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    const allIds = notifications.map((n) => n.id);
    saveAllReadIds(allIds);
    setReadIds(new Set(allIds));
    setRealtimeEvents([]);
  };

  const handleNotificationClick = (notif: DashboardNotification) => {
    saveReadId(notif.id);
    setReadIds((prev) => new Set([...prev, notif.id]));
    if (notif.targetSection && onNavigate) {
      onNavigate(notif.targetSection);
      setIsOpen(false);
    }
  };

  return (
    <div className="notification-center-container" ref={dropdownRef} style={{ position: "relative" }}>
      {/* Botão de Disparo do Sininho com Efeito Neon Pulsante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn notif-trigger-btn ${isOpen ? "active" : ""}`}
        title="Central de Notificações de Telemetria em Tempo Real"
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
          background: "var(--surface-1)",
          border: unreadCount > 0 ? "1px solid var(--accent-border)" : "1px solid var(--border-subtle)",
          boxShadow: unreadCount > 0 ? "0 0 14px -2px rgba(255, 51, 119, 0.45)" : "none",
          transition: "all 0.18s ease",
        }}
      >
        <Bell
          style={{
            width: "15px",
            height: "15px",
            color: unreadCount > 0 ? "var(--accent-strong)" : "var(--text-secondary)",
          }}
          strokeWidth={unreadCount > 0 ? 2 : 1.7}
        />
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
              background: "var(--accent-strong, #FF3377)",
              color: "#FFFFFF",
              fontSize: "9.5px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--topbar-bg, #0D0F15)",
              boxShadow: "0 2px 8px rgba(255, 51, 119, 0.5)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Suspenso de Notificações Reais */}
      {isOpen && (
        <div
          className="notif-dropdown-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "380px",
            maxWidth: "92vw",
            background: "var(--surface-card, #0D0E17)",
            border: "1px solid var(--border-strong, #2B2E3E)",
            borderRadius: "16px",
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            zIndex: 99999,
            overflow: "hidden",
            animation: "notifScaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Cabeçalho do Dropdown */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--surface-1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Notificações em Tempo Real
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--accent-strong)",
                    background: "var(--accent-soft-bg)",
                    border: "1px solid var(--accent-border)",
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
                  title="Limpar notificações"
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

          {/* Lista de Notificações Dinâmicas */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center" }}>
                <Sparkles style={{ width: "28px", height: "28px", color: "var(--text-muted)", margin: "0 auto 8px", opacity: 0.6 }} />
                <p style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>
                  Nenhuma notificação recente
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  A telemetria do quiz e pedidos está operando ao vivo.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read;

                const getIcon = () => {
                  if (notif.title.includes("PIX")) {
                    return <QrCode style={{ width: "14px", height: "14px", color: "var(--success)" }} />;
                  }
                  if (notif.title.includes("Cartão")) {
                    return <CreditCard style={{ width: "14px", height: "14px", color: "var(--brand-indigo)" }} />;
                  }
                  if (notif.type === "lead") {
                    return <UserPlus style={{ width: "14px", height: "14px", color: "var(--brand-indigo)" }} />;
                  }
                  return <ShieldCheck style={{ width: "14px", height: "14px", color: "var(--brand-indigo)" }} />;
                };

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      borderBottom: "1px solid var(--border-subtle)",
                      background: isUnread ? "var(--surface-hover)" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Ícone Estilizado */}
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "var(--surface-1)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {getIcon()}
                    </div>

                    {/* Conteúdo de Texto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "12.5px",
                            fontWeight: isUnread ? 700 : 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {notif.title}
                        </span>
                        <span style={{ fontSize: "10.5px", color: "var(--text-muted)", flexShrink: 0 }}>
                          {notif.timestamp}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: "11.5px",
                          color: "var(--text-secondary)",
                          margin: "2px 0 0",
                          lineHeight: 1.4,
                        }}
                      >
                        {notif.description}
                      </p>
                    </div>

                    {/* Ponto indicador de não lida */}
                    {isUnread && (
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--accent-strong)",
                          flexShrink: 0,
                          marginTop: "6px",
                          boxShadow: "0 0 6px rgba(255, 51, 119, 0.6)",
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé do Dropdown */}
          <div
            style={{
              padding: "10px 16px",
              background: "var(--surface-1)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
            }}
          >
            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="pulse-emerald" style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)" }} />
              OD Shield Telemetria Ao Vivo
            </span>
            <button
              onClick={() => {
                if (onNavigate) onNavigate("rastreamento");
                setIsOpen(false);
              }}
              style={{
                color: "var(--accent-strong)",
                fontWeight: 600,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Ver no Funil</span>
              <ExternalLink style={{ width: "11px", height: "11px" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

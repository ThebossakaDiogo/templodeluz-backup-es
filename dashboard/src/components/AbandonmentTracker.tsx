import { useState, useMemo, useEffect } from "react";
import {
  Clock,
  QrCode,
  CreditCard,
  MessageCircle,
  Search,
  TrendingDown,
  UserX,
  Copy,
  Check,
  Send,
  Settings,
  Radio,
  CheckCircle,
  RefreshCw,
  X,
  AlertTriangle,
  ExternalLink,
  Zap,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Phone,
  Heart,
  CheckCircle2,
} from "lucide-react";
import type { Lead } from "@/types";
import {
  diagnoseLeadAbandonment,
  QUIZ_STEPS_MAP,
} from "@/utils/lead-abandonment";
import {
  getEvolutionConfig,
  saveEvolutionConfig,
  testEvolutionConnection,
  sendEvolutionTextMessage,
  getMessagedLeadsMap,
  formatPhoneForEvolution,
  type EvolutionConfig,
} from "@/services/evolution";
import { EvolutionQRModal } from "./EvolutionQRModal";

interface AbandonmentTrackerProps {
  readonly leads: readonly Lead[];
  readonly loading?: boolean;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "recentemente";
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.max(1, Math.round(diff))}s atrás`;
  if (diff < 3600) return `${Math.round(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h atrás`;
  return `${Math.round(diff / 86400)}d atrás`;
}

export function AbandonmentTracker({ leads }: AbandonmentTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Estados de Integração com a Evolution API
  const [evoConfig, setEvoConfig] = useState<EvolutionConfig>(getEvolutionConfig);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "checking" | "connected" | "disconnected">("idle");
  const [connectionMsg, setConnectionMsg] = useState<string>("");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<EvolutionConfig>(evoConfig);

  // Estados de Envio de Mensagem Individual
  const [activeLeadToSend, setActiveLeadToSend] = useState<Lead | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [messagedMap, setMessagedMap] = useState<Record<string, string>>(getMessagedLeadsMap);

  // Testa a conexão com a Evolution API ao carregar
  useEffect(() => {
    let isMounted = true;
    setConnectionStatus("checking");
    testEvolutionConnection().then((res) => {
      if (!isMounted) return;
      if (res.success) {
        setConnectionStatus("connected");
        setConnectionMsg(res.message);
      } else {
        setConnectionStatus("disconnected");
        setConnectionMsg(res.message);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [evoConfig]);

  const handleManualTest = async () => {
    setConnectionStatus("checking");
    const res = await testEvolutionConnection();
    if (res.success) {
      setConnectionStatus("connected");
      setConnectionMsg(res.message);
    } else {
      setConnectionStatus("disconnected");
      setConnectionMsg(res.message);
    }
  };

  const handleSaveConfig = () => {
    saveEvolutionConfig(tempConfig);
    setEvoConfig(tempConfig);
    setIsConfigModalOpen(false);
  };

  // Diagnóstico de todos os leads
  const diagnosedLeads = useMemo(() => {
    return leads.map((lead) => ({
      lead,
      diagnostic: diagnoseLeadAbandonment(lead),
    }));
  }, [leads]);

  // Apenas quem abandonou (excluindo quem pagou)
  const abandonedLeads = useMemo(() => {
    return diagnosedLeads.filter(({ diagnostic }) => diagnostic.category !== "paid");
  }, [diagnosedLeads]);

  // Métricas agregadas de abandono
  const metrics = useMemo(() => {
    const totalAbandoned = abandonedLeads.length;
    const pixUnpaid = abandonedLeads.filter(({ diagnostic }) => diagnostic.category === "pix_unpaid_1h");
    const checkoutAbandoned = abandonedLeads.filter(({ diagnostic }) => diagnostic.category === "checkout_abandoned");
    const quizAbandoned = abandonedLeads.filter(({ diagnostic }) => diagnostic.category === "quiz_abandoned");
    const cardDeclined = abandonedLeads.filter(({ diagnostic }) => diagnostic.category === "card_declined");
    const bounces = abandonedLeads.filter(({ diagnostic }) => diagnostic.category === "immediate_bounce");
    const recoverable = abandonedLeads.filter(({ lead }) => Boolean(lead.lead_phone && lead.lead_phone.replace(/\D/g, "").length >= 8));

    // Valor total em R$ represado em PIX gerados e não pagos
    const pixRepressedCents = pixUnpaid.reduce((acc, { lead }) => acc + (lead.last_amount_cents || 1900), 0);

    return {
      totalAbandoned,
      pixUnpaidCount: pixUnpaid.length,
      pixRepressedReais: (pixRepressedCents / 100).toFixed(2),
      checkoutAbandonedCount: checkoutAbandoned.length,
      quizAbandonedCount: quizAbandoned.length,
      cardDeclinedCount: cardDeclined.length,
      bounceCount: bounces.length,
      recoverableCount: recoverable.length,
      lossRate: leads.length > 0 ? Math.round((totalAbandoned / leads.length) * 100) : 0,
    };
  }, [abandonedLeads, leads.length]);

  // Gargalo por etapa do quiz
  const dropByStep = useMemo(() => {
    const stepsCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
    for (const { diagnostic } of abandonedLeads) {
      if (diagnostic.stepIndex >= 1 && diagnostic.stepIndex <= 8) {
        stepsCount[diagnostic.stepIndex] = (stepsCount[diagnostic.stepIndex] || 0) + 1;
      }
    }
    const maxDrop = Math.max(...Object.values(stepsCount), 1);

    return Object.entries(stepsCount).map(([stepStr, count]) => {
      const stepNum = Number(stepStr);
      const info = QUIZ_STEPS_MAP[stepNum] || { name: `step_${stepNum}`, label: `Etapa ${stepNum}` };
      const pctOfTotal = metrics.totalAbandoned > 0 ? Math.round((count / metrics.totalAbandoned) * 100) : 0;
      const relWidth = Math.round((count / maxDrop) * 100);

      return {
        stepIndex: stepNum,
        stepName: info.name,
        stepLabel: info.label,
        count,
        pctOfTotal,
        relWidth,
      };
    });
  }, [abandonedLeads, metrics.totalAbandoned]);

  // Lista filtrada
  const filteredList = useMemo(() => {
    return abandonedLeads.filter(({ lead, diagnostic }) => {
      // Filtro por abas
      if (selectedFilter === "pix" && diagnostic.category !== "pix_unpaid_1h") return false;
      if (selectedFilter === "checkout" && diagnostic.category !== "checkout_abandoned") return false;
      if (selectedFilter === "quiz" && diagnostic.category !== "quiz_abandoned") return false;
      if (selectedFilter === "bounce" && diagnostic.category !== "immediate_bounce") return false;
      if (selectedFilter === "recoverable" && !(lead.lead_phone && lead.lead_phone.replace(/\D/g, "").length >= 8)) return false;

      // Filtro de busca
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = lead.lead_name?.toLowerCase().includes(q);
        const matchEnte = lead.ente_querido?.toLowerCase().includes(q);
        const matchPhone = lead.lead_phone?.includes(q);
        const matchEmail = lead.lead_email?.toLowerCase().includes(q);
        if (!matchName && !matchEnte && !matchPhone && !matchEmail) return false;
      }

      return true;
    });
  }, [abandonedLeads, selectedFilter, searchTerm]);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchTerm, pageSize]);

  // Cálculo da Paginação e Colunas
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredList.length);
  const paginatedList = useMemo(() => {
    return filteredList.slice(startIndex, endIndex);
  }, [filteredList, startIndex, endIndex]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWhatsAppLink = (lead: Lead): string | null => {
    const raw = lead.lead_phone ? lead.lead_phone.replace(/\D/g, "") : "";
    if (raw.length < 8) return null;
    const phoneWithDDI = raw.startsWith("55") ? raw : `55${raw}`;
    const name = lead.lead_name ? lead.lead_name.trim().split(" ")[0] : "Consulente";
    const ente = lead.ente_querido ? ` para seu ente querido(a) ${lead.ente_querido}` : "";
    const msg = `Olá, ${name}! Aqui é da equipe do Templo de Luz da médium Milena Medeiros. Vimos que você iniciou o pedido da carta psicografada${ente}, mas houve uma interrupção. Podemos te ajudar a consagrar seu pedido no oratório?`;
    return `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(msg)}`;
  };

  // Abre o modal de envio via Evolution API
  const handleOpenSendModal = (lead: Lead) => {
    setActiveLeadToSend(lead);
    setSendResult(null);

    const name = lead.lead_name ? lead.lead_name.trim().split(" ")[0] : "Consulente";
    const ente = lead.ente_querido ? lead.ente_querido.trim() : "seu ente amado";
    const diagnostic = diagnoseLeadAbandonment(lead);

    let defaultMsg = "";
    if (diagnostic.category === "pix_unpaid_1h") {
      defaultMsg = `Olá, ${name}! Que a paz esteja com você.\n\nAqui é da equipe do Templo de Luz da médium Milena Medeiros. Vimos que a bênção da carta sagrada para seu ente querido ${ente} foi iniciada e sua chave PIX foi emitida.\n\nComo o oratório sagrado recolhe as preces de hoje, estamos à disposição caso precise de auxílio para concluir a consagração. Que a luz conforte seu coração!`;
    } else {
      defaultMsg = `Olá, ${name}! Que a paz e a luz divina confortem seu coração.\n\nAqui é da equipe do Templo de Luz da médium Milena Medeiros. Notamos que você iniciou o memorial e a homenagem para seu amado(a) ${ente}, mas a mensagem não foi concluída.\n\nEstamos à sua inteira disposição para acolher seu pedido e sanar qualquer dúvida com todo respeito e carinho espiritual.`;
    }

    setMessageText(defaultMsg);
  };

  // Dispara a mensagem via Evolution API
  const handleSendViaEvolution = async () => {
    if (!activeLeadToSend?.lead_phone || !messageText.trim()) return;
    setIsSending(true);
    setSendResult(null);

    const res = await sendEvolutionTextMessage(activeLeadToSend.lead_phone, messageText.trim());
    setIsSending(false);

    if (res.success) {
      setSendResult({
        success: true,
        msg: "Mensagem enviada com sucesso para o WhatsApp do consulente!",
      });
      setMessagedMap(getMessagedLeadsMap());
      setTimeout(() => {
        setActiveLeadToSend(null);
      }, 1600);
    } else {
      setSendResult({
        success: false,
        msg: res.error || "Não foi possível enviar a mensagem. Verifique a conexão com a Evolution API.",
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ─── BANNER SUPERIOR: EVOLUTION API INTEGRAÇÃO DIRETA NO DASHBOARD ─── */}
      <div
        className="card"
        style={{
          padding: "18px 22px",
          background: "var(--surface-card)",
          border: connectionStatus === "connected" ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid var(--border-subtle)",
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: connectionStatus === "connected" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              border: connectionStatus === "connected" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: connectionStatus === "connected" ? "#10B981" : "#F59E0B",
              flexShrink: 0,
            }}
          >
            <Radio style={{ width: "22px", height: "22px" }} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>
                Evolution API — WhatsApp de Recuperação
              </span>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: connectionStatus === "connected" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                  color: connectionStatus === "connected" ? "#10B981" : "#F59E0B",
                  border: connectionStatus === "connected" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                Instância: {evoConfig.instanceName}
              </span>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  color: connectionStatus === "connected" ? "#10B981" : connectionStatus === "checking" ? "#F59E0B" : "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: connectionStatus === "connected" ? "#10B981" : connectionStatus === "checking" ? "#F59E0B" : "#EF4444",
                    boxShadow: connectionStatus === "connected" ? "0 0 6px rgba(16, 185, 129, 0.7)" : "none",
                  }}
                />
                {connectionStatus === "connected" ? "Conectada" : connectionStatus === "checking" ? "Verificando..." : "Desconectada"}
              </span>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-muted)", margin: "3px 0 0" }}>
              {connectionMsg || "Disparo direto de mensagens WhatsApp sem precisar abrir abas manuais."}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setIsQRModalOpen(true)}
            className="btn"
            style={{
              fontSize: "11px",
              padding: "6px 14px",
              borderRadius: "8px",
              background: connectionStatus === "connected" ? "rgba(16, 185, 129, 0.15)" : "#25D366",
              border: connectionStatus === "connected" ? "1px solid rgba(16, 185, 129, 0.4)" : "none",
              color: connectionStatus === "connected" ? "#10B981" : "#FFFFFF",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="Escanear QR Code no celular para conectar WhatsApp"
          >
            <QrCode style={{ width: "13px", height: "13px" }} />
            {connectionStatus === "connected" ? "WhatsApp Conectado (QR)" : "Conectar WhatsApp (QR Code)"}
          </button>

          <button
            type="button"
            onClick={handleManualTest}
            disabled={connectionStatus === "checking"}
            className="btn"
            style={{
              fontSize: "11px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw style={{ width: "12px", height: "12px", animation: connectionStatus === "checking" ? "spin 1s linear infinite" : "none" }} />
            Testar Conexão
          </button>

          <button
            type="button"
            onClick={() => {
              setTempConfig(evoConfig);
              setIsConfigModalOpen(true);
            }}
            className="btn"
            style={{
              fontSize: "11px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Settings style={{ width: "12px", height: "12px" }} />
            Configurar API
          </button>
        </div>
      </div>

      {/* ─── 1. KPIs DE ABANDONO NO TOPO ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Total de Abandonos */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "14px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Total de Abandonos
              </span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                {metrics.totalAbandoned}
              </div>
              <span style={{ fontSize: "11.5px", color: "var(--accent-red)", fontWeight: 600 }}>
                {metrics.lossRate}% do tráfego não converteu
              </span>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EF4444",
              }}
            >
              <TrendingDown style={{ width: "18px", height: "18px" }} />
            </div>
          </div>
        </div>

        {/* Card 2: PIX Gerado e Não Pago (+1h) - MAIOR GARGALO DE RECUPERAÇÃO */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "var(--surface-card)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "14px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#F59E0B", textTransform: "uppercase" }}>
                PIX Abandonado (+1h)
              </span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                {metrics.pixUnpaidCount}
              </div>
              <span style={{ fontSize: "11.5px", color: "#F59E0B", fontWeight: 700 }}>
                R$ {metrics.pixRepressedReais} represados
              </span>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F59E0B",
              }}
            >
              <QrCode style={{ width: "18px", height: "18px" }} />
            </div>
          </div>
        </div>

        {/* Card 3: Desistiu no Checkout */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Desistência no Checkout
              </span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                {metrics.checkoutAbandonedCount}
              </div>
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Viram o checkout e não pagaram
              </span>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(139, 92, 246, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8B5CF6",
              }}
            >
              <CreditCard style={{ width: "18px", height: "18px" }} />
            </div>
          </div>
        </div>

        {/* Card 4: Desistiu no Quiz */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Desistência no Quiz
              </span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                {metrics.quizAbandonedCount}
              </div>
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Pararam entre Etapas 2 e 7
              </span>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(56, 189, 248, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38BDF8",
              }}
            >
              <UserX style={{ width: "18px", height: "18px" }} />
            </div>
          </div>
        </div>

        {/* Card 5: Leads Recuperáveis com WhatsApp */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "var(--surface-card)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#10B981", textTransform: "uppercase" }}>
                Com WhatsApp (Recuperáveis)
              </span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                {metrics.recoverableCount}
              </div>
              <span style={{ fontSize: "11.5px", color: "#10B981", fontWeight: 600 }}>
                Prontos para disparo de recuperação
              </span>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
              }}
            >
              <MessageCircle style={{ width: "18px", height: "18px" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. GARGALO DO FUNIL (ONDE ELES ESTÃO ABANDONANDO) ─── */}
      <div
        className="card"
        style={{
          padding: "22px 24px",
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
        }}
      >
        <div style={{ marginBottom: "18px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Gargalo de Abandono por Etapa do Quiz
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            Distribuição exata de onde os consulentes saíram sem concluir a doação
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {dropByStep.map((step) => {
            return (
              <div
                key={step.stepIndex}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  fontSize: "12px",
                }}
              >
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px", color: "var(--text-primary)", flexShrink: 0 }}>
                  {step.stepIndex}
                </div>

                <div style={{ width: "190px", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{step.stepLabel}</span>
                </div>

                <div style={{ flex: 1, height: "10px", background: "var(--surface-3)", borderRadius: "99px", overflow: "hidden", position: "relative" }}>
                  <div
                    style={{
                      width: `${step.relWidth}%`,
                      height: "100%",
                      borderRadius: "99px",
                      background: step.stepIndex === 8 ? "#F59E0B" : step.stepIndex === 1 ? "#EF4444" : "var(--accent-strong)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                <div style={{ width: "120px", textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{step.count} saíram</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "6px" }}>({step.pctOfTotal}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 3. TABELA DE LEADS ABANDONADOS COM DISPARO EVOLUTION API ─── */}
      <div
        className="card"
        style={{
          padding: "20px 22px",
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Consulentes Abandonados — Ação de Recuperação Imediata
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
              Identificação nominal, diagnóstico temporal e envio direto via Evolution API ou WhatsApp Web
            </p>
          </div>

          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Exibindo <strong style={{ color: "var(--text-primary)" }}>{filteredList.length}</strong> consulentes
          </span>
        </div>

        {/* Filtros e Busca */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {/* Campo de Busca */}
          <div style={{ position: "relative", minWidth: "220px", flex: 1, maxWidth: "340px" }}>
            <Search
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "13px",
                height: "13px",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nome, WhatsApp, ente querido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                fontSize: "12px",
                padding: "6px 10px 6px 30px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-1)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>

          {/* Filtros em Pílulas */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {[
              { key: "all", label: "Todos", count: abandonedLeads.length },
              { key: "pix", label: "PIX Não Pago (+1h)", count: metrics.pixUnpaidCount },
              { key: "checkout", label: "Checkout", count: metrics.checkoutAbandonedCount },
              { key: "quiz", label: "No Quiz", count: metrics.quizAbandonedCount },
              { key: "bounce", label: "Bounces", count: metrics.bounceCount },
              { key: "recoverable", label: "Com WhatsApp", count: metrics.recoverableCount },
            ].map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedFilter(tab.key)}
                  style={{
                    fontSize: "11.5px",
                    fontWeight: active ? 700 : 500,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: active ? "1px solid var(--accent-strong)" : "1px solid var(--border-subtle)",
                    background: active ? "var(--accent-soft-bg)" : "var(--surface-1)",
                    color: active ? "var(--accent-strong)" : "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "1px 5px",
                      borderRadius: "999px",
                      background: active ? "var(--accent-strong)" : "var(--surface-3)",
                      color: active ? "#FFFFFF" : "var(--text-secondary)",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Alternador Tabela vs Cards & Seletor de Limite */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Visualização em Tabela"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: viewMode === "table" ? 700 : 500,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "table" ? "var(--accent-strong)" : "transparent",
                  color: viewMode === "table" ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                <List style={{ width: "12px", height: "12px" }} />
                <span>Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                title="Visualização em Cards / Colunas"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: viewMode === "cards" ? 700 : 500,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "cards" ? "var(--accent-strong)" : "transparent",
                  color: viewMode === "cards" ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                <LayoutGrid style={{ width: "12px", height: "12px" }} />
                <span>Cards</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
              <span style={{ fontWeight: 600 }}>Limite:</span>
              {[5, 10, 20, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPageSize(size)}
                  style={{
                    fontSize: "10.5px",
                    fontWeight: pageSize === size ? 800 : 500,
                    padding: "3px 7px",
                    borderRadius: "5px",
                    border: pageSize === size ? "1px solid var(--accent-strong)" : "1px solid var(--border-subtle)",
                    background: pageSize === size ? "var(--accent-soft-bg)" : "var(--surface-card)",
                    color: pageSize === size ? "var(--accent-strong)" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── BARRA DE COLUNAS NO TOPO (EVITA SCROLL INFINITO NO MOBILE) ─── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            padding: "9px 12px",
            background: "var(--surface-1)",
            borderRadius: "10px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-muted)" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "6px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                fontWeight: 700,
                color: "var(--accent-strong)",
              }}
            >
              Coluna {currentPage} de {totalPages}
            </span>
            <span>
              Exibindo <strong style={{ color: "var(--text-primary)" }}>{filteredList.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> de{" "}
              <strong style={{ color: "var(--text-primary)" }}>{filteredList.length}</strong> abandonos
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              maxWidth: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "2px 0",
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "5px 9px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "7px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                opacity: currentPage === 1 ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              <ChevronLeft style={{ width: "13px", height: "13px" }} />
              <span>Ant.</span>
            </button>

            {pageNumbers.map((p) => {
              const active = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  style={{
                    padding: "5px 10px",
                    fontSize: "11px",
                    fontWeight: active ? 800 : 500,
                    borderRadius: "7px",
                    border: active ? "1px solid var(--accent-strong)" : "1px solid var(--border-subtle)",
                    background: active ? "var(--accent-strong)" : "var(--surface-card)",
                    color: active ? "#FFFFFF" : "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Coluna {p}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "5px 9px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "7px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                opacity: currentPage === totalPages ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              <span>Próx.</span>
              <ChevronRight style={{ width: "13px", height: "13px" }} />
            </button>
          </div>
        </div>

        {/* ─── CORPO: TABELA OU CARDS ─── */}
        {viewMode === "table" ? (
          <div style={{ overflowX: "auto", margin: "0 -4px", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    CONSULENTE & ENTE QUERIDO
                  </th>
                  <th style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    ONDE PAROU
                  </th>
                  <th style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    DIAGNÓSTICO EXATO DO ABANDONO
                  </th>
                  <th style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    TEMPO NO QUIZ
                  </th>
                  <th style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    HORÁRIO
                  </th>
                  <th style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>
                    AÇÃO DE RECUPERAÇÃO
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      Nenhum abandono encontrado para este filtro.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map(({ lead, diagnostic }) => {
                    const whatsAppLink = getWhatsAppLink(lead);
                    const cleanPhone = lead.lead_phone ? lead.lead_phone.replace(/\D/g, "") : "";
                    const messagedTimestamp = cleanPhone ? messagedMap[cleanPhone] : undefined;

                    return (
                      <tr
                        key={lead.id || lead.session_id}
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          transition: "background 0.12s ease",
                        }}
                      >
                        {/* Consulente & Ente */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                              {lead.lead_name || "Consulente Sem Nome"}
                            </span>
                            {lead.ente_querido ? (
                              <span style={{ fontSize: "11px", color: "var(--accent-primary)" }}>
                                Ente: {lead.ente_querido} {lead.grau_parentesco ? `(${lead.grau_parentesco})` : ""}
                              </span>
                            ) : (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                Não informou ente querido
                              </span>
                            )}
                            {lead.lead_phone && (
                              <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Phone style={{ width: "10px", height: "10px" }} />
                                <span>{lead.lead_phone}</span>
                              </span>
                            )}
                            {messagedTimestamp && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color: "#10B981",
                                  background: "rgba(16, 185, 129, 0.12)",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  width: "fit-content",
                                  marginTop: "2px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <CheckCircle2 style={{ width: "10px", height: "10px" }} />
                                Disparado {timeAgo(messagedTimestamp)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Onde Parou */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--text-primary)" }}>
                              Etapa {diagnostic.stepIndex}/8 · {diagnostic.stepLabel}
                            </span>
                            <div style={{ width: "70px", height: "3px", borderRadius: "99px", background: "var(--surface-3)", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${(diagnostic.stepIndex / 8) * 100}%`,
                                  height: "100%",
                                  background: diagnostic.badgeColor,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Diagnóstico Exato */}
                        <td style={{ padding: "12px", maxWidth: "300px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                width: "fit-content",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                background: diagnostic.badgeBg,
                                border: `1px solid ${diagnostic.badgeBorder}`,
                                color: diagnostic.badgeColor,
                                fontSize: "10.5px",
                                fontWeight: 600,
                              }}
                            >
                              {diagnostic.badgeLabel}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                              {diagnostic.detailedDescription}
                            </span>
                          </div>
                        </td>

                        {/* Tempo no Quiz */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "var(--text-secondary)" }}>
                            <Clock style={{ width: "12px", height: "12px", color: "var(--text-muted)" }} />
                            <span>{formatDuration(lead.time_spent_seconds || 0)}</span>
                          </div>
                        </td>

                        {/* Horário */}
                        <td style={{ padding: "12px", fontSize: "11.5px", color: "var(--text-muted)" }}>
                          {timeAgo(lead.created_at)}
                        </td>

                        {/* Ação de Recuperação */}
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                            {lead.lead_phone && cleanPhone.length >= 8 ? (
                              <>
                                {/* Botão Principal: Disparo Evolution API */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenSendModal(lead)}
                                  title="Disparar mensagem no WhatsApp via Evolution API"
                                  style={{
                                    height: "28px",
                                    padding: "0 10px",
                                    fontSize: "11px",
                                    gap: "5px",
                                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                    border: "none",
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                                  }}
                                >
                                  <Zap style={{ width: "12px", height: "12px" }} />
                                  Disparar WhatsApp
                                </button>

                                {/* Botão Secundário: Abrir no WhatsApp Web */}
                                {whatsAppLink && (
                                  <a
                                    href={whatsAppLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Abrir no WhatsApp Web manual"
                                    className="btn"
                                    style={{
                                      height: "28px",
                                      padding: "0 7px",
                                      fontSize: "11px",
                                      background: "var(--surface-1)",
                                      border: "1px solid var(--border-subtle)",
                                      color: "var(--text-secondary)",
                                      borderRadius: "6px",
                                      display: "flex",
                                      alignItems: "center",
                                      textDecoration: "none",
                                    }}
                                  >
                                    <ExternalLink style={{ width: "12px", height: "12px" }} />
                                  </a>
                                )}
                              </>
                            ) : lead.lead_email ? (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(lead.lead_email || "", lead.id)}
                                className="btn"
                                style={{ height: "28px", padding: "0 9px", fontSize: "11px", gap: "4px" }}
                              >
                                {copiedId === lead.id ? <Check style={{ width: "11px", height: "11px" }} /> : <Copy style={{ width: "11px", height: "11px" }} />}
                                {copiedId === lead.id ? "Copiado!" : "Copiar E-mail"}
                              </button>
                            ) : (
                              <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                                Sem contato
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ─── MODO CARDS (OTIMIZADO PARA CELULAR E SEM SCROLL INFINITO) ─── */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            {paginatedList.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                Nenhum abandono encontrado para este filtro.
              </div>
            ) : (
              paginatedList.map(({ lead, diagnostic }) => {
                const whatsAppLink = getWhatsAppLink(lead);
                const cleanPhone = lead.lead_phone ? lead.lead_phone.replace(/\D/g, "") : "";
                const messagedTimestamp = cleanPhone ? messagedMap[cleanPhone] : undefined;

                return (
                  <div
                    key={lead.id || lead.session_id}
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "12px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "13px", display: "block" }}>
                          {lead.lead_name || "Consulente Sem Nome"}
                        </span>
                        {lead.ente_querido && (
                          <span style={{ fontSize: "11px", color: "var(--accent-strong)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Heart style={{ width: "10px", height: "10px" }} />
                            <span>{lead.ente_querido} {lead.grau_parentesco ? `(${lead.grau_parentesco})` : ""}</span>
                          </span>
                        )}
                        {lead.lead_phone && (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <Phone style={{ width: "10px", height: "10px" }} />
                            <span>{lead.lead_phone}</span>
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {timeAgo(lead.created_at)}
                      </span>
                    </div>

                    {/* Badge de Diagnóstico */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: "5px",
                          background: diagnostic.badgeBg,
                          border: `1px solid ${diagnostic.badgeBorder}`,
                          color: diagnostic.badgeColor,
                          fontSize: "10.5px",
                          fontWeight: 700,
                        }}
                      >
                        {diagnostic.badgeLabel}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Parou na Etapa {diagnostic.stepIndex}/8
                      </span>
                      {messagedTimestamp && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#10B981", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <CheckCircle2 style={{ width: "10px", height: "10px" }} />
                          <span>Disparado</span>
                        </span>
                      )}
                    </div>

                    {/* Descrição Curta */}
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.3 }}>
                      {diagnostic.detailedDescription}
                    </p>

                    {/* Botões de Ação */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      {lead.lead_phone && cleanPhone.length >= 8 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenSendModal(lead)}
                            style={{
                              flex: 1,
                              height: "30px",
                              padding: "0 10px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                              border: "none",
                              color: "#FFFFFF",
                              borderRadius: "7px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              cursor: "pointer",
                            }}
                          >
                            <Zap style={{ width: "12px", height: "12px" }} />
                            Disparar WhatsApp
                          </button>
                          {whatsAppLink && (
                            <a
                              href={whatsAppLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn"
                              style={{
                                height: "30px",
                                padding: "0 8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "7px",
                              }}
                            >
                              <ExternalLink style={{ width: "12px", height: "12px" }} />
                            </a>
                          )}
                        </>
                      ) : lead.lead_email ? (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(lead.lead_email || "", lead.id)}
                          className="btn"
                          style={{ flex: 1, height: "30px", fontSize: "11px", gap: "4px" }}
                        >
                          {copiedId === lead.id ? <Check style={{ width: "11px", height: "11px" }} /> : <Copy style={{ width: "11px", height: "11px" }} />}
                          {copiedId === lead.id ? "Copiado!" : "Copiar E-mail"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sem contato disponível</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── BARRA DE COLUNAS NO RODAPÉ ─── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "14px",
          }}
        >
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
            Exibindo <strong style={{ color: "var(--text-primary)" }}>{filteredList.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> de{" "}
            <strong style={{ color: "var(--text-primary)" }}>{filteredList.length}</strong> abandonos
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              maxWidth: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "2px 0",
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "5px 9px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "7px",
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                opacity: currentPage === 1 ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              <ChevronLeft style={{ width: "13px", height: "13px" }} />
              <span>Ant.</span>
            </button>

            {pageNumbers.map((p) => {
              const active = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  style={{
                    padding: "5px 10px",
                    fontSize: "11px",
                    fontWeight: active ? 800 : 500,
                    borderRadius: "7px",
                    border: active ? "1px solid var(--accent-strong)" : "1px solid var(--border-subtle)",
                    background: active ? "var(--accent-strong)" : "var(--surface-1)",
                    color: active ? "#FFFFFF" : "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Coluna {p}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "5px 9px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "7px",
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                opacity: currentPage === totalPages ? 0.4 : 1,
                flexShrink: 0,
              }}
            >
              <span>Próx.</span>
              <ChevronRight style={{ width: "13px", height: "13px" }} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL DE DISPARO DIRETO DA EVOLUTION API ─── */}
      {activeLeadToSend && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-strong)",
              borderRadius: "18px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10B981",
                  }}
                >
                  <Send style={{ width: "18px", height: "18px" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                    Enviar Mensagem via Evolution API
                  </h3>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Instância: <strong style={{ color: "#10B981" }}>{evoConfig.instanceName}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveLeadToSend(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Dados do Destinatário */}
            <div
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Consulente:</span>
                <strong style={{ color: "var(--text-primary)" }}>{activeLeadToSend.lead_name || "Sem Nome"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Ente Querido:</span>
                <strong style={{ color: "var(--accent-strong)" }}>{activeLeadToSend.ente_querido || "Não informado"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>WhatsApp:</span>
                <strong style={{ color: "#10B981" }}>{activeLeadToSend.lead_phone} ({formatPhoneForEvolution(activeLeadToSend.lead_phone || "")})</strong>
              </div>
            </div>

            {/* Caixa de Texto da Mensagem */}
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
                Mensagem a ser enviada:
              </label>
              <textarea
                rows={7}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "12px",
                  lineHeight: "1.4",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--surface-1)",
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Feedback do Envio */}
            {sendResult && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: sendResult.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: sendResult.success ? "#10B981" : "#EF4444",
                  border: sendResult.success ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                {sendResult.success ? <CheckCircle style={{ width: "16px", height: "16px" }} /> : <AlertTriangle style={{ width: "16px", height: "16px" }} />}
                <span>{sendResult.msg}</span>
              </div>
            )}

            {/* Ações */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setActiveLeadToSend(null)}
                className="btn"
                style={{
                  fontSize: "12px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSendViaEvolution}
                disabled={isSending || !messageText.trim()}
                className="btn"
                style={{
                  fontSize: "12px",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: "#10B981",
                  border: "none",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  cursor: isSending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 10px rgba(16, 185, 129, 0.4)",
                }}
              >
                {isSending ? (
                  <>
                    <RefreshCw style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    Enviando Mensagem...
                  </>
                ) : (
                  <>
                    <Send style={{ width: "14px", height: "14px" }} />
                    Disparar Mensagem Agora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE CONFIGURAÇÃO DA EVOLUTION API ─── */}
      {isConfigModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "var(--surface-card)",
              border: "1px solid var(--border-strong)",
              borderRadius: "18px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Settings style={{ width: "20px", height: "20px", color: "var(--accent-strong)" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  Configuração da Evolution API
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "4px" }}>
                  URL da Evolution API:
                </label>
                <input
                  type="text"
                  value={tempConfig.apiUrl}
                  onChange={(e) => setTempConfig({ ...tempConfig, apiUrl: e.target.value })}
                  placeholder="http://212.85.14.56:8080"
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-1)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "4px" }}>
                  Nome da Instância:
                </label>
                <input
                  type="text"
                  value={tempConfig.instanceName}
                  onChange={(e) => setTempConfig({ ...tempConfig, instanceName: e.target.value })}
                  placeholder="dipefy-drop"
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-1)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "4px" }}>
                  Chave de Autenticação (apikey):
                </label>
                <input
                  type="password"
                  value={tempConfig.apiKey}
                  onChange={(e) => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
                  placeholder="Sua AUTHENTICATION_API_KEY"
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-1)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="btn"
                style={{
                  fontSize: "12px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="btn"
                style={{
                  fontSize: "12px",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  background: "var(--accent-strong)",
                  border: "none",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conexão WhatsApp / QR Code Evolution API */}
      <EvolutionQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onConnectionChange={(connected) => {
          setConnectionStatus(connected ? "connected" : "disconnected");
        }}
      />
    </div>
  );
}

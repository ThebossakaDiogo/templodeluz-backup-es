import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  X,
  RefreshCw,
  Settings,
  Smartphone,
  KeyRound,
  AlertTriangle,
  Send,
  LogOut,
  Copy,
  Check,
  Lightbulb,
} from "lucide-react";
import {
  getEvolutionConfig,
  saveEvolutionConfig,
  testEvolutionConnection,
  getEvolutionQRCode,
  logoutEvolutionInstance,
  sendEvolutionTextMessage,
  type EvolutionConfig,
} from "@/services/evolution";

interface EvolutionQRModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConnectionChange?: (isConnected: boolean) => void;
}

export function EvolutionQRModal({
  isOpen,
  onClose,
  onConnectionChange,
}: EvolutionQRModalProps) {
  const [config, setConfig] = useState<EvolutionConfig>(getEvolutionConfig);
  const [tempConfig, setTempConfig] = useState<EvolutionConfig>(config);
  const [showConfig, setShowConfig] = useState(false);

  // Estados de Conexão e QR Code
  const [connectionState, setConnectionState] = useState<
    "checking" | "open" | "needs_qr" | "error"
  >("checking");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Verificando status...");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Estado para teste de mensagem
  const [testPhone, setTestPhone] = useState<string>("");
  const [testSending, setTestSending] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; text: string } | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Busca QR Code e status
  const fetchQRCode = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage("Buscando QR Code na Evolution API...");

    // Primeiro checa se já está conectado
    const stateRes = await testEvolutionConnection();
    if (stateRes.success && stateRes.state === "open") {
      setConnectionState("open");
      setStatusMessage("WhatsApp Conectado e Ativo!");
      setQrBase64(null);
      setIsLoading(false);
      onConnectionChange?.(true);
      return;
    }

    // Se não está aberto, solicita o QR Code
    const qrRes = await getEvolutionQRCode();
    setIsLoading(false);

    if (qrRes.success && qrRes.base64) {
      setConnectionState("needs_qr");
      setQrBase64(qrRes.base64);
      setPairingCode(qrRes.pairingCode || null);
      setStatusMessage(qrRes.message || "Aponte a câmera do seu WhatsApp para o QR Code.");
      setCountdown(30);
      onConnectionChange?.(false);
    } else {
      setConnectionState("error");
      setStatusMessage(
        qrRes.message || "Não foi possível carregar o QR Code da Evolution API."
      );
      onConnectionChange?.(false);
    }
  }, [onConnectionChange]);

  // Abre e fecha polling
  useEffect(() => {
    if (!isOpen) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    // Ao abrir, atualiza credenciais e busca QR Code
    const currentCfg = getEvolutionConfig();
    setConfig(currentCfg);
    setTempConfig(currentCfg);
    void fetchQRCode();

    // Polling a cada 4 segundos para detectar quando o celular escanear
    pollTimerRef.current = setInterval(async () => {
      const stateRes = await testEvolutionConnection();
      if (stateRes.success && stateRes.state === "open") {
        setConnectionState("open");
        setStatusMessage("WhatsApp Conectado com Sucesso!");
        setQrBase64(null);
        onConnectionChange?.(true);
      }
    }, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, fetchQRCode, onConnectionChange]);

  // Contagem regressiva para expiração do QR Code
  useEffect(() => {
    if (!isOpen || connectionState !== "needs_qr") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          void fetchQRCode();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, connectionState, fetchQRCode]);

  const handleSaveConfig = () => {
    saveEvolutionConfig(tempConfig);
    setConfig(tempConfig);
    setShowConfig(false);
    void fetchQRCode();
  };

  const handleLogout = async () => {
    if (!confirm("Deseja realmente desconectar o WhatsApp desta instância?")) return;
    setIsLoggingOut(true);
    await logoutEvolutionInstance();
    setIsLoggingOut(false);
    setConnectionState("needs_qr");
    onConnectionChange?.(false);
    await fetchQRCode();
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) return;
    setTestSending(true);
    setTestResult(null);

    const res = await sendEvolutionTextMessage(
      testPhone.trim(),
      "Olá! Esta é uma mensagem de teste da Evolution API conectada ao painel do Templo de Luz da médium Milena Medeiros. Tudo funcionando com sucesso."
    );

    setTestSending(false);
    if (res.success) {
      setTestResult({ success: true, text: "Mensagem de teste enviada com sucesso!" });
    } else {
      setTestResult({
        success: false,
        text: res.error || "Erro ao enviar mensagem de teste. Verifique o número.",
      });
    }
  };

  const copyPairingCode = () => {
    if (!pairingCode) return;
    void navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Trava o scroll da página ao abrir o modal e fecha com tecla ESC
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

  if (!isOpen || typeof document === "undefined") return null;

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
          maxWidth: "520px",
          margin: "auto",
          background: "linear-gradient(135deg, rgba(20, 24, 35, 0.92) 0%, rgba(10, 13, 20, 0.96) 100%)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px -10px rgba(16, 185, 129, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)",
          position: "relative",
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
                background: connectionState === "open" ? "rgba(16, 185, 129, 0.15)" : "rgba(37, 211, 102, 0.15)",
                border: connectionState === "open" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(37, 211, 102, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#25D366",
                flexShrink: 0,
              }}
            >
              <Smartphone style={{ width: "22px", height: "22px" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  Conectar WhatsApp
                </h3>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background:
                      connectionState === "open"
                        ? "rgba(16, 185, 129, 0.12)"
                        : connectionState === "checking"
                        ? "rgba(245, 158, 11, 0.12)"
                        : "rgba(239, 68, 68, 0.12)",
                    color:
                      connectionState === "open"
                        ? "#10B981"
                        : connectionState === "checking"
                        ? "#F59E0B"
                        : "#EF4444",
                    border: `1px solid ${
                      connectionState === "open"
                        ? "rgba(16, 185, 129, 0.3)"
                        : connectionState === "checking"
                        ? "rgba(245, 158, 11, 0.3)"
                        : "rgba(239, 68, 68, 0.3)"
                    }`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background:
                        connectionState === "open"
                          ? "#10B981"
                          : connectionState === "checking"
                          ? "#F59E0B"
                          : "#EF4444",
                      boxShadow:
                        connectionState === "open"
                          ? "0 0 6px rgba(16, 185, 129, 0.8)"
                          : "none",
                    }}
                  />
                  {connectionState === "open"
                    ? "Conectado"
                    : connectionState === "checking"
                    ? "Verificando..."
                    : "Não Pareado"}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "3px 0 0" }}>
                Instância: <strong style={{ color: "var(--text-primary)" }}>{config.instanceName}</strong> · Evolution API Baileys v2
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              background: "var(--surface-1, #1e202e)",
              border: "1px solid var(--border-subtle, #2c2f42)",
              borderRadius: "8px",
              padding: "6px",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        {/* ─── CASO 1: CONECTADO COM SUCESSO ─── */}
        {connectionState === "open" && (
          <div
            style={{
              padding: "20px",
              borderRadius: "14px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              textAlign: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
              }}
            >
              <CheckCircle2 style={{ width: "28px", height: "28px" }} />
            </div>

            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#10B981", margin: 0 }}>
                WhatsApp Conectado com Sucesso!
              </h4>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "6px 0 0", maxWidth: "380px" }}>
                Sua instância está ativa e pronta para enviar mensagens automáticas de recuperação de pix e entrega da consagração espiritual.
              </p>
            </div>

            {/* Teste de Disparo Rápido */}
            <div
              style={{
                width: "100%",
                marginTop: "6px",
                padding: "14px",
                background: "var(--surface-1, #171926)",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
                Enviar mensagem de teste:
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="(DDD) 99999-9999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: "12px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    background: "var(--surface-2, #10121c)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={testSending || !testPhone.trim()}
                  className="btn"
                  style={{
                    fontSize: "11px",
                    padding: "0 12px",
                    background: "#10B981",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Send style={{ width: "12px", height: "12px" }} />
                  {testSending ? "Enviando..." : "Testar"}
                </button>
              </div>

              {testResult && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: testResult.success ? "#10B981" : "#EF4444",
                  }}
                >
                  {testResult.text}
                </div>
              )}
            </div>

            {/* Botão de Desconectar */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn"
                style={{
                  fontSize: "11px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#EF4444",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <LogOut style={{ width: "13px", height: "13px" }} />
                {isLoggingOut ? "Desconectando..." : "Desconectar Aparelho"}
              </button>
            </div>
          </div>
        )}

        {/* ─── CASO 2: PRECISA ESCANEAR QR CODE ─── */}
        {connectionState === "needs_qr" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            {/* Box do QR Code */}
            <div
              style={{
                background: "#FFFFFF",
                padding: "16px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                position: "relative",
              }}
            >
              {qrBase64 ? (
                <img
                  src={qrBase64}
                  alt="QR Code WhatsApp Evolution API"
                  style={{
                    width: "240px",
                    height: "240px",
                    display: "block",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "240px",
                    height: "240px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B7280",
                  }}
                >
                  <RefreshCw style={{ width: "28px", height: "28px", animation: "spin 1s linear infinite" }} />
                </div>
              )}
            </div>

            {/* Contador de expiração e Recarregar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Atualiza em <strong>{countdown}s</strong>
              </span>
              <button
                type="button"
                onClick={fetchQRCode}
                disabled={isLoading}
                className="btn"
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <RefreshCw style={{ width: "11px", height: "11px", animation: isLoading ? "spin 1s linear infinite" : "none" }} />
                Gerar Novo QR Code
              </button>
            </div>

            {/* Código de Pareamento por Texto (se houver) */}
            {pairingCode && (
              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-1)",
                  border: "1px dashed var(--border-strong)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <KeyRound style={{ width: "14px", height: "14px", color: "var(--accent-strong)" }} />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Código de Pareamento: <strong style={{ color: "var(--text-primary)", letterSpacing: "2px" }}>{pairingCode}</strong>
                </span>
                <button
                  type="button"
                  onClick={copyPairingCode}
                  style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer" }}
                >
                  {copiedCode ? <Check style={{ width: "12px", height: "12px", color: "#10B981" }} /> : <Copy style={{ width: "12px", height: "12px" }} />}
                </button>
              </div>
            )}

            {/* Instruções Passo a Passo */}
            <div
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "var(--surface-1, #171926)",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h5 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
                Como conectar no seu celular:
              </h5>
              <ol style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, paddingLeft: "18px", lineHeight: "1.6" }}>
                <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
                <li>Toque nos <strong>3 pontinhos</strong> (Android) ou <strong>Configurações</strong> (iPhone)</li>
                <li>Selecione <strong>Aparelhos conectados</strong> e clique em <strong>Conectar um aparelho</strong></li>
                <li>Aponte a câmera para o QR Code acima</li>
              </ol>
            </div>
          </div>
        )}

        {/* ─── CASO 3: ERRO OU VERIFICANDO ─── */}
        {connectionState === "checking" && (
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <RefreshCw style={{ width: "28px", height: "28px", animation: "spin 1s linear infinite", color: "var(--accent-strong)", margin: "0 auto" }} />
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px" }}>
              Verificando status da instância na Evolution API...
            </p>
          </div>
        )}

        {connectionState === "error" && (
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#EF4444" }}>
              <AlertTriangle style={{ width: "18px", height: "18px" }} />
              <strong style={{ fontSize: "13px" }}>Não foi possível obter o QR Code</strong>
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0 }}>
              {statusMessage}
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: "1.5" }}>
              <Lightbulb style={{ width: "13px", height: "13px", color: "#F59E0B", flexShrink: 0, marginTop: "2px" }} />
              <span>
                <strong style={{ color: "var(--text-secondary)" }}>Dica:</strong> Verifique se o servidor Evolution API em <code>{config.apiUrl}</code> está rodando e com a porta liberada no firewall, ou se você usa outro endereço (ex: HTTPS / domínio). Você pode ajustar abaixo.
              </span>
            </div>
            <button
              type="button"
              onClick={fetchQRCode}
              className="btn"
              style={{
                alignSelf: "flex-start",
                fontSize: "11px",
                padding: "6px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* ─── ACCORDION: CONFIGURAÇÕES DA API ─── */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "11.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: 0,
            }}
          >
            <Settings style={{ width: "13px", height: "13px" }} />
            {showConfig ? "Ocultar Parâmetros da API" : "Ajustar URL / Chave da Evolution API"}
          </button>

          {showConfig && (
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                background: "var(--surface-1, #171926)",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "4px" }}>
                  URL do Servidor Evolution:
                </label>
                <input
                  type="text"
                  value={tempConfig.apiUrl}
                  onChange={(e) => setTempConfig({ ...tempConfig, apiUrl: e.target.value })}
                  placeholder="http://212.85.14.56:8080"
                  style={{
                    width: "100%",
                    fontSize: "11.5px",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-2)",
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
                    fontSize: "11.5px",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: "4px" }}>
                  Chave Global / Instância (apikey):
                </label>
                <input
                  type="password"
                  value={tempConfig.apiKey}
                  onChange={(e) => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
                  placeholder="975e8d9ce136..."
                  style={{
                    width: "100%",
                    fontSize: "11.5px",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="btn"
                style={{
                  alignSelf: "flex-end",
                  fontSize: "11px",
                  padding: "6px 14px",
                  background: "var(--accent-strong, #6366f1)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Salvar e Reconectar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

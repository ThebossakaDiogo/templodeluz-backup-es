import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ExternalLink, MessageCircle, Play, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import {
  EVOLUTION_MANAGER_URL,
  getEvolutionLocalStatus,
  restartEvolutionLocal,
  startEvolutionLocal,
  type EvolutionLocalState,
  type EvolutionLocalStatus,
} from "@/services/evolution-local-bridge";

const STATE_LABELS: Record<EvolutionLocalState, string> = {
  OFFLINE: "Offline",
  INICIANDO_DOCKER: "Ligando o motor…",
  INICIANDO_EVOLUTION: "Iniciando conexão…",
  ONLINE: "Online",
  WHATSAPP_DESCONECTADO: "WhatsApp desconectado",
  WHATSAPP_CONECTADO: "WhatsApp conectado",
  ERRO: "Erro",
};

function isStarting(state?: EvolutionLocalState) {
  return state === "INICIANDO_DOCKER" || state === "INICIANDO_EVOLUTION";
}

interface EvolutionLocalControlProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function EvolutionLocalControl({ onConnectionChange }: EvolutionLocalControlProps = {}) {
  const [status, setStatus] = useState<EvolutionLocalStatus | null>(null);
  const [bridgeAvailable, setBridgeAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"start" | "restart" | null>(null);
  const [error, setError] = useState("");
  const pollTimer = useRef<number | null>(null);
  const mounted = useRef(true);

  const clearPoll = () => {
    if (pollTimer.current !== null) window.clearTimeout(pollTimer.current);
    pollTimer.current = null;
  };

  const refresh = useCallback(async (scheduleNext = true) => {
    clearPoll();
    try {
      const nextStatus = await getEvolutionLocalStatus();
      if (!mounted.current) return;
      setStatus(nextStatus);
      onConnectionChange?.(nextStatus.whatsapp.connected);
      setBridgeAvailable(true);
      setError(nextStatus.error ?? "");
      if (scheduleNext) {
        const interval = isStarting(nextStatus.status) ? 3_000 : 30_000;
        pollTimer.current = window.setTimeout(() => void refresh(true), interval);
      }
    } catch {
      if (!mounted.current) return;
      setBridgeAvailable(false);
      setStatus(null);
      setError("A conexão local não foi encontrada.");
    }
  }, [onConnectionChange]);

  useEffect(() => {
    mounted.current = true;
    void refresh(true);
    return () => {
      mounted.current = false;
      clearPoll();
    };
  }, [refresh]);

  const runOperation = async (operation: "start" | "restart") => {
    setBusy(operation);
    setError("");
    setBridgeAvailable(true);
    setStatus((current) => current ? {
      ...current,
      status: operation === "start" && !current.docker.available ? "INICIANDO_DOCKER" : "INICIANDO_EVOLUTION",
    } : current);
    try {
      const result = operation === "start" ? await startEvolutionLocal() : await restartEvolutionLocal();
      if (!mounted.current) return;
      setStatus(result);
    } catch (operationError) {
      if (!mounted.current) return;
      setError(operationError instanceof Error ? operationError.message : "Não foi possível controlar a Evolution.");
      await refresh(false);
    } finally {
      if (mounted.current) {
        setBusy(null);
        pollTimer.current = window.setTimeout(() => void refresh(true), 3_000);
      }
    }
  };

  const state = status?.status ?? "OFFLINE";
  const dockerReady = status?.docker.available ?? false;
  const evolutionReady = status?.evolution.online ?? false;
  const whatsappReady = status?.whatsapp.connected ?? false;
  const allDone = whatsappReady;

  const steps = [
    {
      id: 1,
      title: "Ligar o motor",
      hint: "O programa que faz tudo funcionar",
      done: dockerReady,
    },
    {
      id: 2,
      title: "Iniciar a conexão",
      hint: "Conexão local segura com o serviço",
      done: evolutionReady,
    },
    {
      id: 3,
      title: "Conectar o WhatsApp",
      hint: "Aponte a câmera do celular para o QR",
      done: whatsappReady,
    },
  ];

  const spinStyle = { animation: "spin 0.8s linear infinite" };

  return (
    <section className="card evolution-local-card connect-wizard" aria-labelledby="connect-wizard-title">
      <header className="evolution-local-header">
        <div className="evolution-local-heading">
          <span className="evolution-local-icon"><MessageCircle size={21} /></span>
          <div>
            <span className="section-kicker">Passo a passo</span>
            <h2 id="connect-wizard-title">Conecte seu WhatsApp</h2>
            <p>Em 3 passos simples, a médium fica pronta para enviar as cartas.</p>
          </div>
        </div>
        <span className={`evolution-state-badge ${allDone ? "success" : "neutral"}`}>
          <i /> {allDone ? "Tudo conectado" : STATE_LABELS[state]}
        </span>
      </header>

      {bridgeAvailable === false ? (
        <div className="evolution-bridge-missing">
          <ShieldCheck size={22} />
          <div>
            <strong>A conexão local não foi encontrada.</strong>
            <p>Inicie o “Evolution Local Bridge” neste computador e tente novamente.</p>
          </div>
          <button type="button" className="btn" onClick={() => void refresh(true)}>Tentar novamente</button>
        </div>
      ) : (
        <>
          <ol className="connect-wizard-steps">
            {steps.map((step) => (
              <li
                key={step.id}
                className={`connect-step ${step.done ? "done" : ""} ${!step.done && !isStarting(state) && step.id === (dockerReady ? (evolutionReady ? 3 : 2) : 1) ? "active" : ""}`}
              >
                <span className="connect-step-marker">
                  {step.done ? (
                    <Check size={15} />
                  ) : isStarting(state) && step.id === (dockerReady ? 2 : 1) ? (
                    <RefreshCw size={15} style={spinStyle} />
                  ) : (
                    step.id
                  )}
                </span>
                <span className="connect-step-body">
                  <strong>{step.title}</strong>
                  <small>{step.hint}</small>
                </span>
              </li>
            ))}
          </ol>

          {error && <p className="evolution-local-error" role="alert">{error}</p>}

          <footer className="evolution-local-actions">
            {!allDone && !dockerReady && (
              <button type="button" className="btn btn-primary" disabled={Boolean(busy)} onClick={() => void runOperation("start")}>
                {busy === "start" ? <RefreshCw size={16} style={spinStyle} /> : <Play size={16} />}
                {isStarting(state) ? "Ligando…" : "Ligar o motor"}
              </button>
            )}
            {!allDone && dockerReady && !evolutionReady && (
              <button type="button" className="btn btn-primary" disabled={Boolean(busy)} onClick={() => void runOperation("start")}>
                {busy === "start" ? <RefreshCw size={16} style={spinStyle} /> : <Play size={16} />}
                {isStarting(state) ? "Iniciando…" : "Iniciar a conexão"}
              </button>
            )}
            {!allDone && evolutionReady && !whatsappReady && (
              <a className="btn btn-primary" href={EVOLUTION_MANAGER_URL} target="_blank" rel="noreferrer">
                <QrCode size={16} /> Escanear o QR Code
              </a>
            )}

            {allDone && (
              <div className="connect-wizard-done">
                <Check size={16} /> WhatsApp conectado na instância <strong>dipefy-drop</strong>.
              </div>
            )}

            {dockerReady && (
              <button type="button" className="btn" disabled={Boolean(busy)} onClick={() => void runOperation("restart")}>
                <RefreshCw size={15} className={busy === "restart" ? "" : ""} style={busy === "restart" ? spinStyle : undefined} />
                Reiniciar
              </button>
            )}
            <a className="btn" href={EVOLUTION_MANAGER_URL} target="_blank" rel="noreferrer">
              Abrir painel <ExternalLink size={14} />
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

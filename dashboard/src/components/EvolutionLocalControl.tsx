import { useCallback, useEffect, useRef, useState } from "react";
import { Container, ExternalLink, MessageCircle, Play, RefreshCw, Server, ShieldCheck } from "lucide-react";
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
  INICIANDO_DOCKER: "Iniciando Docker",
  INICIANDO_EVOLUTION: "Iniciando Evolution",
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
      setError("Serviço local da Evolution não encontrado.");
      // Do not keep retrying when the local service is absent.
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
  const stateTone = state === "WHATSAPP_CONECTADO" || state === "ONLINE"
    ? "success"
    : isStarting(state)
      ? "warning"
      : state === "ERRO"
        ? "danger"
        : "neutral";

  return (
    <section className="card evolution-local-card" aria-labelledby="evolution-local-title">
      <header className="evolution-local-header">
        <div className="evolution-local-heading">
          <span className="evolution-local-icon"><Server size={21} /></span>
          <div>
            <span className="section-kicker">Serviço local</span>
            <h2 id="evolution-local-title">Evolution API</h2>
            <p>Instância <strong>dipefy-drop</strong> · Bridge em 127.0.0.1:3210</p>
          </div>
        </div>
        <span className={`evolution-state-badge ${stateTone}`}>
          <i /> {STATE_LABELS[state]}
        </span>
      </header>

      {bridgeAvailable === false ? (
        <div className="evolution-bridge-missing">
          <ShieldCheck size={22} />
          <div>
            <strong>Serviço local da Evolution não encontrado.</strong>
            <p>Inicie o “Evolution Local Bridge” neste computador e tente novamente.</p>
          </div>
          <button type="button" className="btn" onClick={() => void refresh(true)}>Tentar novamente</button>
        </div>
      ) : (
        <div className="evolution-status-grid">
          <div>
            <span><Container size={17} /> Docker</span>
            <strong className={status?.docker.available ? "online" : "offline"}>
              {status?.docker.available ? "Disponível" : "Indisponível"}
            </strong>
            <small>{status?.docker.allRunning ? "3 containers ativos" : "Containers aguardando"}</small>
          </div>
          <div>
            <span><Server size={17} /> Evolution</span>
            <strong className={status?.evolution.online ? "online" : "offline"}>
              {status?.evolution.online ? "Online" : "Offline"}
            </strong>
            <small>127.0.0.1:8080</small>
          </div>
          <div>
            <span><MessageCircle size={17} /> WhatsApp</span>
            <strong className={status?.whatsapp.connected ? "online" : "offline"}>
              {status?.whatsapp.connected ? "Conectado" : "Desconectado"}
            </strong>
            <small>dipefy-drop</small>
          </div>
        </div>
      )}

      {error && bridgeAvailable !== false && <p className="evolution-local-error" role="alert">{error}</p>}

      <footer className="evolution-local-actions">
        <button type="button" className="btn btn-primary" disabled={Boolean(busy)} onClick={() => void runOperation("start")}>
          {busy === "start" ? <RefreshCw size={16} className="topbar-spin" /> : <Play size={16} />}
          Iniciar Evolution
        </button>
        <button type="button" className="btn" disabled={Boolean(busy) || bridgeAvailable === false} onClick={() => void runOperation("restart")}>
          <RefreshCw size={16} className={busy === "restart" ? "topbar-spin" : ""} />
          Reiniciar Evolution
        </button>
        <a className="btn" href={EVOLUTION_MANAGER_URL} target="_blank" rel="noreferrer">
          Abrir Manager <ExternalLink size={15} />
        </a>
      </footer>
    </section>
  );
}

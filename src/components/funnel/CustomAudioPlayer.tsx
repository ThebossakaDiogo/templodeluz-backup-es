import React, { useEffect, useId, useMemo, useRef, useState } from "react";

export interface CustomAudioPlayerProps {
  readonly src: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly ariaLabel?: string;
  readonly autoPlay?: boolean;
  readonly defaultDuration?: number; // Duração estimada/conhecida em segundos
  readonly theme?: "gold" | "purple" | "emerald" | "whatsapp";
  readonly variant?: "full" | "card" | "inline";
  readonly className?: string;
  readonly onPlay?: () => void;
  readonly onPause?: () => void;
  readonly onEnded?: () => void;
}

// Padrão visual de alturas simulando o ritmo da fala
const WAVEFORM_BARS = [
  35, 55, 40, 75, 90, 60, 45, 80, 100, 70, 50, 85, 95, 65, 45, 70, 85, 90, 60,
  40, 75, 85, 95, 65, 50, 80, 65, 45, 60, 75, 50, 35,
];

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function CustomAudioPlayer({
  src,
  title,
  subtitle,
  ariaLabel,
  autoPlay = false,
  defaultDuration = 0,
  theme = "gold",
  variant = "full",
  className = "",
  onPlay,
  onPause,
  onEnded,
}: CustomAudioPlayerProps) {
  const playerId = useId();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(defaultDuration);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [showRemaining, setShowRemaining] = useState(false);

  // Sincroniza fallback se mudar
  useEffect(() => {
    if (defaultDuration > 0 && duration === 0) {
      setDuration(defaultDuration);
    }
  }, [defaultDuration, duration]);

  // Pausa se outro player tocar
  useEffect(() => {
    const handleGlobalPause = (e: Event) => {
      const custom = e as CustomEvent<{ id: string }>;
      if (custom.detail?.id !== playerId && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
    window.addEventListener("templo:pause-other-audios", handleGlobalPause);
    return () => window.removeEventListener("templo:pause-other-audios", handleGlobalPause);
  }, [playerId]);

  // Event handlers do elemento <audio>
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !Number.isNaN(audio.duration) && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !Number.isNaN(audio.duration) && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleAudioPlay = () => {
      setIsPlaying(true);
      window.dispatchEvent(
        new CustomEvent("templo:pause-other-audios", { detail: { id: playerId } })
      );
      onPlay?.();
    };

    const handleAudioPause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleAudioEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleLoadedMetadata);
    audio.addEventListener("canplay", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handleAudioPlay);
    audio.addEventListener("pause", handleAudioPause);
    audio.addEventListener("ended", handleAudioEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handleAudioPlay);
      audio.removeEventListener("pause", handleAudioPause);
      audio.removeEventListener("ended", handleAudioEnded);
    };
  }, [playerId, onPlay, onPause, onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[CustomAudioPlayer] Erro ao reproduzir:", err);
        });
      }
    }
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    let nextRate: 1 | 1.5 | 2 = 1;
    if (playbackRate === 1) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;

    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const skipSeconds = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const targetTime = Math.min(Math.max(0, audio.currentTime + seconds), duration || audio.duration || 0);
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const seekFromClientX = (clientX: number) => {
    const bar = progressBarRef.current;
    const audio = audioRef.current;
    if (!bar || !audio) return;

    const rect = bar.getBoundingClientRect();
    const clickPos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const effectiveDuration = duration || audio.duration || 0;
    if (effectiveDuration > 0) {
      const targetTime = clickPos * effectiveDuration;
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekFromClientX(e.clientX);
  };

  const progressPercent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  // Paletas de estilo por tema
  const themeStyles = useMemo(() => {
    switch (theme) {
      case "gold":
        return {
          container:
            "border border-[#f5d285]/35 bg-gradient-to-br from-[#1d0b33]/95 via-[#160728]/95 to-[#10031f]/95 text-white shadow-[0_16px_36px_rgba(0,0,0,0.4)] backdrop-blur-md",
          playBtn:
            "bg-gradient-to-tr from-[#f5d285] via-[#f7dd9d] to-[#dfb85b] text-[#1a082c] shadow-lg shadow-[#f5d285]/25 hover:shadow-[#f5d285]/40 hover:scale-[1.03] active:scale-95",
          barActive: "bg-[#f5d285]",
          barInactive: "bg-white/20",
          progressBg: "bg-white/15",
          progressFill: "bg-gradient-to-r from-[#f5d285] to-[#ffe8a3]",
          thumb: "bg-[#f5d285] ring-2 ring-[#1a082c]",
          timeActive: "text-[#f5d285]",
          timeMuted: "text-white/60",
          speedBtn:
            "border border-[#f5d285]/35 bg-[#f5d285]/15 text-[#f5d285] hover:bg-[#f5d285]/25 hover:border-[#f5d285]/60",
          skipBtn: "text-white/70 hover:text-[#f5d285] hover:bg-white/10",
          playingBadge: "border-[#f5d285]/40 bg-[#f5d285]/10 text-[#f5d285]",
        };
      case "purple":
        return {
          container:
            "border border-[#d8cae5] bg-gradient-to-br from-[#faf8fc] via-white to-[#f4effa] text-[#272039] shadow-sm",
          playBtn:
            "bg-gradient-to-tr from-[#6f5aa0] to-[#543f80] text-white shadow-md shadow-[#543f80]/30 hover:scale-[1.03] active:scale-95",
          barActive: "bg-[#5d4786]",
          barInactive: "bg-[#ded5e8]",
          progressBg: "bg-[#e5dbea]",
          progressFill: "bg-gradient-to-r from-[#7a64a2] to-[#5d4786]",
          thumb: "bg-[#5d4786] ring-2 ring-white",
          timeActive: "text-[#5d4786]",
          timeMuted: "text-slate-400",
          speedBtn:
            "border border-[#d8cae5] bg-[#f2ecf8] text-[#5d4786] hover:bg-[#e7dcef]",
          skipBtn: "text-slate-500 hover:text-[#5d4786] hover:bg-[#f2ecf8]",
          playingBadge: "border-[#d8cae5] bg-[#f4effa] text-[#5d4786]",
        };
      case "emerald":
        return {
          container:
            "border border-[#d4e7e0] bg-gradient-to-br from-[#f2f9f5] via-white to-[#eaf5ef] text-[#1a2e26] shadow-sm",
          playBtn:
            "bg-gradient-to-tr from-[#42887b] to-[#2d665e] text-white shadow-md shadow-[#2d665e]/30 hover:scale-[1.03] active:scale-95",
          barActive: "bg-[#39776c]",
          barInactive: "bg-[#cce3d9]",
          progressBg: "bg-[#d5e7df]",
          progressFill: "bg-gradient-to-r from-[#4b8b7e] to-[#2d665e]",
          thumb: "bg-[#2d665e] ring-2 ring-white",
          timeActive: "text-[#2d665e]",
          timeMuted: "text-slate-400",
          speedBtn:
            "border border-[#c5e1d5] bg-[#e4f3ec] text-[#2d665e] hover:bg-[#d5ece1]",
          skipBtn: "text-slate-500 hover:text-[#2d665e] hover:bg-[#e4f3ec]",
          playingBadge: "border-[#c5e1d5] bg-[#e4f3ec] text-[#2d665e]",
        };
      case "whatsapp":
        return {
          container:
            "border border-[#e1e4e8] bg-[#f8f9fa] text-[#111b21] shadow-2xs",
          playBtn:
            "bg-[#25D366] text-white shadow-sm hover:bg-[#20bd5a] hover:scale-[1.03] active:scale-95",
          barActive: "bg-[#00a884]",
          barInactive: "bg-[#d1d7db]",
          progressBg: "bg-[#e9edef]",
          progressFill: "bg-[#00a884]",
          thumb: "bg-[#00a884] ring-2 ring-white",
          timeActive: "text-[#111b21]",
          timeMuted: "text-[#667781]",
          speedBtn:
            "border border-[#d1d7db] bg-white text-[#54656f] hover:bg-[#f0f2f5]",
          skipBtn: "text-[#667781] hover:text-[#111b21] hover:bg-white",
          playingBadge: "border-[#d1d7db] bg-white text-[#54656f]",
        };
    }
  }, [theme]);

  return (
    <div
      className={`relative w-full rounded-2xl p-3.5 sm:p-4 transition-all duration-300 ${themeStyles.container} ${className}`}
    >
      {/* Elemento de áudio real oculto com track de legenda */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        autoPlay={autoPlay}
        aria-label={ariaLabel || title || "Áudio da Médium Milena"}
      >
        <track kind="captions" />
      </audio>

      {/* Topo com Título e Badge de Status (se fornecidos) */}
      {(title || subtitle) && (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="min-w-0 flex-1 text-left">
            {title && (
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.14em] text-current opacity-90">
                {title}
              </span>
            )}
            {subtitle && (
              <span className="mt-0.5 block text-[12px] font-medium leading-tight opacity-75">
                {subtitle}
              </span>
            )}
          </div>
          {isPlaying && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider ${themeStyles.playingBadge}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
              <span>Ouvindo</span>
            </span>
          )}
        </div>
      )}

      {/* Linha Principal: Botão Play/Pause + Waveform e Scrubber */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Botão Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar mensagem de áudio" : "Reproduzir mensagem de áudio"}
          className={`relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform ${themeStyles.playBtn}`}
        >
          {isPlaying ? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-current"
              aria-hidden="true"
            >
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 translate-x-0.5 fill-current"
              aria-hidden="true"
            >
              <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
            </svg>
          )}
        </button>

        {/* Bloco de Waveform + Scrubber interativo */}
        <div className="min-w-0 flex-1">
          {/* Waveform Visual clicável */}
          <div
            ref={progressBarRef}
            onClick={handleBarClick}
            className="group relative flex h-9 cursor-pointer items-center gap-[2px] sm:gap-[3px] py-1 select-none"
            role="slider"
            tabIndex={0}
            aria-label="Progresso do áudio"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") skipSeconds(-5);
              if (e.key === "ArrowRight") skipSeconds(5);
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                togglePlay();
              }
            }}
          >
            {WAVEFORM_BARS.map((heightPct, idx) => {
              const barThreshold = (idx / WAVEFORM_BARS.length) * 100;
              const isPast = progressPercent >= barThreshold;
              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center h-full"
                >
                  <span
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-full transition-all duration-150 ${
                      isPast ? themeStyles.barActive : themeStyles.barInactive
                    } ${
                      isPlaying && isPast
                        ? "scale-y-[1.08] duration-300"
                        : "group-hover:scale-y-110"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Barra de Progresso Fina */}
          <div
            aria-hidden="true"
            className={`relative h-1.5 w-full overflow-hidden rounded-full ${themeStyles.progressBg}`}
          >
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full transition-all duration-100 ${themeStyles.progressFill}`}
            />
          </div>

          {/* Linha de Minutagem e Controles Rápidos */}
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono select-none">
            {/* Minutagem (Tempo Atual e Total) */}
            <button
              type="button"
              onClick={() => setShowRemaining(!showRemaining)}
              title="Clique para alternar entre duração total e tempo restante"
              aria-label="Alternar exibição entre duração total e tempo restante"
              className="flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 text-left"
            >
              <span className={`font-black ${themeStyles.timeActive}`}>
                {formatTime(currentTime)}
              </span>
              <span className={`font-semibold ${themeStyles.timeMuted}`}>/</span>
              <span className={`font-bold ${themeStyles.timeMuted}`}>
                {showRemaining && duration > 0
                  ? `-${formatTime(Math.max(0, duration - currentTime))}`
                  : formatTime(duration)}
              </span>
            </button>

            {/* Ações: Voltar 10s & Velocidade */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  skipSeconds(-10);
                }}
                title="Voltar 10 segundos"
                aria-label="Voltar 10 segundos"
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors cursor-pointer ${themeStyles.skipBtn}`}
              >
                ↺10
              </button>

              <button
                type="button"
                onClick={toggleSpeed}
                title="Velocidade de reprodução"
                aria-label={`Velocidade de reprodução atual: ${playbackRate}x`}
                className={`flex h-6 min-w-[34px] items-center justify-center rounded-full px-1.5 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${themeStyles.speedBtn}`}
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

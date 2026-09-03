import { useState, useEffect } from "react";
import { Download, Smartphone, Share, PlusSquare, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // Detecta se já está rodando como PWA instalado
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detecta se o dispositivo é iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // Evento de instalação nativa para Android, Chrome, Edge e Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Se já está instalado e rodando em modo standalone, não precisa exibir
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      // Caso o navegador não tenha disparado ainda (ex: Safari no Mac ou instrução genérica)
      setShowIosModal(true);
    }
  };

  return (
    <>
      {/* Botão de Instalação na Sidebar */}
      <button
        onClick={handleInstallClick}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          color: "#10b981",
          fontSize: "12px",
          fontWeight: 800,
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 0 14px rgba(16, 185, 129, 0.15)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.18) 100%)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#10b981";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(16, 185, 129, 0.35)";
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            background: "rgba(16, 185, 129, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isIos ? (
            <Smartphone style={{ width: "14px", height: "14px" }} />
          ) : (
            <Download style={{ width: "14px", height: "14px" }} />
          )}
        </div>
        <div style={{ textAlign: "left", lineHeight: 1.2 }}>
          <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#ffffff" }}>
            {isIos ? "Instalar no iPhone" : "Instalar Aplicativo"}
          </div>
          <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 600 }}>
            OD METRICS no Celular
          </div>
        </div>
      </button>

      {/* Modal de Instruções para iPhone / iOS Safari */}
      {showIosModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowIosModal(false)}
        >
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              background: "linear-gradient(165deg, #0d172e 0%, #060b17 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "20px",
              padding: "26px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.15)",
              color: "#ffffff",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              onClick={() => setShowIosModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                borderRadius: "8px",
                width: "28px",
                height: "28px",
                color: "#94a3b8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X style={{ width: "16px", height: "16px" }} />
            </button>

            {/* Cabeçalho */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981",
                  flexShrink: 0,
                }}
              >
                <Smartphone style={{ width: "22px", height: "22px" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#ffffff" }}>
                  Instalar no iPhone (iOS)
                </h3>
                <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: "2px 0 0" }}>
                  Transforme o OD METRICS em um app nativo na sua tela inicial
                </p>
              </div>
            </div>

            {/* Passo a Passo Visual */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", margin: "20px 0" }}>
              {/* Passo 1 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "rgba(56, 189, 248, 0.2)",
                    color: "#38bdf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <Share style={{ width: "15px", height: "15px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#ffffff" }}>
                    1. Toque em Compartilhar
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>
                    Na barra inferior do navegador Safari, toque no ícone com o quadrado e a seta apontando para cima.
                  </div>
                </div>
              </div>

              {/* Passo 2 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <PlusSquare style={{ width: "15px", height: "15px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#ffffff" }}>
                    2. "Adicionar à Tela de Início"
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>
                    Role as opções para baixo até encontrar e clicar em <strong>"Adicionar à Tela de Início"</strong>.
                  </div>
                </div>
              </div>

              {/* Passo 3 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "rgba(168, 85, 247, 0.2)",
                    color: "#c084fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: "12px",
                    marginTop: "2px",
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#ffffff" }}>
                    3. Confirme em "Adicionar"
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>
                    Toque em <strong>Adicionar</strong> no canto superior direito. O ícone oficial do OD METRICS aparecerá no seu iPhone!
                  </div>
                </div>
              </div>
            </div>

            {/* Botão Entendido */}
            <button
              onClick={() => setShowIosModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
              }}
            >
              Entendido! Vou Instalar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

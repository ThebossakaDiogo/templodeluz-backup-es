import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[OD METRICS ERROR BOUNDARY]", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) caches.delete(name);
        });
      }
    } catch {
      // ignore
    }
    window.location.href = "/login";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#07080F",
            color: "#F5F5FA",
            padding: "24px",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', Inter, sans-serif",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #7C5CFF 0%, #4F38C4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 900,
              color: "#FFFFFF",
              marginBottom: "20px",
              boxShadow: "0 8px 30px rgba(124, 92, 255, 0.4)",
            }}
          >
            OD
          </div>

          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              margin: "0 0 8px",
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            Sessão Atualizada no Painel
          </h1>

          <p
            style={{
              fontSize: "13.5px",
              color: "#9DA0B5",
              maxWidth: "460px",
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            Ocorreu uma atualização de estado no navegador. Clique abaixo para
            restaurar os painéis com a telemetria ao vivo.
          </p>

          {this.state.error?.message && (
            <div
              style={{
                maxWidth: "520px",
                width: "100%",
                background: "rgba(240, 93, 102, 0.08)",
                border: "1px solid rgba(240, 93, 102, 0.25)",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "12px",
                color: "#F87171",
                marginBottom: "24px",
                textAlign: "left",
                fontFamily: "monospace",
                overflowX: "auto",
              }}
            >
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                background: "linear-gradient(135deg, #7C5CFF 0%, #5E46D8 100%)",
                border: "1px solid rgba(189, 180, 239, 0.4)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "13px",
                padding: "12px 24px",
                borderRadius: "12px",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(124, 92, 255, 0.3)",
              }}
            >
              Recarregar Painel
            </button>

            <button
              type="button"
              onClick={this.handleClearAndReload}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#9DA0B5",
                fontWeight: 600,
                fontSize: "13px",
                padding: "12px 20px",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              Limpar Cache & Entrar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

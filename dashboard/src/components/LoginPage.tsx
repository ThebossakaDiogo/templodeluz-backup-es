import { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ALLOWED_ADMIN_EMAILS = new Set([
  "thebossakadiogo@gmail.com",
  "otaviov.quinalia@gmail.com",
]);

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  // Verifica se o email digitado é autorizado
  const handleValidateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!cleanEmail) {
      setError("Por favor, digite seu e-mail de administrador.");
      return;
    }

    if (!ALLOWED_ADMIN_EMAILS.has(cleanEmail)) {
      setUnauthorized(true);
      setError("ACESSO NEGADO: Este e-mail não possui privilégios de administrador.");
      setTimeout(() => {
        window.location.href = "about:blank";
      }, 1200);
      return;
    }

    // Se estiver na whitelist, prossegue com o login ou criação
    handleAuth();
  };

  const handleAuth = async () => {
    if (!ALLOWED_ADMIN_EMAILS.has(cleanEmail)) {
      setUnauthorized(true);
      window.location.href = "about:blank";
      return;
    }

    if (!password) {
      setError("Por favor, digite sua senha.");
      return;
    }

    if (isFirstAccess) {
      if (password.length < 6) {
        setError("A senha deve conter no mínimo 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas digitadas não coincidem.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (signUpError) {
          // Se o usuário já existir no auth, tenta login direto
          if (signUpError.message.toLowerCase().includes("already registered")) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (signInError) {
              setError("Esta conta já possui senha cadastrada. Use a opção 'Já possuo senha'.");
              setIsFirstAccess(false);
              setLoading(false);
              return;
            }
            onLoginSuccess();
            return;
          }
          throw signUpError;
        }

        if (data.session) {
          setSuccessMsg("Senha de administrador criada com sucesso! Entrando...");
          setTimeout(onLoginSuccess, 1000);
        } else {
          setSuccessMsg("Senha cadastrada! Faça seu login com a senha criada.");
          setIsFirstAccess(false);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao criar senha de administrador.");
      } finally {
        setLoading(false);
      }
    } else {
      // Login tradicional
      setLoading(true);
      setError("");

      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes("invalid login credentials")) {
            setError("Senha incorreta ou primeiro acesso ainda não configurado.");
          } else {
            setError(signInError.message || "Credenciais inválidas.");
          }
          setLoading(false);
          return;
        }

        if (data.session) {
          onLoginSuccess();
        }
      } catch (err: any) {
        setError(err.message || "Falha na autenticação.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#030712",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Gradients & Glows */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "10%",
          width: "450px",
          height: "350px",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Caixa Central de Login */}
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          margin: "20px",
          padding: "36px 32px",
          background: "rgba(9, 15, 29, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(16, 185, 129, 0.15)",
          backdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Monograma OD & Marca */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 28px rgba(16, 185, 129, 0.4)",
              position: "relative",
            }}
          >
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "22px",
                fontWeight: 900,
                color: "#030712",
                letterSpacing: "-0.05em",
              }}
            >
              OD
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "22px",
              fontWeight: 900,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>OD</span>
            <span style={{ color: "#10b981" }}>METRICS</span>
          </h1>

          <p
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              marginTop: "4px",
              fontWeight: 500,
            }}
          >
            Acesso Restrito a Administradores Autorizados
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "12px",
              padding: "4px 12px",
              borderRadius: "99px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#10b981",
            }}
          >
            <ShieldCheck style={{ width: "13px", height: "13px" }} />
            <span>RLS & Supabase Auth Ativos</span>
          </div>
        </div>

        {/* Mensagem de Erro / Acesso Negado */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: unauthorized ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "18px",
            }}
          >
            <AlertTriangle style={{ width: "16px", height: "16px", color: "#ef4444", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {successMsg && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#6ee7b7",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "18px",
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleValidateEmail} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Campo de E-mail */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11.5px",
                fontWeight: 700,
                color: "#cbd5e1",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              E-mail do Administrador
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  height: "16px",
                  color: "#64748b",
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="seu.email@exemplo.com"
                required
                disabled={loading || unauthorized}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "12px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#10b981";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(16, 185, 129, 0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Campo de Senha */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "#cbd5e1",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {isFirstAccess ? "Criar Senha de Admin" : "Senha"}
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsFirstAccess(!isFirstAccess);
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {isFirstAccess ? "Já criei minha senha" : "Primeiro acesso? Criar senha"}
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <Lock
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  height: "16px",
                  color: "#64748b",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isFirstAccess ? "Digite uma senha segura (mín. 6 dígitos)" : "••••••••"}
                required
                disabled={loading || unauthorized}
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 42px",
                  borderRadius: "12px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#10b981";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(16, 185, 129, 0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {showPassword ? (
                  <EyeOff style={{ width: "16px", height: "16px" }} />
                ) : (
                  <Eye style={{ width: "16px", height: "16px" }} />
                )}
              </button>
            </div>
          </div>

          {/* Confirmação de Senha no Primeiro Acesso */}
          {isFirstAccess && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "#cbd5e1",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                }}
              >
                Confirmar Senha
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: "#64748b",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha criada"
                  required
                  disabled={loading || unauthorized}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    borderRadius: "12px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "13.5px",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(16, 185, 129, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* Botão Entrar / Criar Senha */}
          <button
            type="submit"
            disabled={loading || unauthorized}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: unauthorized
                ? "#ef4444"
                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 800,
              cursor: loading || unauthorized ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: unauthorized
                ? "0 4px 15px rgba(239, 68, 68, 0.4)"
                : "0 4px 20px rgba(16, 185, 129, 0.35)",
              transition: "all 0.2s ease",
              marginTop: "8px",
            }}
          >
            {loading ? (
              <span>Autenticando com Supabase...</span>
            ) : unauthorized ? (
              <span>Acesso Bloqueado...</span>
            ) : (
              <>
                <span>{isFirstAccess ? "Salvar Senha & Acessar OD METRICS" : "Entrar no OD METRICS"}</span>
                <ArrowRight style={{ width: "16px", height: "16px" }} />
              </>
            )}
          </button>
        </form>

        {/* Rodapé Seguro */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
            fontSize: "11px",
            color: "#64748b",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span>Painel blindado por criptografia de ponta a ponta</span>
          <span>Tentativas não autorizadas serão redirecionadas e descartadas.</span>
        </div>
      </div>
    </div>
  );
}

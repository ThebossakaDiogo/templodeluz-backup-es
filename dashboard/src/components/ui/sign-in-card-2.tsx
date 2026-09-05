import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertTriangle, KeyRound, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ALLOWED_ADMIN_EMAILS = new Set([
  "thebossakadiogo@gmail.com",
  "otaviov.quinalia@gmail.com",
]);

interface SignInCardProps {
  onLoginSuccess: () => void;
}

export function SignInCard({ onLoginSuccess }: SignInCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Por favor, informe seu e-mail.");
      return;
    }

    // Validação estrita da Whitelist
    if (!ALLOWED_ADMIN_EMAILS.has(cleanEmail)) {
      setUnauthorized(true);
      setError("ACESSO NEGADO: Usuário não autorizado.");
      setTimeout(() => {
        window.location.href = "about:blank";
      }, 1000);
      return;
    }

    if (!password) {
      setError("Por favor, informe sua senha.");
      return;
    }

    if (isFirstAccess) {
      if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 dígitos.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas informadas não coincidem.");
        return;
      }

      setIsLoading(true);
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes("already registered")) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (signInError) {
              setError("Esta conta já possui senha cadastrada. Utilize a opção de login.");
              setIsFirstAccess(false);
              setIsLoading(false);
              return;
            }
            onLoginSuccess();
            return;
          }
          throw signUpError;
        }

        if (data.session) {
          setSuccessMsg("Senha configurada com sucesso! Entrando...");
          setTimeout(onLoginSuccess, 1000);
        } else {
          setSuccessMsg("Senha salva! Faça o login normalmente.");
          setIsFirstAccess(false);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao configurar senha.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes("invalid login credentials")) {
            setError("Senha incorreta ou acesso ainda não configurado.");
          } else {
            setError(signInError.message || "Credenciais inválidas.");
          }
          setIsLoading(false);
          return;
        }

        if (data.session) {
          onLoginSuccess();
        }
      } catch (err: any) {
        setError(err.message || "Falha na autenticação.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const inputBoxStyle = (focusKey: string): React.CSSProperties => ({
    position: "relative",
    borderRadius: "14px",
    background: "var(--surface-1, #fffdfa)",
    border: focusedInput === focusKey
      ? "2px solid var(--accent-primary, #FF3377)"
      : "2px solid var(--border-subtle, rgba(43,11,46,0.12))",
    boxShadow: focusedInput === focusKey
      ? "3px 3px 0 rgba(255,51,119,0.25)"
      : "none",
    transition: "all 0.2s ease",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "46px",
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "0 14px 0 42px",
    color: "var(--text-primary, #2B0B2E)",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "var(--font-body, inherit)",
  };

  const iconColor = (focusKey: string) =>
    focusedInput === focusKey
      ? "var(--accent-primary, #FF3377)"
      : "var(--text-muted, #777169)";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "var(--app-bg, #FFF9E6)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
      }}
    >
      {/* Glow coral/vinho sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 65% 55% at 50% -10%, rgba(255,51,119,0.16) 0%, rgba(157,28,187,0.10) 42%, rgba(255,249,230,0.9) 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "760px",
          height: "360px",
          background: "radial-gradient(ellipse at bottom, rgba(43,11,46,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "20px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "var(--surface-card, #FFFFFF)",
            border: "2px solid var(--border, rgba(43,11,46,0.16))",
            borderRadius: "24px",
            boxShadow: "var(--shadow-neo-pop-card, 4px 4px 0 rgba(43,11,46,0.45))",
            padding: "32px 28px 26px",
          }}
        >
          {/* Cabeçalho */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <img
              src="/icons/icon-192.png"
              alt="OD Metrics"
              width={64}
              height={64}
              style={{
                borderRadius: "18px",
                marginBottom: "14px",
                boxShadow: "4px 4px 0 #FF3377",
              }}
            />
            <h1
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                fontSize: "24px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "var(--text-primary, #2B0B2E)",
                margin: 0,
              }}
            >
              OD <span style={{ color: "var(--accent-primary, #FF3377)" }}>METRICS</span>
            </h1>
            <p
              style={{
                fontSize: "12.5px",
                color: "var(--text-muted, #777169)",
                margin: "6px 0 0",
                fontWeight: 600,
              }}
            >
              Terminal Seguro de Inteligência & Tracking
            </p>
          </div>

          {/* Erro / Acesso negado */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "12.5px",
                fontWeight: 700,
                background: "var(--danger-soft, #F4DFDC)",
                border: "1px solid var(--danger, #A84D49)",
                color: "var(--danger, #A84D49)",
              }}
            >
              <AlertTriangle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Sucesso */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "12.5px",
                fontWeight: 700,
                background: "var(--success-soft, #E0EFE7)",
                border: "1px solid var(--success, #287a55)",
                color: "var(--success, #287a55)",
              }}
            >
              <ShieldCheck style={{ width: "16px", height: "16px", flexShrink: 0 }} />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {/* E-mail */}
            <div>
              <label
                htmlFor="admin-email"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-secondary, #6C586B)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "6px",
                }}
              >
                E-mail Administrativo
              </label>
              <div style={inputBoxStyle("email")}>
                <Mail
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: iconColor("email"),
                    transition: "color 0.2s ease",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  disabled={isLoading || unauthorized}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label
                  htmlFor="admin-password"
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--text-secondary, #6C586B)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {isFirstAccess ? "Criar Senha" : "Sua Senha"}
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
                    color: "var(--accent-primary, #FF3377)",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {isFirstAccess ? "Já tenho senha" : "Criar nova senha"}
                </button>
              </div>
              <div style={inputBoxStyle("password")}>
                <Lock
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: iconColor("password"),
                    transition: "color 0.2s ease",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isFirstAccess ? "Mínimo de 6 dígitos" : "Digite sua senha"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  disabled={isLoading || unauthorized}
                  style={{ ...inputStyle, paddingRight: "44px" }}
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
                    cursor: "pointer",
                    color: "var(--text-muted, #777169)",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: "15px", height: "15px" }} />
                  ) : (
                    <Eye style={{ width: "15px", height: "15px" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmação de senha */}
            {isFirstAccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <label
                  htmlFor="admin-confirm-password"
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--text-secondary, #6C586B)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "6px",
                  }}
                >
                  Confirmar Nova Senha
                </label>
                <div style={inputBoxStyle("confirm")}>
                  <KeyRound
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "16px",
                      height: "16px",
                      color: iconColor("confirm"),
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="admin-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha criada"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedInput("confirm")}
                    onBlur={() => setFocusedInput(null)}
                    disabled={isLoading || unauthorized}
                    style={inputStyle}
                  />
                </div>
              </motion.div>
            )}

            {/* Lembrar acesso */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "2px" }}>
              <input
                id="remember-admin"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: "15px",
                  height: "15px",
                  accentColor: "var(--accent-primary, #FF3377)",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              />
              <label
                htmlFor="remember-admin"
                style={{ fontSize: "12px", color: "var(--text-muted, #777169)", cursor: "pointer", fontWeight: 600 }}
              >
                Manter sessão conectada
              </label>
            </div>

            {/* Botão principal */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={isLoading || unauthorized}
              style={{
                width: "100%",
                height: "48px",
                marginTop: "6px",
                borderRadius: "14px",
                border: "2px solid rgba(43,11,46,0.18)",
                background: "linear-gradient(135deg, #FF3377 0%, #D81B60 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 900,
                letterSpacing: "0.04em",
                cursor: isLoading || unauthorized ? "not-allowed" : "pointer",
                boxShadow: "4px 4px 0 rgba(43,11,46,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: isLoading ? 0.75 : 1,
              }}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="spin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                ) : (
                  <motion.span
                    key="txt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <span>{isFirstAccess ? "SALVAR SENHA & ENTRAR" : "ENTRAR NO OD METRICS"}</span>
                    <ArrowRight style={{ width: "16px", height: "16px" }} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Rodapé */}
          <div
            style={{
              marginTop: "22px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle, rgba(43,11,46,0.12))",
              textAlign: "center",
              fontSize: "11px",
              color: "var(--text-muted, #777169)",
              fontWeight: 600,
            }}
          >
            <span>Terminal Seguro de Alta Performance</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

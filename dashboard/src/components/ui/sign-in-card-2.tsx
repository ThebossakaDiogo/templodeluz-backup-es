import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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

  // Efeito 3D de inclinação do cartão no mouse
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

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

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#03060d",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ── Background com a paleta oficial do OD METRICS (Navy & Emerald & Cyan) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 50% -10%, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.12) 40%, rgba(3, 6, 13, 0.98) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Brilho esmeralda inferior */}
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "400px",
          background: "radial-gradient(ellipse at bottom, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Luzes dinâmicas de fundo */}
      <motion.div
        animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: 7, repeat: Infinity, repeatType: "mirror" }}
        style={{
          position: "absolute",
          top: "10%",
          left: "20%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", delay: 1 }}
        style={{
          position: "absolute",
          bottom: "15%",
          right: "20%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      {/* Grid sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* ── Container do Cartão 3D ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "20px",
          position: "relative",
          zIndex: 10,
          perspective: 1500,
        }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 12 }}
        >
          <div style={{ position: "relative" }}>
            {/* Feixes de luz viajantes pelas bordas */}
            <div
              style={{
                position: "absolute",
                inset: "-1px",
                borderRadius: "20px",
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              {/* Feixe Topo (Verde Esmeralda) */}
              <motion.div
                animate={{ left: ["-50%", "100%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
                style={{
                  position: "absolute",
                  top: 0,
                  height: "2px",
                  width: "50%",
                  background: "linear-gradient(90deg, transparent, #10b981, transparent)",
                  boxShadow: "0 0 12px #10b981",
                }}
              />

              {/* Feixe Direita (Ciano) */}
              <motion.div
                animate={{ top: ["-50%", "100%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8, delay: 0.7 }}
                style={{
                  position: "absolute",
                  right: 0,
                  width: "2px",
                  height: "50%",
                  background: "linear-gradient(180deg, transparent, #06b6d4, transparent)",
                  boxShadow: "0 0 12px #06b6d4",
                }}
              />

              {/* Feixe Base */}
              <motion.div
                animate={{ right: ["-50%", "100%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8, delay: 1.4 }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  height: "2px",
                  width: "50%",
                  background: "linear-gradient(270deg, transparent, #10b981, transparent)",
                  boxShadow: "0 0 12px #10b981",
                }}
              />

              {/* Feixe Esquerda */}
              <motion.div
                animate={{ bottom: ["-50%", "100%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8, delay: 2.1 }}
                style={{
                  position: "absolute",
                  left: 0,
                  width: "2px",
                  height: "50%",
                  background: "linear-gradient(0deg, transparent, #06b6d4, transparent)",
                  boxShadow: "0 0 12px #06b6d4",
                }}
              />
            </div>

            {/* Borda de vidro e Corpo do Cartão */}
            <div
              style={{
                background: "linear-gradient(165deg, rgba(13, 22, 42, 0.92) 0%, rgba(6, 12, 24, 0.96) 100%)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderTop: "1px solid rgba(16, 185, 129, 0.35)",
                boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.08)",
                padding: "34px 30px 28px",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* Cabeçalho Centralizado com Logo OD */}
              <div style={{ textAlign: "center", marginBottom: "26px" }}>
                <img
                  src="/icons/icon-192.png"
                  alt="OD Metrics"
                  width={68}
                  height={68}
                  style={{ borderRadius: "19px", marginBottom: "14px", boxShadow: "0 12px 34px rgba(255, 51, 119, 0.3)" }}
                />

                <h1
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "22px",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  OD <span style={{ color: "#10b981" }}>METRICS</span>
                </h1>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#8292a8",
                    margin: "5px 0 0",
                    fontWeight: 500,
                  }}
                >
                  Terminal Seguro de Inteligência & Tracking
                </p>
              </div>

              {/* Mensagem de Erro / Acesso Negado */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginBottom: "18px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: unauthorized ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.12)",
                    border: unauthorized ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                  }}
                >
                  <AlertTriangle style={{ width: "16px", height: "16px", flexShrink: 0, color: "#f87171" }} />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Mensagem de Sucesso */}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginBottom: "18px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    color: "#6ee7b7",
                  }}
                >
                  <ShieldCheck style={{ width: "16px", height: "16px", flexShrink: 0, color: "#10b981" }} />
                  <span>{successMsg}</span>
                </motion.div>
              )}

              {/* Formulário de Login */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* CAMPO DE E-MAIL */}
                <div>
                  <label
                    htmlFor="admin-email"
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "6px",
                    }}
                  >
                    E-mail Administrativo
                  </label>

                  <div
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      background: "rgba(9, 16, 31, 0.8)",
                      border:
                        focusedInput === "email"
                          ? "1px solid #10b981"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow:
                        focusedInput === "email"
                          ? "0 0 16px rgba(16, 185, 129, 0.25)"
                          : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Mail
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "16px",
                        height: "16px",
                        color: focusedInput === "email" ? "#10b981" : "#64748b",
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
                      style={{
                        width: "100%",
                        height: "44px",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        padding: "0 14px 0 44px", // PADDING SEGURO: ÍCONE NUNCA TOCA NO TEXTO
                        color: "#ffffff",
                        fontSize: "13.5px",
                        fontWeight: 600,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    />
                  </div>
                </div>

                {/* CAMPO DE SENHA */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label
                      htmlFor="admin-password"
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#94a3b8",
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
                        color: "#10b981",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {isFirstAccess ? "Já tenho senha" : "Criar nova senha"}
                    </button>
                  </div>

                  <div
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      background: "rgba(9, 16, 31, 0.8)",
                      border:
                        focusedInput === "password"
                          ? "1px solid #10b981"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow:
                        focusedInput === "password"
                          ? "0 0 16px rgba(16, 185, 129, 0.25)"
                          : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Lock
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "16px",
                        height: "16px",
                        color: focusedInput === "password" ? "#10b981" : "#64748b",
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
                      style={{
                        width: "100%",
                        height: "44px",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        padding: "0 44px 0 44px", // PADDING SEGURO NAS DUAS PONTAS
                        color: "#ffffff",
                        fontSize: "13.5px",
                        fontWeight: 600,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                        cursor: "pointer",
                        color: "#64748b",
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

                {/* CONFIRMAÇÃO DE SENHA NO PRIMEIRO ACESSO */}
                {isFirstAccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label
                      htmlFor="admin-confirm-password"
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "6px",
                      }}
                    >
                      Confirmar Nova Senha
                    </label>

                    <div
                      style={{
                        position: "relative",
                        borderRadius: "12px",
                        background: "rgba(9, 16, 31, 0.8)",
                        border:
                          focusedInput === "confirm"
                            ? "1px solid #10b981"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow:
                          focusedInput === "confirm"
                            ? "0 0 16px rgba(16, 185, 129, 0.25)"
                            : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <KeyRound
                        style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "16px",
                          height: "16px",
                          color: focusedInput === "confirm" ? "#10b981" : "#64748b",
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
                        style={{
                          width: "100%",
                          height: "44px",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          padding: "0 14px 0 44px",
                          color: "#ffffff",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Lembrar Acesso */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "2px" }}>
                  <input
                    id="remember-admin"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: "15px",
                      height: "15px",
                      accentColor: "#10b981",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  />
                  <label
                    htmlFor="remember-admin"
                    style={{ fontSize: "12px", color: "#94a3b8", cursor: "pointer", fontWeight: 600 }}
                  >
                    Manter sessão conectada
                  </label>
                </div>

                {/* BOTÃO PRINCIPAL DE ENTRAR */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={isLoading || unauthorized}
                  style={{
                    width: "100%",
                    height: "46px",
                    marginTop: "8px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 900,
                    letterSpacing: "0.04em",
                    cursor: isLoading || unauthorized ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "box-shadow 0.2s ease, opacity 0.2s ease",
                    opacity: isLoading ? 0.7 : 1,
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

              {/* Rodapé do Cartão */}
              <div
                style={{
                  marginTop: "22px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                <span>Terminal Seguro de Alta Performance</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

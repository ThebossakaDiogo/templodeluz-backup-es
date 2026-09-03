import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertTriangle, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const ALLOWED_ADMIN_EMAILS = new Set([
  "thebossakadiogo@gmail.com",
  "otaviov.quinalia@gmail.com",
]);

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className
      )}
      {...props}
    />
  );
}

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

  // Efeito 3D de rotação do Card com o mouse
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

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
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
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
          setSuccessMsg("Senha salva! Faça seu login normalmente.");
          setIsFirstAccess(false);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao salvar senha.");
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
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center font-sans select-none">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/30 via-purple-900/40 to-black pointer-events-none" />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-purple-400/20 blur-[80px] pointer-events-none" />
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-purple-300/15 blur-[60px] pointer-events-none"
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-purple-500/15 blur-[60px] pointer-events-none"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1,
        }}
      />

      {/* Animated glow spots */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse opacity-40 pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000 opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10 p-4"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div className="relative group">
            {/* Card glow effect */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                  "0 0 15px 5px rgba(255,255,255,0.05)",
                  "0 0 10px 2px rgba(255,255,255,0.03)",
                ],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "mirror",
              }}
            />

            {/* Traveling light beam effect */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
              {/* Top light beam */}
              <motion.div
                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{
                  left: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                }}
                transition={{
                  left: {
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1,
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                  },
                }}
              />

              {/* Right light beam */}
              <motion.div
                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{
                  top: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                }}
                transition={{
                  top: {
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 0.6,
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.6,
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 0.6,
                  },
                }}
              />

              {/* Bottom light beam */}
              <motion.div
                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{
                  right: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                }}
                transition={{
                  right: {
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.2,
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.2,
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.2,
                  },
                }}
              />

              {/* Left light beam */}
              <motion.div
                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                initial={{ filter: "blur(2px)" }}
                animate={{
                  bottom: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                  filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                }}
                transition={{
                  bottom: {
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 1.8,
                  },
                  opacity: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.8,
                  },
                  filter: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    delay: 1.8,
                  },
                }}
              />

              {/* Subtle corner glow spots */}
              <motion.div
                className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
              />
              <motion.div
                className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatType: "mirror", delay: 0.5 }}
              />
              <motion.div
                className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatType: "mirror", delay: 1 }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2.3, repeat: Infinity, repeatType: "mirror", delay: 1.5 }}
              />
            </div>

            {/* Card border glow */}
            <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />

            {/* Glass card background */}
            <div className="relative bg-black/60 backdrop-blur-2xl rounded-2xl p-6 border border-white/[0.08] shadow-2xl overflow-hidden">
              {/* Subtle card inner patterns */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: "30px 30px",
                }}
              />

              {/* Logo e cabeçalho OD METRICS */}
              <div className="text-center space-y-1 mb-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="mx-auto w-11 h-11 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center relative overflow-hidden shadow-lg shadow-emerald-500/20"
                >
                  <span
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200"
                  >
                    OD
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent opacity-50" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  className="text-xl font-extrabold text-white tracking-tight"
                >
                  OD <span className="text-emerald-400">METRICS</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-xs font-medium"
                >
                  Terminal Seguro de Inteligência & Tracking
                </motion.p>
              </div>

              {/* Alerta de erro ou acesso negado */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-bold border",
                    unauthorized
                      ? "bg-red-500/25 border-red-500/50 text-red-200"
                      : "bg-red-500/15 border-red-500/30 text-red-300"
                  )}
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Alerta de sucesso */}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl p-3 text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                >
                  {successMsg}
                </motion.div>
              )}

              {/* Formulário de Login */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  {/* Campo de E-mail */}
                  <motion.div
                    className={cn("relative", focusedInput === "email" && "z-10")}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="absolute -inset-[0.5px] bg-gradient-to-r from-emerald-500/20 via-white/5 to-teal-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />

                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail
                        className={cn(
                          "absolute left-3 w-4 h-4 transition-all duration-300",
                          focusedInput === "email" ? "text-emerald-400" : "text-white/40"
                        )}
                      />

                      <Input
                        type="email"
                        placeholder="E-mail de acesso"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        disabled={isLoading || unauthorized}
                        className="w-full bg-white/5 border-transparent focus:border-emerald-500/40 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10"
                      />

                      {focusedInput === "email" && (
                        <motion.div
                          layoutId="input-highlight"
                          className="absolute inset-0 bg-white/5 -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Campo de Senha */}
                  <motion.div
                    className={cn("relative", focusedInput === "password" && "z-10")}
                    whileFocus={{ scale: 1.02 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="absolute -inset-[0.5px] bg-gradient-to-r from-emerald-500/20 via-white/5 to-teal-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />

                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock
                        className={cn(
                          "absolute left-3 w-4 h-4 transition-all duration-300",
                          focusedInput === "password" ? "text-emerald-400" : "text-white/40"
                        )}
                      />

                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={isFirstAccess ? "Criar senha (mín. 6 dígitos)" : "Sua senha"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        disabled={isLoading || unauthorized}
                        className="w-full bg-white/5 border-transparent focus:border-emerald-500/40 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white/10"
                      />

                      <div
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 cursor-pointer select-none"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                        ) : (
                          <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                        )}
                      </div>

                      {focusedInput === "password" && (
                        <motion.div
                          layoutId="input-highlight"
                          className="absolute inset-0 bg-white/5 -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Confirmação de Senha no Primeiro Acesso */}
                  {isFirstAccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn("relative", focusedInput === "confirmPassword" && "z-10")}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <KeyRound
                          className={cn(
                            "absolute left-3 w-4 h-4 transition-all duration-300",
                            focusedInput === "confirmPassword"
                              ? "text-emerald-400"
                              : "text-white/40"
                          )}
                        />

                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirme sua nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onFocus={() => setFocusedInput("confirmPassword")}
                          onBlur={() => setFocusedInput(null)}
                          disabled={isLoading || unauthorized}
                          className="w-full bg-white/5 border-transparent focus:border-emerald-500/40 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white/10"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Lembrar-me e Primeiro Acesso */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-emerald-500 checked:border-emerald-500 focus:outline-none transition-all duration-200 cursor-pointer"
                      />
                      {rememberMe && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center text-black pointer-events-none"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <label
                      htmlFor="remember-me"
                      className="text-xs text-white/60 hover:text-white/80 transition-colors duration-200 cursor-pointer"
                    >
                      Lembrar acesso
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstAccess(!isFirstAccess);
                      setError("");
                    }}
                    className="text-xs text-emerald-400/90 hover:text-emerald-300 transition-colors duration-200 font-semibold bg-transparent border-none cursor-pointer p-0"
                  >
                    {isFirstAccess ? "Já possuo senha" : "Criar nova senha"}
                  </button>
                </div>

                {/* Botão Entrar / Criar */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || unauthorized}
                  className="w-full relative group/button mt-5 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />

                  <div className="relative overflow-hidden bg-white text-black font-bold h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -z-10"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      style={{
                        opacity: isLoading ? 1 : 0,
                        transition: "opacity 0.3s ease",
                      }}
                    />

                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-4 h-4 border-2 border-black/80 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="button-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-wider"
                        >
                          <span>{isFirstAccess ? "Salvar Senha & Entrar" : "Entrar no OD METRICS"}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-1 transition-transform duration-300" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              </form>

              {/* Rodapé discreto sem qualquer menção de banco */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] text-center text-[10.5px] text-white/40">
                <span>Terminal Seguro de Alta Performance</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

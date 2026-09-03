import { useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Smartphone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ProfileViewProps {
  currentUserEmail?: string;
  onSignOut?: () => void;
}

export function ProfileView({ currentUserEmail, onSignOut }: ProfileViewProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const email = currentUserEmail || "admin@templodeluz.com";
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = email.includes("theboss") ? "Diogo (TheBoss)" : "Otávio Quinalia";

  // Medidor de força de senha
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", percent: 0, color: "#64748b" };
    if (pass.length < 6) return { label: "Muito Curta (mín. 6)", percent: 25, color: "#ef4444" };
    if (pass.length < 8) return { label: "Média", percent: 60, color: "#f59e0b" };
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    if (hasNumber && hasSpecial) return { label: "Excelente (Forte)", percent: 100, color: "#10b981" };
    return { label: "Boa", percent: 80, color: "#10b981" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newPassword) {
      setErrorMsg("Informe a nova senha desejada.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("As senhas informadas não coincidem. Verifique e tente novamente.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg("Senha atualizada com sucesso! Suas próximas conexões utilizarão a nova credencial.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao atualizar senha. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
      {/* ── Cartão de Cabeçalho do Administrador ── */}
      <div
        className="card"
        style={{
          padding: "26px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow de fundo */}
        <div
          style={{
            position: "absolute",
            right: "-30px",
            top: "-30px",
            width: "220px",
            height: "220px",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#03060d",
              fontWeight: 900,
              fontSize: "24px",
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: "0 0 24px rgba(16, 185, 129, 0.4)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {displayName}
              </h2>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  background: "rgba(16, 185, 129, 0.18)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Super Admin
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", color: "var(--text-muted)", fontSize: "12px" }}>
              <Mail style={{ width: "13px", height: "13px", color: "var(--primary-green)" }} />
              <span style={{ fontWeight: 600 }}>{email}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", color: "var(--text-muted)", fontSize: "11px" }}>
              <ShieldCheck style={{ width: "13px", height: "13px", color: "#38bdf8" }} />
              <span>Acesso restrito por Whitelist no OD METRICS</span>
            </div>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="btn"
            style={{
              borderColor: "rgba(239, 68, 68, 0.4)",
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.08)",
              padding: "8px 16px",
            }}
          >
            <LogOut style={{ width: "14px", height: "14px" }} />
            <span>Desconectar Sessão</span>
          </button>
        )}
      </div>

      {/* ── Grid Principal de Configurações ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* CARD 1: FORMULÁRIO DE ALTERAÇÃO DE SENHA */}
        <div className="card" style={{ padding: "26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
              }}
            >
              <KeyRound style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Alterar Senha de Acesso
              </h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                Defina uma nova senha forte para o seu acesso administrativo
              </p>
            </div>
          </div>

          {/* Feedback de Sucesso */}
          {successMsg && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "#6ee7b7",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 style={{ width: "16px", height: "16px", flexShrink: 0, color: "#10b981" }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Feedback de Erro */}
          {errorMsg && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle style={{ width: "16px", height: "16px", flexShrink: 0, color: "#ef4444" }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Campo Nova Senha */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                }}
              >
                Nova Senha
              </label>

              <div
                style={{
                  position: "relative",
                  borderRadius: "10px",
                  background: "var(--bg-surface-alt)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Lock
                  style={{
                    position: "absolute",
                    left: "12px",
                    width: "15px",
                    height: "15px",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo de 6 dígitos"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "42px",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "0 40px 0 38px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: "15px", height: "15px" }} />
                  ) : (
                    <Eye style={{ width: "15px", height: "15px" }} />
                  )}
                </button>
              </div>

              {/* Indicador de Força */}
              {newPassword && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Força da Senha:</span>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ height: "4px", width: "100%", background: "var(--border-subtle)", borderRadius: "99px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${strength.percent}%`,
                        background: strength.color,
                        transition: "all 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Campo Confirmar Nova Senha */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                }}
              >
                Confirmar Nova Senha
              </label>

              <div
                style={{
                  position: "relative",
                  borderRadius: "10px",
                  background: "var(--bg-surface-alt)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <KeyRound
                  style={{
                    position: "absolute",
                    left: "12px",
                    width: "15px",
                    height: "15px",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "42px",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "0 14px 0 38px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Botão Salvar Senha */}
            <button
              type="submit"
              disabled={loading || !newPassword}
              className="btn btn-emerald"
              style={{
                height: "44px",
                fontSize: "12.5px",
                fontWeight: 900,
                marginTop: "6px",
                letterSpacing: "0.02em",
                opacity: loading || !newPassword ? 0.6 : 1,
              }}
            >
              {loading ? "Salvando Nova Senha..." : "Atualizar Minha Senha"}
            </button>
          </form>
        </div>

        {/* CARD 2: POLÍTICAS DE SEGURANÇA & SESSÃO ATIVA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Card Detalhes da Conta */}
          <div className="card" style={{ padding: "26px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 14px" }}>
              Detalhes de Segurança da Conta
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Nível de Permissão:</span>
                <strong style={{ color: "#10b981" }}>Administrador Master</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Autenticação:</span>
                <strong style={{ color: "var(--text-primary)" }}>Token JWT Criptografado</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-muted)" }}>Proteção de Dados:</span>
                <strong style={{ color: "var(--text-primary)" }}>RLS Estrita</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Status do Acesso:</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#10b981", fontWeight: 800 }}>
                  <span className="pulse-emerald" />
                  Ativo & Protegido
                </span>
              </div>
            </div>
          </div>

          {/* Card Dispositivos e Sessão PWA */}
          <div className="card" style={{ padding: "22px 26px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 12px" }}>
              Acesso Móvel & PWA
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                  flexShrink: 0,
                }}
              >
                <Smartphone style={{ width: "18px", height: "18px" }} />
              </div>

              <div style={{ fontSize: "12px" }}>
                <strong style={{ color: "var(--text-primary)", display: "block" }}>
                  Aplicativo PWA Disponível
                </strong>
                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                  Você pode acessar o OD METRICS no iPhone e Android com sessão persistente.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

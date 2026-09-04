import type { Lead } from "@/types";

export type AbandonmentCategory =
  | "paid"
  | "live"
  | "pix_unpaid_1h"
  | "pix_expired"
  | "card_declined"
  | "checkout_abandoned"
  | "quiz_abandoned"
  | "immediate_bounce";

export interface AbandonmentDiagnostic {
  category: AbandonmentCategory;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  detailedDescription: string;
  isRecoverable: boolean;
  stepIndex: number;
  stepName: string;
  stepLabel: string;
  minutesSinceActivity: number;
  hoursSincePix?: number;
}

export const QUIZ_STEPS_MAP: Record<number, { name: string; label: string }> = {
  1: { name: "intro",    label: "Início do Quiz" },
  2: { name: "ente",     label: "Nome do Ente Querido" },
  3: { name: "relacao",  label: "Vínculo Familiar" },
  4: { name: "tempo",    label: "Tempo e Sentimento" },
  5: { name: "mensagem", label: "Mensagem e Intenção" },
  6: { name: "confirma", label: "Confirmação dos Dados" },
  7: { name: "loading",  label: "Preparação da Carta" },
  8: { name: "result",   label: "Checkout e Doação" },
};

export function diagnoseLeadAbandonment(lead: Lead, now: Date = new Date()): AbandonmentDiagnostic {
  const isPaid = lead.payment_status === "paid";
  const isDeclined = lead.card_declined === true;
  // Apenas considera PIX se a cobrança foi comprovadamente gerada no gateway (evita falsos positivos de quem apenas abriu o modal)
  const isPix = Boolean(lead.pix_generated === true || lead.pix_generated_at);
  const isCheckout = lead.checkout_initiated === true || lead.highest_step_index >= 8;

  // Tempos de referência
  const activityDate = new Date(lead.updated_at || lead.created_at || now.toISOString());
  const diffMs = Math.max(0, now.getTime() - activityDate.getTime());
  const minutesSinceActivity = Math.round(diffMs / (1000 * 60));

  const pixDate = lead.pix_generated_at ? new Date(lead.pix_generated_at) : activityDate;
  const hoursSincePix = isPix ? Math.max(0, (now.getTime() - pixDate.getTime()) / (1000 * 60 * 60)) : undefined;

  const hasContact = Boolean(
    (lead.lead_phone && lead.lead_phone.replace(/\D/g, "").length >= 8) ||
    (lead.lead_email && lead.lead_email.includes("@"))
  );

  const stepIndex = lead.highest_step_index || lead.current_step_index || 1;
  const stepInfo = QUIZ_STEPS_MAP[stepIndex] || {
    name: lead.current_step_name || "quiz",
    label: `Etapa ${stepIndex}`,
  };

  // 1. Pago / Concluído
  if (isPaid) {
    return {
      category: "paid",
      badgeLabel: "Pago / Concluído",
      badgeColor: "#10B981",
      badgeBg: "rgba(16, 185, 129, 0.12)",
      badgeBorder: "rgba(16, 185, 129, 0.28)",
      detailedDescription: "Doação concluída e confirmada pela instituição.",
      isRecoverable: false,
      stepIndex: 8,
      stepName: "result",
      stepLabel: "Checkout e Doação",
      minutesSinceActivity,
    };
  }

  // 2. Ao Vivo / Em Navegação Recente (< 10 minutos)
  if (minutesSinceActivity <= 10) {
    return {
      category: "live",
      badgeLabel: "Ao Vivo Agora",
      badgeColor: "#38BDF8",
      badgeBg: "rgba(56, 189, 248, 0.12)",
      badgeBorder: "rgba(56, 189, 248, 0.28)",
      detailedDescription: `Navegando no quiz há ${minutesSinceActivity}m na ${stepInfo.label}.`,
      isRecoverable: false,
      stepIndex,
      stepName: stepInfo.name,
      stepLabel: stepInfo.label,
      minutesSinceActivity,
    };
  }

  // 3. Cartão Recusado
  if (isDeclined) {
    return {
      category: "card_declined",
      badgeLabel: "Cartão Recusado",
      badgeColor: "#EF4444",
      badgeBg: "rgba(239, 68, 68, 0.12)",
      badgeBorder: "rgba(239, 68, 68, 0.28)",
      detailedDescription: "Tentativa de pagamento em cartão recusada pelo emissor.",
      isRecoverable: hasContact,
      stepIndex: 8,
      stepName: "result",
      stepLabel: "Checkout e Doação",
      minutesSinceActivity,
    };
  }

  // 4. PIX Gerado e Não Pago há mais de 1 hora
  if (isPix) {
    const hours = hoursSincePix || 0;
    if (hours >= 24) {
      return {
        category: "pix_expired",
        badgeLabel: "PIX Expirado",
        badgeColor: "#64748B",
        badgeBg: "rgba(100, 116, 139, 0.12)",
        badgeBorder: "rgba(100, 116, 139, 0.28)",
        detailedDescription: `Cobrança PIX gerada há ${Math.round(hours)}h e expirada sem pagamento.`,
        isRecoverable: hasContact,
        stepIndex: 8,
        stepName: "result",
        stepLabel: "Checkout e Doação",
        minutesSinceActivity,
        hoursSincePix: hours,
      };
    }

    if (hours >= 1) {
      return {
        category: "pix_unpaid_1h",
        badgeLabel: "PIX Não Pago (+1h)",
        badgeColor: "#F59E0B",
        badgeBg: "rgba(245, 158, 11, 0.12)",
        badgeBorder: "rgba(245, 158, 11, 0.28)",
        detailedDescription: `Gerou o código PIX há ${Math.round(hours)}h e ainda não efetuou o pagamento.`,
        isRecoverable: hasContact,
        stepIndex: 8,
        stepName: "result",
        stepLabel: "Checkout e Doação",
        minutesSinceActivity,
        hoursSincePix: hours,
      };
    }

    // PIX Recente (entre 10 min e 1h)
    return {
      category: "pix_unpaid_1h",
      badgeLabel: "PIX Pendente",
      badgeColor: "#F59E0B",
      badgeBg: "rgba(245, 158, 11, 0.12)",
      badgeBorder: "rgba(245, 158, 11, 0.28)",
      detailedDescription: `Cobrança PIX emitida há ${minutesSinceActivity}m aguardando compensação.`,
      isRecoverable: hasContact,
      stepIndex: 8,
      stepName: "result",
      stepLabel: "Checkout e Doação",
      minutesSinceActivity,
      hoursSincePix: hours,
    };
  }

  // 5. Abandono no Checkout (Chegou na Etapa 8 mas não gerou cobrança)
  if (isCheckout) {
    return {
      category: "checkout_abandoned",
      badgeLabel: "Abandono no Checkout",
      badgeColor: "#F97316",
      badgeBg: "rgba(249, 115, 22, 0.12)",
      badgeBorder: "rgba(249, 115, 22, 0.28)",
      detailedDescription: "Chegou na tela final de doação e saiu sem escolher método de pagamento.",
      isRecoverable: hasContact,
      stepIndex: 8,
      stepName: "result",
      stepLabel: "Checkout e Doação",
      minutesSinceActivity,
    };
  }

  // 6. Abandono Imediato / Bounce (Etapa 1 com tempo <= 15s)
  const timeSpent = lead.time_spent_seconds || 0;
  if (stepIndex <= 1 && timeSpent <= 15) {
    return {
      category: "immediate_bounce",
      badgeLabel: "Abandono Imediato",
      badgeColor: "#64748B",
      badgeBg: "rgba(100, 116, 139, 0.10)",
      badgeBorder: "rgba(100, 116, 139, 0.20)",
      detailedDescription: `Visitou a introdução por apenas ${timeSpent}s e fechou a aba.`,
      isRecoverable: false,
      stepIndex: 1,
      stepName: "intro",
      stepLabel: "Início do Quiz",
      minutesSinceActivity,
    };
  }

  // 7. Abandono no Meio do Quiz (Etapas 2 a 7)
  return {
    category: "quiz_abandoned",
    badgeLabel: `Desistiu na Etapa ${stepIndex}`,
    badgeColor: "#A855F7",
    badgeBg: "rgba(168, 85, 247, 0.12)",
    badgeBorder: "rgba(168, 85, 247, 0.28)",
    detailedDescription: `Abandonou ao preencher ${stepInfo.label} após ${timeSpent}s de quiz.`,
    isRecoverable: hasContact,
    stepIndex,
    stepName: stepInfo.name,
    stepLabel: stepInfo.label,
    minutesSinceActivity,
  };
}

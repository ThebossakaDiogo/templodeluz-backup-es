/**
 * Utilitário completo de integração do Meta Pixel (Facebook Ads)
 * Pixel ID: 1076049174870131
 */

export const META_PIXEL_ID = "1076049174870131";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/**
 * Dispara um evento padrão do Meta Pixel
 * Ex: fbqTrack('PageView'), fbqTrack('Purchase', { value: 19.00, currency: 'BRL' })
 */
export function fbqTrack(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.fbq === "function") {
      if (params) {
        window.fbq("track", eventName, params);
      } else {
        window.fbq("track", eventName);
      }
      console.log(`[META PIXEL] track: ${eventName}`, params || "");
    }
  } catch (err) {
    console.warn(`[META PIXEL ERROR] Falha ao disparar evento ${eventName}:`, err);
  }
}

/**
 * Dispara um evento personalizado do Meta Pixel
 * Ex: fbqTrackCustom('Quiz_Step_1_Nome', { step: 1 })
 */
export function fbqTrackCustom(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.fbq === "function") {
      if (params) {
        window.fbq("trackCustom", eventName, params);
      } else {
        window.fbq("trackCustom", eventName);
      }
      console.log(`[META PIXEL CUSTOM] trackCustom: ${eventName}`, params || "");
    }
  } catch (err) {
    console.warn(`[META PIXEL ERROR] Falha ao disparar trackCustom ${eventName}:`, err);
  }
}

/**
 * Rastreia as etapas do Quiz
 */
export function trackQuizStep(step: string, data?: Record<string, any>) {
  const stepLabels: Record<string, { custom: string; title: string; standard?: string }> = {
    intro: {
      custom: "Quiz_Step_1_Nome",
      title: "Etapa 1 - Nome do Consulente",
      standard: "ViewContent",
    },
    ente: {
      custom: "Quiz_Step_2_EnteQuerido",
      title: "Etapa 2 - Nome do Ente Querido",
    },
    relacao: {
      custom: "Quiz_Step_3_Relacao",
      title: "Etapa 3 - Grau de Parentesco",
    },
    tempo: {
      custom: "Quiz_Step_4_Tempo",
      title: "Etapa 4 - Tempo de Partida",
    },
    mensagem: {
      custom: "Quiz_Step_5_Mensagem",
      title: "Etapa 5 - Intenção e Dor Principal",
    },
    confirma: {
      custom: "Quiz_Step_6_Confirma",
      title: "Etapa 6 - Confirmação do Horário",
      standard: "Lead",
    },
    loading: {
      custom: "Quiz_Step_7_Canalizacao",
      title: "Etapa 7 - Canalização Espiritual",
    },
    result: {
      custom: "Quiz_Step_8_Resultado_Oferta",
      title: "Etapa 8 - Página de Agendamento e Doação",
      standard: "InitiateCheckout",
    },
  };

  const current = stepLabels[step] || {
    custom: `Quiz_Step_${step}`,
    title: `Etapa ${step}`,
  };

  // Evento Customizado com nome amigável para relatórios do Meta Ads
  fbqTrackCustom(current.custom, {
    etapa: step,
    titulo: current.title,
    ...data,
  });

  // Evento Padrão correspondente (se houver)
  if (current.standard === "ViewContent") {
    fbqTrack("ViewContent", {
      content_name: current.title,
      content_category: "Quiz Funnel",
    });
  } else if (current.standard === "Lead") {
    fbqTrack("Lead", {
      content_name: "Consulente Agendou Psicografia",
      content_category: "Lead Espiritual",
      ...data,
    });
  } else if (current.standard === "InitiateCheckout") {
    fbqTrack("InitiateCheckout", {
      content_name: "Carta Psicografada Sagrada",
      content_category: "Doação Espiritual",
      value: 19.0,
      currency: "BRL",
    });
  }
}

/**
 * Rastreia o início de uma doação (Checkout Aberto)
 */
export function trackInitiateDonation(options: {
  amountCents: number;
  productName: string;
  productId: string;
  paymentMethod: "pix" | "cartao";
}) {
  const value = Number((options.amountCents / 100).toFixed(2));

  // Evento padrão da Meta
  fbqTrack("InitiateCheckout", {
    value: value,
    currency: "BRL",
    content_name: options.productName,
    content_category: "Doação",
    content_ids: [options.productId],
    num_items: 1,
  });

  // Evento personalizado
  fbqTrackCustom("Iniciou_Doacao", {
    valor: value,
    moeda: "BRL",
    produto: options.productName,
    produto_id: options.productId,
    metodo_pagamento: options.paymentMethod,
  });
}

/**
 * Rastreia doação / compra aprovada com valor monetário
 */
export function trackPurchaseComplete(options: {
  amountCents: number;
  productName: string;
  productId: string;
  paymentMethod: "pix" | "cartao";
  orderId?: string | undefined;
}) {
  const value = Number((options.amountCents / 100).toFixed(2));

  // 1. Evento Padrão Purchase (Compra com Valor Monetário)
  fbqTrack("Purchase", {
    value: value,
    currency: "BRL",
    content_name: options.productName,
    content_type: "product",
    content_ids: [options.productId],
    num_items: 1,
    order_id: options.orderId || `ped_${Date.now()}`,
  });

  // 2. Evento Padrão Donate (Doação na Meta)
  fbqTrack("Donate", {
    value: value,
    currency: "BRL",
    content_name: options.productName,
  });

  // 3. Eventos Personalizados de Alto Impacto para Otimização
  fbqTrackCustom("Doacao_Confirmada", {
    valor: value,
    moeda: "BRL",
    produto: options.productName,
    produto_id: options.productId,
    metodo_pagamento: options.paymentMethod,
    order_id: options.orderId,
  });

  if (options.productId === "carta_sagrada") {
    fbqTrackCustom("Doacao_Carta_Sagrada", {
      valor: value,
      moeda: "BRL",
      metodo: options.paymentMethod,
    });
  } else {
    fbqTrackCustom("Doacao_Cirurgia_Milena", {
      valor: value,
      moeda: "BRL",
      metodo: options.paymentMethod,
    });
  }
}

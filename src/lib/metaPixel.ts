/**
 * Utilitário completo de integração do Meta Pixel (Facebook Ads)
 * Pixel ID: 1076049174870131
 */

export const META_PIXEL_ID = "1076049174870131";

interface MetaFbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
}

declare global {
  interface Window {
    fbq?: MetaFbqFunction;
    _fbq?: unknown;
  }
}

/**
 * Inicializa a fila e injeta o script do Meta Pixel de forma 100% segura
 */
export function initMetaPixel(pixelId = META_PIXEL_ID) {
  if (typeof window === "undefined") return;

  // Guarda o fbclid assim que a pagina abre; o checkout pode acontecer
  // depois de varias trocas de rota e ainda precisa montar o _fbc correto.
  getMetaBrowserAttribution();

  // Se o fbq ainda não foi inicializado, cria a fila padrão do Facebook
  if (!window.fbq) {
    const fbq: MetaFbqFunction = function (...args: unknown[]) {
      if (typeof fbq.callMethod === "function") {
        fbq.callMethod(...args);
      } else {
        fbq.queue = fbq.queue || [];
        fbq.queue.push(args);
      }
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;

    // Injeta o script fbevents.js caso não esteja presente no DOM
    if (!document.querySelector('script[src*="fbevents.js"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        (document.head || document.documentElement).appendChild(script);
      }
    }
  }

  // Inicializa o Pixel ID se ainda não foi configurado
  try {
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  } catch (err) {
    console.warn("[META PIXEL] Erro ao inicializar Pixel:", err);
  }
}

/**
 * Dispara um evento padrão do Meta Pixel
 * Ex: fbqTrack('PageView'), fbqTrack('Purchase', { value: 19.00, currency: 'BRL' })
 */
export function fbqTrack(
  eventName: string,
  params?: Record<string, unknown>,
  eventOptions?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  // Auto-inicializa se necessário
  if (!window.fbq) {
    initMetaPixel();
  }

  try {
    if (typeof window.fbq === "function") {
      if (params) {
        if (eventOptions) {
          window.fbq("track", eventName, params, eventOptions);
        } else {
          window.fbq("track", eventName, params);
        }
      } else {
        window.fbq("track", eventName);
      }
    }
  } catch (err) {
    console.warn(`[META PIXEL ERROR] Falha ao disparar evento ${eventName}:`, err);
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length) || ""
  );
}

export function getMetaBrowserAttribution() {
  if (typeof window === "undefined") return {};

  const currentUrl = new URL(window.location.href);
  let storedFbclid = "";
  let storedFbc = "";
  try {
    storedFbclid = sessionStorage.getItem("templodeluz:fbclid") || "";
    storedFbc = sessionStorage.getItem("templodeluz:fbc") || "";
  } catch {
    // Navegadores com armazenamento bloqueado ainda enviam os demais sinais.
  }
  const fbclid = (currentUrl.searchParams.get("fbclid") || storedFbclid).slice(0, 500);
  if (fbclid) {
    try {
      sessionStorage.setItem("templodeluz:fbclid", fbclid);
    } catch {
      // ignore
    }
  }

  const fbp = readCookie("_fbp");
  const cookieFbc = readCookie("_fbc");
  const fbc = cookieFbc || storedFbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : "");
  if (fbc && fbc !== storedFbc) {
    try {
      sessionStorage.setItem("templodeluz:fbc", fbc);
    } catch {
      // ignore
    }
  }

  return {
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    eventSourceUrl: window.location.href,
  };
}

/**
 * Dispara um evento personalizado do Meta Pixel
 * Ex: fbqTrackCustom('Quiz_Step_1_Nome', { step: 1 })
 */
export function fbqTrackCustom(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  // Auto-inicializa se necessário
  if (!window.fbq) {
    initMetaPixel();
  }

  try {
    if (typeof window.fbq === "function") {
      if (params) {
        window.fbq("trackCustom", eventName, params);
      } else {
        window.fbq("trackCustom", eventName);
      }
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
  paymentMethod?: "pix" | "cartao";
  eventId?: string;
}) {
  const value = Number((options.amountCents / 100).toFixed(2));

  // Evento padrão da Meta
  fbqTrack(
    "InitiateCheckout",
    {
      value: value,
      currency: "BRL",
      content_name: options.productName,
      content_category: "Doação",
      content_ids: [options.productId],
      num_items: 1,
    },
    options.eventId ? { eventID: options.eventId } : undefined,
  );

  // Evento personalizado
  fbqTrackCustom("Iniciou_Doacao", {
    valor: value,
    moeda: "BRL",
    produto: options.productName,
    produto_id: options.productId,
    ...(options.paymentMethod ? { metodo_pagamento: options.paymentMethod } : {}),
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
  orderId?: string;
}) {
  const value = Number((options.amountCents / 100).toFixed(2));

  // 1. Evento Padrão Purchase (Compra com Valor Monetário)
  fbqTrack(
    "Purchase",
    {
      value: value,
      currency: "BRL",
      content_name: options.productName,
      content_type: "product",
      content_ids: [options.productId],
      num_items: 1,
      order_id: options.orderId || `ped_${Date.now()}`,
    },
    options.orderId ? { eventID: options.orderId } : undefined,
  );

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
  } else if (options.productId === "chamada_ao_vivo_milena") {
    fbqTrackCustom("Doacao_Chamada_Ao_Vivo", {
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

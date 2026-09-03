export interface Lead {
  id: string;
  session_id: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  ente_querido: string | null;
  grau_parentesco: string | null;
  mensagem_preview: string | null;
  temas_selecionados: string[] | null;
  current_step_index: number;
  current_step_name: string;
  highest_step_index: number;
  completed: boolean;
  payment_status: "none" | "waiting_payment" | "paid" | "failed";
  last_amount_cents: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentOrder {
  id: string;
  order_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  product_name: string;
  amount_cents: number;
  status: "paid" | "pending" | "failed" | "creating" | "expired";
  payment_method: "pix" | "credit_card";
  gateway?: "connectpay" | "pushinpay" | "stripe" | string;
  created_at: string;
}

export interface DashboardStats {
  // Gerais
  newSubscriptions: number;
  newSubscriptionsDiff: number;
  newOrders: number;
  newOrdersDiff: number;
  totalRevenue: number;
  totalRevenueDiff: number;
  avgOrderRevenue: number;
  avgOrderRevenueDiff: number;

  // PIX Específico
  pixRevenue: number;
  pixCount: number;
  pixPendingCount: number;
  pixPendingAmount: number;

  // Cartão Específico (Stripe)
  cardRevenue: number;
  cardCount: number;
  cardAvgRevenue: number;

  // Geral pendente
  pendingAmount: number;
  pendingCount: number;
}

/** Ponto de dado para gráficos com suporte a PIX e Cartão */
export interface ChartDataPoint {
  dia: string;
  receita?: number;
  receitaPix?: number;
  receitaCartao?: number;
  vendas?: number;
  vendasPix?: number;
  vendasCartao?: number;
  leads?: number;
}

export interface WhatsAppMessage {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  ente_querido?: string;
  grau_parentesco?: string;
  payment_method: "pix" | "credit_card" | "pending" | "none";
  payment_status: "paid" | "pending" | "none";
  amount_cents: number;
  source_page?: string;
  message_preview?: string;
  utm_source?: string;
  created_at: string;
}

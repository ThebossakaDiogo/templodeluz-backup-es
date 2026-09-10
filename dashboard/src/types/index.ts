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
  time_spent_seconds?: number;
  checkout_initiated?: boolean;
  checkout_initiated_at?: string | null;
  checkout_opened?: boolean;
  checkout_opened_at?: string | null;
  checkout_form_started?: boolean;
  checkout_form_started_at?: string | null;
  pix_generated?: boolean;
  pix_generated_at?: string | null;
  card_declined?: boolean;
  card_declined_at?: string | null;
  card_abandoned?: boolean;
  card_abandoned_at?: string | null;
  checkout_status?: string | null;
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
  status: "paid" | "pending" | "failed" | "creating" | "expired" | "in_dispute" | "chargeback";
  payment_method: "pix" | "credit_card";
  gateway?: "connectpay" | "pushinpay" | "stripe" | string;
  created_at: string;
  fulfilled_at?: string;
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

  // Telemetria de Checkout & Retenção
  checkoutsInitiatedCount: number;
  pixGeneratedCount: number;
  cardDeclinedCount: number;
  cardAbandonedCount: number;
  avgQuizTimeSeconds: number;

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

export type WhatsAppThreadStatus = "open" | "resolved" | "opted_out";
export type WhatsAppMessageDirection = "inbound" | "outbound" | "ai";
export type WhatsAppMessageType = "text" | "image" | "document" | "audio";

export interface WhatsAppChatThread {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string;
  ente_querido: string | null;
  payment_status: "paid" | "pending" | "none" | null;
  status: WhatsAppThreadStatus;
  last_message_content: string | null;
  last_message_direction: WhatsAppMessageDirection | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
}

export interface WhatsAppChatMessage {
  id: string;
  thread_id: string;
  direction: WhatsAppMessageDirection;
  message_type: WhatsAppMessageType;
  content: string | null;
  media_url: string | null;
  media_name: string | null;
  delivery_status: "queued" | "sent" | "delivered" | "read" | "failed" | null;
  failure_reason: string | null;
  created_at: string;
}

export interface WhatsAppMaterial {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  mime_type: string;
  size_bytes: number;
  is_active: boolean;
  created_at: string;
}

export interface WhatsAppAiSettings {
  enabled: boolean;
  ai_enabled?: boolean;
  brand_instructions: string;
  tone: string;
  away_message: string | null;
  response_window_minutes: number;
  message_limit: number;
  updated_at: string | null;
}

export interface WhatsAppAiRun {
  id: string;
  thread_id: string;
  status: "draft" | "sent" | "skipped" | "failed";
  summary: string | null;
  error: string | null;
  created_at: string;
}

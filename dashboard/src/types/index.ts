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
  created_at: string;
}

export interface DashboardStats {
  newSubscriptions: number;
  newSubscriptionsDiff: number;
  newOrders: number;
  newOrdersDiff: number;
  avgOrderRevenue: number;
  avgOrderRevenueDiff: number;
  totalRevenue: number;
  totalRevenueDiff: number;
  pendingAmount: number;
  pendingCount: number;
}

/** Ponto de dado para gráficos — chaves em PT-BR */
export interface ChartDataPoint {
  dia: string;
  receita?: number;
  vendas?: number;
  leads?: number;
}

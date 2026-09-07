import { pixFunctionHeaders } from "./pix-config";

export interface PixClientConfig {
  quizOrigin: "original" | "mirrored";
  pixAccountKey: "connectpay_original" | "connectpay_mirrored";
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface PixCustomer {
  name: string;
}

export interface PixCharge {
  orderId: string;
  statusToken: string;
  pixPayload: string;
  qrCodeBase64: string | null;
  expiresAt: string | null;
}

export type PixPaymentStatus =
  | "creating"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "in_dispute"
  | "chargeback";

function functionUrl(config: PixClientConfig, name: string) {
  return `${config.supabaseUrl.replace(/\/$/, "")}/functions/v1/${name}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok || !body) {
    throw new Error(body?.error ?? "Falha ao comunicar com a API PIX.");
  }
  return body;
}

export async function createPixCharge(
  config: PixClientConfig,
  input: {
    productId: string;
    amountCents: number;
    customer: PixCustomer;
    customerPhone?: string | undefined;
    customerEmail?: string | undefined;
    sessionId?: string | undefined;
    enteQuerido?: string | undefined;
    grauParentesco?: string | undefined;
    utms?: Record<string, string | null> | undefined;
  },
): Promise<PixCharge> {
  const statusToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const response = await fetch(functionUrl(config, "create-connectpay-pix"), {
    method: "POST",
    headers: pixFunctionHeaders(config),
    body: JSON.stringify({
      productId: input.productId,
      quizOrigin: config.quizOrigin,
      amountCents: input.amountCents,
      customerName: input.customer.name,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      sessionId: input.sessionId,
      enteQuerido: input.enteQuerido,
      grauParentesco: input.grauParentesco,
      utms: input.utms,
      idempotencyKey: crypto.randomUUID(),
      statusToken,
    }),
  });
  const charge = await readJson<Omit<PixCharge, "statusToken">>(response);
  return { ...charge, statusToken };
}

export async function getPixStatus(config: PixClientConfig, charge: PixCharge) {
  const response = await fetch(functionUrl(config, "get-connectpay-pix-status"), {
    method: "POST",
    headers: pixFunctionHeaders(config),
    body: JSON.stringify({
      orderId: charge.orderId,
      quizOrigin: config.quizOrigin,
      statusToken: charge.statusToken,
    }),
  });
  return readJson<{
    status: PixPaymentStatus;
    paid: boolean;
    expiresAt: string | null;
    updatedAt: string;
  }>(response);
}

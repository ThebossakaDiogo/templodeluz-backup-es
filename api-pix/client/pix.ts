export interface PixClientConfig {
  quizOrigin: 'original' | 'mirrored';
  pixAccountKey: 'connectpay_original' | 'connectpay_mirrored';
  supabaseUrl: string;
  supabaseAnonKey: string;
  accessToken?: string;
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

export type PixPaymentStatus = 'creating' | 'pending' | 'paid' | 'failed' | 'expired' | 'in_dispute' | 'chargeback';

function functionUrl(config: PixClientConfig, name: string) {
  return `${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/${name}`;
}

function headers(config: PixClientConfig) {
  return {
    'Content-Type': 'application/json',
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.accessToken ?? config.supabaseAnonKey}`,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.error ?? 'Falha ao comunicar com a API PIX.');
  return body;
}

export async function createPixCharge(
  config: PixClientConfig,
  input: {
    productId: string;
    amountCents?: number;
    customer: PixCustomer;
    idempotencyKey?: string;
    statusToken?: string;
  },
): Promise<PixCharge> {
  const idempotencyKey = input.idempotencyKey ?? crypto.randomUUID();
  const statusToken = input.statusToken ?? `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const response = await fetch(functionUrl(config, 'create-connectpay-pix'), {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify({
      productId: input.productId,
      quizOrigin: config.quizOrigin,
      amountCents: input.amountCents,
      customerName: input.customer.name,
      idempotencyKey,
      statusToken,
    }),
  });
  const charge = await readJson<Omit<PixCharge, 'statusToken'>>(response);
  return { ...charge, statusToken };
}

export async function getPixStatus(
  config: PixClientConfig,
  orderId: string,
  statusToken: string,
): Promise<{ status: PixPaymentStatus; paid: boolean; expiresAt: string | null; updatedAt: string }> {
  const response = await fetch(functionUrl(config, 'get-connectpay-pix-status'), {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify({ orderId, quizOrigin: config.quizOrigin, statusToken }),
  });
  return readJson(response);
}

export async function waitForPixPayment(
  config: PixClientConfig,
  charge: Pick<PixCharge, 'orderId' | 'statusToken'>,
  options: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {},
) {
  const intervalMs = options.intervalMs ?? 5_000;
  const timeoutMs = options.timeoutMs ?? 15 * 60_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (options.signal?.aborted) throw options.signal.reason;
    const result = await getPixStatus(config, charge.orderId, charge.statusToken);
    if (result.status !== 'creating' && result.status !== 'pending') return result;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, intervalMs);
      options.signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(options.signal?.reason);
      }, { once: true });
    });
  }

  throw new Error('Tempo limite excedido ao aguardar o pagamento PIX.');
}

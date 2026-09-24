export type PixStatus =
  | 'creating'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'in_dispute'
  | 'refunded'
  | 'chargeback';

export function digits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export function isValidCpf(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  const checkDigit = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split('')
      .reduce((total, value, index) => total + Number(value) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

export function normalizeConnectPayStatus(value: unknown): PixStatus {
  switch (String(value ?? '').trim().toUpperCase()) {
    case 'AUTHORIZED':
    case 'PAID':
    case 'APPROVED':
      return 'paid';
    case 'FAILED':
    case 'DECLINED':
    case 'CANCELED':
    case 'CANCELLED':
      return 'failed';
    case 'EXPIRED':
      return 'expired';
    case 'IN_DISPUTE':
      return 'in_dispute';
    case 'REFUND':
    case 'REFUNDED':
      return 'refunded';
    case 'CHARGEBACK':
      return 'chargeback';
    default:
      return 'pending';
  }
}

export function amountToCents(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

export function resolveChargeAmount(
  requested: unknown,
  product: {
    amountCents: number;
    allowCustomAmount: boolean;
    minimumAmountCents: number;
    maximumAmountCents: number;
  },
) {
  const amount = product.allowCustomAmount ? requested : product.amountCents;
  return Number.isInteger(amount)
    && Number(amount) >= product.minimumAmountCents
    && Number(amount) <= product.maximumAmountCents
    ? Number(amount)
    : null;
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

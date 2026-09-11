import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMetaUtmifyPayload } from './utmify.ts';

const order = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2026-09-11T10:00:00.000Z',
  updated_at: '2026-09-11T10:05:00.000Z',
  fulfilled_at: '2026-09-11T10:04:00.000Z',
  amount_cents: 2000,
  payment_method: 'pix',
  product_id: 'carta_sagrada',
  product_name: 'Carta Psicografada Sagrada',
  customer_name: 'Maria da Silva',
  customer_email: 'maria@example.com',
  customer_phone: '5511999999999',
  customer_cpf: '12345678901',
  utm_source: 'facebook',
};

test('gera pedido UTMIFY pendente sem data de aprovacao', () => {
  const payload = buildMetaUtmifyPayload(order, 'waiting_payment');
  assert.equal(payload.orderId, order.id);
  assert.equal(payload.platform, 'TemploDeLuzMeta');
  assert.equal(payload.status, 'waiting_payment');
  assert.equal(payload.approvedDate, null);
  assert.equal(payload.paymentMethod, 'pix');
});

test('atualiza o mesmo pedido UTMIFY para pago', () => {
  const pending = buildMetaUtmifyPayload(order, 'waiting_payment');
  const paid = buildMetaUtmifyPayload(order, 'paid');
  assert.equal(pending.orderId, paid.orderId);
  assert.equal(paid.status, 'paid');
  assert.ok(paid.approvedDate);
});

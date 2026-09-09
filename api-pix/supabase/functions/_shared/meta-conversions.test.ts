import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMetaInitiateCheckoutEvent, buildMetaPurchaseEvent, isEligibleMetaOrder } from './meta-conversions.ts';

async function hash(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

test('monta Purchase da Meta com PII normalizada e identificadores sem hash', async () => {
  const event = await buildMetaPurchaseEvent({
    id: '550e8400-e29b-41d4-a716-446655440000',
    session_id: 'Session-123',
    product_id: 'carta_sagrada',
    product_name: 'Carta Psicografada Sagrada',
    amount_cents: 1900,
    currency: 'BRL',
    customer_name: 'Maria da Silva',
    customer_email: ' MARIA@EXEMPLO.COM ',
    customer_phone: '(11) 99999-9999',
    fulfilled_at: '2025-01-02T03:04:05.000Z',
    meta_fbp: 'fb.1.1234567890.1234567890',
    meta_fbc: 'fb.1.1234567890.fbclid-value',
    meta_client_ip_address: '203.0.113.10',
    meta_client_user_agent: 'Browser Test',
    meta_event_source_url: 'https://templodeluz.com/?utm_source=facebook',
  });

  assert.equal(event.event_name, 'Purchase');
  assert.equal(event.event_id, '550e8400-e29b-41d4-a716-446655440000');
  assert.equal(event.action_source, 'website');
  assert.deepEqual(event.user_data.em, [await hash('maria@exemplo.com')]);
  assert.deepEqual(event.user_data.ph, [await hash('5511999999999')]);
  assert.deepEqual(event.user_data.fn, [await hash('maria')]);
  assert.deepEqual(event.user_data.ln, [await hash('silva')]);
  assert.deepEqual(event.user_data.external_id, [await hash('session-123')]);
  assert.equal(event.user_data.fbp, 'fb.1.1234567890.1234567890');
  assert.equal(event.user_data.fbc, 'fb.1.1234567890.fbclid-value');
  assert.equal(event.custom_data.value, 19);
  assert.deepEqual(event.custom_data.content_ids, ['carta_sagrada']);
});

test('usa o mesmo event_id do navegador no InitiateCheckout do servidor', async () => {
  const event = await buildMetaInitiateCheckoutEvent({
    id: '550e8400-e29b-41d4-a716-446655440000',
    session_id: 'session-123',
    product_id: 'carta_sagrada',
    product_name: 'Carta Psicografada Sagrada',
    amount_cents: 1900,
    customer_name: 'Maria Silva',
    customer_email: 'maria@exemplo.com',
    customer_phone: '11999999999',
    created_at: '2025-01-02T03:04:05.000Z',
    meta_initiate_checkout_event_id: 'ic_550e8400-e29b-41d4-a716-446655440000',
  });

  assert.equal(event.event_name, 'InitiateCheckout');
  assert.equal(event.event_id, 'ic_550e8400-e29b-41d4-a716-446655440000');
  assert.equal(event.custom_data.value, 19);
});

test('adiciona codigo do Brasil quando o telefone local comeca pelo DDD 55', async () => {
  const event = await buildMetaPurchaseEvent({
    id: '550e8400-e29b-41d4-a716-446655440000',
    product_id: 'carta_sagrada',
    product_name: 'Carta Psicografada Sagrada',
    amount_cents: 1900,
    customer_name: 'Maria Silva',
    customer_phone: '55999999999',
  });

  assert.deepEqual(event.user_data.ph, [await hash('5555999999999')]);
});

test('aceita somente vendas do quiz principal sem sinais TikTok', () => {
  assert.equal(isEligibleMetaOrder({ quiz_origin: 'original', utm_source: 'facebook' }), true);
  assert.equal(isEligibleMetaOrder({ quiz_origin: 'mirrored', utm_source: 'facebook' }), false);
  assert.equal(isEligibleMetaOrder({ quiz_origin: 'original', utm_source: 'tiktok' }), false);
  assert.equal(isEligibleMetaOrder({ quiz_origin: 'original', ttclid: 'click-id' }), false);
});

test('identifica cartão no payload Purchase', async () => {
  const event = await buildMetaPurchaseEvent({
    id: '550e8400-e29b-41d4-a716-446655440000',
    product_id: 'carta_sagrada',
    product_name: 'Carta Psicografada Sagrada',
    amount_cents: 1900,
    payment_method: 'credit_card',
  });
  assert.equal(event.custom_data.payment_method, 'credit_card');
});

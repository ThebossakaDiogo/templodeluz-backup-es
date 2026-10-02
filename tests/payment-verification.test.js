import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import statusHandler from '../api/check-purchase.js';
import webhook from '../api/checkout-webhook.js';
import reading from '../api/generate-reading.js';
import schedule from '../api/save-schedule.js';
import lead from '../api/save-quiz-lead.js';
import analytics from '../api/analytics.js';
import fs from 'node:fs';

let env;
beforeEach(() => {
  env = { ...process.env };
  Object.assign(process.env, { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'test',
    CONNECTPAY_API_SECRET: 'test', OPENAI_API_KEY: 'test' });
});
afterEach(() => { process.env = env; });

async function invoke(handler, body, method = 'POST', query = {}) {
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() {} };
  await handler({ body, method, query, headers: {} }, res);
  return res;
}

function setup(t, options = {}) {
  const order = { id: 'order_1', external_id: 'tdl_123', transaction_id: 'tx_1', amount: 15,
    payment_method: 'PIX', status: 'PENDING', ...options.order };
  const provider = { id: order.transaction_id, external_id: order.external_id, total_amount: order.amount,
    payment_method: 'PIX', status: 'AUTHORIZED', ...options.provider };
  const requests = [];
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    requests.push({ url: String(url), init });
    if (url.includes('connectpay')) {
      if (options.providerFailure) return Response.json({}, { status: 503 });
      return Response.json(provider);
    }
    if (url.includes('openai.com')) return Response.json({ choices: [{ message: { content: 'Leitura de teste' } }] });
    if (url.includes('/consultation_schedules') || url.includes('/quiz_funnel_leads') || url.includes('/analytics_events')) {
      return new Response(null, { status: options.storageFailure ? 503 : 201 });
    }
    if (init.method === 'PATCH') {
      if (options.storageFailure) return Response.json({}, { status: 503 });
      return Response.json(options.concurrentChange ? [] : [{ ...order, ...JSON.parse(init.body) }]);
    }
    return Response.json(options.noOrder ? [] : [order]);
  });
  return { order, provider, requests };
}

test('forged paid webhook cannot authorize provider-pending order', async t => {
  const { requests } = setup(t, { provider: { status: 'PENDING' } });
  const res = await invoke(webhook, { id: 'tx_1', external_id: 'tdl_123', status: 'AUTHORIZED', total_amount: 150 });
  assert.equal(res.code, 200);
  assert.equal(res.body.status, 'PENDING');
  assert.equal(requests.filter(r => r.init.method === 'PATCH').length, 0);
});

test('nullable webhook external_id resolves existing transaction', async t => {
  setup(t);
  const res = await invoke(webhook, { id: 'tx_1', external_id: null });
  assert.equal(res.code, 200);
  assert.equal(res.body.status, 'AUTHORIZED');
});

test('pending order reconciles even when payment webhook was lost', async t => {
  const { requests } = setup(t);
  const res = await invoke(statusHandler, null, 'GET', { external_id: 'tdl_123' });
  assert.equal(res.code, 200);
  assert.equal(res.body.paid, true);
  assert.equal(res.body.package.product_id, 'reading_15');
  assert.equal(requests.filter(r => r.init.method === 'PATCH').length, 1);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('cached authorization is revoked when provider reports chargeback', async t => {
  setup(t, { order: { status: 'AUTHORIZED' }, provider: { status: 'CHARGEBACK' } });
  const res = await invoke(statusHandler, null, 'GET', { external_id: 'tdl_123' });
  assert.equal(res.code, 200);
  assert.equal(res.body.paid, false);
  assert.equal(res.body.status, 'CHARGEBACK');
});

for (const [name, provider] of Object.entries({
  amount: { total_amount: 150 }, missingAmount: { total_amount: null },
  missingStatus: { status: null }, unknownStatus: { status: 'PAID' },
  otherTransaction: { id: 'tx_other' }, otherOrder: { external_id: 'tdl_other' },
  wrongMethod: { payment_method: 'CARD' },
})) {
  test(`rejects inconsistent provider ${name}`, async t => {
    const { requests } = setup(t, { provider });
    const res = await invoke(webhook, { id: 'tx_1' });
    assert.equal(res.code, 409);
    assert.equal(requests.filter(r => r.init.method === 'PATCH').length, 0);
  });
}

test('cannot exchange a pending order transaction for a paid transaction', async t => {
  const { requests } = setup(t);
  const res = await invoke(statusHandler, null, 'GET', { external_id: 'tdl_123', transaction_id: 'tx_other' });
  assert.equal(res.code, 409);
  assert.equal(requests.length, 1);
  const url = new URL(requests[0].url);
  assert.equal(url.searchParams.get('external_id'), 'eq.tdl_123');
  assert.equal(url.searchParams.get('transaction_id'), 'eq.tx_other');
});

for (const condition of ['storageFailure', 'concurrentChange', 'providerFailure', 'noOrder']) {
  test(`webhook does not acknowledge ${condition} as success`, async t => {
    setup(t, { [condition]: true });
    const res = await invoke(webhook, { id: 'tx_1' });
    assert.ok(res.code >= 500);
    assert.equal(res.body.ok, false);
  });
}

test('rejects filter injection before network', async t => {
  const { requests } = setup(t);
  const res = await invoke(statusHandler, null, 'GET', { external_id: 'x,status.eq.AUTHORIZED' });
  assert.equal(res.code, 400);
  assert.equal(requests.length, 0);
});

test('reading rejects pending purchases without calling AI', async t => {
  const { requests } = setup(t, { provider: { status: 'PENDING' } });
  const res = await invoke(reading, { mode: 'letter', order_id: 'tdl_123' });
  assert.equal(res.code, 403);
  assert.ok(!requests.some(r => r.url.includes('openai')));
});

test('client cannot obtain oracle through a basic package', async t => {
  const { requests } = setup(t);
  const res = await invoke(reading, { mode: 'oracle', order_id: 'tdl_123', oraculoDays: 90, hasAmarracao: true });
  assert.equal(res.code, 403);
  assert.ok(!requests.some(r => r.url.includes('openai')));
});

test('oracle benefits come from purchased product not request', async t => {
  const { requests } = setup(t, { order: { amount: 30, package: { product_id: 'oracle_30_days_30' } } });
  const res = await invoke(reading, { mode: 'oracle', order_id: 'tdl_123', oraculoDays: 90, hasAmarracao: true });
  assert.equal(res.code, 200);
  const prompt = JSON.parse(requests.find(r => r.url.includes('openai')).init.body).messages[0].content;
  assert.match(prompt, /30 dias/);
  assert.doesNotMatch(prompt, /90 dias/);
});

test('premium purchase preserves video sessions and can save schedule', async t => {
  const { requests } = setup(t, { order: { amount: 150, package: { product_id: 'premium_video_150' } } });
  const res = await invoke(schedule, { order_id: 'tdl_123', sessionId: 'session_1', day: 'Segunda', hour: '14h' });
  assert.equal(res.code, 200);
  const body = JSON.parse(requests.find(r => r.url.includes('consultation_schedules')).init.body)[0];
  assert.equal(body.package_amount, 150);
});

test('schedule persistence failure cannot claim success', async t => {
  setup(t, { order: { amount: 150, status: 'AUTHORIZED' }, storageFailure: true });
  const res = await invoke(schedule, { order_id: 'tdl_123', sessionId: 'session_1', day: 'Segunda', hour: '14h' });
  assert.equal(res.code, 502);
  assert.equal(res.body.ok, false);
});

test('lead storage rejection is reported as an error', async t => {
  setup(t, { storageFailure: true });
  const res = await invoke(lead, { session_id: 'session_1' });
  assert.equal(res.code, 502);
  assert.equal(res.body.saved, false);
});

test('analytics validates events and reports storage failures', async t => {
  let res = await invoke(analytics, { sessionId: 'bad session', eventType: 'click' });
  assert.equal(res.code, 400);
  setup(t, { storageFailure: true });
  res = await invoke(analytics, { sessionId: 'session_1', eventType: 'click' });
  assert.equal(res.code, 502);
  assert.equal(res.body.ok, false);
});

test('Supabase webhook is public for ConnectPay and validates provider state', () => {
  const config = fs.readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
  const source = fs.readFileSync(new URL('../supabase/functions/checkout-webhook/index.ts', import.meta.url), 'utf8');
  assert.match(config, /\[functions\.checkout-webhook\][\s\S]*verify_jwt\s*=\s*false/);
  assert.match(source, /api\.connectpay\.vc\/v1\/transactions/);
  assert.match(source, /transaction\.total_amount/);
  assert.doesNotMatch(source, /status:\s*payload\.status/);
});

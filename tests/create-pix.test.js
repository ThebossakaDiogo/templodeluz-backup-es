import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import handler from '../api/create-pix.js';

let savedEnv;
beforeEach(() => {
  savedEnv = { ...process.env };
  Object.assign(process.env, {
    SUPABASE_URL: 'https://database.test',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only-key',
    CONNECTPAY_API_SECRET: 'test-only-secret',
    CONNECTPAY_WEBHOOK_URL: 'https://site.test/api/checkout-webhook',
  });
});
afterEach(() => { process.env = savedEnv; });

async function invoke(body, method = 'POST') {
  const res = {
    status(code) { this.code = code; return this; },
    json(data) { this.body = data; return this; },
  };
  await handler({ method, body, headers: {} }, res);
  return res;
}

test('rejects invalid prices and unknown products without calling provider', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  for (const body of [
    { amount: 1, product_id: 'premium_video_150' },
    { amount: '15junk', product_id: 'reading_15' },
    { amount: '15', product_id: 'reading_15' },
    { amount: Infinity, product_id: 'reading_15' },
    { amount: 15, product_id: 'toString' },
    { amount: 15, product_id: 'unknown' },
    { amount: 1, package_override: { amount: 150, has_videochamada: true } },
    null, [], '{bad json',
  ]) {
    assert.equal((await invoke(body)).code, 400);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('checks database configuration before creating a charge', async t => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  assert.equal((await invoke({ amount: 15, product_id: 'reading_15' })).code, 500);
  assert.equal(fetch.mock.callCount(), 0);
});

test('ignores client benefits and persists server selected premium package', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return url.includes('connectpay')
      ? Response.json({ data: { id: 'tx_1', status: 'PENDING', pix: { payload: 'test-pix' } } })
      : new Response(null, { status: 201 });
  });
  const res = await invoke({ amount: 150, product_id: 'premium_video_150', package_override: { amount: 1, sessions: 999 } });
  assert.equal(res.code, 200);
  assert.equal(res.body.pix_payload, 'test-pix');
  assert.equal(requests[0].body.total_amount, 150);
  assert.equal(requests[0].body.items[0].id, 'premium_video_150');
  assert.equal(requests[0].body.webhook_url, process.env.CONNECTPAY_WEBHOOK_URL);
  const order = requests[1].body[0];
  assert.equal(order.package.sessions, 3);
  assert.equal(order.package.has_videochamada, true);
  assert.equal(order.package.amount, 150);
});

test('does not grant premium metadata on a cheap reading', async t => {
  let order;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('connectpay')) return Response.json({ id: 'tx_2', pix: { payload: 'test-pix' } });
    order = JSON.parse(options.body)[0];
    return new Response(null, { status: 201 });
  });
  const res = await invoke({ amount: 15, product_id: 'reading_15', package_override: { has_videochamada: true, questions: 999 } });
  assert.equal(res.code, 200);
  assert.equal(order.package.questions, 3);
  assert.equal(order.package.has_videochamada, undefined);
});

test('database write failures never return a usable PIX as success', async t => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async url => url.includes('connectpay')
    ? Response.json({ id: 'tx_3', pix: { payload: 'test-pix' } })
    : Response.json({ message: 'private storage details' }, { status: 503 }));
  const res = await invoke({ amount: 15, product_id: 'reading_15' });
  assert.equal(res.code, 502);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.pix_payload, undefined);
  assert.ok(!res.body.error.includes('private storage'));
});

test('provider HTML and explicit error envelopes are reported as upstream errors', async t => {
  for (const response of [
    new Response('<html>Bad gateway</html>', { status: 502 }),
    Response.json({ success: false, error: { message: 'Refused' } }),
    Response.json({ id: 'tx_4', pix: {} }),
    Response.json(null),
  ]) {
    t.mock.method(globalThis, 'fetch', async () => response);
    const res = await invoke({ amount: 15, product_id: 'reading_15' });
    assert.equal(res.code, 502);
    assert.equal(res.body.ok, false);
  }
});

test('unsupported methods are rejected', async () => {
  assert.equal((await invoke({}, 'GET')).code, 405);
});

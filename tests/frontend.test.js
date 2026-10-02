import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../contato/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const contactScript = scripts.find(([, , text]) => text.includes('const chatWindow ='))[2];

test('template has no configured environment values or original project identifiers', () => {
  const env = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  const configured = env.split(/\r?\n/)
    .filter(line => /^[A-Z][A-Z0-9_]*=/.test(line))
    .filter(line => !line.trim().endsWith('=""'));
  assert.deepEqual(configured, []);

  const files = ['../index.html', '../resultado.html', '../escrever-carta.html',
    '../chamada-ao-vivo-milena.html', '../supabase/config.toml'];
  const source = files.map(file => fs.readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(source, /preconnect[^>]+supabase\.co|window\.pixelId|fbq\(['"]init|utmify-pixel-code|pixel-tiktok/);

  for (const legacy of ['../create-pix.php', '../checkout-webhook.php', '../connectpay-config.php',
    '../contato/api.php', '../analytics/api.php']) {
    assert.equal(fs.existsSync(new URL(legacy, import.meta.url)), false);
  }
});

function boot({ paid = true, storageBlocked = false, amount = 150, stored = {} } = {}) {
  const elements = new Map();
  function node() {
    return { style: {}, dataset: {}, children: [], className: '', textContent: '', innerHTML: '',
      classList: { contains: () => false, add() {}, remove() {} },
      appendChild(child) { this.children.push(child); }, replaceChildren() { this.children = []; },
      querySelectorAll() { return []; }, setAttribute() {}, addEventListener() {}, focus() {}, select() {} };
  }
  const storage = new Map(Object.entries(stored));
  const context = vm.createContext({
    window: { location: { search: '?pedido=tdl_test' } },
    document: { getElementById(id) { if (!elements.has(id)) elements.set(id, node()); return elements.get(id); },
      createElement: node, addEventListener() {}, querySelectorAll: () => [] },
    localStorage: { getItem(key) { if (storageBlocked) throw new Error('SecurityError'); return storage.get(key) || null; },
      setItem(key, value) { if (storageBlocked) throw new Error('SecurityError'); storage.set(key, value); } },
    fetch: async () => Response.json({ ok: true, paid, external_id: 'tdl_test', transaction_id: 'tx_test', amount,
      package: { amount, title: 'Leitura', questions: amount === 150 ? 5 : 3, oraculo_days: amount === 150 ? 90 : 0,
        has_videochamada: amount === 150, sessions: amount === 150 ? 3 : 1 } }),
    URLSearchParams, AbortController, console: { warn() {}, error() {}, log() {} },
    crypto: { randomUUID: () => 'test-uuid' }, navigator: {},
    setTimeout(fn, ms) { if (ms < 10000) queueMicrotask(fn); return 1; }, clearTimeout() {},
    setInterval() { return 1; }, clearInterval() {},
  });
  vm.runInContext(contactScript, context);
  return { context, elements, storage, run: code => vm.runInContext(code, context) };
}

test('all contact inline scripts and checkout scripts parse', () => {
  for (const [, attrs, script] of scripts) {
    if (attrs.includes('src=') || attrs.includes('application/ld+json') || attrs.includes('type="module"')) continue;
    new vm.Script(script);
  }
  for (const file of ['resultado-actions.js', 'escrever-carta-actions.js', 'chamada-actions.js', 'home-contributions.js']) {
    new vm.Script(fs.readFileSync(new URL(`../js/${file}`, import.meta.url), 'utf8'), { filename: file });
  }
  const tracker = fs.readFileSync(new URL('../analytics/tracker.js', import.meta.url), 'utf8');
  new vm.Script(tracker);
  assert.ok(tracker.includes("'/api/analytics'"));
  assert.ok(!tracker.includes('api.php'));
});

test('chat initializes only after verified payment and preserves premium entitlements', async () => {
  const app = boot();
  await app.context.window.onload();
  assert.equal(app.run('userData.packageAmount'), 150);
  assert.equal(app.run('userData.hasVideochamada'), true);
  assert.equal(app.run('userData.sessions'), 3);
  assert.equal(app.run('step'), 2);
  assert.equal(app.elements.get('message-input').disabled, false);
});

test('pending payment cannot unlock chat even with a forged paid localStorage key', async () => {
  const app = boot({ paid: false, stored: { templo_luz_pacote_pago: '{"amount":150}' } });
  await app.context.window.onload();
  assert.equal(app.run('verifiedPackage'), null);
  assert.equal(app.elements.get('input-area').style.display, 'none');
  assert.equal(app.elements.get('message-input').disabled, true);
});

test('storage SecurityError cannot prevent verified chat initialization', async () => {
  const app = boot({ storageBlocked: true });
  await app.context.window.onload();
  assert.equal(app.run('step'), 2);
});

test('chat escapes user and generated text before HTML rendering', () => {
  const app = boot();
  const value = app.run('formatMessageText("<img src=x onerror=alert(1)> **texto**")');
  assert.ok(value.includes('&lt;img'));
  assert.ok(!value.includes('<img'));
  assert.ok(value.includes('<b>texto</b>'));
});

test('30-day upsell stays 30 days and cannot be applied twice', async () => {
  const app = boot();
  await app.context.window.onload();
  app.run(`applyVerifiedUpsell({ paid: true, external_id: 'extra_1', package: {
    purpose: 'oraculo_30', questions: 5, oraculo_days: 30 } })`);
  assert.equal(app.run('userData.oraculoDays'), 30);
  assert.equal(app.run('userData.questionLimit'), 10);
  app.run(`applyVerifiedUpsell({ paid: true, external_id: 'extra_1', package: {
    purpose: 'oraculo_30', questions: 5, oraculo_days: 30 } })`);
  assert.equal(app.run('userData.questionLimit'), 10);
  assert.equal(app.run('oracleOrderId'), 'extra_1');
});

test('POST network failure never creates a second payment through fallback', async () => {
  const app = boot();
  let calls = 0;
  app.context.fetch = async () => { calls++; throw new Error('Timeout'); };
  await assert.rejects(app.run("requestJson('/api/create-pix', '/create-pix.php', {method: 'POST'})"));
  assert.equal(calls, 1);
});

test('reading errors reject rather than returning fake generated content', async () => {
  const app = boot();
  app.context.fetch = async () => Response.json({ ok: false, error: 'Unavailable' }, { status: 503 });
  await assert.rejects(app.run('fetchLetter()'));
  await assert.rejects(app.run('fetchOraculo()'));
  assert.equal(app.run('letterContent'), '');
});

test('cache cannot restore forged premium capabilities or executable HTML', async () => {
  const app = boot({ amount: 15 });
  await app.context.window.onload();
  const key = app.run('CACHE_KEY');
  const state = JSON.parse(app.storage.get(key));
  state.userData.hasVideochamada = true;
  state.userData.questionLimit = 999;
  state.userData.oraculoDays = 90;
  state.step = 31;
  state.html = '<img src=x onerror=alert(1)>';
  state.messages = [{ text: '<img src=x onerror=alert(1)>', type: 'received' }];
  app.storage.set(key, JSON.stringify(state));
  assert.equal(await app.run('loadCache()'), true);
  assert.equal(app.run('userData.hasVideochamada'), false);
  assert.equal(app.run('userData.questionLimit'), 3);
  assert.equal(app.run('userData.oraculoDays'), 0);
  assert.notEqual(app.run('step'), 31);
  const first = app.elements.get('chat-window').children[0];
  assert.equal(first.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(first.innerHTML, '');
});

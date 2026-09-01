import assert from 'node:assert/strict';
import test from 'node:test';
import {
  amountToCents,
  digits,
  isUuid,
  isValidCpf,
  normalizeConnectPayStatus,
  resolveChargeAmount,
} from './pix.ts';

test('normaliza documento e valida CPF', () => {
  assert.equal(digits('529.982.247-25'), '52998224725');
  assert.equal(isValidCpf('52998224725'), true);
  assert.equal(isValidCpf('11111111111'), false);
  assert.equal(isValidCpf('52998224724'), false);
});

test('normaliza status da ConnectPay', () => {
  assert.equal(normalizeConnectPayStatus('AUTHORIZED'), 'paid');
  assert.equal(normalizeConnectPayStatus('IN_DISPUTE'), 'in_dispute');
  assert.equal(normalizeConnectPayStatus('desconhecido'), 'pending');
});

test('converte valor monetario para centavos', () => {
  assert.equal(amountToCents('49.90'), 4990);
  assert.equal(amountToCents(undefined), null);
});

test('valida UUID de idempotencia', () => {
  assert.equal(isUuid('550e8400-e29b-41d4-a716-446655440000'), true);
  assert.equal(isUuid('nao-e-uuid'), false);
});

test('valida valor livre da doacao no servidor', () => {
  const product = {
    amountCents: 2900,
    allowCustomAmount: true,
    minimumAmountCents: 1000,
    maximumAmountCents: 1000000,
  };
  assert.equal(resolveChargeAmount(1900, product), 1900);
  assert.equal(resolveChargeAmount(999, product), null);
  assert.equal(resolveChargeAmount(1900.5, product), null);
  assert.equal(resolveChargeAmount('1900', product), null);
});

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  decimalSolToLamports,
  lamportsToSolString
} = require('./solana_rpc_transport');

test('SOL decimal conversion is exact to nine decimal places', () => {
  assert.equal(decimalSolToLamports('1'), 1000000000);
  assert.equal(decimalSolToLamports('0.001'), 1000000);
  assert.equal(decimalSolToLamports('0.000000001'), 1);
  assert.equal(decimalSolToLamports('12.345678901'), 12345678901);
});

test('SOL decimal conversion rejects unsafe values', () => {
  assert.throws(() => decimalSolToLamports('0'), /POSITIVE/);
  assert.throws(() => decimalSolToLamports('-1'), /INVALID/);
  assert.throws(() => decimalSolToLamports('1.0000000001'), /TOO_PRECISE/);
});

test('lamport conversion does not introduce floating point rounding', () => {
  assert.equal(lamportsToSolString(1), '0.000000001');
  assert.equal(lamportsToSolString(1000000), '0.001');
  assert.equal(lamportsToSolString(12345678901n), '12.345678901');
});

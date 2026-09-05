const test = require('node:test');
const assert = require('node:assert/strict');

const {
  authorisationDigest,
  createTransaction,
  transition,
  applyPolicy,
  authorise,
  markSubmitted,
  markConfirmed,
  entriesBalance,
  postAccounting
} = require('./xqp_transaction');

function fixture() {
  return createTransaction({
    transaction_id: 'tx_0000000000000001',
    intent_id: 'intent_000000000001',
    operation: 'test',
    asset_id: 'solana:5qrGE6aj5yYnhP7tJwNSP8Uz48juymCTMQT7w7w1KtH6',
    symbol: 'XQP',
    amount: '12.500000',
    sender: 'sender-test-address',
    recipient: 'recipient-test-address',
    network: 'solana-devnet',
    expires_at: '2099-01-01T00:00:00.000Z',
    purpose_code: 'REFERENCE_TEST',
    now: '2026-09-05T02:30:00.000Z'
  });
}

test('authorisation digest is deterministic', () => {
  const a = fixture();
  const b = fixture();
  assert.equal(authorisationDigest(a), authorisationDigest(b));
});

test('valid state machine reaches ACCOUNTED', () => {
  let tx = fixture();
  tx = transition(tx, 'POLICY_PENDING', { at: '2026-09-05T02:31:00.000Z' });
  tx = applyPolicy(tx, 'allow', { at: '2026-09-05T02:32:00.000Z' });
  tx = authorise(tx, 'test-authoriser', { at: '2026-09-05T02:33:00.000Z' });
  tx = markSubmitted(tx, {
    idempotency_key: 'idem_0000000000000001',
    signature: 'DEVNET_SIGNATURE_PLACEHOLDER',
    commitment: 'confirmed',
    network_fee: '0.000005'
  }, { at: '2026-09-05T02:34:00.000Z' });
  tx = markConfirmed(tx, {
    block_or_slot: 123456,
    commitment: 'confirmed'
  }, { at: '2026-09-05T02:35:00.000Z' });
  tx = postAccounting(tx, [
    {
      account: 'sender:test',
      side: 'debit',
      asset_id: tx.asset.asset_id,
      amount: '12.500000'
    },
    {
      account: 'recipient:test',
      side: 'credit',
      asset_id: tx.asset.asset_id,
      amount: '12.500000'
    }
  ], { at: '2026-09-05T02:36:00.000Z' });

  assert.equal(tx.state, 'ACCOUNTED');
  assert.equal(tx.accounting.status, 'posted');
  assert.equal(tx.audit.length, 7);
});

test('invalid transition is rejected', () => {
  const tx = fixture();
  assert.throws(() => transition(tx, 'CONFIRMED'), /INVALID_TRANSITION/);
});

test('terminal transaction cannot revive', () => {
  let tx = fixture();
  tx = transition(tx, 'CANCELLED');
  assert.throws(() => transition(tx, 'POLICY_PENDING'), /INVALID_TRANSITION/);
});

test('changing material payload after authorisation is detected', () => {
  let tx = fixture();
  tx = transition(tx, 'POLICY_PENDING');
  tx = applyPolicy(tx, 'allow');
  tx = authorise(tx, 'test-authoriser');
  tx.amount = '13.000000';
  tx.intent.amount = '13.000000';

  assert.throws(() => markSubmitted(tx, {
    idempotency_key: 'idem_0000000000000002'
  }), /AUTH_PAYLOAD_CHANGED/);
});

test('balanced accounting handles differing decimal precision exactly', () => {
  const asset = 'test:asset';
  assert.equal(entriesBalance([
    { account: 'a', side: 'debit', asset_id: asset, amount: '1.5' },
    { account: 'b', side: 'credit', asset_id: asset, amount: '1.5000' }
  ]), true);
});

test('unbalanced accounting is rejected', () => {
  const asset = 'test:asset';
  assert.equal(entriesBalance([
    { account: 'a', side: 'debit', asset_id: asset, amount: '1.50' },
    { account: 'b', side: 'credit', asset_id: asset, amount: '1.49' }
  ]), false);
});
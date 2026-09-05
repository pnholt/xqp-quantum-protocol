const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createTransaction,
  transition,
  applyPolicy,
  authorise
} = require('./xqp_transaction');

const {
  submitViaDevnetTransport,
  confirmViaDevnetProvider
} = require('./solana_devnet_adapter');

function authorisedFixture() {
  let tx = createTransaction({
    transaction_id: 'tx_devnet_0000000001',
    intent_id: 'intent_devnet_000001',
    operation: 'test',
    asset_id: 'solana:5qrGE6aj5yYnhP7tJwNSP8Uz48juymCTMQT7w7w1KtH6',
    symbol: 'XQP',
    amount: '5.0',
    sender: 'devnet-sender',
    recipient: 'devnet-recipient',
    network: 'solana-devnet',
    expires_at: '2099-01-01T00:00:00.000Z',
    purpose_code: 'DEVNET_TEST',
    now: '2026-09-05T02:40:00.000Z'
  });
  tx = transition(tx, 'POLICY_PENDING');
  tx = applyPolicy(tx, 'allow');
  tx = authorise(tx, 'devnet-test-authoriser');
  return tx;
}

test('devnet transport receives only normalised settlement request', async () => {
  const tx = authorisedFixture();
  let captured;
  const submitted = await submitViaDevnetTransport(tx, {
    idempotency_key: 'idem_devnet_0001',
    transport: async request => {
      captured = request;
      return {
        signature: 'DEVNET_SIG_001',
        commitment: 'processed',
        network_fee: '0.000005'
      };
    }
  });

  assert.equal(captured.network, 'solana-devnet');
  assert.equal(captured.transaction_id, tx.transaction_id);
  assert.equal(captured.amount, '5.0');
  assert.equal(submitted.state, 'SUBMITTED');
  assert.equal(submitted.settlement.signature, 'DEVNET_SIG_001');
});

test('adapter rejects mainnet transaction', async () => {
  const tx = authorisedFixture();
  tx.network = 'solana-mainnet';
  assert.rejects(
    submitViaDevnetTransport(tx, {
      idempotency_key: 'idem_devnet_0002',
      transport: async () => ({ signature: 'SHOULD_NOT_HAPPEN' })
    }),
    /DEVNET_ONLY/
  );
});

test('confirmation provider advances only when confirmed', async () => {
  const tx = authorisedFixture();
  const submitted = await submitViaDevnetTransport(tx, {
    idempotency_key: 'idem_devnet_0003',
    transport: async () => ({ signature: 'DEVNET_SIG_003' })
  });

  const stillSubmitted = await confirmViaDevnetProvider(submitted, {
    confirmationProvider: async () => ({ confirmed: false })
  });
  assert.equal(stillSubmitted.state, 'SUBMITTED');

  const confirmed = await confirmViaDevnetProvider(stillSubmitted, {
    confirmationProvider: async signature => ({
      confirmed: signature === 'DEVNET_SIG_003',
      commitment: 'confirmed',
      slot: 999999
    })
  });
  assert.equal(confirmed.state, 'CONFIRMED');
  assert.equal(confirmed.settlement.block_or_slot, 999999);
});
const { authorisationDigest, markSubmitted, markConfirmed } = require('./xqp_transaction');

function assertDevnetAuthorised(tx) {
  if (!tx || tx.network !== 'solana-devnet') throw new Error('DEVNET_ONLY');
  if (tx.state !== 'AUTHORISED') throw new Error('TRANSACTION_NOT_AUTHORISED');
  if (!tx.authorisation || tx.authorisation.payload_digest !== authorisationDigest(tx)) {
    throw new Error('AUTH_PAYLOAD_CHANGED');
  }
}

async function submitViaDevnetTransport(tx, options) {
  assertDevnetAuthorised(tx);
  if (!options || typeof options.transport !== 'function') throw new Error('TRANSPORT_REQUIRED');
  if (!options.idempotency_key) throw new Error('MISSING_IDEMPOTENCY_KEY');

  const request = {
    network: 'solana-devnet',
    transaction_id: tx.transaction_id,
    asset_id: tx.asset.asset_id,
    sender: tx.sender,
    recipient: tx.recipient,
    amount: tx.amount,
    idempotency_key: options.idempotency_key
  };

  const result = await options.transport(Object.freeze({ ...request }));
  if (!result || typeof result.signature !== 'string' || result.signature.length === 0) {
    throw new Error('INVALID_SETTLEMENT_SIGNATURE');
  }

  return markSubmitted(tx, {
    idempotency_key: options.idempotency_key,
    signature: result.signature,
    commitment: result.commitment || 'processed',
    network_fee: result.network_fee || null
  }, {
    actor: options.actor || 'solana-devnet-adapter',
    reason: 'DEVNET_SETTLEMENT_SUBMITTED',
    at: options.at
  });
}

async function confirmViaDevnetProvider(tx, options) {
  if (!tx || tx.network !== 'solana-devnet') throw new Error('DEVNET_ONLY');
  if (tx.state !== 'SUBMITTED') throw new Error('TRANSACTION_NOT_SUBMITTED');
  if (!tx.settlement || !tx.settlement.signature) throw new Error('MISSING_SETTLEMENT_SIGNATURE');
  if (!options || typeof options.confirmationProvider !== 'function') {
    throw new Error('CONFIRMATION_PROVIDER_REQUIRED');
  }

  const result = await options.confirmationProvider(tx.settlement.signature);
  if (!result || result.confirmed !== true) return tx;

  return markConfirmed(tx, {
    signature: tx.settlement.signature,
    block_or_slot: result.slot ?? null,
    commitment: result.commitment || 'confirmed'
  }, {
    actor: options.actor || 'solana-devnet-adapter',
    reason: 'DEVNET_SETTLEMENT_CONFIRMED',
    at: options.at
  });
}

module.exports = {
  assertDevnetAuthorised,
  submitViaDevnetTransport,
  confirmViaDevnetProvider
};
const crypto = require('node:crypto');

const ACTIVE_STATES = new Set([
  'CREATED', 'POLICY_PENDING', 'QUOTED', 'AUTHORISED',
  'SUBMITTED', 'CONFIRMED', 'ACCOUNTED', 'AUDITED'
]);

const TERMINAL_STATES = new Set(['REJECTED', 'EXPIRED', 'FAILED', 'CANCELLED']);

const TRANSITIONS = {
  CREATED: new Set(['POLICY_PENDING', 'CANCELLED', 'EXPIRED']),
  POLICY_PENDING: new Set(['QUOTED', 'REJECTED', 'CANCELLED', 'EXPIRED']),
  QUOTED: new Set(['AUTHORISED', 'REJECTED', 'CANCELLED', 'EXPIRED']),
  AUTHORISED: new Set(['SUBMITTED', 'CANCELLED', 'EXPIRED', 'FAILED']),
  SUBMITTED: new Set(['CONFIRMED', 'FAILED']),
  CONFIRMED: new Set(['ACCOUNTED', 'FAILED']),
  ACCOUNTED: new Set(['AUDITED']),
  AUDITED: new Set([]),
  REJECTED: new Set([]),
  EXPIRED: new Set([]),
  FAILED: new Set([]),
  CANCELLED: new Set([])
};

function canonicalise(value) {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(k => [k, canonicalise(value[k])])
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalise(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function authorisationPayload(tx) {
  return {
    protocol_version: tx.protocol_version,
    transaction_id: tx.transaction_id,
    intent: tx.intent,
    asset: tx.asset,
    amount: tx.amount,
    sender: tx.sender,
    recipient: tx.recipient,
    network: tx.network,
    quote: tx.quote
  };
}

function authorisationDigest(tx) {
  return `sha256:${sha256(canonicalJson(authorisationPayload(tx)))}`;
}

function validateAmountString(amount) {
  if (typeof amount !== 'string' || !/^[0-9]+(?:\.[0-9]+)?$/.test(amount)) {
    throw new Error('INVALID_AMOUNT_FORMAT');
  }
  if (/^0+(?:\.0+)?$/.test(amount)) throw new Error('AMOUNT_MUST_BE_POSITIVE');
}

function createTransaction(input) {
  const now = input.now || new Date().toISOString();
  validateAmountString(input.amount);

  const tx = {
    protocol_version: input.protocol_version || '0.1.0',
    transaction_id: input.transaction_id,
    created_at: now,
    updated_at: now,
    state: 'CREATED',
    intent: {
      intent_id: input.intent_id,
      operation: input.operation || 'test',
      asset_id: input.asset_id,
      amount: input.amount,
      destination: input.recipient,
      expires_at: input.expires_at,
      purpose_code: input.purpose_code || 'TEST',
      supersedes: input.supersedes || null
    },
    asset: { asset_id: input.asset_id, symbol: input.symbol },
    amount: input.amount,
    sender: input.sender,
    recipient: input.recipient,
    network: input.network,
    policy: {
      decision: 'pending',
      policy_version: input.policy_version || '0.1.0',
      jurisdiction: input.jurisdiction || null,
      evidence_refs: []
    },
    quote: input.quote || null,
    authorisation: {
      status: 'none',
      payload_digest: null,
      authorised_at: null,
      authoriser_ref: null
    },
    settlement: {
      status: 'none',
      signature: null,
      submitted_at: null,
      confirmed_at: null,
      block_or_slot: null,
      commitment: null,
      network_fee: null,
      idempotency_key: null
    },
    accounting: { status: 'none', entries: [] },
    audit: [{
      from: null,
      to: 'CREATED',
      at: now,
      actor: input.actor || 'reference-client',
      reason: 'TRANSACTION_CREATED',
      evidence_ref: null,
      object_hash: null
    }]
  };

  assertCoreFields(tx);
  return tx;
}

function assertCoreFields(tx) {
  const required = [
    'protocol_version', 'transaction_id', 'created_at', 'updated_at', 'state',
    'intent', 'asset', 'amount', 'sender', 'recipient', 'network', 'policy',
    'authorisation', 'settlement', 'accounting', 'audit'
  ];
  for (const key of required) {
    if (tx[key] === undefined || tx[key] === null) throw new Error(`MISSING_${key.toUpperCase()}`);
  }
  if (!ACTIVE_STATES.has(tx.state) && !TERMINAL_STATES.has(tx.state)) {
    throw new Error('INVALID_STATE');
  }
  validateAmountString(tx.amount);
  if (tx.intent.asset_id !== tx.asset.asset_id) throw new Error('ASSET_ID_MISMATCH');
  if (tx.intent.amount !== tx.amount) throw new Error('AMOUNT_MISMATCH');
  if (tx.intent.destination !== tx.recipient) throw new Error('DESTINATION_MISMATCH');
  return true;
}

function transition(tx, nextState, meta = {}) {
  assertCoreFields(tx);
  const allowed = TRANSITIONS[tx.state];
  if (!allowed || !allowed.has(nextState)) {
    throw new Error(`INVALID_TRANSITION_${tx.state}_TO_${nextState}`);
  }

  const at = meta.at || new Date().toISOString();
  const out = structuredClone(tx);
  const previous = out.state;
  out.state = nextState;
  out.updated_at = at;
  out.audit.push({
    from: previous,
    to: nextState,
    at,
    actor: meta.actor || 'reference-service',
    reason: meta.reason || `STATE_${nextState}`,
    evidence_ref: meta.evidence_ref || null,
    object_hash: meta.object_hash || null
  });
  return out;
}

function applyPolicy(tx, decision, meta = {}) {
  if (tx.state !== 'POLICY_PENDING') throw new Error('POLICY_NOT_PENDING');
  if (!['allow', 'deny', 'review'].includes(decision)) throw new Error('INVALID_POLICY_DECISION');
  const out = structuredClone(tx);
  out.policy.decision = decision;
  out.policy.evidence_refs = [...(meta.evidence_refs || [])];
  if (decision === 'deny') return transition(out, 'REJECTED', { ...meta, reason: meta.reason || 'POLICY_DENIED' });
  if (decision === 'review') return out;
  return transition(out, 'QUOTED', { ...meta, reason: meta.reason || 'POLICY_ALLOWED' });
}

function authorise(tx, authoriserRef, meta = {}) {
  if (tx.state !== 'QUOTED') throw new Error('TRANSACTION_NOT_QUOTED');
  const out = structuredClone(tx);
  out.authorisation = {
    status: 'authorised',
    payload_digest: authorisationDigest(out),
    authorised_at: meta.at || new Date().toISOString(),
    authoriser_ref: authoriserRef
  };
  return transition(out, 'AUTHORISED', { ...meta, reason: meta.reason || 'PAYLOAD_AUTHORISED' });
}

function markSubmitted(tx, settlement, meta = {}) {
  if (tx.state !== 'AUTHORISED') throw new Error('TRANSACTION_NOT_AUTHORISED');
  const currentDigest = authorisationDigest(tx);
  if (tx.authorisation.payload_digest !== currentDigest) throw new Error('AUTH_PAYLOAD_CHANGED');
  if (!settlement.idempotency_key) throw new Error('MISSING_IDEMPOTENCY_KEY');

  const out = structuredClone(tx);
  out.settlement = {
    ...out.settlement,
    status: 'submitted',
    signature: settlement.signature || null,
    submitted_at: meta.at || new Date().toISOString(),
    commitment: settlement.commitment || null,
    network_fee: settlement.network_fee || null,
    idempotency_key: settlement.idempotency_key
  };
  return transition(out, 'SUBMITTED', { ...meta, reason: meta.reason || 'SETTLEMENT_SUBMITTED' });
}

function markConfirmed(tx, settlement = {}, meta = {}) {
  if (tx.state !== 'SUBMITTED') throw new Error('TRANSACTION_NOT_SUBMITTED');
  const out = structuredClone(tx);
  out.settlement = {
    ...out.settlement,
    status: 'confirmed',
    signature: settlement.signature || out.settlement.signature,
    confirmed_at: meta.at || new Date().toISOString(),
    block_or_slot: settlement.block_or_slot ?? out.settlement.block_or_slot,
    commitment: settlement.commitment || out.settlement.commitment
  };
  return transition(out, 'CONFIRMED', { ...meta, reason: meta.reason || 'SETTLEMENT_CONFIRMED' });
}

function decimalToScaledBigInt(value, scale) {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole + fraction.padEnd(scale, '0'));
}

function entriesBalance(entries) {
  const byAsset = new Map();
  for (const entry of entries) {
    validateAmountString(entry.amount);
    if (!['debit', 'credit'].includes(entry.side)) throw new Error('INVALID_ACCOUNTING_SIDE');
    const key = entry.asset_id;
    if (!byAsset.has(key)) byAsset.set(key, []);
    byAsset.get(key).push(entry);
  }

  for (const [, group] of byAsset) {
    const scale = Math.max(...group.map(e => (e.amount.split('.')[1] || '').length));
    let debits = 0n;
    let credits = 0n;
    for (const e of group) {
      const n = decimalToScaledBigInt(e.amount, scale);
      if (e.side === 'debit') debits += n;
      else credits += n;
    }
    if (debits !== credits) return false;
  }
  return true;
}

function postAccounting(tx, entries, meta = {}) {
  if (tx.state !== 'CONFIRMED') throw new Error('TRANSACTION_NOT_CONFIRMED');
  if (!Array.isArray(entries) || entries.length < 2) throw new Error('ACCOUNTING_ENTRIES_REQUIRED');
  if (!entriesBalance(entries)) throw new Error('UNBALANCED_JOURNAL');
  const out = structuredClone(tx);
  out.accounting = { status: 'posted', entries: structuredClone(entries) };
  return transition(out, 'ACCOUNTED', { ...meta, reason: meta.reason || 'ACCOUNTING_POSTED' });
}

module.exports = {
  TRANSITIONS,
  canonicalJson,
  authorisationDigest,
  createTransaction,
  assertCoreFields,
  transition,
  applyPolicy,
  authorise,
  markSubmitted,
  markConfirmed,
  entriesBalance,
  postAccounting
};
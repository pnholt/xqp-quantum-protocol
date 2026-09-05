const fs = require('node:fs');
const path = require('node:path');
const {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');

const {
  createTransaction,
  transition,
  applyPolicy,
  authorise,
  postAccounting
} = require('../reference/xqp_transaction');
const {
  submitViaDevnetTransport,
  confirmViaDevnetProvider
} = require('../reference/solana_devnet_adapter');
const {
  DEVNET_ASSET_ID,
  createDevnetRpcTransport,
  createDevnetConfirmationProvider,
  waitForDevnetConfirmation
} = require('../reference/solana_rpc_transport');

const RPC = process.env.SOLANA_DEVNET_RPC_URL || clusterApiUrl('devnet');
const OUTPUT = process.env.XQP_DEVNET_OUTPUT || 'artifacts/devnet-lifecycle.json';
const TRANSFER_SOL = process.env.XQP_DEVNET_TRANSFER_SOL || '0.001';
const AIRDROP_SOL = Number(process.env.XQP_DEVNET_AIRDROP_SOL || '0.05');

async function requestEphemeralFunding(connection, publicKey) {
  const lamports = Math.round(AIRDROP_SOL * LAMPORTS_PER_SOL);
  const signature = await connection.requestAirdrop(publicKey, lamports);
  const provider = createDevnetConfirmationProvider({ connection });
  await waitForDevnetConfirmation(provider, signature, { attempts: 45, intervalMs: 1000 });
  return signature;
}

async function main() {
  const connection = new Connection(RPC, 'confirmed');

  // Ephemeral signer exists only in this process. Secret key is never serialised or printed.
  const payer = Keypair.generate();
  const recipient = Keypair.generate().publicKey;
  const payerPublic = payer.publicKey.toBase58();
  const recipientPublic = recipient.toBase58();

  const fundingSignature = await requestEphemeralFunding(connection, payer.publicKey);
  const fundedBalance = await connection.getBalance(payer.publicKey, 'confirmed');
  if (fundedBalance <= 0) throw new Error('DEVNET_AIRDROP_BALANCE_NOT_OBSERVED');

  const now = new Date();
  let tx = createTransaction({
    transaction_id: `tx_devnet_${now.getTime()}`,
    intent_id: `intent_devnet_${now.getTime()}`,
    operation: 'test',
    asset_id: DEVNET_ASSET_ID,
    symbol: 'SOL-DEV',
    amount: TRANSFER_SOL,
    sender: payerPublic,
    recipient: recipientPublic,
    network: 'solana-devnet',
    expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    purpose_code: 'XQP_FULL_LIFECYCLE_DEVNET',
    actor: 'xqp-devnet-integration'
  });

  tx = transition(tx, 'POLICY_PENDING', {
    actor: 'xqp-devnet-policy',
    reason: 'TESTNET_POLICY_EVALUATION'
  });
  tx = applyPolicy(tx, 'allow', {
    actor: 'xqp-devnet-policy',
    reason: 'TESTNET_ONLY_ALLOWED',
    evidence_refs: ['XQP-0005']
  });
  tx = authorise(tx, payerPublic, {
    actor: 'ephemeral-devnet-signer',
    reason: 'EPHEMERAL_SIGNER_AUTHORISED'
  });

  const transport = createDevnetRpcTransport({ connection, signer: payer });
  tx = await submitViaDevnetTransport(tx, {
    transport,
    idempotency_key: `idem_${tx.transaction_id}`,
    actor: 'solana-devnet-rpc'
  });

  const confirmationProvider = createDevnetConfirmationProvider({ connection });
  await waitForDevnetConfirmation(confirmationProvider, tx.settlement.signature, {
    attempts: 45,
    intervalMs: 1000
  });
  tx = await confirmViaDevnetProvider(tx, {
    confirmationProvider,
    actor: 'solana-devnet-rpc'
  });
  if (tx.state !== 'CONFIRMED') throw new Error('DEVNET_NOT_CONFIRMED');

  const entries = [
    {
      account: `wallet:${payerPublic}`,
      side: 'debit',
      asset_id: DEVNET_ASSET_ID,
      amount: TRANSFER_SOL
    },
    {
      account: `wallet:${recipientPublic}`,
      side: 'credit',
      asset_id: DEVNET_ASSET_ID,
      amount: TRANSFER_SOL
    }
  ];
  if (tx.settlement.network_fee && tx.settlement.network_fee !== '0') {
    entries.push(
      {
        account: `wallet:${payerPublic}:network-fee`,
        side: 'debit',
        asset_id: DEVNET_ASSET_ID,
        amount: tx.settlement.network_fee
      },
      {
        account: 'network:solana-devnet:fees',
        side: 'credit',
        asset_id: DEVNET_ASSET_ID,
        amount: tx.settlement.network_fee
      }
    );
  }

  tx = postAccounting(tx, entries, {
    actor: 'xqp-reference-ledger',
    reason: 'DEVNET_DOUBLE_ENTRY_POSTED'
  });
  tx = transition(tx, 'AUDITED', {
    actor: 'xqp-reference-auditor',
    reason: 'DEVNET_LIFECYCLE_VERIFIED',
    evidence_ref: tx.settlement.signature
  });

  const recipientBalance = await connection.getBalance(recipient, 'confirmed');
  const result = {
    completed_at: new Date().toISOString(),
    protocol_state: tx.state,
    network: 'solana-devnet',
    rpc_endpoint: RPC,
    asset_id: DEVNET_ASSET_ID,
    amount_sol: TRANSFER_SOL,
    ephemeral_payer_public_key: payerPublic,
    recipient_public_key: recipientPublic,
    funding_signature: fundingSignature,
    settlement_signature: tx.settlement.signature,
    commitment: tx.settlement.commitment,
    slot: tx.settlement.block_or_slot,
    network_fee_sol: tx.settlement.network_fee,
    recipient_balance_lamports: recipientBalance,
    authorisation_digest: tx.authorisation.payload_digest,
    accounting_balanced: tx.accounting.status === 'posted',
    audit_event_count: tx.audit.length,
    secret_material_persisted: false,
    audit: tx.audit
  };

  if (result.protocol_state !== 'AUDITED') throw new Error('LIFECYCLE_DID_NOT_REACH_AUDITED');
  if (recipientBalance <= 0) throw new Error('RECIPIENT_BALANCE_NOT_OBSERVED');

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + '\n', { mode: 0o644 });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

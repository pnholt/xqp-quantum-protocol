const {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');

const DEVNET_ASSET_ID = 'solana-devnet:native-sol';

function decimalSolToLamports(value) {
  if (typeof value !== 'string' || !/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
    throw new Error('INVALID_SOL_AMOUNT');
  }
  const [whole, frac = ''] = value.split('.');
  if (frac.length > 9) throw new Error('SOL_AMOUNT_TOO_PRECISE');
  const lamports = BigInt(whole) * 1000000000n + BigInt((frac + '000000000').slice(0, 9));
  if (lamports <= 0n) throw new Error('SOL_AMOUNT_MUST_BE_POSITIVE');
  if (lamports > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('SOL_AMOUNT_TOO_LARGE');
  return Number(lamports);
}

function lamportsToSolString(lamports) {
  const n = BigInt(lamports);
  const whole = n / 1000000000n;
  const frac = (n % 1000000000n).toString().padStart(9, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}

function assertDevnetConnection(connection) {
  if (!(connection instanceof Connection)) throw new Error('SOLANA_CONNECTION_REQUIRED');
  const endpoint = String(connection.rpcEndpoint || '').toLowerCase();
  if (!endpoint.includes('devnet')) throw new Error('DEVNET_RPC_REQUIRED');
}

function createDevnetRpcTransport({ connection, signer }) {
  assertDevnetConnection(connection);
  if (!signer || !signer.publicKey || !signer.secretKey) throw new Error('SIGNER_REQUIRED');

  return async function transport(request) {
    if (!request || request.network !== 'solana-devnet') throw new Error('DEVNET_ONLY');
    if (request.asset_id !== DEVNET_ASSET_ID) throw new Error('UNSUPPORTED_DEVNET_ASSET');
    if (request.sender !== signer.publicKey.toBase58()) throw new Error('SENDER_SIGNER_MISMATCH');

    const recipient = new PublicKey(request.recipient);
    const lamports = decimalSolToLamports(request.amount);
    const latest = await connection.getLatestBlockhash('confirmed');

    const transaction = new Transaction({
      feePayer: signer.publicKey,
      recentBlockhash: latest.blockhash
    }).add(SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: recipient,
      lamports
    }));

    const message = transaction.compileMessage();
    const feeResponse = await connection.getFeeForMessage(message, 'confirmed');
    const feeLamports = feeResponse && feeResponse.value != null ? feeResponse.value : null;

    const signature = await connection.sendTransaction(transaction, [signer], {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3
    });

    return {
      signature,
      commitment: 'processed',
      network_fee: feeLamports == null ? null : lamportsToSolString(feeLamports),
      last_valid_block_height: latest.lastValidBlockHeight
    };
  };
}

function createDevnetConfirmationProvider({ connection }) {
  assertDevnetConnection(connection);

  return async function confirmationProvider(signature) {
    const response = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true
    });
    const status = response && response.value ? response.value[0] : null;
    if (!status) return { confirmed: false, commitment: null, slot: null };
    if (status.err) {
      const error = new Error('DEVNET_TRANSACTION_FAILED');
      error.details = status.err;
      throw error;
    }
    const commitment = status.confirmationStatus || null;
    return {
      confirmed: commitment === 'confirmed' || commitment === 'finalized',
      commitment,
      slot: status.slot ?? null
    };
  };
}

async function waitForDevnetConfirmation(provider, signature, options = {}) {
  const attempts = options.attempts || 30;
  const intervalMs = options.intervalMs || 1000;
  for (let i = 0; i < attempts; i += 1) {
    const status = await provider(signature);
    if (status.confirmed) return status;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('DEVNET_CONFIRMATION_TIMEOUT');
}

module.exports = {
  DEVNET_ASSET_ID,
  decimalSolToLamports,
  lamportsToSolString,
  createDevnetRpcTransport,
  createDevnetConfirmationProvider,
  waitForDevnetConfirmation
};

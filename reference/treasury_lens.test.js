'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const lens = require('./treasury_lens');
const { rpc, request } = require('../scripts/treasury_lens');
const MINT = lens.XQP_MINT;
// Synthetic fixtures use public program addresses; no customer wallet data.
const WALLET = 'BPFLoaderUpgradeab1e11111111111111111111111';
const ACCOUNT = 'So11111111111111111111111111111111111111112';
const OTHER = '11111111111111111111111111111111';
const raw = '10000000000000000000';
const ok = result => ({ status: 'ok', result });
function mintResponse() {
  return { context: { slot: 123 }, value: { owner: lens.TOKEN_PROGRAM, executable: false,
    data: { program: 'spl-token', parsed: { type: 'mint', info: { decimals: 9,
      isInitialized: true, supply: raw, mintAuthority: null, freezeAuthority: null } } } } };
}
function walletAccount(address, amount, state = 'initialized') {
  return { pubkey: address, account: { owner: lens.TOKEN_PROGRAM, executable: false,
    data: { program: 'spl-token', parsed: { type: 'account', info: {
      owner: WALLET, mint: MINT, state, tokenAmount: { amount, decimals: 9 } } } } } };
}
function snapshot() {
  return { started_at: '2026-09-06T00:00:00Z', completed_at: '2026-09-06T00:00:01Z',
    mint: MINT, rpc_origin: 'https://api.mainnet-beta.solana.com', wallets: [], sources: {
      genesis: ok('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'), mint: ok(mintResponse()),
      largest: { status: 'error', error: 'HTTP_429' }, market: ok([]) } };
}

test('10 billion tokens and a single raw unit retain exact precision', () => {
  assert.equal(lens.formatUnits(raw, 9), '10000000000');
  assert.equal(lens.formatUnits('10000000000000000001', 9), '10000000000.000000001');
  assert.equal(lens.percentage(1n, 3n), '33.3333');
  assert.equal(lens.percentage(0n, 0n), null);
  for (const bad of [1e19, '-1', '1.0', '1e9', '18446744073709551616']) assert.throws(() => lens.units(bad));
});

test('public keys require 32 decoded bytes, not merely base58-looking text', () => {
  assert.equal(lens.publicKey(MINT), MINT);
  assert.equal(lens.publicKey(OTHER), OTHER);
  assert.throws(() => lens.publicKey('1'.repeat(44)));
  assert.throws(() => lens.publicKey('0'.repeat(32)));
});

test('missing authority fields are not treated as revoked', () => {
  const result = mintResponse();
  delete result.value.data.parsed.info.mintAuthority;
  assert.throws(() => lens.summariseMint(result), /MISSING_AUTHORITY_FIELD/);
  assert.equal(lens.summariseMint(mintResponse()).mint_authority_revoked, true);
});

test('uninitialised and unsupported mint accounts fail closed', () => {
  const result = mintResponse();
  result.value.owner = OTHER;
  assert.throws(() => lens.summariseMint(result), /UNSUPPORTED_OR_INVALID_MINT/);
  result.value.owner = lens.TOKEN_PROGRAM;
  result.value.data.parsed.info.isInitialized = false;
  assert.throws(() => lens.summariseMint(result), /UNINITIALISED_MINT/);
});

test('largest accounts are sorted exactly and never labelled as holder count', () => {
  const result = lens.summariseLargest({ context: { slot: 124 }, value: [
    { address: ACCOUNT, decimals: 9, amount: '1' },
    { address: OTHER, decimals: 9, amount: '9999999999999999999' }
  ] }, lens.summariseMint(mintResponse()));
  assert.equal(result.accounts[0].address, OTHER);
  assert.equal(result.returned_accounts_supply_pct, '100');
  assert.equal(result.holder_count, null);
});

test('duplicate, empty and inconsistent account observations cannot produce reassuring percentages', () => {
  const mint = lens.summariseMint(mintResponse());
  const row = { address: ACCOUNT, decimals: 9, amount: raw };
  assert.throws(() => lens.summariseLargest({ context: { slot: 124 }, value: [row, row] }, mint), /DUPLICATE/);
  assert.throws(() => lens.summariseLargest({ context: { slot: 124 }, value: [] }, mint), /EMPTY_ACCOUNTS/);
  assert.throws(() => lens.summariseLargest({ context: { slot: 124 }, value: [row, { ...row, address: OTHER, amount: '1' }] }, mint), /EXCEED_SUPPLY/);
});

test('wallet totals include exact dust but do not assert control or spendability', () => {
  const result = lens.summariseWallet({ context: { slot: 125 }, value: [
    walletAccount(ACCOUNT, '9999999999999999999'), walletAccount(OTHER, '1', 'frozen')
  ] }, WALLET, MINT, lens.summariseMint(mintResponse()));
  assert.equal(result.balance_tokens, '10000000000');
  assert.equal(result.control_verified, false);
  assert.equal(result.spendable_balance, null);
});

test('wallet balance response must match the exact mint and owner', () => {
  const account = walletAccount(ACCOUNT, '1');
  account.account.data.parsed.info.owner = OTHER;
  assert.throws(() => lens.summariseWallet({ context: { slot: 125 }, value: [account] },
    WALLET, MINT, lens.summariseMint(mintResponse())), /WALLET_ACCOUNT_MISMATCH/);
});

test('market absence, source failure and mismatched tickers stay distinct', () => {
  assert.equal(lens.summariseMarkets([], MINT).status, 'no_indexed_pairs');
  assert.throws(() => lens.summariseMarkets([{ chainId: 'solana', baseToken: { address: OTHER }, quoteToken: { address: ACCOUNT } }], MINT), /MINT_MISMATCH/);
  const report = lens.buildReport(snapshot());
  assert.equal(report.status, 'partial');
  assert.equal(report.largest_accounts.reason, 'HTTP_429');
  assert.equal(report.market.indexed_pair_count, 0);
  assert.equal(report.valuation.cash_available_gbp, null);
  assert.equal(report.mint.supply_tokens, '10000000000');
});

test('an unverified network cannot yield a verified mint or wallet observation', () => {
  const data = snapshot();
  data.sources.genesis = ok('different-chain');
  const report = lens.buildReport(data);
  assert.equal(report.status, 'unverified');
  assert.equal(report.mint.reason, 'MAINNET_NOT_VERIFIED');
  assert.match(lens.markdown(report), /Unverified/);
  data.sources.genesis = ok('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
  assert.equal(lens.buildReport(data).network, 'unverified');
});

test('transaction submission is rejected before making any request', () => {
  assert.throws(() => rpc('https://example.invalid', 'sendTransaction', []), /READ_ONLY_METHOD_REQUIRED/);
});

test('request failures do not expose provider credentials through error text', async () => {
  const original = global.fetch;
  global.fetch = async () => { throw Error('https://provider.example/credential-path'); };
  try {
    const result = await request('https://provider.example/credential-path');
    assert.equal(result.error, 'NETWORK_TIMEOUT_OR_INVALID_RESPONSE');
    assert.equal(JSON.stringify(result).includes('credential-path'), false);
  } finally { global.fetch = original; }
});

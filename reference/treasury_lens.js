'use strict';

// Reporting only. No signing, custody, transaction construction or submission.
const XQP_MINT = '5qrGE6aj5yYnhP7tJwNSP8Uz48juymCTMQT7w7w1KtH6';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
// Full hash returned by the canonical mainnet RPC; do not use an abbreviated ID.
const MAINNET_GENESIS = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const U64_MAX = 18446744073709551615n;

function publicKey(value) {
  if (typeof value !== 'string' || value.length < 32 || value.length > 44) throw Error('INVALID_PUBLIC_KEY');
  let n = 0n;
  for (const c of value) {
    const digit = BASE58.indexOf(c);
    if (digit < 0) throw Error('INVALID_PUBLIC_KEY');
    n = n * 58n + BigInt(digit);
  }
  let bytes = 0;
  while (n > 0n) { bytes++; n >>= 8n; }
  bytes += value.match(/^1*/)[0].length;
  if (bytes !== 32) throw Error('INVALID_PUBLIC_KEY');
  return value;
}

function units(value) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) throw Error('INVALID_RAW_UNITS');
  const result = BigInt(value);
  if (result > U64_MAX) throw Error('RAW_UNITS_OVERFLOW');
  return result;
}

function decimalPlaces(value) {
  if (!Number.isInteger(value) || value < 0 || value > 255) throw Error('INVALID_DECIMALS');
  return value;
}

function formatUnits(value, decimals) {
  const amount = typeof value === 'bigint' ? value : units(value);
  if (amount < 0n) throw Error('INVALID_RAW_UNITS');
  decimalPlaces(decimals);
  if (decimals === 0) return amount.toString();
  const digits = amount.toString().padStart(decimals + 1, '0');
  const tail = digits.slice(-decimals).replace(/0+$/, '');
  return digits.slice(0, -decimals) + (tail ? '.' + tail : '');
}

// Percentages truncate to four decimal places; token amounts never use floats.
function percentage(numerator, denominator) {
  if (denominator === 0n) return null;
  return formatUnits(numerator * 1000000n / denominator, 4);
}

function atSlot(result) {
  if (!Number.isSafeInteger(result?.context?.slot) || result.context.slot < 0) throw Error('MISSING_CONTEXT_SLOT');
  return result.context.slot;
}

function summariseMint(result) {
  const slot = atSlot(result);
  const account = result.value;
  if (!account || account.owner !== TOKEN_PROGRAM || account.executable !== false ||
      account.data?.program !== 'spl-token' || account.data?.parsed?.type !== 'mint') {
    throw Error('UNSUPPORTED_OR_INVALID_MINT');
  }
  const info = account.data.parsed.info;
  if (info?.isInitialized !== true) throw Error('UNINITIALISED_MINT');
  for (const field of ['mintAuthority', 'freezeAuthority']) {
    if (!Object.hasOwn(info, field)) throw Error('MISSING_AUTHORITY_FIELD');
    if (info[field] !== null) publicKey(info[field]);
  }
  const decimals = decimalPlaces(info.decimals);
  const supply = units(info.supply);
  return { status: 'observed', slot, token_program: TOKEN_PROGRAM, decimals,
    raw_supply: supply.toString(), supply_tokens: formatUnits(supply, decimals),
    mint_authority: info.mintAuthority, freeze_authority: info.freezeAuthority,
    mint_authority_revoked: info.mintAuthority === null,
    freeze_authority_revoked: info.freezeAuthority === null };
}

function summariseLargest(result, mint) {
  const slot = atSlot(result);
  if (!Array.isArray(result.value) || result.value.length > 20) throw Error('INVALID_LARGEST_ACCOUNTS');
  const seen = new Set();
  const accounts = result.value.map(row => {
    publicKey(row.address);
    if (seen.has(row.address)) throw Error('DUPLICATE_TOKEN_ACCOUNT');
    seen.add(row.address);
    if (row.decimals !== mint.decimals) throw Error('DECIMALS_MISMATCH');
    return { address: row.address, amount: units(row.amount) };
  }).sort((a, b) => a.amount > b.amount ? -1 : a.amount < b.amount ? 1 : 0);
  const supply = units(mint.raw_supply);
  const sum = rows => rows.reduce((total, row) => total + row.amount, 0n);
  if (sum(accounts) > supply) throw Error('SNAPSHOT_BALANCES_EXCEED_SUPPLY');
  if (!accounts.length && supply > 0n) throw Error('EMPTY_ACCOUNTS_FOR_NONZERO_SUPPLY');
  return { status: 'observed', slot, returned_account_count: accounts.length,
    holder_count: null,
    top_account_supply_pct: percentage(sum(accounts.slice(0, 1)), supply),
    top_five_accounts_supply_pct: percentage(sum(accounts.slice(0, 5)), supply),
    returned_accounts_supply_pct: percentage(sum(accounts), supply),
    accounts: accounts.map(row => ({ address: row.address, raw_amount: row.amount.toString(),
      tokens: formatUnits(row.amount, mint.decimals), supply_pct: percentage(row.amount, supply) })),
    limitation: 'Up to 20 token accounts, not distinct owners. Pools, custodians and related accounts are not classified. This is not a holder count or a circulating-supply calculation.' };
}

function summariseWallet(result, wallet, mintAddress, mint) {
  publicKey(wallet);
  const slot = atSlot(result);
  if (!Array.isArray(result.value)) throw Error('INVALID_WALLET_ACCOUNTS');
  const seen = new Set();
  let total = 0n;
  const accounts = result.value.map(row => {
    publicKey(row.pubkey);
    if (seen.has(row.pubkey)) throw Error('DUPLICATE_TOKEN_ACCOUNT');
    seen.add(row.pubkey);
    const account = row.account;
    const info = account?.data?.parsed?.info;
    if (account?.owner !== TOKEN_PROGRAM || account.executable !== false ||
        account.data?.program !== 'spl-token' || account.data?.parsed?.type !== 'account' ||
        info?.owner !== wallet || info?.mint !== mintAddress || info.tokenAmount?.decimals !== mint.decimals ||
        !['initialized', 'frozen'].includes(info.state)) throw Error('WALLET_ACCOUNT_MISMATCH');
    const amount = units(info.tokenAmount.amount);
    total += amount;
    return { address: row.pubkey, raw_amount: amount.toString(), state: info.state,
      delegate_present: Boolean(info.delegate) };
  });
  if (total > units(mint.raw_supply)) throw Error('SNAPSHOT_BALANCES_EXCEED_SUPPLY');
  return { status: 'observed', address: wallet, slot, account_count: accounts.length,
    raw_balance: total.toString(), balance_tokens: formatUnits(total, mint.decimals),
    control_verified: false, spendable_balance: null, accounts,
    limitation: 'Only the supplied address is checked. A balance query does not prove who controls it, beneficial ownership, liabilities or spendability.' };
}

function summariseMarkets(result, mintAddress) {
  if (!Array.isArray(result)) throw Error('INVALID_MARKET_RESPONSE');
  const seen = new Set();
  const pairs = result.filter(pair => pair?.chainId === 'solana' &&
    (pair.baseToken?.address === mintAddress || pair.quoteToken?.address === mintAddress)).map(pair => {
      publicKey(pair.pairAddress);
      if (seen.has(pair.pairAddress)) throw Error('DUPLICATE_MARKET_PAIR');
      seen.add(pair.pairAddress);
      return { pair_address: pair.pairAddress, dex_id: String(pair.dexId || 'unknown'),
        base_mint: pair.baseToken.address, quote_mint: pair.quoteToken.address };
    });
  if (result.length && !pairs.length) throw Error('MARKET_RESPONSE_MINT_MISMATCH');
  return { status: pairs.length ? 'indexed_pairs_found' : 'no_indexed_pairs',
    indexed_pair_count: pairs.length, pairs, executable_gbp_value: null,
    limitation: 'Dexscreener is one index. An empty result does not prove no market exists. An indexed pool does not establish an executable quote, beneficial ownership, market depth or sale proceeds.' };
}

function analyse(source, fn) {
  if (!source || source.status !== 'ok') return { status: 'unavailable', reason: source?.error || 'NOT_REQUESTED' };
  try { return fn(source.result); }
  catch (error) { return { status: 'unavailable', reason: error.message }; }
}

function buildReport(snapshot) {
  const mintAddress = publicKey(snapshot.mint);
  const network = snapshot.sources.genesis?.status === 'ok' &&
    snapshot.sources.genesis.result === MAINNET_GENESIS;
  const mint = network ? analyse(snapshot.sources.mint, summariseMint) :
    { status: 'unavailable', reason: 'MAINNET_NOT_VERIFIED' };
  const usable = mint.status === 'observed';
  const largest = usable ? analyse(snapshot.sources.largest, r => summariseLargest(r, mint)) :
    { status: 'unavailable', reason: 'MINT_NOT_VERIFIED' };
  const wallets = (snapshot.wallets || []).map(wallet => ({ address: publicKey(wallet.address),
    ...(usable ? analyse(wallet.source, r => summariseWallet(r, wallet.address, mintAddress, mint)) :
      { status: 'unavailable', reason: 'MINT_NOT_VERIFIED' }) }));
  const market = analyse(snapshot.sources.market, r => summariseMarkets(r, mintAddress));
  return { report_version: '0.1.0', started_at: snapshot.started_at, completed_at: snapshot.completed_at,
    mint_address: mintAddress, network: network ? 'solana-mainnet' : 'unverified',
    rpc_origin: snapshot.rpc_origin, commitment: 'finalized',
    status: !usable ? 'unverified' : [largest, market, ...wallets].some(x => x.status === 'unavailable') ? 'partial' : 'observed',
    mint, largest_accounts: largest, wallets, market,
    valuation: { token_price_gbp: null, founder_holdings: null, cash_available_gbp: null },
    limitations: ['Observations may have different finalised slots; this is not one atomic snapshot.',
      'RPC and index observations are not independent security, financial or legal assurance.',
      'No founder ownership, net assets, market value, reserve backing or token utility is inferred.',
      'Legacy SPL Token mints only; Token-2022 extensions are not supported.'] };
}

function markdown(report) {
  const mint = report.mint;
  const observed = mint.status === 'observed';
  const rows = [
    ['Network', report.network], ['Supply (tokens)', observed ? mint.supply_tokens : 'Unverified'],
    ['Decimals', observed ? mint.decimals : 'Unverified'],
    ['Mint authority revoked', observed ? String(mint.mint_authority_revoked) : 'Unverified'],
    ['Freeze authority revoked', observed ? String(mint.freeze_authority_revoked) : 'Unverified'],
    ['Mint observation slot', observed ? mint.slot : 'Unverified'],
    ['Largest-account data', report.largest_accounts.status === 'observed' ?
      `${report.largest_accounts.returned_account_count} token accounts returned` : `Unavailable: ${report.largest_accounts.reason}`],
    ['Dexscreener pairs', report.market.status === 'unavailable' ? `Unavailable: ${report.market.reason}` : report.market.indexed_pair_count],
    ['Founder holdings / cash value', 'Not established']
  ];
  return `# XQP Treasury Lens — evidence report\n\nCompleted: ${report.completed_at}\n\nMint: \`${report.mint_address}\`\n\nReport status: **${report.status}**. Read-only observations.\n\n| Check | Result |\n|---|---|\n` +
    rows.map(([k, v]) => `| ${k} | ${v} |`).join('\n') +
    '\n\n## Supplied wallet addresses\n\n' + (report.wallets.length ? report.wallets.map(wallet =>
      `- \`${wallet.address}\`: ${wallet.status === 'observed' ? wallet.balance_tokens + ' tokens in ' + wallet.account_count + ' token accounts' : 'unavailable (' + wallet.reason + ')'}. Control is not verified.`).join('\n') : 'No wallet address supplied. Holdings are unverified.') +
    '\n\n## Interpretation\n\nAn empty index result means no pair was returned by this source. It does not prove that no market exists. The largest-account endpoint returns at most 20 token accounts, not people. A wallet balance does not establish control, beneficial ownership or spendability.\n\n' +
    report.limitations.map(item => '- ' + item).join('\n') +
    '\n\nSources: [Solana RPC](https://solana.com/docs/rpc), [largest token accounts](https://solana.com/docs/rpc/http/gettokenlargestaccounts), [owner token accounts](https://solana.com/docs/rpc/http/gettokenaccountsbyowner), [Dexscreener API](https://docs.dexscreener.com/api/reference). Raw observations accompany this report.\n';
}

module.exports = { XQP_MINT, TOKEN_PROGRAM, MAINNET_GENESIS, publicKey, units, formatUnits,
  percentage, summariseMint, summariseLargest, summariseWallet, summariseMarkets, buildReport, markdown };

#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { XQP_MINT, publicKey, buildReport, markdown } = require('../reference/treasury_lens');

const READ_METHODS = new Set(['getGenesisHash', 'getAccountInfo', 'getTokenLargestAccounts', 'getTokenAccountsByOwner']);

async function request(url, body) {
  const started_at = new Date().toISOString();
  try {
    const response = await fetch(url, { method: body ? 'POST' : 'GET', redirect: 'error',
      headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { status: 'error', started_at, error: `HTTP_${response.status}` };
    const data = await response.json();
    if (body && (data.error || !Object.hasOwn(data, 'result'))) {
      return { status: 'error', started_at, error: Number.isInteger(data.error?.code) ? `RPC_${data.error.code}` : 'INVALID_RPC_RESPONSE' };
    }
    return { status: 'ok', started_at, completed_at: new Date().toISOString(), result: body ? data.result : data };
  } catch { return { status: 'error', started_at, error: 'NETWORK_TIMEOUT_OR_INVALID_RESPONSE' }; }
}

function rpc(endpoint, method, params) {
  if (!READ_METHODS.has(method)) throw Error('READ_ONLY_METHOD_REQUIRED');
  return request(endpoint, { jsonrpc: '2.0', id: 1, method, params });
}

async function main() {
  const args = process.argv.slice(2);
  let mint = XQP_MINT;
  let output = path.resolve('artifacts', 'treasury-lens-' + new Date().toISOString().replace(/[:.]/g, '-'));
  const addresses = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help') {
      console.log('Usage: node scripts/treasury_lens.js [--mint PUBLIC_MINT] [--wallet PUBLIC_WALLET] [--out NEW_DIRECTORY]\nRead-only Solana mainnet evidence. Repeat --wallet for up to 10 addresses. Requires Node 20+. No wallet connection or secret is used.');
      return;
    }
    const option = args[i];
    const value = args[++i];
    if (!value || value.startsWith('--')) throw Error('MISSING_OPTION_VALUE');
    if (option === '--mint') mint = publicKey(value);
    else if (option === '--wallet') addresses.push(publicKey(value));
    else if (option === '--out') output = path.resolve(value);
    else throw Error('UNKNOWN_OPTION');
  }
  if (addresses.length > 10 || new Set(addresses).size !== addresses.length) throw Error('WALLET_LIMIT_OR_DUPLICATE');
  const endpoint = process.env.XQP_LENS_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const endpointUrl = new URL(endpoint);
  if (endpointUrl.protocol !== 'https:') throw Error('HTTPS_RPC_REQUIRED');
  if (fs.existsSync(output)) throw Error('OUTPUT_DIRECTORY_ALREADY_EXISTS');
  const snapshot = { started_at: new Date().toISOString(), mint, rpc_origin: endpointUrl.origin, sources: {}, wallets: [] };
  // Deliberately do not retain endpoint path, query, credentials or remote error messages.
  const jobs = [
    ['genesis', () => rpc(endpoint, 'getGenesisHash', [])],
    ['mint', () => rpc(endpoint, 'getAccountInfo', [mint, { encoding: 'jsonParsed', commitment: 'finalized' }])],
    ['largest', () => rpc(endpoint, 'getTokenLargestAccounts', [mint, { commitment: 'finalized' }])],
    ['market', () => request('https://api.dexscreener.com/token-pairs/v1/solana/' + mint)]
  ];
  const responses = await Promise.allSettled(jobs.map(async ([name, run]) => ({ name, value: await run() })));
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    snapshot.sources[jobs[i][0]] = response.status === 'fulfilled' ? response.value.value : { status: 'error', error: 'REQUEST_FAILED' };
  }
  for (const address of addresses) snapshot.wallets.push({ address, source: await rpc(endpoint,
    'getTokenAccountsByOwner', [address, { mint }, { encoding: 'jsonParsed', commitment: 'finalized' }]) });
  snapshot.completed_at = new Date().toISOString();
  const report = buildReport(snapshot);
  const evidence = JSON.stringify(snapshot, null, 2) + '\n';
  report.evidence_sha256 = crypto.createHash('sha256').update(evidence).digest('hex');
  fs.mkdirSync(output, { recursive: true, mode: 0o700 });
  for (const [name, contents] of [['observations.json', evidence], ['report.json', JSON.stringify(report, null, 2) + '\n'], ['report.md', markdown(report)]]) {
    fs.writeFileSync(path.join(output, name), contents, { flag: 'wx', mode: 0o600 });
  }
  console.log(JSON.stringify({ status: report.status, report_directory: output, evidence_sha256: report.evidence_sha256 }));
  if (report.status === 'unverified') process.exitCode = 2;
}

if (require.main === module) main().catch(() => { console.error('Treasury Lens could not complete. Check public-address arguments, HTTPS endpoint and a new output directory. No transaction was submitted.'); process.exitCode = 1; });
module.exports = { rpc, request };

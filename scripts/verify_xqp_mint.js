const fs = require('node:fs');
const path = require('node:path');
const { Connection, PublicKey } = require('@solana/web3.js');

const MINT = '5qrGE6aj5yYnhP7tJwNSP8Uz48juymCTMQT7w7w1KtH6';
const EXPECTED_UI_SUPPLY = '10000000000';
const RPC = process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';
const OUTPUT = process.env.XQP_MINT_VERIFICATION_OUTPUT || 'artifacts/xqp-mint-verification.json';

async function main() {
  const connection = new Connection(RPC, 'finalized');
  const mint = new PublicKey(MINT);
  const [account, supply] = await Promise.all([
    connection.getParsedAccountInfo(mint, 'finalized'),
    connection.getTokenSupply(mint, 'finalized')
  ]);

  if (!account.value) throw new Error('MINT_ACCOUNT_NOT_FOUND');
  const data = account.value.data;
  if (!data || typeof data !== 'object' || !('parsed' in data) || data.program !== 'spl-token') {
    throw new Error('ACCOUNT_IS_NOT_PARSED_SPL_TOKEN_MINT');
  }
  if (data.parsed.type !== 'mint') throw new Error('ACCOUNT_IS_NOT_MINT');

  const info = data.parsed.info;
  const observed = {
    verified_at: new Date().toISOString(),
    rpc_endpoint: RPC,
    commitment: 'finalized',
    mint: MINT,
    owner_program: account.value.owner.toBase58(),
    executable: account.value.executable,
    lamports: account.value.lamports,
    decimals: info.decimals,
    initialized: info.isInitialized,
    mint_authority: info.mintAuthority ?? null,
    freeze_authority: info.freezeAuthority ?? null,
    raw_supply: supply.value.amount,
    ui_supply: supply.value.uiAmountString,
    supply_decimals: supply.value.decimals,
    assertions: {
      mint_authority_revoked: info.mintAuthority == null,
      freeze_authority_revoked: info.freezeAuthority == null,
      expected_ui_supply: supply.value.uiAmountString === EXPECTED_UI_SUPPLY,
      decimals_match_supply: info.decimals === supply.value.decimals,
      initialized: info.isInitialized === true
    }
  };
  observed.verified = Object.values(observed.assertions).every(Boolean);

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(observed, null, 2) + '\n', { mode: 0o644 });
  console.log(JSON.stringify(observed, null, 2));

  if (!observed.verified) process.exitCode = 2;
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

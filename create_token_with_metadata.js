#!/usr/bin/env node
/*
 * create_token_with_metadata.js
 *
 * This script mints a brand‑new XQP token on Solana and attaches
 * on‑chain metadata before revoking the mint and freeze authorities.  It
 * performs the following steps:
 *   1. Connect to the Solana cluster and load the payer’s keypair.
 *   2. Create a new SPL mint with a 10B fixed supply (9 decimal places).
 *   3. Immediately create a Metaplex metadata account pointing at the
 *      hosted metadata.json for XQP (name, symbol, description, image).
 *   4. Mint the entire supply of 10B XQP tokens into the payer’s
 *      associated token account.
 *   5. Revoke the mint and freeze authorities to lock the supply.
 *
 * The metadata URI should be updated to point at a publicly accessible
 * location for your `metadata.json` file.  In this example it uses the
 * GitHub raw URL for the `metadata.json` committed to your repo.  If
 * you host the file elsewhere (e.g. IPFS/Arweave), replace the URI below.
 */

const fs = require('fs');
const path = require('path');
const {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
} = require('@solana/web3.js');
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
} = require('@solana/spl-token');
const {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID,
} = require('@metaplex-foundation/mpl-token-metadata');

/**
 * Load a Solana keypair from the given file path.
 *
 * @param {string} filepath Absolute path to the JSON keypair file.
 * @returns {Promise<Keypair>} A Keypair object.
 */
async function loadKeypair(filepath) {
  const secret = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  return Keypair.fromSecretKey(Buffer.from(secret));
}

async function main() {
  // Choose cluster: default to mainnet-beta; use "devnet" for testing.
  const network = process.env.SOLANA_CLUSTER || 'mainnet-beta';
  const connection = new Connection(clusterApiUrl(network), 'confirmed');

  // Load the payer’s keypair.  Either from SOLANA_KEYPAIR env or the
  // standard Solana CLI location ~/.config/solana/id.json.
  const keypairPath = process.env.SOLANA_KEYPAIR || path.resolve(
    require('os').homedir(),
    '.config',
    'solana',
    'id.json',
  );
  const payer = await loadKeypair(keypairPath);
  console.log(`Loaded payer ${payer.publicKey.toBase58()}`);

  // Token parameters
  const DECIMALS = 9;
  const TOTAL_SUPPLY = BigInt(10_000_000_000) * 10n ** BigInt(DECIMALS);
  const TOKEN_NAME = 'X Quantum Protocol';
  const TOKEN_SYMBOL = 'XQP';
  // IMPORTANT: Replace with the raw URL of your hosted metadata JSON.
  const METADATA_URI = 'https://raw.githubusercontent.com/pnholt/xqp-quantum-protocol/main/metadata.json';

  // 1. Create a new mint.  We set the mint and freeze authorities to the
  // payer (we’ll revoke them later).
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    DECIMALS,
    undefined,
    undefined,
  );
  console.log(`Created new mint: ${mint.toBase58()}`);

  // 2. Create the on‑chain metadata using the Metaplex Token Metadata program.
  // The metadata PDA is derived from the mint and the program ID.
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    PROGRAM_ID,
  );
  // Build the instruction to create the metadata account.
  const metadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPda,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: TOKEN_NAME,
          symbol: TOKEN_SYMBOL,
          uri: METADATA_URI,
          sellerFeeBasisPoints: 0, // no royalties for fungible tokens
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: false,        // metadata cannot be modified after creation
        collectionDetails: null,
      },
    },
  );
  // Send the metadata creation transaction.
  const metaTx = new Transaction().add(metadataIx);
  const metaSig = await sendAndConfirmTransaction(connection, metaTx, [payer]);
  console.log(`Metadata created. Signature: ${metaSig}`);

  // 3. Create (or get) the associated token account for the payer.
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );
  console.log(`Associated token account: ${tokenAccount.address.toBase58()}`);

  // 4. Mint the entire supply to the payer’s token account.
  const mintSig = await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer,
    TOTAL_SUPPLY,
  );
  console.log(`Minted total supply. Signature: ${mintSig}`);

  // 5. Revoke mint and freeze authorities to enforce fixed supply.
  const revokeMintSig = await setAuthority(
    connection,
    payer,
    mint,
    payer,
    AuthorityType.MintTokens,
    null,
  );
  console.log(`Revoked mint authority. Signature: ${revokeMintSig}`);
  const revokeFreezeSig = await setAuthority(
    connection,
    payer,
    mint,
    payer,
    AuthorityType.FreezeAccount,
    null,
  );
  console.log(`Revoked freeze authority. Signature: ${revokeFreezeSig}`);

  console.log('New XQP mint created successfully.');
  console.log(`Mint address: ${mint.toBase58()}`);
  console.log(`Token account: ${tokenAccount.address.toBase58()}`);
  console.log('IMPORTANT: Save your mint address and verify on Solana Explorer.');
}

main().catch((err) => {
  console.error(err);
});
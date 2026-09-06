# XQP Treasury Lens

Read-only evidence reporting for legacy SPL Token mints on Solana mainnet. This is the first reporting tool built on XQP's transparency and treasury specifications. It does not assign a cash value to minted supply.

## Run

Requires Node.js 20 or later. This tool uses only Node built-ins; it needs no dependency installation, wallet connection, password or signing key.

```bash
npm run report:treasury
node scripts/treasury_lens.js --help
```

The default is the canonical XQP mint. Use `--mint PUBLIC_MINT` for another supported mint, `--wallet PUBLIC_WALLET` to check a supplied address, and `--out NEW_DIRECTORY` to select a new output directory. Repeat `--wallet` for up to ten distinct addresses. Replace these placeholders with public addresses only.

An optional `XQP_LENS_RPC_URL` environment variable selects another HTTPS Solana mainnet RPC provider. Genesis hash validation rejects another network. Provider URL paths, query strings, credentials and remote error messages are not written to the reports. RPC observations still depend on the integrity and availability of that provider.

## Outputs

- `observations.json`: timestamped source observations, finalised slots and source failures.
- `report.json`: exact-unit supply and balances, authority flags, largest-account concentration and indexed-pair presence.
- `report.md`: readable evidence summary with limitations and source links.

The report includes a SHA-256 digest of the exact observations file. This can detect subsequent changes when compared with a separately retained digest; it is not an independent attestation or proof of original authenticity. Output uses a new private directory and refuses to overwrite an existing directory. Keep wallet reports private unless their publication is explicitly authorised.

## What a result establishes

| Observation | Meaning | Limit |
|---|---|---|
| Mint supply | Raw units and decimal scale returned for the identified mint | Does not establish founder holdings, circulating supply or market value |
| Null mint/freeze authorities | These authorities are revoked in the observed legacy SPL mint | Does not establish overall token safety or project credibility |
| Largest token accounts | Up to 20 account balances and supply percentages | Accounts are not distinct people; pools, custodians and related accounts are unclassified |
| Supplied wallet | Matching token accounts returned for that address | Does not prove control, beneficial ownership, liabilities or spendable balance |
| Dexscreener pair list | Pairs indexed for the exact Solana mint | Empty is not proof of no market; a pair is not an executable quote |

Amounts use BigInt and exact decimal strings, including XQP's 10,000,000,000,000,000,000 raw units. Percentages truncate to four decimal places. A failed source remains unavailable rather than becoming zero. A report is `partial` when optional evidence is missing, and `unverified` when mainnet or mint validation fails. Exit code 2 indicates an unverified report; callers should also inspect the JSON status for partial reports.

## Scope and next delivery gate

This is a working prototype for manually reviewed transparency reports. It is not a security audit, assurance opinion, investment recommendation, token sale, exchange, custodian, production SaaS, proof of reserves or net-asset statement. Token-2022 extensions, owner clustering, trade execution, fee quotes, transaction history and automated subscriptions are outside this version.

The next controlled service test is a manually checked report for one consenting project, with an explicit scope and a repeatable data source. Do not describe the larger reporting service as launched solely because the CLI works. Payments for software or analyst time must not imply rights to XQP tokens, profit, guaranteed price support or regulated approval.

## Verify the implementation

```bash
node --test reference/treasury_lens.test.js
npm test
npm run guard:secrets
```

Tests exercise exact precision beyond JavaScript's safe integer range, malformed and missing evidence, duplicate accounts, wallet/mint mismatches, source outages, network identity and the prohibition on transaction submission.

## Sources

- [Solana mint accounts](https://solana.com/docs/tokens/basics/create-mint)
- [Solana largest token accounts](https://solana.com/docs/rpc/http/gettokenlargestaccounts)
- [Solana accounts by owner](https://solana.com/docs/rpc/http/gettokenaccountsbyowner)
- [Dexscreener API reference](https://docs.dexscreener.com/api/reference)
- [FCA cryptoasset promotions](https://www.fca.org.uk/firms/cryptoassets/marketing-uk-consumers)

Public-address reporting can support the existing protocol; it does not implement or clear any future token incentive, merchant settlement or public fundraising proposal.

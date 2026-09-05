# XQP-0002 — Monetary Architecture & Asset Registry

**Status:** Genesis Draft
**Date:** 5 September 2026
**Depends on:** PROTOCOL_FOUNDATION.md, XQP-0001-GENESIS.md

## Abstract

This proposal separates the existing XQP cryptoasset from any future stable-value payment instrument and establishes a canonical asset registry. This separation is essential for accounting integrity, risk disclosure, engineering and regulatory analysis.

## 1. Canonical assets

### XQP
- Name: X Quantum Protocol
- Symbol: XQP
- Network: Solana
- Mint: `5qrGE6aj5yYnhP7tJwNSP8Uz48juymCTMQT7w7w1KtH6`
- Maximum/issued supply: 10,000,000,000 XQP (subject to independent on-chain verification)
- Mint authority: recorded by project documentation as revoked; independently verify before relying on this statement
- Freeze authority: recorded by project documentation as revoked; independently verify before relying on this statement
- Classification inside protocol: network cryptoasset
- Stability promise: none
- Redemption promise: none
- Legal-tender claim: none
- Deposit claim: none

XQP's market price may fluctuate. Protocol interfaces must never imply that one XQP equals one pound, dollar or other sovereign currency.

### XQP-SV
`XQP-SV` is a reserved design identifier only. It does not currently denote an issued asset.

If developed, it would represent a separate stable-value instrument and MUST have a separate legal issuer, specification, reserve architecture, redemption policy, risk framework and regulatory analysis before issuance.

No XQP-SV token may be publicly issued merely by approving this proposal.

## 2. Unit of account

The protocol distinguishes:

- **settlement asset** — what actually moves on a ledger;
- **unit of account** — how a price or obligation is denominated;
- **reference currency** — external currency used for valuation;
- **network token** — XQP;
- **stable-value instrument** — future, separately authorised design.

A merchant can therefore quote £10 while settlement occurs in an agreed cryptoasset at a disclosed exchange rate. This does not make the settlement asset sterling.

## 3. Monetary invariants

For XQP:

1. The protocol shall not introduce a mechanism capable of secretly increasing the canonical XQP supply.
2. Any wrapped or bridged representation must be explicitly labelled and must not be counted as additional canonical supply.
3. Treasury holdings are not burned supply unless demonstrably sent to an irrecoverable address under an adopted protocol rule.
4. Market capitalisation is not treasury value, reserve value or cash available to the project.
5. Token price is market-determined and is not a protocol performance guarantee.

## 4. Future stable-value design constraints

Before XQP-SV can leave research status, a subsequent proposal must specify at minimum:

- legal issuer;
- target reference value;
- eligible reserve assets;
- reserve custody;
- segregation and insolvency treatment;
- minting conditions;
- redemption at par and redemption timescale;
- fees;
- reserve reconciliation;
- independent assurance/attestation;
- operational resilience;
- financial-crime controls;
- complaint/redress model;
- wind-down plan;
- applicable FCA/payment-services permissions.

The default research hypothesis is a fully reserved model backed by high-quality liquid assets rather than an endogenous algorithmic stabilisation mechanism.

## 5. Asset registry schema

Every recognised asset MUST have a machine-readable record containing:

`asset_id, name, symbol, network, contract_or_mint, decimals, issuer, asset_class, supply_model, redemption_model, reference_asset, status, risk_level, verification_source, last_verified_at`

Status values: `research`, `testnet`, `pilot`, `production`, `deprecated`.

No application should identify an asset by ticker alone.

## 6. Pricing

Quotes involving volatile assets must contain:

- source asset and amount;
- destination asset and amount;
- reference fiat value where applicable;
- price source(s);
- timestamp;
- expiry;
- spread/fee;
- maximum permitted slippage.

The system should reject stale quotes rather than silently executing them.

## 7. Monetary governance

XQP governance may change software and protocol policy but cannot alter facts about the underlying Solana mint. Any proposal claiming to modify supply must demonstrate the actual on-chain authority enabling that change.

A future stable-value instrument must not permit governance token holders to vote reserve assets away from redeeming holders.

## 8. Adoption criteria

XQP-0002 becomes the canonical monetary model when:

- the existing mint and authorities have been independently re-verified;
- `assets/registry.json` validates against its schema;
- all public protocol interfaces distinguish XQP from future XQP-SV;
- treasury and market-value accounting are separated.

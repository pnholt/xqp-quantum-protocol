# XQP Reference Implementation

This directory contains a deliberately minimal, dependency-free implementation of the XQP transaction state machine defined in `docs/XQP-0003-TRANSACTION-PROTOCOL.md`.

It is **not** a wallet, custodian, exchange, stablecoin, mainnet payment processor or production signing service.

## Run the tests

Requires Node.js 20 or later.

```bash
node --test reference/xqp_transaction.test.js
```

## Implemented

- deterministic transaction creation;
- explicit state-transition validation;
- policy decision handling;
- deterministic SHA-256 authorisation digest;
- payload mutation detection;
- settlement submission/confirmation recording;
- idempotency-key requirement;
- exact decimal double-entry balance checking;
- append-only audit-state events.

## Intentionally not implemented yet

- private-key management;
- Solana signing;
- RPC submission;
- custody;
- price/oracle integration;
- KYC/AML provider integration;
- database persistence;
- production authentication/authorisation;
- XQP-SV issuance or reserves.

## Next engineering step

Add a Solana **devnet-only** settlement adapter that accepts an already authorised transaction, constructs or records a devnet transfer, and maps the returned signature/confirmation into the XQP transaction object. No mainnet private key should be committed or embedded in the reference implementation.
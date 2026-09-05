# XQP-0003 — Transaction Protocol

**Status:** Genesis Draft
**Type:** Standards Track
**Date:** 5 September 2026
**Depends on:** XQP-0001, XQP-0002

## Abstract

This proposal defines a chain-normalised transaction lifecycle for X Quantum Protocol. The goal is to make every payment or value-transfer attempt explicit, replay-resistant, auditable and capable of being reconciled independently of the settlement network.

## 1. Transaction lifecycle

Every XQP protocol transaction progresses through deterministic states:

`CREATED -> POLICY_PENDING -> QUOTED -> AUTHORISED -> SUBMITTED -> CONFIRMED -> ACCOUNTED -> AUDITED`

Terminal failure states are:

`REJECTED`, `EXPIRED`, `FAILED`, `CANCELLED`.

A terminal state MUST NOT silently transition back into an active state. A replacement transaction requires a new transaction identifier and may reference the prior transaction as `supersedes`.

## 2. Core transaction object

Each transaction MUST contain, at minimum:

- `protocol_version`
- `transaction_id`
- `created_at`
- `updated_at`
- `state`
- `intent`
- `asset`
- `amount`
- `sender`
- `recipient`
- `network`
- `policy`
- `quote`
- `authorisation`
- `settlement`
- `accounting`
- `audit`

Optional personal data SHOULD NOT be embedded unless strictly required. Sensitive compliance evidence belongs in an external controlled system and may be represented by opaque references or hashes.

## 3. Intent

An intent expresses what a participant wants to achieve before settlement details are chosen.

Required fields:

- unique `intent_id`;
- operation type (`transfer`, `merchant_payment`, `donation`, `treasury_disbursement`, `test`);
- source asset identifier from `assets/registry.json`;
- amount in base units or a precisely specified decimal representation;
- destination address/account identifier;
- expiry time;
- human-readable purpose code.

An intent MUST NOT itself move funds.

## 4. Policy stage

Policy evaluation returns:

- `decision`: `allow`, `deny`, or `review`;
- policy version;
- jurisdiction flags where relevant;
- sanctions/compliance outcome where applicable;
- transaction-value controls;
- application-specific restrictions;
- evidence references.

A denied policy result cannot be overridden by ordinary application code. Manual override, if ever permitted, requires a separately logged privileged decision.

## 5. Quote stage

A quote is required whenever the amount depends on an exchange rate or volatile reference value.

A quote contains:

- quote identifier;
- source and destination assets;
- input and output amounts;
- price source(s);
- timestamp;
- expiry;
- fee/spread;
- maximum slippage;
- reference fiat value where applicable.

Expired quotes MUST be rejected rather than silently refreshed after authorisation.

For same-asset transfers where no conversion occurs, `quote` may be null and the transaction must explicitly state `conversion_required: false`.

## 6. Authorisation

Authorisation binds the participant to a specific transaction payload.

The authorised payload SHOULD include a deterministic hash of material fields. Changing amount, recipient, asset, network, fee, quote or expiry invalidates prior authorisation.

No private key, seed phrase or raw secret may be written to the protocol record.

## 7. Settlement

Settlement records:

- target network;
- unsigned or signed transaction reference as appropriate;
- transaction signature/hash;
- submission timestamp;
- block/slot reference when available;
- confirmation level;
- network fee;
- settlement result.

A settlement adapter must be idempotent. Repeating an API request with the same idempotency key must not create an unintended second transfer.

## 8. Confirmation rule

Applications must define what constitutes confirmation for each settlement network. `submitted` is not equivalent to `confirmed`.

A Solana implementation should record the commitment level used and final network signature. Production policies may require a stronger confirmation level than testnet demonstrations.

## 9. Accounting

Every confirmed value transfer creates balanced accounting entries.

At minimum:

- ledger event identifier;
- debit account;
- credit account;
- asset identifier;
- amount;
- network fee treatment;
- timestamp;
- source transaction identifier.

The sum of debits and credits for each asset within a journal event MUST balance.

Market-value reporting is supplementary and must not replace native-asset accounting.

## 10. Audit record

The audit record captures the immutable chronology of state transitions. Each transition records:

- prior state;
- new state;
- timestamp;
- actor or service identifier;
- reason code;
- evidence reference;
- object hash where implemented.

Audit logs must be append-only at the application level. Corrections are new events, not destructive edits to history.

## 11. Error model

Standard reason-code families:

- `POLICY_*`
- `QUOTE_*`
- `AUTH_*`
- `NETWORK_*`
- `SETTLEMENT_*`
- `ACCOUNTING_*`
- `INTERNAL_*`

Errors must distinguish retryable from terminal conditions.

## 12. Replay and duplication protection

Each intent and transaction uses globally unique identifiers. Settlement calls use idempotency keys. A transaction signature/hash may only satisfy one canonical settlement record unless a deliberate one-to-many operation is specified.

## 13. Privacy

Protocol records should use public addresses, pseudonymous identifiers and opaque compliance references rather than names, addresses, identity documents or other unnecessary personal data.

## 14. Testnet gate

M1 is achieved when a reference implementation can:

1. validate a transaction object against the canonical schema;
2. progress through valid state transitions and reject invalid ones;
3. create a deterministic authorisation digest;
4. simulate or submit a testnet settlement without custody of public funds;
5. produce balanced accounting entries;
6. emit an append-only audit history;
7. demonstrate idempotency and duplicate protection in tests.

## 15. Production prohibition

Approval of XQP-0003 does not authorise custody, consumer payment services, dealing, exchange, stablecoin issuance or other regulated activity. It defines protocol mechanics only.
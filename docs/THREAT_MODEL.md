# XQP Genesis Threat Model

**Status:** Initial security baseline
**Date:** 5 September 2026
**Scope:** XQP protocol specifications, registries, reference implementation, treasury controls and future settlement adapters.

## 1. Security objectives

XQP should preserve:

- **asset integrity** — protocol-owned and user-directed transfers occur only as authorised;
- **ledger integrity** — accounting and audit records accurately reflect settlement events;
- **key confidentiality** — private signing material is never exposed through code, logs or collaboration systems;
- **availability** — failures degrade safely rather than causing duplicate or uncontrolled transfers;
- **policy integrity** — application or compliance controls cannot be silently bypassed;
- **claim integrity** — public assertions about supply, treasury, reserves and status remain verifiable.

## 2. Trust boundaries

Primary trust boundaries are:

1. user/application interface;
2. protocol transaction service;
3. policy/compliance service;
4. quote/oracle sources;
5. signing environment;
6. settlement network/RPC providers;
7. treasury multisig;
8. accounting store;
9. audit/transparency interface;
10. external custodians/reserve providers, if ever introduced.

No component should be trusted merely because it is operated by the protocol team.

## 3. Protected assets

- privileged/private keys;
- treasury assets;
- transaction authorisations;
- canonical asset and treasury registries;
- accounting records;
- audit history;
- compliance evidence/references;
- software release integrity;
- future reserve assets and redemption records, if applicable.

## 4. Threat catalogue

### T01 — Private-key compromise
**Impact:** unauthorised treasury or user-directed transfer.
**Controls:** hardware-backed signing, multisig, no secrets in GitHub/chat/email, signer separation, recovery procedure, low-balance operational wallet.

### T02 — Single-signer coercion or error
**Impact:** unauthorised or mistaken disbursement.
**Controls:** multisig threshold, independent transaction verification, approval bands, cooling-off for extraordinary transactions.

### T03 — Address substitution
**Impact:** funds sent to attacker-controlled destination.
**Controls:** authorisation digest binds destination; signers independently verify destination and amount; canonical address registry for protocol wallets.

### T04 — Replay/duplicate submission
**Impact:** double payment.
**Controls:** unique transaction IDs, idempotency keys, settlement-signature uniqueness, terminal state rules.

### T05 — Authorised-payload mutation
**Impact:** changed amount/recipient/asset after user or signer approval.
**Controls:** deterministic authorisation digest covering material fields; reject settlement if digest changes.

### T06 — Oracle/price manipulation
**Impact:** adverse or fraudulent conversion terms.
**Controls:** timestamped expiring quotes, source attribution, slippage limits, multiple sources for material-value conversion, reject stale quotes.

### T07 — RPC/network deception
**Impact:** false belief that settlement occurred or incorrect state.
**Controls:** confirmation policy, independent RPC verification for material transactions, record signature and slot/block reference.

### T08 — Chain outage/congestion
**Impact:** delayed or uncertain settlement.
**Controls:** explicit SUBMITTED versus CONFIRMED states, expiry/retry policy, no automatic duplicate submission.

### T09 — Ledger tampering
**Impact:** false internal balances or concealed loss.
**Controls:** balanced journal entries, append-only audit events, independent on-chain reconciliation, immutable backups where practicable.

### T10 — Registry poisoning
**Impact:** applications use wrong asset contract/mint or treasury address.
**Controls:** code review, signed releases where introduced, explicit verification status, no ticker-only identification.

### T11 — Insider concealment / related-party transfer
**Impact:** treasury misuse or misleading disclosures.
**Controls:** transaction purpose records, conflict register, multisig, public treasury registry, reconciliation and governance notes.

### T12 — Manufactured market activity
**Impact:** misleading users/investors and possible regulatory exposure.
**Controls:** prohibition on self-trading/circular activity intended to simulate demand or volume; genuine-use metrics separated from market metrics.

### T13 — False reserve/stability claim
**Impact:** consumer harm, run risk and regulatory exposure.
**Controls:** XQP/XQP-SV separation; no reserve or redemption statement without evidence; future reserve architecture requires separate proposal and legal review.

### T14 — Dependency/supply-chain compromise
**Impact:** malicious code or secret theft.
**Controls:** minimal dependencies, pinned/locked versions when dependencies are introduced, automated tests, dependency review and reproducible releases.

### T15 — CI/repository compromise
**Impact:** malicious release or documentation substitution.
**Controls:** least-privilege GitHub access, branch/review policy when contributor count grows, no production secrets in CI, release verification.

### T16 — Personal-data leakage
**Impact:** privacy harm and legal exposure.
**Controls:** data minimisation, opaque references for compliance evidence, no identity documents on-chain or in public repository.

### T17 — Denial of service
**Impact:** protocol/API unavailable.
**Controls:** rate limits at application layer, stateless validation where possible, resilient RPC/provider strategy, queued reconciliation.

### T18 — Governance capture
**Impact:** protocol rules changed for narrow/private benefit.
**Controls:** numbered proposals, published rationale, separation of treasury powers, measurable decentralisation, no ability for governance token holders to confiscate future reserve assets.

## 5. Highest-priority risks before any pilot

1. privileged-key compromise;
2. single-key treasury dependence;
3. duplicate/replay settlement;
4. incorrect asset/address registry data;
5. authorisation-payload mutation;
6. misleading public claims;
7. accounting/on-chain reconciliation failure.

## 6. Security gates

### M1 — Reference implementation
- deterministic state machine;
- authorisation digest;
- idempotency tests;
- balanced accounting tests;
- no production secret handling.

### M2 — Treasury hardening
- multisig/equivalent control;
- registered wallet addresses;
- signer compromise/recovery drill;
- reconciliation process.

### M3 — Controlled pilot
- capped values;
- identified counterparties;
- incident-response procedure;
- independent code/security review proportionate to value at risk;
- settlement and ledger reconciliation after every cycle.

### M4 — Production decision
Production is blocked while any critical threat lacks an accountable owner, implemented control and evidence that the control works.

## 7. Incident severity

- **SEV-1:** confirmed or credible imminent loss of assets, signing-key compromise, reserve insolvency, or systemic unauthorised transfer.
- **SEV-2:** material control failure without confirmed loss; incorrect treasury/accounting record; serious service outage.
- **SEV-3:** contained software defect, stale metadata, non-material reconciliation difference.
- **SEV-4:** documentation or low-risk operational defect.

SEV-1 incidents require immediate containment, preservation of evidence, suspension of affected transaction paths and post-incident review before restart.

## 8. Residual risk

A transparent protocol is not a risk-free protocol. Blockchain finality, self-custody, software defects, market volatility, legal change, compromised counterparties and human error remain material risks and must be disclosed rather than hidden by branding.
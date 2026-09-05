# XQP-0001 — Genesis Architecture

**Status:** Draft
**Type:** Standards Track
**Version:** 0.1

## Abstract

This proposal establishes the initial architecture and governance vocabulary for X Quantum Protocol. It separates the existing fixed-supply XQP token from future payment or stable-value instruments and establishes a staged path from public specification to testnet, controlled pilot and regulated production deployment.

## Roles

- **Genesis Steward:** coordinates the early protocol and publishes decisions.
- **Treasury Signers:** multisig participants controlling protocol treasury assets.
- **Maintainers:** implement accepted specifications.
- **Auditors/Reviewers:** independent technical, financial or legal reviewers.
- **Users:** participants interacting with applications or settlement functions.

## Core components

1. **XQP Asset Registry** — canonical identifiers, networks, mint/contract addresses, authority status and asset classification.
2. **XQP Treasury Registry** — canonical public treasury addresses and purpose labels.
3. **XQP Ledger API** — normalised representation of protocol transactions independent of settlement chain.
4. **XQP Governance Registry** — proposal numbers, versions, status and implementation references.
5. **XQP Compliance Interface** — optional jurisdiction-aware policy hooks for regulated applications.
6. **XQP Proof Interface** — machine-readable proofs/attestations for supply, treasury and future reserves.

## Invariants

- Existing XQP token supply must never be represented as expandable if mint authority is revoked.
- A future stable-value asset must use a distinct identifier and must not silently redefine XQP.
- Treasury assets and personal founder assets must be operationally and accountingly separable.
- No production component may rely on an undocumented privileged key.
- No claim of backing, reserves, regulation, insurance, legal-tender status or guaranteed redemption may be published without evidence.
- Governance changes affecting user funds require a public specification and security review appropriate to risk.

## Reference transaction lifecycle

`Intent -> Policy checks -> Quote/terms -> Authorisation -> Settlement -> Confirmation -> Accounting -> Audit record`

Each stage should expose a deterministic state and error model to applications.

## Failure model

The system must explicitly handle:

- chain congestion/outage;
- stale or manipulated price data;
- compromised signing key;
- treasury signer unavailability;
- duplicate transaction submission;
- counterparty failure;
- sanctions/compliance rejection where applicable;
- reserve/custodian failure for any future backed asset;
- protocol software defect.

## Implementation milestones

### M0 — Genesis documentation
Publish protocol foundation, XQP-0001, asset registry schema, threat model and regulatory perimeter checklist.

### M1 — Testnet reference implementation
Implement transaction lifecycle and ledger normalisation without custody of public funds.

### M2 — Treasury hardening
Deploy documented multisig, signer policy, reconciliation and public treasury dashboard.

### M3 — Pilot
Run capped-value controlled transactions with identified pilot counterparties and complete reconciliation after every settlement cycle.

### M4 — Production decision gate
Proceed only when security, legal/regulatory, operational and financial controls have named owners and documented evidence.

## Rationale

The protocol's strongest route to credibility is to make falsifiable, auditable claims. The architecture therefore treats transparency and evidence as protocol features rather than marketing additions.

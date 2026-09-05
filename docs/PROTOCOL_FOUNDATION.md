# X Quantum Protocol (XQP) — Protocol Foundation v0.1

**Status:** Design specification. Not a claim that XQP is currently a bank, legal tender, stablecoin, payment system, regulated financial institution, or replacement for sovereign currency.

## 1. Mission

X Quantum Protocol is an open financial infrastructure project intended to test whether digital value can be transferred, accounted for and governed with greater transparency, programmability, auditability and user control than conventional closed financial rails.

The project may criticise weaknesses of fiat monetary systems, but protocol documentation must distinguish ethical or philosophical opinion from verifiable technical and economic claims.

## 2. Design principles

1. **Verifiability over trust** — balances, supply, treasury movements and protocol rules should be independently auditable wherever practicable.
2. **No hidden monetary expansion** — the existing XQP token has a fixed 10,000,000,000 supply with mint authority revoked; protocol documentation must identify any future instruments separately.
3. **Transparent governance** — material changes require published proposals, recorded decisions and explicit versioning.
4. **Separation of powers** — treasury, protocol administration, custody and oracle/control functions should not depend on one private key.
5. **User sovereignty with safeguards** — self-custody should be supported, while interfaces should make risks intelligible.
6. **Open standards** — prefer public specifications and interoperable APIs over proprietary lock-in.
7. **Economic honesty** — no guaranteed returns, artificial price promises or claims that token appreciation is required for protocol success.
8. **Regulatory compatibility by design** — architecture should support AML/CTF, sanctions controls, consumer disclosures and permissions where legally required without pretending these obligations do not exist.
9. **Privacy by minimisation** — collect the least personal data needed for a lawful function; do not place unnecessary personal data on-chain.
10. **Security before scale** — no material-value deployment without threat modelling, key-management controls, testing and independent review.

## 3. System architecture

XQP should be treated as a protocol stack rather than a single token.

### Layer 0 — Public specification
Human-readable and machine-readable definitions of assets, roles, governance, accounting rules, risk controls and interfaces.

### Layer 1 — Settlement
Initial settlement may use Solana for the existing XQP token. The protocol specification should remain chain-agnostic enough to permit additional settlement networks later.

### Layer 2 — Assets
Keep asset classes distinct:

- **XQP:** existing fixed-supply network/utility/governance token.
- **XQP-SV (future concept):** any stable-value payment instrument, only after reserve design, legal classification and regulatory requirements are settled.
- **Tokenised claims/assets (future):** only where ownership, redemption, custody and legal enforceability are defined.

XQP itself must not be described as £1-backed, a stablecoin, deposit or legal tender unless that becomes factually and legally true.

### Layer 3 — Identity and compliance
A modular compliance layer should allow risk-based identity checks, sanctions screening, transaction monitoring and jurisdictional restrictions when required. Compliance data should remain off-chain or privacy-preserving wherever feasible.

### Layer 4 — Treasury and reserves
Treasury assets must be segregated from founder personal assets. Publish wallet addresses and accounting methodology. Any future reserve-backed instrument requires a separate reserve policy, custody structure, redemption rules, attestations and insolvency analysis.

### Layer 5 — Applications
Wallets, merchant tools, invoicing, escrow, programmable payments, community grants and APIs sit above the settlement layer. Applications should not obtain unrestricted treasury authority.

## 4. Governance model — Genesis phase

Until decentralisation is real rather than rhetorical:

- Founder acts as **Genesis Steward**, not an unlimited monetary authority.
- Material treasury transfers should migrate to multisig.
- Protocol changes are proposed in numbered **XQPs — X Quantum Proposals**.
- Each XQP records: problem, specification, security impact, economic impact, regulatory impact, implementation and rollback.
- Emergency powers must be narrow, time-limited and publicly logged.
- Governance decentralisation milestones must be measurable.

## 5. Monetary and economic policy

The existing XQP supply is fixed at 10 billion units. Fixed supply alone does not create value, stability or scarcity-driven appreciation. Sustainable value requires actual utility, credible governance, liquidity, security and voluntary demand.

No protocol document should promise a future price, guaranteed return or inevitable replacement of fiat currencies.

For any future stable-value payment unit, the preferred starting design is full-reserve or equivalent high-quality liquid backing with explicit 1:1 redemption mechanics, rather than algorithmic reflexivity.

## 6. Treasury policy

Genesis treasury controls should include:

- published treasury wallet registry;
- multisig target before significant external capital is accepted;
- transaction classification and monthly reconciliation;
- conflict-of-interest register;
- expenditure authority limits;
- immutable record of material treasury decisions;
- continuation of the existing 1% community pledge, with scope and calculation basis defined precisely before commercial launch.

## 7. Security baseline

Before a production financial application handles material user value:

1. document asset and trust boundaries;
2. perform threat modelling;
3. remove single-key treasury control;
4. use hardware-backed signing for privileged keys;
5. establish key-loss and compromise procedures;
6. test contracts and transaction-building code;
7. commission independent security review where smart-contract risk exists;
8. create incident-response and disclosure procedures;
9. prohibit secrets in source repositories;
10. maintain reproducible deployment records.

The word **Quantum** is a brand name unless and until a component actually uses quantum computing or quantum-resistant cryptography. Technical documentation must not imply quantum technology that is not implemented.

## 8. Initial use cases

The first credible use cases should minimise regulatory and technical complexity:

- transparent community treasury and grant accounting;
- verifiable donations/pledges;
- merchant invoicing and settlement experiments;
- programmable escrow prototypes on testnet;
- public proof-of-reserves/accounting dashboards;
- developer APIs and SDK examples.

Retail deposit-taking, credit, leveraged products, investment management and reserve-backed payment instruments are later-stage activities requiring specialised legal and regulatory design.

## 9. Success metrics

Do not measure success primarily by token price. Track:

- active wallets using genuine protocol functions;
- settlement volume excluding wash/self-transfers;
- merchant or organisation integrations;
- transaction cost and settlement latency;
- treasury transparency coverage;
- number and severity of security incidents;
- governance participation;
- community funding delivered and independently verifiable;
- regulatory milestones completed.

## 10. Genesis build sequence

**Phase A — Specification:** protocol charter, asset taxonomy, threat model, governance, treasury policy, legal perimeter map.

**Phase B — Testnet:** wallet/ledger prototype, merchant invoice flow, escrow prototype, public explorer/dashboard.

**Phase C — Controlled pilot:** small number of counterparties, capped transaction values, reconciliation, incident drills and independent review.

**Phase D — Regulated expansion:** only after required permissions, financial-promotion controls, custody/reserve arrangements and consumer documentation are in place.

**Phase E — Interoperability:** additional chains, payment rails and institutional integrations where justified by demand.

## 11. Non-negotiable doctrine

XQP should seek to outperform legacy finance by being more transparent, more auditable, more programmable and more accountable — not by asking users to replace one form of blind trust with another.

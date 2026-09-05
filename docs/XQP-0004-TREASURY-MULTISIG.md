# XQP-0004 — Treasury & Multisig Constitution

**Status:** Genesis Draft
**Type:** Governance / Security
**Date:** 5 September 2026
**Depends on:** PROTOCOL_FOUNDATION.md, XQP-0001, XQP-0002, XQP-0003

## Abstract

This proposal defines minimum controls for XQP protocol treasury assets. The objective is to remove single-person/key dependence, separate founder assets from protocol assets, make treasury movements intelligible, and establish an auditable approval process before material external capital is accepted.

## 1. Treasury principles

1. Protocol treasury assets are not founder personal assets.
2. Every production treasury address must appear in a public registry with a purpose label.
3. No significant treasury should depend on one hot wallet or one private key.
4. Treasury signers must never share seed phrases or private keys.
5. Every material disbursement must have a documented purpose and accounting record.
6. Token market value is not treasury cash and must not be presented as such.
7. The treasury may not represent user/customer assets as protocol-owned funds.

## 2. Wallet classes

- **Operational wallet:** low-balance wallet for routine network fees and tightly capped operational transactions.
- **Treasury multisig:** primary protocol-owned asset store; requires multiple independent approvals.
- **Community pledge wallet:** designated accounting/settlement wallet for the existing community pledge where practicable.
- **Liquidity wallet/position:** separately labelled assets committed to market liquidity.
- **Testnet wallet:** valueless development assets only; must never be confused with mainnet treasury.
- **Reserve wallet (future):** prohibited until a separately approved stable-value/reserve proposal exists.

## 3. Genesis signer model

Target configuration before material value is held: at least **2-of-3** independent signers.

The three signer roles should be operationally distinct where possible:

1. Genesis Steward signer;
2. independent continuity/security signer;
3. independent governance/oversight signer.

A signer role is a control function, not a claim of employment, regulatory approval or fiduciary status beyond applicable law.

For larger treasury values, governance should consider 3-of-5 or an equivalent institutional custody model after risk review.

## 4. Key management

Production privileged keys should use hardware-backed signing or equivalent secure key storage.

Mandatory rules:

- no seed phrase in GitHub, email, chat logs, screenshots or cloud notes;
- no identical seed phrase held by multiple signers;
- backup material stored separately from the active signing device;
- signer loss/compromise procedure tested before significant funds are deposited;
- signer devices protected by strong local authentication;
- no unsigned transaction should be approved without independently checking destination, asset and amount.

## 5. Approval bands

Until governance adopts GBP-equivalent limits based on treasury size, use percentage bands:

- **Band A — routine:** <=0.25% of liquid treasury; standard multisig threshold, logged purpose.
- **Band B — material:** >0.25% and <=2%; standard multisig threshold plus written transaction note.
- **Band C — major:** >2% and <=10%; published proposal or public treasury decision before execution except genuine emergency containment.
- **Band D — extraordinary:** >10%; protocol proposal, explicit rationale, security review and cooling-off period unless required to protect assets from an active compromise.

These percentages are governance controls, not recommendations to spend any particular amount.

## 6. Emergency authority

Emergency action may be used only to contain a credible asset-security or operational incident.

Emergency actions must:

- use the minimum authority required;
- avoid transferring assets to an unregistered personal wallet except where no safer recovery route exists;
- be logged immediately when safe;
- receive post-incident signer review;
- produce a public incident summary when disclosure does not create additional security risk.

Emergency authority cannot be used to bypass ordinary approval merely because a transaction is commercially urgent.

## 7. Treasury registry

`treasury/registry.json` will be the canonical machine-readable registry.

Each wallet record should contain:

- `wallet_id`
- `network`
- `address`
- `class`
- `purpose`
- `control_model`
- `status`
- `publicly_disclosed`
- `verified_at`

No address should be labelled a protocol treasury address until ownership/control has been verified.

## 8. Accounting and reconciliation

Every treasury transaction should map to:

- XQP transaction ID where applicable;
- network signature/hash;
- purpose/category;
- native asset and amount;
- GBP reference valuation methodology if reported;
- counterparty reference where lawful and necessary;
- supporting decision/proposal reference.

Monthly reconciliation compares internal ledger balances against independently observed on-chain balances.

Unexplained differences are incidents, not adjustments to be silently written off.

## 9. Community pledge

The historical project documentation references a 1% community pledge. Before commercial use, governance must define precisely:

- what revenue/base the 1% applies to;
- when the liability arises;
- eligible recipients;
- approval and payment process;
- whether the pledge is discretionary, contractual or otherwise legally binding;
- reporting method.

Until defined, public communications must not imply that 1% of token value, token supply or every transaction is automatically transferred to charity.

## 10. Prohibited treasury practices

The treasury must not:

- execute self-trades or circular transactions to manufacture apparent volume;
- conceal related-party transfers;
- mix customer/custodial funds with protocol-owned funds;
- publish unverifiable reserve claims;
- borrow against user assets without an adopted legal/product framework;
- use treasury funds to guarantee a market price for XQP;
- describe unrealised token holdings as cash reserves.

## 11. Deployment gate

M2 Treasury Hardening is complete only when:

1. canonical treasury registry exists;
2. material protocol assets are controlled by an approved multisig or equivalent institutional arrangement;
3. signer recovery/compromise procedure is documented and tested;
4. at least one monthly reconciliation has been completed;
5. accounting categories and approval bands are implemented;
6. no active public documentation instructs manufactured trading activity or unreviewed consumer promotion.

## 12. Production status

Approval of XQP-0004 is a governance/security specification. It does not itself establish a regulated custody service, trust, client-money arrangement or reserve structure.
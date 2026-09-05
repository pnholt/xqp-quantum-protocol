# XQP-0005 — Solana Devnet Settlement Boundary

**Status:** Genesis Draft
**Type:** Standards Track / Testnet
**Date:** 5 September 2026
**Depends on:** XQP-0003

## Abstract

This proposal defines the first settlement adapter boundary for XQP. It is restricted to Solana devnet and deliberately separates protocol transaction logic from private-key custody and transaction signing.

## 1. Objective

A reference application should be able to hand an authorised XQP transaction to a settlement adapter, receive a devnet transaction signature from an injected signing/transport component, record submission, query confirmation, and return the result to the protocol state machine.

The reference adapter must not contain a production private key, seed phrase or mainnet signing secret.

## 2. Mandatory controls

- network must be exactly `solana-devnet`;
- transaction must be in `AUTHORISED` state before submission;
- the authorisation digest must still match the material payload;
- an idempotency key is mandatory;
- settlement transport is injected rather than embedded;
- returned signature must be non-empty;
- confirmation provider is injected;
- the adapter does not claim confirmation until the provider reports it;
- mainnet submission is explicitly rejected.

## 3. Transport interface

The injected transport receives a normalised request:

```json
{
  "network": "solana-devnet",
  "transaction_id": "...",
  "asset_id": "...",
  "sender": "...",
  "recipient": "...",
  "amount": "...",
  "idempotency_key": "..."
}
```

and returns at minimum:

```json
{
  "signature": "...",
  "commitment": "processed|confirmed|finalized",
  "network_fee": "..."
}
```

The concrete wallet/RPC implementation is a separate integration concern.

## 4. Confirmation interface

The injected confirmation provider receives a signature and returns a normalised status containing confirmation state, commitment and slot where available.

## 5. Security rationale

Separating signing from the protocol core reduces the blast radius of application compromise and allows hardware wallets, multisig, institutional custody or other signing systems to be substituted later without redesigning the XQP transaction object.

## 6. Mainnet gate

No mainnet adapter is authorised by XQP-0005. A future mainnet proposal requires completed M2 treasury hardening, threat-model review, production key-management design and the relevant regulatory/compliance clearance for the implemented service.
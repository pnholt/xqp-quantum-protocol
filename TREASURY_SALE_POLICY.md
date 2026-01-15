# XQP Treasury Sale Policy

**Purpose.** Fund development, operations, and our 1% annual pledge to good causes while protecting holders and market health.

**Official mint**: `5qrGE6aj5yYnhP7tJwNSP8Uz48juymCTMQT7w7w1KtH6`\
**Treasury**: <treasury pubkey>\
**Charity wallet**: <charity pubkey>

---

## 1) Cadence & size
- Default micro‑sale: **0.01% of total supply** (1,000,000 XQP).
- Standard sale: **0.03%–0.05%**.
- **Rolling 30‑day cap:** **≤ 0.25%** of total supply unless a community vote approves otherwise.
- Use **TWAP** (time‑weighted) or split into small clips to reduce price impact. No sales during extreme volatility (≥10% 24h drop) unless emergency funding is required; any emergency sale is disclosed within 24h.

## 2) Route (execution to GBP)
1. Execute on Solana via **Jupiter**: **XQP → USDC** (or XQP→SOL→USDC if needed).
2. Transfer **USDC** to a verified UK exchange (e.g., Kraken/Coinbase).
3. Sell to **GBP** via Faster Payments to the project bank account.

## 3) Allocation of proceeds
- **1% of revenue** set aside for the **Charity Wallet**; donation reviewed and reported annually.
- Remainder split between **Operations** and **Liquidity** top‑ups (exact split disclosed in monthly notes).

## 4) Transparency & reporting
- Every sale announced with **transaction links** and amounts.
- A **monthly treasury note** includes starting balances, sales executed, LP fees earned, donations accrued, and closing balances.

## 5) Liquidity and fees
- Maintain XQP/SOL and/or XQP/USDC pools.
- Hold LP tokens in the treasury to accrue **swap fees**, recycling a portion to top up liquidity when depth falls.

## 6) Safeguards
- **Pause** sales during Solana degradation, abnormal slippage, or extraordinary market events.
- **Emergency pause** may be invoked by the founder with a public explanation and next steps.

## 7) Addresses
- **Mint**: `5qrGE6aj5yYnhP7tJwNSP8Uz48juymCTMQT7w7w1KtH6`
- **Treasury**: <treasury pubkey>
- **Charity**: <charity pubkey>

*XQP does not promise profits. Crypto is risky. Verify the mint above. This policy may evolve via public updates or holder vote.*

---

## Appendix — Operations playbook

### Sizing examples
- Micro‑sale: **1,000,000 XQP** (0.01%).
- Weekly standard: **5,000,000 XQP** (0.05%).
- Month hard‑cap total: **25,000,000 XQP** (0.25%).

### Execution checklist
1. Prepare target size and a **Jupiter TWAP** or multi‑clip plan (10–50 orders).
2. Prefer route **XQP→USDC**; avoid thin‑liquidity windows.
3. Copy **tx links**, post short disclosure, update monthly ledger.
4. Send **USDC** to exchange, sell to **GBP**, withdraw.
5. Move **1%** of revenue to **Charity Wallet** (or earmark and settle monthly).

### First‑month template
- Week 1: two micro‑sales (0.01% each).
- Week 2: one standard sale (0.03%).
- Week 3: two micro‑sales (0.01% each).
- Week 4: optional 0.02% if operations runway < 6 weeks.

Total month target: **≤ 0.08%**. All transactions posted with links.

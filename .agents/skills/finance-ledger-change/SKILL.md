---
name: finance-ledger-change
description: >-
  Use this skill when modifying financial calculations, double-entry ledger logic,
  profit splits, loans, expenses, or UI under app/bank-actions.ts, lib/domain-math.ts,
  app/finances/, or components/finances/.
---

# Finance & Double-Entry Ledger Workflow

Follow this checklist for any change touching cash-basis profit, partner equity, loans, withdrawals, or sale/restock ledger hooks.

## Steps

1. **Read the finance specification**
   - Read [finance-system.md](../../../docs/finance-system.md), [bank-actions.ts](../../../app/bank-actions.ts), and [domain-math.ts](../../../lib/domain-math.ts) first.
   - Never use the legacy COGS helper `getFinancesMetrics()` in [actions.ts](../../../app/actions.ts).
2. **Preserve core invariants**
   - Derive all balances and profit from immutable `TxnEntry` rows using `Decimal(14, 2)`.
   - Keep domain + ledger mutations inside the same `prisma.$transaction` block.
   - Preserve the master identity:
     `Business Cash = Capital + All-time Net Profit + Outstanding Loan Debt - Withdrawals`.
   - Preserve both withdrawal guards (`unclaimedProfit` and liquid `businessCash`) and exact partner rounding (`hashir = round(...)`, `badar = profit - hashir`).
   - Use PKT (`UTC+5`) helpers (`getPKTYearMonth`, `getMonthDateRangePKT`) for monthly period boundaries.
   - Ensure UI modal submit buttons disable while server actions are pending to prevent duplicate manual ledger entries.
3. **Update tests & docs**
   - Add or update unit tests in [finance-invariants.test.ts](../../../tests/finance-invariants.test.ts).
   - Update [finance-system.md](../../../docs/finance-system.md) if formulas, action parameters, or rules change.
4. **Verify**
   - Run `bun test`, `bun run typecheck`, `bun run build`, and `bunx eslint` on all touched files.

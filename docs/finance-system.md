# Finance & Banking System — Design & Implementation

Status: **Implemented**
Supersedes: the legacy COGS profit logic in `docs/PRD.md` §Module 7 and `getFinancesMetrics()` in `app/actions.ts`.

This document defines the replacement for the current finance module: a cash-basis profit
formula plus a simple double-entry banking ledger with a company account and one personal
account per partner.

---

## 1. Why we are replacing the current system

Today `getFinancesMetrics()` does this on every page render:

```ts
// app/actions.ts:819 — runs a full table scan of Sale, no date filter
const revenue    = sale.total_price;                                  // qty × sale price
const makingCost = sale.quantity * (sale.product?.making_cost || 0);  // qty → cost price
const netProfit  = revenue - makingCost;
// ...
const hashirProfit = totalNetProfit * 0.35;
const badarProfit  = totalNetProfit * 0.65;
```

Three problems with it:

1. **It is not what the business actually earns.** It subtracts *production cost per bottle*
   but ignores everything else you spend — stock you bought, ads you ran, rent. You can buy
   25,000 of inventory and run 5,000 of ads and the page will still show a healthy profit.
2. **Nothing is stored.** Every number is derived at render time from a full scan of `Sale`.
   There is no record of profit for any period, no audit trail, and nothing to attach an
   operation to.
3. **There is no money layer at all.** No account, no balance, no way to record that you
   invested 10,000 or that Badar took out his share. "Profit" exists only as a rendered
   integer.

---

## 2. The three numbers

Almost every confusing part of this system comes from mixing these up. They are deliberately
different and must never be substituted for one another.

| # | Number | Question it answers | Source |
|---|--------|--------------------|--------|
| 1 | **Net Profit** | Did the business make money this period? | Revenue − Expenses |
| 2 | **Business Cash** | How much money does the company account hold? | Ledger balance |
| 3 | **Partner Available** | How much can this partner withdraw right now? | All-time profit share − all-time withdrawn |

Your own example separates them cleanly: profit is **−500**, yet the business account holds
**39,500** — because 40,000 of that is capital you and Badar put in, not earnings.

**Master identity** (reconciles all accounts and cash flows in `getBankMetrics()`):

```
Business Cash = Σ Capital Contributions + All-time Net Profit + Outstanding Loan Debt − Σ Withdrawals
```
*(where `Outstanding Loan Debt = max(0, Σ LOAN_DISBURSEMENT − Σ LOAN_REPAYMENT)`)*

Contributions and withdrawals move cash but **never** touch profit. That single rule is what
keeps the two layers honest.

---

## 3. The new profit formula

### Old vs new

| | Formula |
|---|---|
| ~~Before~~ | `Σ qty × (sale price − making cost)` over all PAYED sales, ever |
| **After** | `Revenue − Expenses` for a chosen period |

```text
Net Profit (period) = Revenue − Expenses

  Revenue = Σ REVENUE − Σ REFUND        (sales that were actually paid for)
  Expenses = Σ EXPENSE                   (everything you spent, in that period)
```

`making_cost` leaves the profit formula entirely. It stays in the schema, but only as a
**stock valuation** input (§7, issue 13) — not as a cost of sale.

### Decisions locked in

| Decision | Choice |
|---|---|
| Basis | **Cash / expense basis** — you are taxed on what you spent, not on COGS |
| PENDING sales | **Excluded** from revenue; shown separately as *Expected* |
| REFUNDED sales | Revenue reversed (net zero contribution) |
| Period | Monthly, selectable; default current month |
| Loss period (profit ≤ 0) | **Hide the partner split.** Show one loss figure. Block withdrawals when all-time profit ≤ 0. |
| Withdrawal guard | **Earned-share AND liquid-cash limit** — cannot exceed unclaimed profit share or `businessCash`. |
| Account bootstrap | **Auto-initialized** on first ledger read/write via `getOrCreateDefaultAccounts()` (or `bun run seed`). |

### Worked example — your March

| Item | Type | PKR |
|---|---|---:|
| Marj — 50 × 350 | Revenue | +17,500 |
| Imagination — 4 × 3,000 | Revenue | +12,000 |
| Boxes | Expense · Inventory | −8,000 |
| Stickers | Expense · Inventory | −2,000 |
| Ethanol | Expense · Inventory | −5,000 |
| Oils | Expense · Inventory | −10,000 |
| Ads | Expense · Operating | −5,000 |
| **Net profit** | | **−500** |

```
Revenue  = 17,500 + 12,000      = 29,500
Expenses = 8,000 + 2,000 + 5,000 + 10,000 + 5,000 = 30,000
Net profit = 29,500 − 30,000    = −500      ← loss
```

Because profit ≤ 0 for this period: **no split is shown**, no partner shares are displayed,
and the Withdraw buttons are disabled.

Meanwhile a *separate* card reads:

```
Cash in stock = raw material stock + finished goods = 18,000 + 7,000 = 25,000
```

so the −500 is readable as *"we spent it, and it is sitting on the shelf as unsold stock"*
rather than *"we lost it"*.

And PENDING sales:

```
Expected (not yet paid) = 6,000     ← informational only, excluded from everything above
```

---

## 4. Accounts

Three accounts, created automatically by `getOrCreateDefaultAccounts()` (or `bun run seed`):

| Account | Type | Purpose |
|---|---|---|
| **BUSINESS** | `BUSINESS` | The company wallet. All revenue, expenses, contributions land here. |
| **Badar** | `PARTNER` | Holds profit Badar has withdrawn. |
| **Hashir** | `PARTNER` | Holds profit Hashir has withdrawn. |

Balances are **derived, never stored**:

```sql
balance(account) = SUM(incoming amounts) − SUM(outgoing amounts)
```

Storing a cached balance invites drift the first time a write is missed. Deriving it from
immutable rows cannot drift.

---

## 5. Transaction types

Every movement of money is one row with a `from` and a `to`. A `NULL` side means *the outside
world* — a customer, a supplier, a landlord, your own pocket.

| Type | Direction | Trigger | Affects profit? |
|---|---|---|---|
| `CAPITAL_CONTRIBUTION` | outside → BUSINESS | You or Badar invest | **No** |
| `REVENUE` | outside → BUSINESS | A sale becomes `PAYED` | **Yes** (+) |
| `REFUND` | BUSINESS → outside | A `PAYED` sale becomes `REFUNDED` | **Yes** (−) |
| `EXPENSE` | BUSINESS → outside | Restock, ads, rent, anything bought | **Yes** (−) |
| `PROFIT_WITHDRAWAL` | BUSINESS → partner | A partner cashes out their share | **No** |
| `LOAN_DISBURSEMENT` | outside → BUSINESS | Bank / lender funds received | **No** |
| `LOAN_REPAYMENT` | BUSINESS → outside | Loan principal paid to lender | **No** |

`EXPENSE` carries a category, split into two families:

- **`INVENTORY`** — raw material restocks. Auto-posted by `restockRawMaterial`.
- **`OPERATING`** — ads, rent, utilities, packaging, salaries, transport, equipment, bank fees/interest, other. Entered by hand.

Both reduce profit equally under cash basis. The split exists purely so you can break down
*"where did the 30,000 go"*.

---

## 6. Data model

```prisma
enum Partner          { BADAR  HASHIR }
enum AccountType      { BUSINESS  PARTNER }
enum TxnType          { CAPITAL_CONTRIBUTION  REVENUE  REFUND  EXPENSE  PROFIT_WITHDRAWAL  LOAN_DISBURSEMENT  LOAN_REPAYMENT }
enum ExpenseCategory  { INVENTORY  ADS  RENT  PACKAGING  UTILITIES  SALARY  TRANSPORT  EQUIPMENT  BANK_INTEREST_FEES  OTHER }

model Account {
  id               String      @id @default(uuid())
  type             AccountType
  partner          Partner?    // null on the BUSINESS account
  name             String
  share_percentage Float       @default(0) // e.g. 65 for Badar, 35 for Hashir
  created_at       DateTime    @default(now())
  updated_at       DateTime    @updatedAt

  outgoing         TxnEntry[]  @relation("From")
  incoming         TxnEntry[]  @relation("To")

  @@unique([type, partner])
  @@map("accounts")
}

model TxnEntry {
  id          String          @id @default(uuid())
  type        TxnType
  amount      Decimal         @db.Decimal(14, 2)  // always > 0; direction = from/to
  from_id     String?
  to_id       String?
  category    ExpenseCategory?                     // EXPENSE only
  partner     Partner?                             // CONTRIBUTION: who paid in
                                                      // WITHDRAWAL: who was paid out
  sale_id     String?                              // idempotency key for REVENUE / REFUND
  restock_id  String?                              // idempotency key for inventory EXPENSE
  notes       String?
  occurred_at DateTime    @default(now())          // business date — may be backdated
  created_at  DateTime    @default(now())

  from        Account?    @relation("From", fields: [from_id], references: [id])
  to          Account?    @relation("To",   fields: [to_id],   references: [id])

  @@unique([sale_id, type])      // one REVENUE and one REFUND per sale, maximum
  @@unique([restock_id, type])   // one EXPENSE per restock, maximum
  @@index([type, occurred_at])   // period aggregates
  @@map("txn_entries")
}
```

Notes:

- **`Decimal`, not `Float`.** The rest of the schema uses `Float`, but a ledger must reconcile
  exactly. Binary floats drift (`0.1 + 0.2 ≠ 0.3`), and a balance that is off by a paisa makes
  every downstream check unreliable. See issue 2.
- **The unique constraints are the idempotency mechanism.** Re-running a hook posts nothing the
  second time. `NULL` keys do not collide in Postgres, so manual entries are unaffected.
- **`occurred_at` ≠ `created_at`.** The business date drives which period a row belongs to; the
  creation timestamp is audit-only.
- **`Sale` is unchanged.** The per-sale `making_cost_snapshot` / `net_profit` columns from the
  earlier draft are *not* needed — cash-basis profit does not derive from individual sales.

---

## 7. Rules and invariants

1. **Ledger is append-only.** Corrections are reversal rows, never `UPDATE`/`DELETE` of an
   existing entry. Otherwise the audit trail is worthless.
2. **Profit is derived from the ledger, cash is derived from the ledger.** One source. If both
   read the same rows they cannot disagree.
3. **Both layers are written in the same `$transaction` as the domain change.** A `REVENUE` row
   and the `PAYED` status either both exist or neither does.
4. **Contributions and withdrawals never affect profit.**
5. **Partners may only withdraw up to the lesser of their earned share and liquid cash:**
   `availableToWithdraw = max(0, min(unclaimedProfit, max(0, businessCash)))`.
   Withdrawals exceeding either unclaimed profit or liquid business cash are rejected.
6. **Withdrawals are blocked entirely when all-time profit ≤ 0.**
7. **The split bar renders only when the selected period's profit > 0.**
8. **Period split ≠ withdrawable.** The period split shows this month's share; *Available* is
   always computed on **all-time** profit. They differ whenever any prior period was a loss.
   The UI must show both and label them, or partners will think money is missing (see §8).
9. **Refund vs. reverting to pending:** Marking a `PAYED` sale `REFUNDED` keeps the original
   `REVENUE` row and adds a `REFUND` outflow row. Reverting a sale to `PENDING` deletes its
   `TxnEntry` rows and clears `paid_at`.
10. **`proportionally derived shares must sum exactly`:** compute one partner from the other —
    `hashir = round(profit × (hashirShare / totalShares))`, `badar = profit − hashir`. Never round both independently.

---

## 8. Worked examples

### 8.1 March — loss period (your example)

| Event | Type | Cash movement | Business cash |
|---|---|---:|---:|
| Hashir invests 10,000 | `CAPITAL_CONTRIBUTION` | +10,000 | 10,000 |
| Badar invests 30,000 | `CAPITAL_CONTRIBUTION` | +30,000 | 40,000 |
| Buy boxes/stickers/ethanol/oils | `EXPENSE` · Inventory | −25,000 | 15,000 |
| Ads | `EXPENSE` · Operating | −5,000 | 10,000 |
| Sales (paid) | `REVENUE` | +29,500 | 39,500 |

- **Net profit = 29,500 − 30,000 = −500** → split hidden, withdrawals blocked.
- **Expected (PENDING) = 6,000** → shown, not counted.
- **Cash in stock = 25,000** → shown, explains where the money went.
- Check the identity: `40,000 + (−500) − 0 = 39,500` ✓

### 8.2 April — profitable period, both withdraw

| Item | PKR |
|---|---:|
| Revenue | 80,000 |
| Expenses (stock 30,000 · ads 5,000 · rent 8,000) | 43,000 |
| **Net profit (April)** | **37,000** |

**Period split** (what the cards show for April):

- Badar 65% → **24,050**
- Hashir 35% → **12,950**
- 24,050 + 12,950 = 37,000 ✓

**Available to withdraw** (all-time — this is the number that matters):

```
All-time profit = −500 (March) + 37,000 (April) = 36,500
Badar available = 0.65 × 36,500 − 0 withdrawn = 23,725
Hashir available = 0.35 × 36,500 − 0 withdrawn = 12,775
```

Note **12,950 ≠ 12,775** — March's 500 loss carries forward and reduces April's withdrawable
amount. The UI must present both figures side by side:

```
This month's share    12,950
Available to withdraw 12,775   (all-time, after March's −500)
```

Both withdraw in full:

```
Business cash = 39,500 + 80,000 − 43,000 − 23,725 − 12,775 = 40,000
Hashir account = 12,775        Badar account = 23,725
```

Check the identity: `40,000 (capital) + 36,500 (all-time profit) − 36,500 (withdrawn) = 40,000` ✓

### 8.3 Tight cash — capped by liquid business cash

Suppose Hashir's unclaimed profit share is **12,775**, but the business account only holds **8,000**
in liquid cash (because the rest of the profit is tied up in raw materials and finished stock).

Because withdrawals are guarded by both unclaimed profit and liquid business cash:

```
Available to withdraw = min(12,775, max(0, 8,000)) = 8,000
```

Any withdrawal above **8,000** is rejected with an insufficient liquid cash error until more cash
comes in from sales, capital contributions, or loans.

### 8.4 Refund reversal

A sale for 5,000 goes `PAYED` → `REFUNDED`:

- `REVENUE +5,000` row **stays** (the money did arrive)
- `REFUND −5,000` outflow row is **added** (the money went back)
- Cash: `+5,000 − 5,000 = 0` ✓
- Profit: revenue nets to zero for that sale ✓

---

## 9. Implemented System Reference

### 9.1 Schema — `prisma/schema.prisma`

- `Account`, `TxnEntry`, and enums `Partner`, `AccountType`, `TxnType`, `ExpenseCategory`.
- `Sale.paid_at` tracks when a sale transitions to `PAYED`.
- `TxnEntry` references `Sale` and `RawMaterialRestock` with `onDelete: SetNull` and idempotency unique constraints `@@unique([sale_id, type])` and `@@unique([restock_id, type])`.

### 9.2 Actions — `app/bank-actions.ts`

`app/bank-actions.ts` serves as the dedicated backend domain for financial and ledger transactions:

| Action | Does |
|---|---|
| `getCurrentPKTYearMonth()` | Returns current `{ year, month }` in PKT (`UTC+5`) |
| `getOrCreateDefaultAccounts(tx?)` | Ensures `BUSINESS`, `BADAR` (65%), and `HASHIR` (35%) accounts exist |
| `recordCapitalContribution({ partner, amount, notes, date })` | Inflow from partner → `BUSINESS` account |
| `recordExpense({ amount, category, notes, date, paid_personally_by })` | Expense outflow from `BUSINESS`; if `paid_personally_by` is set, also posts a matching `CAPITAL_CONTRIBUTION` for that partner |
| `recordProfitWithdrawal({ partner, amount, notes, date })` | Guarded payout from `BUSINESS` → partner account (checks `allTimeNetProfit > 0`, `amount <= unclaimedProfit`, and `amount <= businessCash`) |
| `updatePartnerShares(shares)` | Dynamically updates equity/share percentages on partner accounts (must sum to 100%) |
| `recordLoanDisbursement({ lender, amount, notes, date })` | Debt financing inflow into `BUSINESS` account |
| `recordLoanRepayment({ lender, principalAmount, interestAmount, notes, date })` | Guarded by `businessCash`; posts `LOAN_REPAYMENT` for principal and `EXPENSE (BANK_INTEREST_FEES)` for interest |
| `getBankMetrics({ year, month, isAllTime })` | Period profit + revenue + expenses + balances + loans + per-partner earned/withdrawn/available + stock valuation + pending receivables |
| `getLedger({ page, limit, type, partner, category, startDate, endDate })` | Paginated, filterable transaction audit log |

### 9.3 Hooks — inside `app/actions.ts` `$transaction` blocks

| Action | Hook Behavior |
|---|---|
| `createSale` | If `PAYED` → sets `paid_at = date_purchased` and creates `REVENUE` `TxnEntry` |
| `updateSale` | Syncs `paid_at` and `REVENUE`/`REFUND` entries when status, amount, or date changes |
| `updateSalePaymentStatus` | `PAYED` upserts `REVENUE` and deletes `REFUND`; `REFUNDED` upserts `REFUND` (retaining `REVENUE`); `PENDING` deletes the sale's `TxnEntry` rows and clears `paid_at` |
| `deleteSale` | Restores product stock and deletes `TxnEntry` rows for `sale_id` before deleting `Sale` |
| `restockRawMaterial` | Posts `EXPENSE · INVENTORY` (`occurred_at = date_received`, `restock_id` idempotency key) |

### 9.4 UI — `app/finances/page.tsx` + `components/finances/`

- Server page in `app/finances/page.tsx` with client container in `components/finances/FinancesClient.tsx`.
- Modals:
  - `CapitalContributionModal.tsx` — record partner capital injections.
  - `QuickExpenseModal.tsx` — quick-add operating and equipment expenses (including personal-paid advance option).
  - `WithdrawModal.tsx` — partner profit drawings with unclaimed profit and liquid cash enforcement.
  - `LoanModal.tsx` — log loan disbursement and principal/interest repayment.
  - `PartnerShareModal.tsx` — adjust partner share percentages dynamically.
- `LedgerTable.tsx` — filterable, paginated audit log of every cash movement.
- Period selector: Month navigation (PKT boundaries) and an **All Time** reporting view toggle.
- Metrics cards: Net Profit (with loss state), Revenue, Expenses, Cash in Stock, Expected (PENDING), Business Cash, and Loan Debt summary.
- Per-partner cards: share, withdrawn, available to withdraw, and overdrawn warning when applicable. Split bar renders when period profit > 0.

---

## 10. Design Decisions & Known Limitations

### Resolved in Current Implementation
- **Cascade-safe ledger**: `TxnEntry` uses `onDelete: SetNull` on `sale_id`, `restock_id`, `from_id`, and `to_id` (`deleteSale` explicitly removes entries for deleted sales).
- **Exact money precision**: `TxnEntry.amount` uses `Decimal(14, 2)` in Postgres.
- **Exact split rounding**: `hashir = Math.round(profit * ratio)`, `badar = profit - hashir`.
- **Paid timestamp & PKT boundaries**: `Sale.paid_at` is tracked, and `getBankMetrics()` computes monthly date ranges in PKT (`UTC+5`).
- **Personal-paid business expenses**: Handled in `recordExpense({ paid_personally_by })` via paired `CAPITAL_CONTRIBUTION` + `EXPENSE` rows.
- **Cash in stock**: Combines raw materials (`current_stock * cost_per_unit`) and finished goods (`stock * making_cost`).
- **Overdrawn state**: Surfaced per partner in `getBankMetrics()` (`isOverdrawn`, `overdrawnAmount`) if a later refund reduces all-time profit below prior withdrawals.

### Remaining Limitations & Future Considerations
- **No actor audit column**: `TxnEntry` does not record `created_by` (single-owner auth).
- **No closed-period locking**: Backdating or editing historical sales/restocks recalculates past monthly figures immediately.
- **Last-cost stock valuation**: `restockRawMaterial()` overwrites `RawMaterial.cost_per_unit` with the latest non-zero `unit_cost` rather than a weighted average.
- **No automated ledger test suite yet**: The master identity (`identityBalanced` in `getBankMetrics()`) is checked at runtime, but there are no automated `bun test` assertions yet.
- **Legacy `getFinancesMetrics()`**: Still present in `app/actions.ts` as an unused COGS helper; new finance features must use `app/bank-actions.ts`.

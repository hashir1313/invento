# Finance & Banking System — Design

Status: **Proposed** (not yet implemented)
Supersedes: the profit logic in `docs/PRD.md` §Module 7 and `getFinancesMetrics()` in `app/actions.ts`.

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

**Master identity** (useful as an assertion in tests):

```
Business Cash = Σ Capital Contributions + All-time Net Profit − Σ Withdrawals
```

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
| Loss period (profit ≤ 0) | **Hide the partner split.** Show one loss figure. Block withdrawals. |
| Withdrawal guard | **Earned-share limit only** — business cash *may* go negative |
| History | **Backfill** all existing sales + restocks; operating costs entered by hand |

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

Three accounts, created once at backfill:

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
  id         String      @id @default(uuid())
  type       AccountType
  partner    Partner?    // null on the BUSINESS account
  name       String
  created_at DateTime    @default(now())

  outgoing   TxnEntry[]  @relation("From")
  incoming   TxnEntry[]  @relation("To")

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
5. **Partners may only withdraw up to their earned share** (`SHARE × all-time profit −
   all-time withdrawn`). Business cash may go negative as a result — that is an accepted,
   deliberate choice (issue 12).
6. **Withdrawals are blocked entirely when all-time profit ≤ 0.**
7. **The split bar renders only when the selected period's profit > 0.**
8. **Period split ≠ withdrawable.** The period split shows this month's share; *Available* is
   always computed on **all-time** profit. They differ whenever any prior period was a loss.
   The UI must show both and label them, or partners will think money is missing (see §8).
9. **Only `PAYED` sales may be refunded.** Refunding a `PENDING` sale would post an outflow for
   money that never arrived. Cancel/un-pay must route through `REFUNDED`.
10. **`proportionally derived shares must sum exactly`:** compute one partner from the other —
    `hashir = round(profit × 0.35)`, `badar = profit − hashir`. Never round both independently.

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

### 8.3 Tight cash — negative balance permitted

Suppose the account holds only **8,000** but Hashir's available is **12,775**.

Because you chose *allow negative cash*, the full **12,775** is withdrawable:

```
Business cash = 8,000 − 12,775 = −4,775     ← deficit, displayed prominently
```

No block, no clawback. The account simply reads as a deficit until contributions or revenue
cover it. See issue 12.

### 8.4 Refund reversal

A sale for 5,000 goes `PAYED` → `REFUNDED`:

- `REVENUE +5,000` row **stays** (the money did arrive)
- `REFUND −5,000` outflow row is **added** (the money went back)
- Cash: `+5,000 − 5,000 = 0` ✓
- Profit: revenue nets to zero for that sale ✓

---

## 9. What we will build

### 9.1 Schema — `prisma/schema.prisma`

- `Account`, `TxnEntry`, and the three enums above.
- No new columns on `Sale`.
- Apply with `prisma db push` (this repo has no `prisma/migrations/`), then `prisma generate`.

### 9.2 Actions — new file `app/bank-actions.ts`

`app/actions.ts` is already ~1,000 lines and this is a separate domain.

| Action | Does |
|---|---|
| `recordCapitalContribution({ partner, amount, notes, date })` | Contribution → BUSINESS |
| `recordExpense({ amount, category, notes, date })` | Manual operating cost |
| `recordProfitWithdrawal({ partner, amount, notes })` | Guarded payout (rule 5/6) |
| `getBankMetrics({ year, month })` | Period profit + revenue + expenses + balances + per-partner earned/withdrawn/available |
| `getLedger({ type, partner, from, to, page })` | Paginated, filterable transaction list |

### 9.3 Hooks — inside existing `$transaction` blocks

| Existing action | Add |
|---|---|
| `createSale` | If `PAYED` → post `REVENUE`, `occurred_at = date_purchased` |
| `updateSale` | Recompute on status/amount/date change; post `REFUND` if it became `REFUNDED` |
| `updateSalePaymentStatus` | Same transitions — **must first be wrapped in a `$transaction`**, it currently is not |
| `restockRawMaterial` | Post `EXPENSE · INVENTORY`, `occurred_at = date_received` |

### 9.4 UI — `app/finances/page.tsx` + `components/finances/`

- Period selector (month / year), server-driven via `searchParams`.
- Cards: **Net Profit** (with a loss state), Total Revenue, Total Expenses, **Cash in stock**,
  Expected (PENDING), **Business cash balance**.
- Per-partner panels: this month's share · withdrawn · **available** + Withdraw button
  (disabled when available ≤ 0).
- Split bar, rendered only when period profit > 0.
- Tabs: **Overview · Ledger · Money In · Costs** (Costs gets a prominent quick-add — see
  issue 16).
- Negative figures styled with the existing `--color-error` tokens; `formatPKR` output for
  negatives should be verified (issue 3).

### 9.5 Backfill — `scripts/backfill-banking.ts`

Run once via `bun scripts/backfill-banking.ts`. Must be **idempotent** (the unique keys make
re-running safe).

1. Create the three accounts if absent.
2. For every `PAYED` sale → `REVENUE` row, `occurred_at = date_purchased`.
3. For every restock → `EXPENSE · INVENTORY` row, `occurred_at = date_received`.
4. Print per-period totals so the numbers can be checked by hand.
5. You then enter **by hand**: opening capital contributions and all historical operating
   costs (ads, rent) — these cannot be inferred from existing data.

### 9.6 Verification

- Assert the master identity (§2) in a test: `cash = contributions + all-time profit − withdrawn`.
- Assert `Σ shares = profit` exactly (rule 10).
- Re-run backfill twice → row count unchanged (idempotency).
- Reconcile a closed month's profit against a hand calculation.

---

## 10. Issues we will face

### A · Data integrity

**1. Cascade deletes will silently destroy history.**
`Sale` cascades from `Product` (`onDelete: Cascade`) and `RawMaterialRestock` cascades from
`RawMaterial`. If `TxnEntry` inherits that cascade, deleting a perfume or a fragrance oil erases
the revenue/expense rows behind it — past profit and cash balance change with no trace.
→ Make `sale_id`/`restock_id` `SET NULL` (ledger rows survive), **or** block deletion when
ledger rows reference the record, **or** soft-delete. Decide before writing the hooks.

**2. `Float` cannot be trusted for money.**
Schema-wide `Float` accumulates rounding drift. For a ledger whose whole value is that it
reconciles, use `Decimal(14,2)` (as specified) or integer paisa. If `Float` is kept anyway,
round on every write and compare with an epsilon — but expect balances that never quite tie out.

**3. Split rounding loses a rupee.**
`round(37,000 × 0.65) + round(37,000 × 0.35)` will not always equal the total. Derive one from
the other (rule 10). Also verify `formatPKR` renders negatives sensibly — it sets
`maximumFractionDigits: 0`, so sub-rupee drift is hidden rather than fixed.

**4. Nothing records *who* performed an action.**
A withdrawal row with no actor means you cannot tell which partner entered it. Add
`created_by` if the session identity is reachable from server actions.

### B · Time and periods

**5. There is no `paid_at`.**
Only `date_purchased` exists. A sale made 28 March but paid 5 April — which period? Cash basis
says *when the money arrived*. Add `paid_at`, set on the transition to `PAYED`, and bucket
revenue by it. Without this, "revenue" is really "orders", not cash.

**6. Timezone will put sales in the wrong month.**
Dates are stored UTC; "this month" in Pakistan (UTC+5) differs from UTC for any late-night
sale. Period boundaries must be computed explicitly in `Asia/Karachi`, not via naive
`>= startOfMonth && < nextMonth` on UTC values.

**7. Backdating silently rewrites closed periods.**
Editing `date_purchased` or `date_received`, or flipping an old `PENDING` sale to `PAYED`,
changes a month you have already reported. There is no period locking today.
→ Either lock closed periods, or at minimum show a banner when a past period's figure changes.

**8. A refund after a withdrawal drives Available negative.**
Revenue reverses, all-time profit drops, and a partner who already cashed out now has
`withdrawn > share`. No clawback was chosen — so surface an explicit **"over-drawn by X"**
state and block further withdrawals until it recovers.

**9. Un-paying a sale is undefined.**
`updateSalePaymentStatus` currently allows `PAYED → PENDING` freely. Did the cash go back or
not? Force that path through `REFUNDED`, or treat the reversal as a refund. Leaving it open
guarantees a cash/profit mismatch.

### C · Semantics

**10. Profit and cash will look contradictory, and users will report it as a bug.**
Your March: profit −500, cash 39,500. Both correct. The labels must do the work —
*"Money earned this period"* vs *"Money in the account"* — with the cash-in-stock card as the
bridge between them. Budget time for explaining this.

**11. A partner paying a business cost from their own pocket is not modelled.**
If Hashir personally pays 5,000 for ads: profit should drop 5,000, but business cash did not
move. With the current schema you would have to post an expense (cash drops — wrong) or skip it
(profit overstated — wrong). Needs a `paid_from: BUSINESS | PERSONAL` flag, and personal-paid
costs become a receivable owed to that partner. **Open decision.**

**12. Negative cash has no floor and no meaning attached.**
Your choice permits `−4,775`. It must be rendered unmistakably (it now means partners have
effectively lent the business money), and you should decide whether later contributions are
automatically consumed to clear the deficit or are tracked separately.

**13. "Cash in stock" is rough and will be wrong in two ways.**
(a) `cost_per_unit` is *overwritten* by the latest restock (`actions.ts:435`), so stock is
valued at last purchase price, not average cost — a cheap restock instantly devalues everything
on hand. (b) Counting raw materials alone makes the figure collapse right after a production
run, because materials become bottles; finished goods must be included
(`product.stock × making_cost`). That means **`making_cost` must still be maintained** even
though it no longer feeds profit — worth stating explicitly in the UI, or it will rot.

### D · Build and rollout

**14. Profit figures will jump overnight.**
The formula changes from COGS to cash basis, so historical numbers will not reconcile with
anything anyone remembers. Expect "why did profit change?" — document the new formula
everywhere before it ships.

**15. `db push` with no migration history.**
Additive changes (new tables, new enums) are safe, but there is no migration file to roll back
and no record of what changed. Take a database backup first.

**16. Cash-basis profit is only as good as the expenses you remember to log.**
Forget a month of ads and profit is overstated with no warning. Costs entry needs to be
fast and obvious — a quick-add right on the finance page, not buried behind the raw-materials
flow. This is an adoption risk more than a technical one.

**17. Server actions can fire twice.**
Double-click, retry, or React 19's double render in dev will post duplicate rows. Unique keys
protect sale/restock-derived entries; **manual** contributions, expenses and withdrawals need a
client-generated idempotency key or a disabled-on-submit button.

**18. Seed data would be booked as real revenue.**
`prisma/seed.ts` creates `PAYED` sales dated today. Backfill would treat them as genuine
history. Clean or exclude them before running against the real database.

**19. Query load on every render.**
The page is `export const revalidate = 0`, so every visit re-aggregates — now across
`txn_entries` as well as `Sale`. Fine at this scale, but keep it on aggregates (never hydrate
rows for metrics) and index `(type, occurred_at)`.

**20. Five existing documents describe the old formula.**
`README.md`, `docs/PRD.md`, `docs/database.md`, `docs/architecture.md` and `docs/plan.md` all
state the COGS-based 65/35 split. All must be updated or the next change reintroduces the old
logic.

---

## 11. Open decisions

| # | Question | Options |
|---|---|---|
| 1 | Partner pays a business cost personally (issue 11) | `paid_from` flag + receivable · force everything through BUSINESS · ignore |
| 2 | Revenue period bucketing (issue 5) | Add `paid_at` and use it · keep `date_purchased` |
| 3 | Money type (issue 2) | `Decimal(14,2)` · integer paisa · keep `Float` |
| 4 | Closed-period policy (issue 7) | Lock · allow silent restatement · banner on change |
| 5 | Delete policy (issue 1) | Block · `SET NULL` · soft-delete |
| 6 | Literal profit snapshots | Always derive live · also store a monthly snapshot to freeze reported months |
| 7 | Deficit clearance (issue 12) | Contributions auto-clear the deficit · track deficit separately |

---

## 12. Documents to update when this ships

- `README.md` — feature bullet and `/finances` route description
- `docs/PRD.md` — Module 7 rewrite
- `docs/database.md` — new models, enums, ERD
- `docs/architecture.md` — server action surface, data flows
- `docs/plan.md` — phase status and the finance regression check
- `docs/README.md` — index entry for this file

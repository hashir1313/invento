# Product Requirements Document (PRD)

## Project Name: Invento
**Target Audience**: Business Owner(s) Only (Internal Operational System)

---

## 1. Executive Summary & Purpose

**Invento** is a custom, cloud-native inventory, production, and sales management web application built specifically for a **Perfume Brand**.

The system is strictly designed for **internal use by the business owner(s)** to streamline daily operational workflows, manage finished perfume stock, track customer purchases with local payment options (Easypaisa, Jazzcash, Bank Transfer, Cash), log raw material restocks (fragrance oils, ethanol, bottles, packaging), run batch production with automatic ingredient calculation, manage maceration periods, and monitor profitability with partner profit splits.

---

## 2. Target Persona & Access

- **Users**: Business Owner(s) and operational manager(s).
- **Access Level**: Private operational dashboard accessible via desktop or mobile web browser, protected by username/password login (see Module 8).
- **Goal**: Fast, zero-friction data entry for sales and raw material intake, with real-time tracking of finished inventory, financial receivables (Pending vs Payed), low-stock alerts, and maceration readiness.

---

## 3. Key Feature Requirements

### Module 1: Products Catalog (Finished Perfumes)
- **Product Management**: Create, update, view, and delete finished perfume items.
- **Perfume Details**:
  - Name (e.g., "Velvet Rose", "Santal Musk")
  - Volume in milliliters (`perfume_quantity` in ml, e.g., 30ml, 50ml, 100ml)
  - Impression Flag (Boolean: whether it is an impression of a designer brand or original formulation)
  - Designer Brand Name (Optional string, e.g., "Tom Ford Tobacco Vanille")
  - Unit Selling Price (in PKR)
  - **Making Cost** (in PKR — cost to produce one bottle; feeds the Finances module)
  - Finished Bottle Stock Count (Available ready-to-sell stock), adjustable via quick +/- controls
- **Product Images**: Upload product photos auto-compressed client-side into `.webp` format (< 100 KB, max 800×800) and stored on the product record.

### Module 2: Customer Sales & Orders Register
- **Order Recording**: Quickly enter customer purchases; sales are fully editable after creation.
- **Sales Data Fields**:
  - Customer Name (Text)
  - Date Purchased (Date picker, default: current timestamp)
  - Product Purchased (Relation to Finished Product; unit price auto-fills from the product)
  - Quantity Purchased (Integer count of bottles)
  - Unit Price & Total Price (Auto-calculated)
  - **Payment Status**: `PENDING`, `PAYED`, `REFUNDED` (inline dropdown/badges — updatable directly from the table)
  - **Payment Options**: `CASH`, `EASYPAISA`, `JAZZCASH`, `BANK_TRANSFER` (Dropdown/Badges)
  - **Review Given**: Boolean toggle (`true`/`false`) for customer review follow-up
  - Notes (Text, optional address/contact/shipping details)
- **Filtering**: Filter the sales table by Payment Status and Payment Option.
- **Automated Stock Deduction**: Recording a sale decrements the product's available `stock` in a transaction, with an insufficient-stock guard. Editing a sale re-balances stock (including product switches).

### Module 3: Raw Materials Inventory & Restock Hub
- **Raw Material Catalog**:
  - Material Name (e.g., "French Vanilla Fragrance Oil", "99% Ethanol", "50ml Square Glass Bottle", "Silver Spray Atomizer", "Logo Sticker 50ml", "Branded Outer Box", "Thank You Card")
  - Category: `OIL`, `SOLVENT`, `BOTTLE`, `CAP_SPRAY`, `STICKER`, `BOX`, `CARD`, `OTHER`
  - Unit of Measure: `ML`, `GRAMS`, `PIECES`
  - Current Stock Level (Float quantity in stock)
  - Minimum Stock Alert Threshold (Generates a low-stock warning when current stock falls below threshold)
  - Cost per Unit (Average cost per ml or piece)
- **Category Filter Tabs**: Filter the material list by category with item counts.
- **"Got Supply" Restock Intake Log**:
  - Log incoming raw material shipments (Quantity received, unit cost, total spend preview, supplier name, date received).
  - Automatically updates raw material stock level, refreshes cost per unit, and logs the inventory investment.

### Module 4: Batch Production Engine
Two production workflows are supported:

**V2 — Concentration-Based Production (`/batch-production-v2`, primary)**
- **Production Modes**:
  - *Bottle Production*: produce a specific number of bottles (pcs).
  - *Mass Production*: produce a bulk volume (ml); full bottles are derived from the product's ml size.
- **Automatic Ingredient Calculation**: Enter a concentration percentage — fragrance oil (grams) and ethanol (ml) requirements are calculated from total volume.
- **Material Selection**: Choose the oil, ethanol, and optional glass bottle / packaging box / sticker materials to deduct; live insufficient-stock indicators block invalid runs.
- **Maceration Option**: Choose a maceration period (0–90 days). With maceration, bottles go into a `MacerationBatch` instead of stock; with 0 days they are added to stock immediately.
- **Production Log**: Every run is recorded as a `BatchProduction` entry.

**V1 — Recipe-Based Production (`/batch-production`, legacy)**
- **Recipe Management**: Define per-bottle raw material quantities for each product (`BatchRecipeItem`).
- **Batch Run**: Producing deducts recipe materials (oil, ethanol, bottles, stickers, boxes) from inventory and increments finished product stock, with stock guards.

### Module 5: Owner Dashboard & Business Analytics
- **Financial Overview**: Total Revenue (Payed), Pending Receivables (Receivables), Total Refunded.
- **Payment Method Breakdown**: Sales split by Cash vs Easypaisa vs Jazzcash vs Bank Transfer.
- **Low Stock Alerts**: Perfumes at or below 5 bottles flagged as "Critical Low Stock" with a quick link to production.
- **Maceration Alerts**: Batches whose maceration period has ended surface on the dashboard with **Add to Stock** and **Extend** actions.
- **Review Follow-up Tracker**: Count of customer purchases where `review_given = false`.
- **Recent Sales**: Latest 5 orders with a link to the full register.
- **Quick Actions**: "Record New Sale" and "Got Supply".

### Module 6: Maceration Management
- **Create Maceration Batches**: Select product, bottle count, start date, and end date (end must be after start).
- **Active List**: Shows days remaining per batch, with a READY badge once the period ends.
- **Actions**: Add a completed batch to sellable stock (transactional), or extend the end date.
- **History**: Completed batches (added to stock) are listed with status badges.

### Module 7: Finances & Partner Profit Split
- Computed from **Payed** sales only:
  - Total Revenue (sum of sale totals)
  - Total Making Cost (quantity × product `making_cost`)
  - Total Net Profit (revenue − making cost)
- **Partner Split**: Net profit is split **Badar 65% / Hashir 35%**, shown as cards and a split bar.

### Module 8: Authentication & Access Control
- **Single-owner login**: username/password checked against environment-stored credentials using a SHA-256 hash with a timing-safe comparison.
- **Session**: HS256 JWT stored in an `httpOnly`, `SameSite=Lax` cookie (7-day expiry), signed with `AUTH_SECRET`.
- **Route Protection**: `proxy.ts` (Next.js 16 middleware replacement) redirects every unauthenticated request to `/login`; login/logout are exposed via `/api/auth/login` and `/api/auth/logout`.
- **Credential Tooling**: `bun run create-user <username> <password>` generates the values needed in `.env`.

---

## 4. Non-Functional Requirements

- **Hosting & Cost**: 100% Free deployment on Vercel Hobby tier.
- **Database**: Neon PostgreSQL (Serverless, free tier).
- **Image Handling**: Client-side WebP compression (< 100 KB per image) stored as data URLs on the product record; `@vercel/blob` is available for future migration to blob storage.
- **Performance**: Instant UI state updates, sub-second API responses; all stock mutations run inside Prisma transactions.
- **Responsiveness**: Fully usable on mobile smartphones for quick sales entry on the go (bottom navigation bar).
- **Theming**: Light and dark mode, persisted in `localStorage` and applied before first paint to avoid a flash.
- **Design**: Geist design system (see `DESIGN.md`), Geist Sans/Mono fonts.

---

## 5. Implementation Status

All modules above are implemented as of September 2026:

| Module | Status |
|--------|--------|
| 1. Products Catalog | ✅ Implemented |
| 2. Sales & Orders Register | ✅ Implemented |
| 3. Raw Materials & Restock | ✅ Implemented |
| 4. Batch Production (V1 + V2) | ✅ Implemented |
| 5. Dashboard & Analytics | ✅ Implemented |
| 6. Maceration Management | ✅ Implemented |
| 7. Finances & Profit Split | ✅ Implemented |
| 8. Authentication & Access Control | ✅ Implemented |

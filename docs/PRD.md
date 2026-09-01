# Product Requirements Document (PRD)

## Project Name: Invento
**Target Audience**: Business Owner(s) Only (Internal Operational System)

---

## 1. Executive Summary & Purpose

**Invento** is a custom, cloud-native inventory, production, and sales management web application built specifically for a **Perfume Brand**.

The system is strictly designed for **internal use by the business owner(s)** to streamline daily operational workflows, manage finished perfume stock, track customer purchases with local payment options (Easypaisa, Jazzcash, Bank Transfer, Cash), log raw material restocks (fragrance oils, ethanol, bottles, packaging), and monitor batch production.

---

## 2. Target Persona & Access

- **Users**: Business Owner(s) and operational manager(s).
- **Access Level**: Private operational dashboard accessible via desktop or mobile web browser.
- **Goal**: Fast, zero-friction data entry for sales and raw material intake, with real-time tracking of finished inventory, financial receivables (Pending vs Payed), and low-stock alerts.

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
  - Finished Bottle Stock Count (Available ready-to-sell stock)
- **WebP Product Images**: Upload product photos auto-compressed into `.webp` format stored on Vercel Blob to fit thousands of images within 1 GB free cloud storage.

### Module 2: Customer Sales & Orders Register
- **Order Recording**: Quickly enter customer purchases.
- **Sales Data Fields**:
  - Customer Name (Text)
  - Date Purchased (Date picker, default: current timestamp)
  - Product Purchased (Relation to Finished Product)
  - Quantity Purchased (Integer count of bottles)
  - Unit Price & Total Price (Auto-calculated)
  - **Payment Status**: `PENDING`, `PAYED`, `REFUNDED` (Dropdown/Badges)
  - **Payment Options**: `CASH`, `EASYPAISA`, `JAZZCASH`, `BANK_TRANSFER` (Dropdown/Badges)
  - **Review Given**: Boolean toggle/checkbox (`true`/`false`)
  - Notes (Text, optional address/contact/shipping details)
- **Automated Stock Deduction**: Recording a sale automatically decrements the corresponding product's available `stock`.

### Module 3: Raw Materials Inventory & Restock Hub
- **Raw Material Catalog**:
  - Material Name (e.g., "French Vanilla Fragrance Oil", "99% Ethanol", "50ml Square Glass Bottle", "Silver Spray Atomizer", "Logo Sticker 50ml", "Branded Outer Box", "Thank You Card")
  - Category: `OIL`, `SOLVENT`, `BOTTLE`, `CAP_SPRAY`, `STICKER`, `BOX`, `CARD`, `OTHER`
  - Unit of Measure: `ML`, `GRAMS`, `PIECES`
  - Current Stock Level (Float/Int quantity in stock)
  - Minimum Stock Alert Threshold (Generates low-stock warning when current stock falls below threshold)
  - Cost per Unit (Average cost per ml or piece)
- **"Got Supply" Restock Intake Log**:
  - Log incoming raw material shipments (Quantity received, total cost, supplier name, date received).
  - Automatically updates raw material stock level and logs inventory investment.

### Module 4: Batch Production / Assembly Engine (Optional Workflow)
- **Batch Brewing & Bottling**: Enter a production run (e.g., "Brewed 20 bottles of Velvet Rose 50ml").
- **Auto-Deduction of Raw Materials**: Deducts required raw materials (e.g., 300ml oil, 700ml ethanol, 20 bottles, 20 stickers, 20 boxes) from raw material inventory and adds +20 finished bottles to product stock.

### Module 5: Owner Dashboard & Business Analytics
- **Financial Overview**: Total Revenue, Total Pending Payments (Receivables), Total Refunded.
- **Payment Method Breakdown**: Sales split by Cash vs Easypaisa vs Jazzcash vs Bank Transfer.
- **Low Stock Alerts**: Instant notifications for raw materials running low.
- **Review Follow-up Tracker**: Filter customer purchases where `review_given = false` for easy customer follow-ups.

---

## 4. Non-Functional Requirements

- **Hosting & Cost**: 100% Free deployment on Vercel Hobby tier.
- **Database**: Neon PostgreSQL (Serverless, free tier).
- **Storage**: Vercel Blob with client-side WebP compression (< 100 KB per image).
- **Performance**: Instant UI state updates, sub-second API responses.
- **Responsiveness**: Fully usable on mobile smartphones for quick sales entry on the go.

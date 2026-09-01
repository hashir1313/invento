# System Architecture Document

## System Overview: Invento Architecture

**Invento** is built as a serverless, cloud-native web application deployed on **Vercel** with a **Neon PostgreSQL** database layer and **Vercel Blob** cloud file storage.

```mermaid
graph TD
    Client["Owner Mobile / Desktop Browser"]
    
    subgraph Vercel["Vercel Cloud Platform (100% Free Hobby)"]
        NextApp["Next.js App Router (React + TypeScript)"]
        ServerActions["Server Actions & API Routes"]
        Compressor["WebP Image Compression Utility"]
    end
    
    subgraph Database["Database Layer"]
        Prisma["Prisma ORM"]
        NeonDB[("Neon Serverless PostgreSQL")]
    end
    
    subgraph Storage["Cloud Media Storage"]
        VercelBlob["Vercel Blob Storage"]
    end
    
    Client -->|HTTPS / UI Interaction| NextApp
    NextApp --> ServerActions
    ServerActions -->|Query / Mutation| Prisma
    Prisma -->|SQL over TLS| NeonDB
    ServerActions -->|Upload Raw WebP| Compressor
    Compressor -->|Put Blob| VercelBlob
    VercelBlob -->|CDN Image URL| ServerActions
```

---

## 1. Tech Stack Components

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Frontend UI** | **Next.js 14/15 (React 18/19)** | App Router, React Server Components (RSC), Client Components for forms & interactive modals. |
| **Styling** | **Tailwind CSS + Lucide Icons** | Utility-first CSS with modern color palette, badged statuses, and responsive mobile-first grids. |
| **Backend & API** | **Next.js Server Actions** | Type-safe server mutations without external REST overhead. |
| **Database ORM** | **Prisma ORM** | Schema-driven ORM generating type-safe TypeScript clients. |
| **Database** | **Neon PostgreSQL** | Serverless cloud Postgres instance connected via pooled connection strings (`DATABASE_URL`). |
| **Media Storage** | **Vercel Blob (`@vercel/blob`)** | Cloud storage for perfume product images. |
| **Image Optimizer** | **Canvas / WebP Converter** | Converts user-uploaded images to lightweight `.webp` (< 100 KB) before uploading to Vercel Blob. |

---

## 2. Component Layering & Data Flow

### A. Customer Sale Flow
```mermaid
sequenceDiagram
    autonumber
    actor Owner as Business Owner
    participant UI as Sales Page (Client Component)
    participant Action as recordSale() Server Action
    participant Prisma as Prisma ORM
    participant DB as Neon PostgreSQL DB

    Owner->>UI: Selects Product, Quantity, Payment Status, Payment Option
    UI->>Action: Submits sale payload
    Action->>Prisma: Checks current product stock count
    alt Stock Available
        Action->>Prisma: Creates Sale record & Decrements Product stock in transaction
        Prisma->>DB: Executing SQL Transaction
        DB-->>Prisma: Transaction Success
        Prisma-->>Action: Returns new Sale object
        Action-->>UI: Revalidates path & shows success toast
    else Insufficient Stock
        Action-->>UI: Returns error: Insufficient finished stock
    end
```

### B. Image Upload & WebP Optimization Flow
```mermaid
sequenceDiagram
    autonumber
    actor Owner as Business Owner
    participant UI as Product Form
    participant Canvas as Browser Canvas WebP Encoder
    participant Action as uploadProductImage() Action
    participant Blob as Vercel Blob SDK
    participant DB as Neon DB

    Owner->>UI: Selects phone camera photo (e.g., 5MB JPG)
    UI->>Canvas: Resizes to max 800x800px & converts to image/webp (50KB)
    Canvas-->>UI: Returns optimized WebP Blob
    UI->>Action: Sends WebP File payload
    Action->>Blob: put('products/velvet-rose.webp', webpBuffer)
    Blob-->>Action: Returns public CDN URL (https://...blob.vercel-storage.com)
    Action->>DB: Saves image_url in Product record
```

### C. Raw Material Restock Flow
```mermaid
sequenceDiagram
    autonumber
    actor Owner as Business Owner
    participant UI as Restock Modal
    participant Action as restockMaterial() Server Action
    participant DB as Neon DB

    Owner->>UI: Selects Material (e.g. "French Vanilla Oil"), Qty "+500ml", Unit Cost
    UI->>Action: Submits restock entry
    Action->>DB: Creates RawMaterialRestock log & updates RawMaterial.current_stock
    DB-->>UI: UI revalidates and updates stock indicator badge
```

---

## 3. Directory & File Structure

```
g:/Projects/invento/
├── app/
│   ├── layout.tsx            # Global layout with navigation bar
│   ├── page.tsx              # Dashboard Home (Metrics, Revenue, Alerts)
│   ├── products/
│   │   └── page.tsx          # Products Manager (Grid, Add/Edit Perfume Modal)
│   ├── sales/
│   │   └── page.tsx          # Customer Sales Register (Filterable table, Record Sale Modal)
│   ├── raw-materials/
│   │   └── page.tsx          # Raw Materials Hub (Oils, Bottles, Packaging, Restock Intake)
│   └── api/
│       └── upload/route.ts   # Image upload endpoint with WebP processing
├── components/
│   ├── ui/                   # Buttons, Badges, Modals, Cards, Inputs
│   ├── Navbar.tsx            # Top/Bottom mobile navigation bar
│   ├── DashboardMetrics.tsx  # Revenue & Pending stats
│   ├── ProductCard.tsx       # Perfume display card with stock status
│   ├── SalesTable.tsx        # Filterable orders table
│   └── RestockModal.tsx      # Raw material intake form
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── webp-compressor.ts    # WebP image compression helper
│   └── utils.ts              # Currency & date formatters
├── prisma/
│   └── schema.prisma         # PostgreSQL schema definition
├── public/                   # Static assets & placeholders
├── PRD.md                    # Product Requirements Document
├── architecture.md           # System Architecture Document
├── database.md               # Database Schema Document
└── plan.md                   # Development & Testing Plan
```

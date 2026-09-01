# Database Schema Documentation

## Database Technology: Neon PostgreSQL + Prisma ORM

This document specifies the database models, enums, relationships, and constraints for **Invento**.

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    Product ||--o{ Sale : "has sales"
    Product ||--o{ BatchProduction : "produced in"
    Product ||--o{ BatchRecipeItem : "has recipe items"
    RawMaterial ||--o{ RawMaterialRestock : "restocked in"
    RawMaterial ||--o{ BatchRecipeItem : "used in recipe"

    Product {
        string id PK
        string name
        int perfume_quantity_ml
        boolean impression
        string impression_of
        decimal price
        int stock
        string image_url
        datetime created_at
        datetime updated_at
    }

    Sale {
        string id PK
        string customer_name
        datetime date_purchased
        string product_id FK
        int quantity
        decimal unit_price
        decimal total_price
        PaymentStatus payment_status
        PaymentOption payment_option
        boolean review_given
        string notes
        datetime created_at
    }

    RawMaterial {
        string id PK
        string name
        MaterialCategory category
        UnitOfMeasure unit_of_measure
        float current_stock
        float min_stock_alert
        decimal cost_per_unit
        datetime created_at
        datetime updated_at
    }

    RawMaterialRestock {
        string id PK
        string raw_material_id FK
        float quantity_received
        decimal unit_cost
        decimal total_cost
        string supplier
        datetime date_received
        string notes
        datetime created_at
    }

    BatchProduction {
        string id PK
        string product_id FK
        int batch_quantity
        datetime date_produced
        string notes
        datetime created_at
    }

    BatchRecipeItem {
        string id PK
        string product_id FK
        string raw_material_id FK
        float quantity_required_per_unit
    }
```

---

## 2. Enums

### `PaymentStatus`
- `PENDING`: Order logged, payment not yet received.
- `PAYED`: Order payment received in full.
- `REFUNDED`: Order payment refunded to customer.

### `PaymentOption`
- `CASH`: Cash on Delivery / Hand cash.
- `EASYPAISA`: Easypaisa mobile wallet transfer.
- `JAZZCASH`: JazzCash mobile wallet transfer.
- `BANK_TRANSFER`: Direct bank account deposit/IBFT.

### `MaterialCategory`
- `OIL`: Essential / Fragrance oils (measured in ml).
- `SOLVENT`: Perfumer's ethanol / perfumery solvent (measured in ml).
- `BOTTLE`: Glass bottles (measured in pieces).
- `CAP_SPRAY`: Atomizer spray pumps and caps (measured in pieces).
- `STICKER`: Product labels & bottle stickers (measured in pieces).
- `BOX`: Outer packaging boxes (measured in pieces).
- `CARD`: Thank you / notes cards (measured in pieces).
- `OTHER`: Miscellaneous supplies.

### `UnitOfMeasure`
- `ML`: Milliliters
- `GRAMS`: Grams
- `PIECES`: Pieces / Count

---

## 3. Prisma Schema Code (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum PaymentStatus {
  PENDING
  PAYED
  REFUNDED
}

enum PaymentOption {
  CASH
  EASYPAISA
  JAZZCASH
  BANK_TRANSFER
}

enum MaterialCategory {
  OIL
  SOLVENT
  BOTTLE
  CAP_SPRAY
  STICKER
  BOX
  CARD
  OTHER
}

enum UnitOfMeasure {
  ML
  GRAMS
  PIECES
}

model Product {
  id                  String   @id @default(uuid())
  name                String
  perfume_quantity_ml Int      // Volume in ml (e.g. 30, 50, 100)
  impression          Boolean  @default(false)
  impression_of       String?  // Name of designer scent if impression = true
  price               Float    // Sale price in PKR
  stock               Int      @default(0) // Ready-to-sell bottles
  image_url           String?  // Vercel Blob WebP URL
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  sales               Sale[]
  batch_productions   BatchProduction[]
  recipe_items        BatchRecipeItem[]

  @@map("products")
}

model Sale {
  id             String        @id @default(uuid())
  customer_name  String
  date_purchased DateTime      @default(now())
  product_id     String
  quantity       Int           @default(1)
  unit_price     Float
  total_price    Float
  payment_status PaymentStatus @default(PENDING)
  payment_option PaymentOption @default(CASH)
  review_given   Boolean       @default(false)
  notes          String?

  created_at     DateTime      @default(now())

  product        Product       @relation(fields: [product_id], references: [id], onDelete: Cascade)

  @@index([payment_status])
  @@index([payment_option])
  @@index([date_purchased])
  @@map("sales")
}

model RawMaterial {
  id              String           @id @default(uuid())
  name            String
  category        MaterialCategory @default(OTHER)
  unit_of_measure UnitOfMeasure    @default(PIECES)
  current_stock   Float            @default(0) // Remaining ml/grams/pcs
  min_stock_alert Float            @default(10) // Threshold warning
  cost_per_unit   Float            @default(0) // Avg cost per unit in PKR
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt

  restocks        RawMaterialRestock[]
  recipe_items    BatchRecipeItem[]

  @@map("raw_materials")
}

model RawMaterialRestock {
  id                String      @id @default(uuid())
  raw_material_id   String
  quantity_received Float
  unit_cost         Float
  total_cost        Float
  supplier          String?
  date_received     DateTime    @default(now())
  notes             String?

  created_at        DateTime    @default(now())

  raw_material      RawMaterial @relation(fields: [raw_material_id], references: [id], onDelete: Cascade)

  @@map("raw_material_restocks")
}

model BatchProduction {
  id             String   @id @default(uuid())
  product_id     String
  batch_quantity Int      // Number of finished bottles produced
  date_produced  DateTime @default(now())
  notes          String?
  created_at     DateTime @default(now())

  product        Product  @relation(fields: [product_id], references: [id], onDelete: Cascade)

  @@map("batch_productions")
}

model BatchRecipeItem {
  id                          String      @id @default(uuid())
  product_id                  String
  raw_material_id             String
  quantity_required_per_unit  Float       // e.g. 15ml oil per bottle

  product                     Product     @relation(fields: [product_id], references: [id], onDelete: Cascade)
  raw_material                RawMaterial @relation(fields: [raw_material_id], references: [id], onDelete: Cascade)

  @@unique([product_id, raw_material_id])
  @@map("batch_recipe_items")
}
```

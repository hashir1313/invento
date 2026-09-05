# Invento

Internal inventory and sales management system for a perfume brand. Built with Next.js, Prisma, and Neon PostgreSQL.

## Features

- **Dashboard** — Revenue, profit, stock alerts, and recent sales at a glance
- **Product Management** — Track perfume products with images, pricing, and stock levels
- **Sales Tracking** — Record sales with payment status (Cash, EasyPaisa, JazzCash, Bank Transfer)
- **Raw Materials Inventory** — Manage oils, solvents, bottles, caps, stickers, packaging, and cards
- **Batch Production** — Log production runs with recipe-based material consumption
- **Restock Tracking** — Record material restocks with supplier and cost details
- **Authentication** — Simple username/password login with HMAC-SHA256

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Styling:** Tailwind CSS v4
- **Storage:** Vercel Blob (product images)
- **Runtime:** Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- A PostgreSQL database (e.g. [Neon](https://neon.tech/))

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd invento
   bun install
   ```

2. Copy the example env file and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Run the database migration:
   ```bash
   bunx prisma migrate dev
   ```

4. Seed the database with sample data:
   ```bash
   bun run seed
   ```

5. Create an admin user:
   ```bash
   bun run create-user <username> <password>
   ```
   Then paste the generated hash and username into your `.env` file.

6. Start the dev server:
   ```bash
   bun dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run seed` | Seed database with sample data |
| `bun run create-user <user> <pass>` | Generate auth credentials |
| `bun run lint` | Run ESLint |

## Project Structure

```
app/
├── actions.ts          # Server actions (CRUD operations)
├── api/                # API routes
├── batch-production/   # Batch production page
├── login/              # Login page
├── products/           # Product management page
├── raw-materials/      # Raw materials inventory page
├── sales/              # Sales tracking page
├── layout.tsx          # Root layout with Navbar
└── page.tsx            # Dashboard
components/
└── Navbar.tsx          # Navigation bar
lib/
└── prisma.ts           # Prisma client singleton
prisma/
├── schema.prisma       # Database schema
└── seed.ts             # Database seed script
scripts/
└── create-user.ts      # Auth user creation utility
```

## License

MIT

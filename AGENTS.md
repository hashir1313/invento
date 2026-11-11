<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Invento — Agent Instructions

## 1. Workflow & Safety Rules (Mandatory)
- **Never touch the production branch directly:** Never commit, push, merge, or make changes directly on `main`, and never run `db push`, migrations, or seed scripts against the production Neon database branch. Always ask before merging to `main` or touching production data.
- **Ask before branching off `main`:** Check the current git branch before editing files. If the repo is on `main`, **stop and ask the user** whether to create a new `feat/<topic>` or `fix/<topic>` branch (or switch to an existing branch) before making any changes.
- **Diagnose first on bugs/errors:** When asked about an issue or given an error, investigate and return with the **root cause** and a **proposed fix** — do **not** automatically edit files or implement the fix until the user approves.
- **Strict scope:** Keep edits strictly focused on the task; do not refactor unrelated files or legacy `/batch-production` unless explicitly asked.
- **Protect secrets & data:** Never read/print `.env` secret values in responses, and never run destructive database commands (`prisma migrate reset`, `db push --force-reset`, `DROP`, `TRUNCATE`) without explicit user confirmation.

## 2. Stack & Commands
- **Package manager & runtime:** Use **Bun** (`bun install`, `bun dev`, `bun run lint`, `bun run build`, `bunx prisma ...`). Do not use `npm`, `yarn`, or `pnpm`.
- **Verification before finishing code changes:** Run and report results for:
  - `bun run lint`
  - `bun run typecheck`
  - `bun test`
  - `bun run build`

## 3. Documentation Map (Read Before Editing)
Read the relevant doc before modifying a module instead of guessing conventions:
- **UI & Styling (Geist design system, tokens, dark mode):** `DESIGN.md` and `app/globals.css`
- **Database Schema & Models:** `docs/database.md` and `prisma/schema.prisma`
- **Finances & Double-Entry Ledger:** `docs/finance-system.md` and `app/bank-actions.ts`
- **System Architecture, Flows & Regression Checklist:** `docs/architecture.md` and `app/actions.ts`
- **Product Requirements & Scope:** `docs/PRD.md`

## 4. Codebase Invariants & Gotchas
- **Next.js 16 Conventions:** Auth gating lives in `proxy.ts` (not `middleware.ts`), protecting all routes except `/login` and `/api/auth/*`. Always check `node_modules/next/dist/docs/` before changing Next.js routing/caching/server APIs.
- **Prisma Schema Sync:** This repo currently has no `prisma/migrations/` directory and syncs schema changes via `bunx prisma db push` + `bunx prisma generate` (against a dev Neon branch only). Do not run `prisma migrate dev` or introduce a migrations directory unless explicitly requested.
- **Transactional Integrity:** Sales, restocks, batch production, maceration, and ledger entries must execute atomically inside Prisma `$transaction` blocks so inventory counts and double-entry account balances never drift.
- **Finance Ledger Source of Truth & Guards:** All finance reads/writes must use `app/bank-actions.ts` (`TxnEntry` / `Account`), never the legacy COGS helper `getFinancesMetrics()` in `app/actions.ts`. Preserve the master identity (`Business Cash = Capital + All-time Net Profit + Outstanding Loan Debt − Withdrawals`) and both the unclaimed-profit and liquid-cash (`businessCash`) withdrawal guards.
- **Timezone (PKT / UTC+5):** Monthly finance and reporting date ranges use PKT (UTC+5) helpers in `app/bank-actions.ts` — preserve PKT boundaries when adding period filters or aggregations.
- **Active vs. Legacy Routes:** `/batch-production-v2` is the active production page; `/batch-production` is legacy and kept out of the main nav.
- **Server Action Revalidation:** Use `safeRevalidate()` (in `app/actions.ts` and `app/bank-actions.ts`) instead of raw `revalidatePath()` so actions do not throw when invoked from scripts or tests.
- **UI, Dark Mode & Mobile Nav:** New pages and modals must use Geist tokens from `app/globals.css` (see `DESIGN.md`), support both light and dark modes, disable submit buttons while server actions are pending (preventing duplicate manual ledger entries), and update `components/Navbar.tsx` (desktop bar + mobile "More" drawer) when adding routes.
- **Product Images:** Product photos are compressed client-side via `lib/webp-compressor.ts` to WebP (`< 100 KB`, max `800×800`). Vercel Blob (`BLOB_READ_WRITE_TOKEN`) is wired up on the production setup, not in local dev (dev uses compressed WebP data URLs on `Product.image_url`).

## 5. Keep Documentation in Sync
- When changing Prisma models, routes, server actions, or environment variables, update the matching `docs/*.md` file (and `README.md` if setup/scripts/routes change).


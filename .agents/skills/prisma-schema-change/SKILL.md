---
name: prisma-schema-change
description: >-
  Use this skill whenever modifying Prisma models, enums, relations, or indexes
  in prisma/schema.prisma for Invento.
---

# Prisma Schema Change Workflow

Follow this procedure when changing the database schema so Neon branches, Prisma Client, and documentation stay aligned.

## Steps

1. **Verify branch & environment safety**
   - Confirm you are **not** on the `main` git branch (ask the user before creating/switching branches if on `main`).
   - Confirm `DATABASE_URL` points to a **dev** Neon branch — never run schema syncs or seeds against production.
2. **Read existing schema docs**
   - Review [database.md](../../../docs/database.md) and [schema.prisma](../../../prisma/schema.prisma).
3. **Edit `prisma/schema.prisma`**
   - For financial/ledger fields, use `Decimal @db.Decimal(14, 2)` (never `Float`) and preserve `onDelete: SetNull` on `TxnEntry` references so ledger history survives deletions.
4. **Sync schema & regenerate client**
   - This repo has no `prisma/migrations/` directory. Run:
     ```bash
     bunx prisma db push
     bunx prisma generate
     ```
   - Do **not** run `prisma migrate dev` or `prisma migrate reset` unless explicitly requested.
5. **Update documentation & seed**
   - Update the ERD, enum/model descriptions, and schema block in [database.md](../../../docs/database.md).
   - Update [seed.ts](../../../prisma/seed.ts) if new required models or fields need default seed rows.
6. **Verify**
   - Run `bun run typecheck`, `bun test`, `bun run build`, and `bunx eslint` on modified files.

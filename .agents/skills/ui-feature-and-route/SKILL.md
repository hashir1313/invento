---
name: ui-feature-and-route
description: >-
  Use this skill when adding or modifying App Router pages, UI components, modals,
  navigation links, or dark-mode styles in app/ or components/.
---

# UI Feature & Route Workflow

Follow this checklist when building or updating pages and interactive components in Invento.

## Steps

1. **Check design tokens & Next.js 16 conventions**
   - Read [DESIGN.md](../../../DESIGN.md) and [globals.css](../../../app/globals.css).
   - Check `node_modules/next/dist/docs/` before using Next.js 16 routing, caching, or server/client APIs.
2. **Build with light/dark mode & mobile responsiveness**
   - Use Geist design tokens from `app/globals.css` so every surface, border, badge, and text color renders cleanly in both light and dark themes.
   - Disable submit buttons while server actions are pending (`isPending` / loading state).
   - Remember [proxy.ts](../../../proxy.ts) automatically protects all routes except `/login` and `/api/auth/*`.
3. **Update navigation when adding a route**
   - Add the route to both the desktop top navigation and the mobile bottom bar / "More" drawer in [Navbar.tsx](../../../components/Navbar.tsx).
   - Do **not** add legacy `/batch-production` to navigation (`/batch-production-v2` is active).
4. **Sync docs & verify**
   - Update route tables and directory listings in [README.md](../../../README.md) and [architecture.md](../../../docs/architecture.md) (and [PRD.md](../../../docs/PRD.md) if adding a feature module).
   - Run `bun run typecheck`, `bun test`, `bun run build`, and `bunx eslint` on modified files.

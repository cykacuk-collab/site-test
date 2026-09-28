# BRIEFING — 2026-09-28T04:41:00Z

## Mission
Extract, specify, and inventory all requirements, acceptance criteria, constraints, and testable specifications for the Admin Dashboard (`/admin`) for "Histoire et Saveurs".

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: Requirements & Spec Miner (spec_miner_survey_3)
- Working directory: c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\spec_miner_survey_3
- Original parent: 597955d9-96e6-4e46-b1d5-0fbd100d9801
- Milestone: Admin Dashboard Specification Mining

## 🔒 Key Constraints
- Do NOT implement anything — read-only mining and specification role.
- Prioritize authoritative sources (codebase, database schema, existing middleware/routes/pages) over prior knowledge.
- Must document all assigned features (R1: Products/Inventory, R2: Orders/Fulfillment, R3: Sales Analytics, Security/Access) plus any discovered related features.
- Full edge cases, validation rules, error handling, opaque-box E2E test cases, and unit/integration verification specifications.
- Write handoff report to `handoff.md` following the 5-component format.
- Output metadata only in `.agents/teamwork/spec_miner_survey_3/`.

## Current Parent
- Conversation ID: 597955d9-96e6-4e46-b1d5-0fbd100d9801
- Updated: 2026-09-28T04:41:00Z

## Task Summary
- **What to build**: Specification inventory and test matrix for Nuxt 3 Admin Dashboard (`/admin`).
- **Success criteria**: Comprehensive feature matrix, edge cases, validation rules, RLS/auth considerations, charting library specs, and E2E/unit verification test plan written in `handoff.md`.
- **Interface contracts**: Supabase schema (`products`, `orders`, `order_items`, storage `product_images`), Nuxt auth middleware (`app/middleware/admin.ts`, `server/middleware/adminGuard.ts`), Nitro server routes / Supabase client.
- **Code layout**: Nuxt 4 directory structure (`app/`, `server/`).

## Key Decisions Made
- Confirmed database empirical state: `products` table has 2 active items; `orders` and `order_items` return 42501 (insufficient_privilege) because table-level GRANTs were never executed for `authenticated` / `service_role`.
- Identified status constraint discrepancy: DB schema currently checks `status IN ('pending', 'paid', 'expired', 'fulfilled', 'cancelled')`. The requirement specifies transitions across `pending`, `processing`, `shipped`, `delivered`, `cancelled`. A schema migration updating `orders_status_check` constraint is specified.
- Identified foreign key delete trap: `order_items` references `products(id)` without CASCADE. Hard-deleting ordered products causes code 23503 `foreign_key_violation`. Soft-delete (`is_active = false`) specified.
- Identified SSR Chart hydration pitfall: Charts accessing Canvas/DOM must be wrapped in `<ClientOnly>` with skeleton fallback to prevent hydration mismatch.
- Identified Nitro server middleware behavior: `server/middleware/adminGuard.ts` throws 403 instead of clean redirect to `/admin/login`.

## Artifact Index
- `DISPATCH.md` — Dispatch prompt and assignment.
- `BRIEFING.md` — Situational awareness and working memory.
- `progress.md` — Heartbeat and step tracking.
- `supabase_skill.md` — Local copy of supabase skill reference.
- `supabase_postgres_best_practices_skill.md` — Local copy of postgres best practices reference.
- `handoff.md` — Comprehensive specification mining report.

## Loaded Skills
- **Source**: `c:\Users\Peli911GT\Desktop\site ma\.agents\skills\supabase\SKILL.md`
  - **Local copy**: `c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\spec_miner_survey_3\supabase_skill.md`
  - **Core methodology**: Safe Supabase integration, client/server distinction, RLS security policies, storage permissions, and migration workflows.
- **Source**: `c:\Users\Peli911GT\Desktop\site ma\.agents\skills\supabase-postgres-best-practices\SKILL.md`
  - **Local copy**: `c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\spec_miner_survey_3\supabase_postgres_best_practices_skill.md`
  - **Core methodology**: Postgres performance, schema design, security and RLS rules, indexing, connection pooling, and data access patterns.

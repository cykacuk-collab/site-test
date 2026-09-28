## 2026-09-28T04:42:20Z

You are worker_m1 (Milestone 1 Implementation Worker).
Your working directory is: c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\worker_m1
Project root is: c:\Users\Peli911GT\Desktop\site ma

First, read the original user request and architectural findings:
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\Peli911GT\Desktop\site ma\PROJECT.md
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\explorer_survey_1\handoff.md
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\explorer_survey_2\handoff.md
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\spec_miner_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive write ownership:
- package.json
- app/layouts/admin.vue
- app/pages/admin/products.vue
- server/middleware/adminGuard.ts
- Any product helper components in app/components/admin/

Mission:
1. Install charting dependencies: `npm install chart.js vue-chartjs`.
2. Implement `app/layouts/admin.vue`:
   - Dedicated administrative shell layout.
   - Header with brand colors (#555B56, #E8DDCC, #EDF6ED, #faf9f6) and frosted glass effect (`.glass-panel`).
   - Navigation links/tabs: "Vue d'ensemble" (/admin), "Produits & Stocks" (/admin/products), "Commandes" (/admin/orders).
   - "Voir la boutique" link to `/`.
   - Admin profile pill showing user email and admin badge.
   - Logout button ("Déconnexion") that calls Supabase `auth.signOut()` and navigates to `/admin/login`.
3. Update `server/middleware/adminGuard.ts`:
   - Intercept `/admin*` and `/api/admin*` (except `/admin/login`).
   - If unauthenticated, redirect with 302 to `/admin/login` (instead of unhandled 403 error page).
   - Support development mode matching `app/middleware/admin.ts` (`if (process.dev) return`).
4. Implement `app/pages/admin/products.vue` (Product & Inventory Management - Requirement R1):
   - Uses `layout: 'admin'`, `middleware: ['admin']`.
   - Search input (real-time filtering by name_fr, name_en, or reference_code).
   - Category filter (Toutes, Sucrée, Salée).
   - Stock filter (Tous, En stock, Stock bas, Rupture).
   - Active status filter (Tous, Actifs, Inactifs).
   - Product table: Thumbnail (with fallback icon), Name (FR & EN), SKU, Category, Price ($ CAD), Stock badge, Active badge, Actions.
   - Quick stock adjustment controls: buttons (+1, -1, +5, -5) or direct count input that updates Supabase database immediately, enforcing stock >= 0.
   - Add Product Modal: clean validation, name_fr, name_en, category ('sweet'|'savory'), price, stock, reference_code, descriptions, image file upload to Supabase bucket `product_images` with UUID filename.
   - Edit Product Modal: prefilled with existing product data, image upload/replacement.
   - Delete Confirmation Modal: handles deletion gracefully. If foreign key error (23503) occurs because product was ordered in existing orders, catches error and offers one-click deactivation (`is_active = false`).
5. Run build verification:
   `npm run build`
   Confirm 0 errors and output build artifacts.
6. Write your handoff report to:
   c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\worker_m1\handoff.md
   Include all modified files, build results, and verification steps.

Update your progress.md periodically.
When done, notify the orchestrator (conversation ID: 597955d9-96e6-4e46-b1d5-0fbd100d9801) via send_message.

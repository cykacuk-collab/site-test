## 2026-09-28T04:59:28Z

<USER_REQUEST>
You are worker_m2 (Milestone 2 Implementation Worker).
Your working directory is: c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\worker_m2
Project root is: c:\Users\Peli911GT\Desktop\site ma

First, read the original request and specifications:
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Users\Peli911GT\Desktop\site ma\PROJECT.md
- c:\Users\Peli911GT\Desktop\site ma\TEST_INFRA.md
- c:\Users\Peli911GT\Desktop\site ma\TEST_READY.md
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\explorer_survey_1\handoff.md
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\explorer_survey_2\handoff.md
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\spec_miner_survey_3\handoff.md
- c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\worker_m1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive write ownership:
- server/api/admin/orders/index.get.ts
- server/api/admin/orders/[id].patch.ts
- server/api/admin/analytics.get.ts
- app/components/admin/SalesChart.client.vue
- app/pages/admin/index.vue
- app/pages/admin/orders.vue

Mission:
Implement Milestone 2: Order Fulfillment (R2) and Sales Analytics (R3).

1. Server Endpoints:
   - `server/api/admin/orders/index.get.ts`:
     - Verify admin authentication or development mode (`if (process.dev) ...`).
     - Query `orders` joined with `order_items` and `products` using `serverSupabaseServiceRole(event)` to bypass RLS lockdown cleanly without 42501 permission errors.
     - Return `{ orders: [...] }`.
   - `server/api/admin/orders/[id].patch.ts`:
     - Verify admin authentication or development mode.
     - Validate `status` in `['paid', 'processing', 'shipped', 'delivered', 'fulfilled', 'cancelled']`.
     - Update order record using `serverSupabaseServiceRole(event)`.
     - Return `{ success: true, order: ... }`.
   - `server/api/admin/analytics.get.ts`:
     - Compute Total Revenue, Total Orders, Average Order Value (AOV with 0-order guard), Active Catalog Products count, Top-Selling Products leaderboard, and daily revenue trend.
     - Use `serverSupabaseServiceRole(event)`.

2. Sales Analytics Dashboard Overview (`app/pages/admin/index.vue`):
   - Replace legacy product prototype with complete executive analytics overview.
   - Declared with `layout: 'admin'`, `middleware: ['admin']`.
   - 4 KPI metric cards:
     - Total Revenue ($ CAD)
     - Total Orders
     - Average Order Value ($ CAD)
     - Active Products in Catalog
   - Visual Chart:
     - Create `app/components/admin/SalesChart.client.vue` using `chart.js` and `vue-chartjs`.
     - Register ChartJS components properly.
     - Wrap in `<ClientOnly>` with a clean fallback skeleton placeholder to guarantee ZERO SSR hydration errors.
   - Top-Selling Products leaderboard table with thumbnails and fallback icons.
   - Recent Orders snapshot table with status badges and links to `/admin/orders`.
   - Zero-order resilience (renders $0.00 CAD and empty messages without dividing by zero or throwing runtime exceptions).

3. Order Fulfillment Management (`app/pages/admin/orders.vue`):
   - Declared with `layout: 'admin'`, `middleware: ['admin']`.
   - Header with search (customer name, email, Stripe session ID) and status filter tabs/dropdown (`all`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`).
   - Orders Table: Stripe Session ID, Order Date, Customer Name/Email, Total CAD, Status Badge, Inspect button.
   - Customer & Cart Details Modal / Drawer:
     - Customer details (name, email, guest status if null, Stripe ID).
     - Itemized cart line items (thumbnail with fallback, name FR/EN, SKU, quantity, unit price, total).
     - Financial summary.
   - Order Status Transition:
     - Dropdown / button group to update status (`processing`, `shipped`, `delivered`, `cancelled`).
     - Calls `PATCH /api/admin/orders/[id]` via server API route.
     - Shows loading indicator and toast notification on success.
     - Updates order state in UI immediately without RLS errors.

4. Build & Test Verification:
   - Run `npm run build` -> confirm exit code 0.
   - Run `npm test` or `node tests/runner.mjs` -> confirm all 117 tests pass with exit code 0.

5. Write detailed handoff report to:
   c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\worker_m2\handoff.md

Update your progress.md periodically.
When done, notify the orchestrator (conversation ID: 597955d9-96e6-4e46-b1d5-0fbd100d9801) via send_message.
</USER_REQUEST>

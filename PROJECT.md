# Project: Admin Dashboard for Histoire et Saveurs

## Architecture
- **Framework**: Nuxt 3 / 4 (`compatibilityVersion: 4`), Vue 3, Tailwind CSS, `@nuxtjs/supabase`.
- **Directory Layout**: All frontend code lives in `app/` (`app/layouts/`, `app/pages/admin/`, `app/components/admin/`, `app/middleware/`).
- **Backend**: Nitro server endpoints in `server/api/admin/` and middleware in `server/middleware/adminGuard.ts`.
- **Database**: Supabase PostgreSQL (`products`, `orders`, `order_items`, `product_images` storage bucket).
- **Authentication**: Supabase Auth with admin role verified via `app_metadata.role === 'admin'`.
- **RLS Policy**: Direct client mutations on `orders` are blocked by `rls_lockdown.sql`. All order status updates are routed through authenticated Nitro server endpoints utilizing `serverSupabaseServiceRole(event)` to prevent 42501 permission errors.
- **SSR Hydration Safety**: Charting implemented with `chart.js` and `vue-chartjs`, strictly encapsulated in client-only components (`SalesChart.client.vue`) wrapped with `<ClientOnly>` and skeleton loaders to eliminate hydration mismatches.

## Code Layout
- `app/layouts/admin.vue`: Administrative shell layout with top header, navigation tabs (Vue d'ensemble, Produits & Stocks, Commandes), store link, admin profile badge, and logout.
- `app/pages/admin/index.vue`: Sales Analytics overview page (KPI metric cards, SalesChart client component, top-selling items leaderboard, recent orders snapshot).
- `app/pages/admin/products.vue`: Product & Inventory Management page (table, real-time search & filters, quick stock adjust, add/edit modal, Supabase image upload, delete confirmation with foreign key deactivation fallback).
- `app/pages/admin/orders.vue`: Order Fulfillment page (order list, status filters, customer details drawer, cart items breakdown, status transition controls).
- `app/components/admin/SalesChart.client.vue`: Client-only Vue-ChartJS component for sales trends.
- `server/api/admin/orders/index.get.ts`: Fetches paid/all orders with joined order items and products via service role.
- `server/api/admin/orders/[id].patch.ts`: Updates order fulfillment status securely with status validation.
- `server/api/admin/analytics.get.ts`: Aggregates total revenue, order count, AOV, and top-selling items.
- `server/middleware/adminGuard.ts`: Guards `/admin/*` and `/api/admin/*`, redirecting unauthenticated users to `/admin/login`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Route Auth Guard | Blocks unauthenticated/non-admin users from `/admin/*` and `/api/admin/*` | M1 | Survey |
| 2 | Admin Login & Turnstile | Authenticates administrator with email/password and Turnstile | M1 | Survey |
| 3 | Admin Session Logout | Destroys admin session and redirects to `/admin/login` | M1 | Survey |
| 4 | Admin Layout & Tabs | Dedicated administrative layout with navigation tabs and branding | M1 | Survey |
| 5 | Charting Library Setup | Install `chart.js` and `vue-chartjs` dependencies | M1 | Survey |
| 6 | Product Catalog Table | Displays products with thumbnail, SKU, name, price, stock, active status | M1 | Survey |
| 7 | Catalog Filters & Search | Real-time filtering by search query, category, and stock level | M1 | Survey |
| 8 | Add Product Form & Modal | Form to create a new product item with validation | M1 | Survey |
| 9 | Edit Product Form & Modal | Prefills existing product details for modification | M1 | Survey |
| 10 | Stock Quick Adjust | Direct buttons `+1`, `-1`, `+5`, `-5` enforcing non-negative stock | M1 | Survey |
| 11 | Product Image Upload | Uploads image to Supabase `product_images` bucket with UUID | M1 | Survey |
| 12 | Delete / Deactivate Product | Deletes product or deactivates (`is_active = false`) if order history exists | M1 | Survey |
| 13 | Orders Fetch API | Nitro server endpoint fetching orders with joined `order_items` via service role | M2 | Survey |
| 14 | Order Status Update API | Nitro server endpoint updating status (`paid`, `processing`, `shipped`, `delivered`, `cancelled`) | M2 | Survey |
| 15 | Paid Orders List UI | Table showing paid Stripe orders, customer details, totals, and status badges | M2 | Survey |
| 16 | Order Customer & Cart Details | Modal/drawer displaying customer info, Stripe ID, and itemized cart items | M2 | Survey |
| 17 | Order Status Transition UI | Status dropdown allowing admin to update fulfillment status without RLS errors | M2 | Survey |
| 18 | Analytics Aggregation API | Server endpoint calculating total revenue, total orders, AOV, top products | M2 | Survey |
| 19 | Sales Analytics Dashboard & Chart | KPI cards, Top-selling items, and `<ClientOnly>` Chart.js with 0 SSR hydration errors | M2 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Core Admin Infrastructure & Product Management (R1) | Admin layout, route security, chart dependencies, and full Product & Inventory Management UI | none | DONE |
| 2 | Order Fulfillment & Sales Analytics (R2 & R3) | Server APIs, Order Fulfillment UI with cart breakdown & status update, and Sales Analytics Dashboard with SSR-safe Chart.js | M1 | DONE |
| 3 | E2E Test Suite Pass & Adversarial Hardening | Pass 100% of E2E tests (Tiers 1-4) and adversarial verification (Tier 5) | M1, M2 | DONE |

## Interface Contracts
### `server/api/admin/orders/index.get.ts`
- **Auth**: Requires authenticated user with `app_metadata.role === 'admin'` (or dev bypass).
- **Response**: `{ orders: Array<{ id, stripe_session_id, customer_email, customer_name, amount_total_cents, status, created_at, updated_at, order_items: Array<{ id, quantity, price_at_purchase_cents, product: { id, name_fr, name_en, image_url, reference_code } }> }> }`

### `server/api/admin/orders/[id].patch.ts`
- **Request Body**: `{ status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'fulfilled' | 'cancelled' }`
- **Response**: `{ success: true, order: OrderRecord }`
- **Error**: 400 for invalid status, 401 for unauthorized, 403 for non-admin, 500 for database error.

### `server/api/admin/analytics.get.ts`
- **Response**:
  ```json
  {
    "totalRevenueCents": 125000,
    "totalOrders": 15,
    "averageOrderValueCents": 8333,
    "activeProductsCount": 8,
    "topProducts": [
      { "id": "uuid", "name_fr": "Tartelette...", "unitsSold": 45, "revenueCents": 22500 }
    ],
    "revenueByDay": [
      { "date": "2026-09-20", "revenueCents": 15000 }
    ]
  }
  ```

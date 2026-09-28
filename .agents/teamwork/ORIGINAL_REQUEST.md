# Original User Request

## 2026-09-28T04:32:29Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

Build a comprehensive Admin Dashboard (`/admin`) for the Nuxt 3 "Histoire et Saveurs" e-commerce site to handle real business operations.

Working directory: c:/Users/Peli911GT/Desktop/site ma
Integrity mode: development

## Requirements

### R1. Product & Inventory Management
The dashboard must include a dedicated section to view, add, edit, and delete products. It must interface with the existing Supabase `products` table and allow for stock adjustments and image uploads.

### R2. Order Fulfillment
The dashboard must include an order management section that displays paid Stripe orders from the `orders` table. Admins should be able to view customer details, see the cart items, and update the fulfillment status of the order.

### R3. Sales Analytics
The main overview page of the dashboard must display high-level business metrics, such as total revenue and top-selling items, utilizing a standard Vue charting library.

## Acceptance Criteria

### Security & Access
- [ ] All new `/admin/*` routes are protected by the existing authentication middleware so public users cannot access them.

### Functional Operations
- [ ] A new product can be successfully created via the UI and verified to exist in the Supabase database.
- [ ] An existing order's status can be updated via the UI and successfully saved to the database without RLS permission errors.
- [ ] The analytics page successfully mounts and renders at least one visual chart without throwing SSR hydration errors.

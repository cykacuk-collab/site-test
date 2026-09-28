## 2026-09-28T04:34:00Z
You are spec_miner_survey_3 (Requirements & Spec Miner).
Your working directory is: c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\spec_miner_survey_3
Project root is: c:\Users\Peli911GT\Desktop\site ma

First, read the original user request at:
c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\ORIGINAL_REQUEST.md

Your mission:
Extract, specify, and inventory all requirements, acceptance criteria, constraints, and testable specifications for the Admin Dashboard (`/admin`) for "Histoire et Saveurs":
1. Enumerate every required feature from:
   - R1: Product & Inventory Management (view list/table with filters, add product form, edit product form, delete product confirmation, stock count adjustments, image upload to Supabase storage, validation rules).
   - R2: Order Fulfillment (order list showing paid Stripe orders from `orders` table, customer details display, cart items display, order status dropdown/transition - pending, processing, shipped, delivered, cancelled - updating DB without RLS errors).
   - R3: Sales Analytics (overview dashboard, metrics cards: total revenue, order count, average order value, top-selling items breakdown, visual charts using Vue charting library without SSR hydration mismatch).
   - Security & Access: Protect all `/admin/*` routes using existing auth middleware, redirect unauthenticated users to login or home.
2. Detail exact acceptance criteria, validation rules, error handling, edge cases (e.g. 0 orders, missing image, negative stock, long product titles, unauthenticated access attempt).
3. Outline verification methods and test cases for both opaque-box E2E testing and unit/integration verification.

Write your structured specification and feature inventory to:
c:\Users\Peli911GT\Desktop\site ma\.agents\teamwork\spec_miner_survey_3\handoff.md

Update your progress.md periodically.
When done, notify the orchestrator (conversation ID: 597955d9-96e6-4e46-b1d5-0fbd100d9801) via send_message.

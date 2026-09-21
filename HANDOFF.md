# AI Session Handoff: Histoire et Saveurs

**Target Context:** E-commerce platform for an artisanal pastry business in Quebec. 
**Current Status:** Production-Ready (Phase 6 Complete). The repository was just pushed to GitHub.

## 🏗️ Architecture Blueprint

### 1. The Stack
- **Frontend**: Nuxt 3 + Vue 3 + Tailwind CSS.
- **Backend API**: Nuxt Nitro (`server/api/*`).
- **Database / Auth**: Supabase (PostgreSQL with strict RLS).
- **Payments**: Stripe Checkout.
- **Security**: Cloudflare Turnstile (Captcha).
- **Email**: Resend.

### 2. The Engine (Atomic Checkout)
This project uses an enterprise-grade transactional checkout flow to prevent deadlocks and overselling:
- **`checkout.post.ts`**: Validates Turnstile -> Calls `process_cart_lock` (Postgres RPC) to atomically lock inventory -> Generates Stripe Session (injecting `db_id` into line item metadata) -> Atomically releases inventory via `release_cart_lock` if Stripe API crashes.
- **`webhook.post.ts`**: Uses a database-first lock (`INSERT INTO webhook_events`) for 100% idempotency against Stripe retries. Fetches authoritative line items directly from Stripe. Processes `checkout.session.completed` (sends Resend email) or `checkout.session.expired` (calls `release_cart_lock` to return items to stock).

### 3. The Design (Glass-Ladurée Theme)
The UI blends a Parisian pastry aesthetic (Ladurée) with modern Glassmorphism.
- **Colors**: Mint (`#EDF6ED`), Warm Sand (`#E8DDCC`), Beige (`#faf9f6`), Primary Charcoal (`#555B56`).
- **Styles**: `app/layouts/default.vue` injects a `.glass-bg` mesh gradient and a `.glass-panel` frosted glass utility class. These are applied to the Navbar, Product Cards, and the Slide-over Cart.

### 4. Security & Compliance
- **RLS**: Customer tables (`orders`, `order_items`, `webhook_events`) are strictly locked to `service_role` and `admin` via Row Level Security.
- **Loi 25 (Quebec)**: Fully compliant. Features a strict default-denial Cookie Banner (`CookieBanner.vue`) and a bilingual `/privacy` page requiring explicit Privacy Officer (DPO) contact details.

## 🚦 Future Agent Instructions
If you are an AI picking up this codebase in a new session:
1. **Do not modify the checkout or webhook architecture** without explicit instruction. It has been rigorously hardened against race conditions and Node memory limits.
2. The UI relies heavily on the `.glass-panel` CSS class located in `default.vue`. Maintain this aesthetic for new components.
3. The only B2B route is `/b2b` (a Turnstile-protected contact form). Self-serve B2B login was explicitly abandoned.
4. If deploying to Vercel, ensure the Vercel URL is whitelisted in the Cloudflare Turnstile dashboard, and that Cloudflare DNS is set to "DNS Only" (Grey Cloud) to allow Vercel SSL generation.

## 📝 Pending Business Tasks (Placeholders)
- Replace `[À COMPLÉTER]` in `Footer.vue` with the official MAPAQ Permit number.
- Replace `[NOM DU RESPONSABLE À COMPLÉTER]` in `privacy.vue` with the actual Privacy Officer details.
- Swap the placeholder Unsplash images in the Supabase `products` table with final client photography.

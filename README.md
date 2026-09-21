# Histoire et Saveurs - E-Commerce Platform

A production-ready e-commerce platform for an artisanal pastry business in Quebec, built with a modern Server-Side Rendered (SSR) stack.

## 🚀 Tech Stack

- **Framework:** [Nuxt 3](https://nuxt.com/) (Vue.js)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom Glassmorphism/Ladurée theme
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL with RLS)
- **Payments:** [Stripe Checkout](https://stripe.com/)
- **Security:** [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
- **Emails:** [Resend](https://resend.com/)

## ✨ Key Features

- **Atomic Inventory Locks:** Uses PostgreSQL RPCs (`process_cart_lock`, `release_cart_lock`) to prevent race conditions and overselling during checkout.
- **Idempotent Webhooks:** Database-level uniqueness constraints prevent duplicate Stripe webhook processing.
- **Law 25 Compliant:** Strict default-denial cookie consent banner and integrated Privacy Officer details.
- **Bilingual Support:** Fully localized (EN/FR) via `@nuxtjs/i18n`.
- **Glassmorphism UI:** Custom CSS mesh gradients and frosted glass panels.

## 🛠️ Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/your-username/histoire-et-saveurs.git
cd histoire-et-saveurs
npm install
```

### 2. Environment Variables
Copy the template to your local environment file:
```bash
cp .env.example .env
```
Fill in all the required API keys (Stripe, Supabase, Turnstile, Resend).

### 3. Database Setup (Supabase)
Run the SQL migrations located in your Supabase SQL Editor to initialize the schema:
1. Initialize the tables (`products`, `orders`, `order_items`, `webhook_events`).
2. Run the `atomic_migrations.sql` logic to create the locking functions.
3. Run the `rls_lockdown.sql` to strictly secure customer data.

*(Note: See `.agents/skills` or internal documentation for exact SQL schemas if not in source control).*

### 4. Run Development Server
```bash
npm run dev
```
The site will be available at `http://localhost:3000`.

## 🔒 Deployment
This project is optimized for deployment on **Vercel**. 
Make sure your Vercel project environment variables match your `.env`, and configure your domain on Vercel using Cloudflare with **DNS Only (Grey Cloud)** to allow Vercel to issue SSL certificates.

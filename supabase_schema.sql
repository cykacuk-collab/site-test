-- ==========================================================================================
-- SUPABASE SCHEMA & RLS POLICIES FOR HISTOIRE ET SAVEURS
-- ==========================================================================================

-- 1. UTILITY FUNCTION: RBAC Admin Check
-- This function securely checks the user's app_metadata JWT claim for the 'admin' role.
-- Crucially, app_metadata cannot be edited by the client (unlike user_metadata).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', 
    ''
  ) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 2. PRODUCTS TABLE
-- ==========================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), -- Critical: Constraint prevents negative stock
    image_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('sweet', 'savory')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Public profiles can view active products" 
ON public.products FOR SELECT 
USING (is_active = true);

-- Admins can view and manage all products
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.is_admin());


-- ==========================================
-- 3. ORDERS TABLE
-- ==========================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- Nullable for guest checkouts
    stripe_session_id TEXT UNIQUE NOT NULL,
    customer_email TEXT NOT NULL,
    amount_total_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'expired', 'fulfilled', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view and manage all orders
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.is_admin());

-- The Nuxt backend (Service Role) handles inserts and status updates based on Stripe webhooks.
-- Service Role bypasses RLS automatically.


-- ==========================================
-- 4. ORDER ITEMS TABLE
-- ==========================================
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own order items
CREATE POLICY "Users can view their own order items" 
ON public.order_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
);

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.is_admin());


-- ==========================================
-- 5. WEBHOOK EVENTS TABLE (IDEMPOTENCY)
-- ==========================================
-- This table is strictly used by the backend to prevent duplicate processing of Stripe webhooks.
CREATE TABLE public.webhook_events (
    stripe_event_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Webhook Events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No public policies. Only the Service Role (Nuxt Backend) can read/write this table.


-- ==========================================
-- 6. STORAGE BUCKET: PRODUCT IMAGES
-- ==========================================
-- Assuming you create a bucket named 'product_images' in the dashboard.
-- Policies for the storage.objects table:

-- (Note: Run these only after the 'product_images' bucket is created)
/*
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product_images' );

CREATE POLICY "Admin Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product_images' AND public.is_admin() );

CREATE POLICY "Admin Deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product_images' AND public.is_admin() );
*/

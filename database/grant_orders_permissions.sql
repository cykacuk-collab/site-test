-- ==============================================================================
-- Grant Table Privileges on Orders and Order Items
-- ==============================================================================
-- Fixes PostgreSQL error 42501 (permission denied for table orders / order_items)
--
-- Context:
-- In PostgreSQL, table-level grants (DCL) are required before Row Level Security
-- (RLS) policies can be evaluated. When service_role queries public.orders or
-- public.order_items via PostgREST / Supabase Client without table grants,
-- PostgreSQL rejects the query with error code 42501.
--
-- This script grants full table-level privileges on public.orders and
-- public.order_items to service_role and authenticated roles.
-- ==============================================================================

-- 1. Grant table permissions to service_role and authenticated
GRANT ALL ON TABLE public.orders TO service_role, authenticated;
GRANT ALL ON TABLE public.order_items TO service_role, authenticated;

-- 2. Grant sequence usage in schema public (for serial / identity columns if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

-- 3. Confirm RLS remains active
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Ensure Service Role bypass / full management policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Service role manages orders'
    ) THEN
        CREATE POLICY "Service role manages orders" ON public.orders
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' AND policyname = 'Service role manages order items'
    ) THEN
        CREATE POLICY "Service role manages order items" ON public.order_items
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

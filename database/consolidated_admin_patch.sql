-- ==============================================================================
-- HISTOIRE ET SAVEURS — CONSOLIDATED ADMIN DATABASE REMEDIATION SCRIPT
-- File: database/consolidated_admin_patch.sql
-- Description: Idempotent DDL and DCL patch to grant table permissions, update
--              status constraints, configure RLS policies, and install admin RPC.
-- Application instructions:
--   Execute this script in the Supabase Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/nzrooalbzeparcklxitz/sql/new
-- ==============================================================================

-- 1. Ensure customer_name column exists on public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 2. Drop and recreate orders_status_check constraint to permit all 8 lifecycle statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'fulfilled', 'cancelled', 'expired'));

-- 3. Grant PostgreSQL table privileges to service_role and authenticated
-- Resolves PostgreSQL error 42501 (permission denied for table orders / order_items)
GRANT ALL ON TABLE public.orders TO service_role, authenticated;
GRANT ALL ON TABLE public.order_items TO service_role, authenticated;

-- 4. Grant sequence usage and select in schema public
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;

-- 5. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 6. Ensure Service Role management RLS policies exist
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

-- 7. Create admin_update_order_status SECURITY DEFINER RPC function for direct status update bypass
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
    p_order_id UUID,
    p_status TEXT
)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate status against allowed admin statuses
    IF p_status NOT IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'fulfilled', 'cancelled', 'expired') THEN
        RAISE EXCEPTION 'Invalid order status: %', p_status USING ERRCODE = '23514';
    END IF;

    RETURN QUERY
    UPDATE public.orders
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_order_id
    RETURNING *;
END;
$$;

-- Secure the RPC function: revoke from public/anon, grant to service_role and authenticated
REVOKE EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT) TO service_role, authenticated;

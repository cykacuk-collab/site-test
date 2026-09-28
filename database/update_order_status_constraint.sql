-- Migration: Update orders.status Check Constraint
-- Description: Expands the orders_status_check constraint to include all valid fulfillment statuses
-- used by the Admin Dashboard: ('pending', 'paid', 'processing', 'shipped', 'delivered', 'fulfilled', 'cancelled', 'expired').

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'fulfilled', 'cancelled', 'expired'));

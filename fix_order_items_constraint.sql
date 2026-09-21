-- Add check constraint to order_items to prevent negative prices
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_price_at_purchase_cents_check 
CHECK (price_at_purchase_cents >= 0);

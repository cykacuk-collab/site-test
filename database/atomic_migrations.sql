-- 1. Create Atomic Cart Lock Function (Prevents overselling and partial crashes)
CREATE OR REPLACE FUNCTION process_cart_lock(cart_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    item RECORD;
    v_stock INT;
BEGIN
    -- Iterate through each item in the JSONB array
    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INT)
    LOOP
        -- Sanity check: prevent negative or zero quantities
        IF item.quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity: %', item.quantity;
        END IF;

        -- Lock the row for concurrent transactions
        SELECT stock INTO v_stock FROM products WHERE id = item.id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', item.id;
        END IF;

        -- Check if enough stock exists
        IF v_stock < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product: %', item.id;
        END IF;

        -- Decrement the stock
        UPDATE products SET stock = stock - item.quantity WHERE id = item.id;
    END LOOP;
END;
$$;

-- 2. Create Atomic Cart Release Function (For checkout.session.expired webhooks)
CREATE OR REPLACE FUNCTION release_cart_lock(cart_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INT)
    LOOP
        -- Safely return the locked inventory back to the store
        UPDATE products SET stock = stock + item.quantity WHERE id = item.id;
    END LOOP;
END;
$$;

-- 3. Webhook Idempotency Upgrades
-- Ensure stripe_event_id is strictly unique at the database level to prevent race conditions
ALTER TABLE webhook_events ADD CONSTRAINT unique_stripe_event_id UNIQUE (stripe_event_id);

-- Add a status tracking column to handle partial crashes
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing';

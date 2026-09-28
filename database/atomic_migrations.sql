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
    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INT) ORDER BY id
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

-- 4. Atomic Order Transaction
CREATE OR REPLACE FUNCTION process_order_transaction(
    p_session_id TEXT,
    p_email TEXT,
    p_name TEXT,
    p_amount INT,
    p_cart_id UUID,
    p_items JSONB,
    p_stripe_event_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    item RECORD;
BEGIN
    -- Insert the order
    INSERT INTO orders (stripe_session_id, customer_email, customer_name, amount_total_cents, status)
    VALUES (p_session_id, p_email, p_name, p_amount, 'paid')
    RETURNING id INTO v_order_id;

    -- Insert order items
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, price_cents INT)
    LOOP
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase_cents)
        VALUES (v_order_id, item.product_id, item.quantity, item.price_cents);
    END LOOP;

    -- Mark webhook event as completed
    UPDATE webhook_events SET status = 'completed' WHERE stripe_event_id = p_stripe_event_id;
END;
$$;

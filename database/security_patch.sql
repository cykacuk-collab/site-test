-- VULN-02: Add missing customer_name to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- VULN-04: Fix search_path on SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role', 
    ''
  ) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- VULN-06 & 03: Redefine process_cart_lock and release_cart_lock
CREATE OR REPLACE FUNCTION process_cart_lock(cart_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    item RECORD;
    v_stock INT;
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INT) ORDER BY id
    LOOP
        IF item.quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity';
        END IF;

        SELECT stock INTO v_stock FROM products WHERE id = item.id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', item.id;
        END IF;

        IF v_stock < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product: %', item.id;
        END IF;

        UPDATE products SET stock = stock - item.quantity WHERE id = item.id;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION release_cart_lock(cart_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INT) ORDER BY id
    LOOP
        IF item.quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity';
        END IF;

        UPDATE products SET stock = stock + item.quantity WHERE id = item.id;
    END LOOP;
END;
$$;

-- VULN-02: Atomic Order Transaction (Ensure it exists before revoking)
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
    INSERT INTO orders (stripe_session_id, customer_email, customer_name, amount_total_cents, status)
    VALUES (p_session_id, p_email, p_name, p_amount, 'paid')
    RETURNING id INTO v_order_id;

    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, price_cents INT)
    LOOP
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase_cents)
        VALUES (v_order_id, item.product_id, item.quantity, item.price_cents);
    END LOOP;

    UPDATE webhook_events SET status = 'completed' WHERE stripe_event_id = p_stripe_event_id;
END;
$$;

-- Create increment_stock if it was deleted or never run
CREATE OR REPLACE FUNCTION increment_stock(p_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  UPDATE public.products SET stock = stock + p_amount WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- VULN-03: Revoke and Grant EXECUTE on RPC Functions
REVOKE EXECUTE ON FUNCTION process_cart_lock(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION release_cart_lock(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION process_order_transaction(TEXT, TEXT, TEXT, INT, UUID, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_stock(UUID, INT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION process_cart_lock(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION release_cart_lock(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION process_order_transaction(TEXT, TEXT, TEXT, INT, UUID, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INT) TO service_role;

-- VULN-08: Storage Policies and MIME Types
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product_images' );

DROP POLICY IF EXISTS "Admin Uploads" ON storage.objects;
CREATE POLICY "Admin Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product_images' AND public.is_admin() );

DROP POLICY IF EXISTS "Admin Deletes" ON storage.objects;
CREATE POLICY "Admin Deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product_images' AND public.is_admin() );

UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'] 
WHERE id = 'product_images';

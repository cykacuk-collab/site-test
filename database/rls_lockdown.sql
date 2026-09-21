-- Enable RLS on sensitive tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- 1. Orders
-- Only admins can read all orders
CREATE POLICY "Admins can view all orders" ON orders
FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Nobody can insert/update/delete from the client. Only service_role can do this via server routes.
CREATE POLICY "Service role manages orders" ON orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Order Items
-- Only admins can view order items
CREATE POLICY "Admins can view all order items" ON order_items
FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Nobody can insert/update/delete from the client.
CREATE POLICY "Service role manages order items" ON order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Webhook Events
-- Ensure webhook_events is entirely locked from public
CREATE POLICY "Service role manages webhook events" ON webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

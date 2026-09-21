CREATE OR REPLACE FUNCTION increment_stock(p_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = stock + p_amount
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

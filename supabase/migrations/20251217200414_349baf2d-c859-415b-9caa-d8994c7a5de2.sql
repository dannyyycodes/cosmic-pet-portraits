-- Drop the permissive INSERT policy on order_items
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Create restrictive policy - only service role can insert order items
CREATE POLICY "Service role only for order items"
ON public.order_items
FOR ALL
USING (false)
WITH CHECK (false);
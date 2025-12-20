-- Fix broken RLS policies that have USING/WITH CHECK set to false instead of service_role check

-- Fix affiliate_referrals
DROP POLICY IF EXISTS "Service role only for referrals" ON public.affiliate_referrals;
CREATE POLICY "Service role only for referrals"
ON public.affiliate_referrals
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix order_items
DROP POLICY IF EXISTS "Service role only for order items" ON public.order_items;
CREATE POLICY "Service role only for order items"
ON public.order_items
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix admin_sessions
DROP POLICY IF EXISTS "Service role only for admin sessions" ON public.admin_sessions;
CREATE POLICY "Service role only for admin sessions"
ON public.admin_sessions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix admin_users
DROP POLICY IF EXISTS "Service role only for admin_users" ON public.admin_users;
CREATE POLICY "Service role only for admin_users"
ON public.admin_users
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix affiliates policy name to be clearer (currently blocks all but name is misleading)
DROP POLICY IF EXISTS "Public can lookup affiliate by referral code" ON public.affiliates;
CREATE POLICY "Service role only for affiliates"
ON public.affiliates
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
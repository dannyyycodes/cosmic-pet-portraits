-- Fix security: Make INSERT policies require service role only for sensitive tables
-- This ensures only edge functions can create these records (after payment verification)

-- Drop existing overly permissive INSERT policies
DROP POLICY IF EXISTS "Allow insert for pet reports" ON public.pet_reports;
DROP POLICY IF EXISTS "Allow insert for horoscope subscriptions" ON public.horoscope_subscriptions;
DROP POLICY IF EXISTS "Allow insert for gift certificates" ON public.gift_certificates;
DROP POLICY IF EXISTS "Allow insert for coupons" ON public.coupons;

-- Pet reports: Only service role can insert (via edge functions after payment)
CREATE POLICY "Service role can insert pet reports"
ON public.pet_reports
FOR INSERT
TO service_role
WITH CHECK (true);

-- Horoscope subscriptions: Only service role can insert
CREATE POLICY "Service role can insert horoscope subscriptions" 
ON public.horoscope_subscriptions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Gift certificates: Only service role can insert
CREATE POLICY "Service role can insert gift certificates"
ON public.gift_certificates
FOR INSERT
TO service_role
WITH CHECK (true);

-- Coupons: Make SELECT service role only (no need to expose all coupons)
DROP POLICY IF EXISTS "Anyone can read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow read for coupons" ON public.coupons;

CREATE POLICY "Service role can read coupons"
ON public.coupons
FOR SELECT
TO service_role
USING (true);

-- Products: Keep public read for storefront, but only active products
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Allow read for products" ON public.products;

CREATE POLICY "Anyone can read active products"
ON public.products
FOR SELECT
USING (is_active = true);
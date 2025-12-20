-- SECURITY FIX: Remove overly permissive public INSERT policies
-- These tables contain PII and should only be insertable via service role (edge functions)

-- 1. Fix email_subscribers - remove public INSERT, keep service role only
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.email_subscribers;

-- 2. Fix horoscope_subscriptions - remove public INSERT policies
DROP POLICY IF EXISTS "Anyone can create horoscope subscriptions" ON public.horoscope_subscriptions;
DROP POLICY IF EXISTS "Service role can insert horoscope subscriptions" ON public.horoscope_subscriptions;

-- Create proper service role only INSERT policy for horoscope_subscriptions
CREATE POLICY "Service role only insert horoscope subscriptions"
ON public.horoscope_subscriptions
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 3. Fix gift_certificates - remove public INSERT policies  
DROP POLICY IF EXISTS "Anyone can create gift certificates" ON public.gift_certificates;
DROP POLICY IF EXISTS "Service role can insert gift certificates" ON public.gift_certificates;

-- Create proper service role only INSERT policy for gift_certificates
CREATE POLICY "Service role only insert gift certificates"
ON public.gift_certificates
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 4. Fix pet_reports - remove public INSERT, keep service role only
DROP POLICY IF EXISTS "Public can create pet reports" ON public.pet_reports;
DROP POLICY IF EXISTS "Service role can insert pet reports" ON public.pet_reports;

-- Create proper service role only INSERT policy for pet_reports
CREATE POLICY "Service role only insert pet reports"
ON public.pet_reports
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
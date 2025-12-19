-- Fix RLS security issues

-- 1. Fix horoscope_subscriptions SELECT policy - currently exposes all data with USING true
DROP POLICY IF EXISTS "Users can view own subscriptions by email" ON public.horoscope_subscriptions;
CREATE POLICY "Service role only for subscription reads"
  ON public.horoscope_subscriptions
  FOR SELECT
  USING (auth.role() = 'service_role');

-- 2. Fix horoscope_subscriptions UPDATE policy - currently allows anyone to update
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.horoscope_subscriptions;
CREATE POLICY "Service role only for subscription updates"
  ON public.horoscope_subscriptions
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- 3. Fix weekly_horoscopes ALL policy - currently exposes premium content to everyone
DROP POLICY IF EXISTS "Service role can manage horoscopes" ON public.weekly_horoscopes;
CREATE POLICY "Service role only for horoscopes"
  ON public.weekly_horoscopes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Fix translation_cache INSERT policy - currently allows anyone to inject translations
DROP POLICY IF EXISTS "Service role can insert translations" ON public.translation_cache;
CREATE POLICY "Service role only for translation inserts"
  ON public.translation_cache
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 5. Remove duplicate INSERT policy on pet_reports (keep one)
DROP POLICY IF EXISTS "Anyone can insert pet reports" ON public.pet_reports;
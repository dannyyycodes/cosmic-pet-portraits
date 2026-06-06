-- Affiliate: per-sale currency + recurring horoscope-subscription attribution
-- 2026-05-29

-- 1. Store the sale's real currency on each referral (GBP default).
--    Checkout charges GBP or USD; we were only storing the amount, so the
--    dashboard showed one currency for everyone.
ALTER TABLE public.affiliate_referrals
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'GBP';

-- 2. Allow the 'processing' status. payout-affiliates already sets it but the
--    original CHECK constraint rejected it (live bug).
ALTER TABLE public.affiliate_referrals
  DROP CONSTRAINT IF EXISTS affiliate_referrals_status_check;
ALTER TABLE public.affiliate_referrals
  ADD CONSTRAINT affiliate_referrals_status_check
  CHECK (status IN ('pending', 'processing', 'paid', 'cancelled'));

-- 3. Link a horoscope subscription to the referring affiliate so every
--    recurring invoice can pay 20% lifetime commission.
ALTER TABLE public.horoscope_subscriptions
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- SECURITY FIX 2026-06-28: gift codes were issued to the buyer BEFORE payment
-- and gift_certificates had no way to tell a paid gift from an abandoned one.
-- Anyone could close the Stripe page without paying and still redeem the code
-- for free product. Add an explicit `paid` flag that ONLY the Stripe webhook
-- sets to true after checkout.session.completed. validate-gift-code and
-- redeem-gift now refuse any code where paid is not true.
ALTER TABLE public.gift_certificates
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;

-- Backfill: every gift row that exists at migration time predates this flag,
-- so mark it paid to avoid bricking legitimate outstanding gifts that were
-- issued (and in many cases already paid for / redeemed) before the fix.
-- Only NEW rows created after this migration default to paid=false and must be
-- confirmed by the Stripe webhook.
UPDATE public.gift_certificates
  SET paid = true
  WHERE is_redeemed = true OR created_at < now();

COMMENT ON COLUMN public.gift_certificates.paid IS
  'True only after Stripe confirms payment (checkout.session.completed) for this gift session. Issuance is NOT entitlement — validate-gift-code and redeem-gift refuse codes where paid is not true.';

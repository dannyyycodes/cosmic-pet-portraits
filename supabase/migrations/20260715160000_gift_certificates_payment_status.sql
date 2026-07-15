-- Drift-fix: commit the gift_certificates payment-gating columns to source.
--
-- Blocker #1 (the gift-code free-reading exploit) added three columns to
-- gift_certificates LIVE via the Management API but never landed a migration,
-- so source drifted from prod. This migration reconciles them idempotently.
--
--   payment_status  text    NOT NULL DEFAULT 'pending'  — 'pending' | 'paid'
--   paid            boolean NOT NULL DEFAULT false
--   paid_at         timestamptz NULL
--
-- A gift certificate is minted 'pending' and only flips to 'paid' in
-- stripe-webhook on checkout.session.completed. Redemption paths
-- (create-checkout gift-code discount, redeem-gift, validate-gift-code) all
-- refuse any cert whose payment_status is not 'paid', so an unpaid cert can
-- never be spent.
--
-- ADD COLUMN IF NOT EXISTS keeps this a no-op on prod (columns already exist)
-- while making a fresh DB (local / CI) match production exactly.

ALTER TABLE public.gift_certificates
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.gift_certificates
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;

ALTER TABLE public.gift_certificates
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Multi-pet complimentary compatibility readings.
--
-- When a buyer pays for 2+ pets in a single Stripe order, the webhook
-- auto-generates one cross-pet compatibility reading for the first pair
-- as a bonus. These rows are marked `is_complimentary = TRUE` so billing
-- reports, refund flows, and analytics can filter them out of paid-revenue
-- aggregates.
--
-- The paid compatibility upsell path is gated behind a server-side flag
-- (see supabase/functions/create-checkout/index.ts, stripe-webhook/index.ts).
-- This migration is additive — the paid path still works if the flag is
-- flipped back on.

ALTER TABLE public.pet_compatibilities
  ADD COLUMN IF NOT EXISTS is_complimentary BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.pet_compatibilities.is_complimentary IS
  'True when the compatibility reading was auto-generated as a multi-pet checkout perk (no Stripe payment).';

CREATE INDEX IF NOT EXISTS pet_compat_complimentary_idx
  ON public.pet_compatibilities(is_complimentary) WHERE is_complimentary = TRUE;

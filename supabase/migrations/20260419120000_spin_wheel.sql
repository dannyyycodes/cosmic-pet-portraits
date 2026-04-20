-- Spin Wheel lead-magnet schema
--
-- Two changes:
--   1. Extend `coupons` so a single code can represent EITHER a discount
--      OR a non-monetary bonus (Soul Speak credits, tier upgrade, free
--      horoscope month). Discount codes leave the new columns NULL.
--   2. Create `wheel_spins` — append-only ledger of every spin attempt.
--      Used for: dedupe (one spin per email forever), IP abuse check
--      (one spin per IP per 30 days), analytics, and attribution.

-- ─── 1. Extend coupons ────────────────────────────────────────────────

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS bonus_type TEXT,
  -- Allowed values: NULL (pure discount), 'soul_speak_credits',
  -- 'horoscope_month', 'tier_upgrade'. Enforced by check constraint below.
  ADD COLUMN IF NOT EXISTS bonus_value NUMERIC,
  -- For 'soul_speak_credits': credit count (e.g. 500).
  -- For 'horoscope_month':    month count (e.g. 1).
  -- For 'tier_upgrade':       NULL (target lives in tier_upgrade_target).
  ADD COLUMN IF NOT EXISTS tier_upgrade_target TEXT,
  -- 'basic' | 'premium' | NULL. The tier the order is upgraded TO when
  -- bonus_type='tier_upgrade'. Stripe-webhook reads this on completion.
  ADD COLUMN IF NOT EXISTS gift_only BOOLEAN NOT NULL DEFAULT false,
  -- When true, code only validates inside the gift checkout flow.
  -- Used by the "30% off gift to a friend" wheel prize so the discount
  -- routes new buyers, not existing buyers gifting themselves.
  ADD COLUMN IF NOT EXISTS wheel_email TEXT,
  -- Email of the visitor who won this code via the wheel.
  -- NULL for admin-created or public codes. Used for sale attribution.
  ADD COLUMN IF NOT EXISTS wheel_prize_label TEXT;
  -- Human-readable label of the prize (matches what the visitor saw).
  -- Surfaced in checkout autofill UI ("Your Cosmic Jackpot — 30% off").

ALTER TABLE public.coupons
  DROP CONSTRAINT IF EXISTS coupons_bonus_type_chk;
ALTER TABLE public.coupons
  ADD CONSTRAINT coupons_bonus_type_chk
  CHECK (bonus_type IS NULL
      OR bonus_type IN ('soul_speak_credits', 'horoscope_month', 'tier_upgrade'));

CREATE INDEX IF NOT EXISTS idx_coupons_wheel_email
  ON public.coupons(wheel_email)
  WHERE wheel_email IS NOT NULL;

-- ─── 2. wheel_spins table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wheel_spins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Visitor identity
  email TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  -- SHA-256 of (ip || daily_salt). Salted+hashed so the table can hold
  -- 30 days of spin history without storing raw IPs (GDPR-friendly).
  user_agent TEXT,

  -- Prize awarded
  prize_slice INTEGER NOT NULL CHECK (prize_slice BETWEEN 1 AND 8),
  prize_label TEXT NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,

  -- Lifecycle
  source TEXT NOT NULL DEFAULT 'funnel_v2',
  -- Lets us add other wheel placements later (blog, post-purchase, etc.)
  -- without losing per-surface analytics.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE
);

-- One spin per email. EVER. Forms the dedupe spine of the abuse model —
-- if a returning visitor re-loads the wheel we look this up and serve
-- back their original prize instead of re-rolling.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wheel_spins_email_unique
  ON public.wheel_spins(lower(email));

-- IP rate-limit check spans 30 days; a partial index keeps it tight.
CREATE INDEX IF NOT EXISTS idx_wheel_spins_ip_recent
  ON public.wheel_spins(ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wheel_spins_coupon
  ON public.wheel_spins(coupon_id) WHERE coupon_id IS NOT NULL;

-- ─── RLS — service-role only ──────────────────────────────────────────

ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

-- No public read or insert. The spin-wheel edge function uses the
-- service role to write rows; no other path should touch this table.
-- (Anon role gets nothing — no policy = no access under RLS.)

-- Defensive revoke on the anon grant Supabase auto-issues.
REVOKE ALL ON public.wheel_spins FROM anon;
REVOKE ALL ON public.wheel_spins FROM authenticated;
GRANT ALL ON public.wheel_spins TO service_role;

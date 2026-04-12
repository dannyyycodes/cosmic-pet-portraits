-- Charity donations ledger — one row per successful order, manually paid out monthly.
-- Populated by stripe-webhook on checkout.session.completed. Read/mark-paid by /admin/donations.

CREATE TABLE IF NOT EXISTS public.charity_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  charity_id TEXT NOT NULL,
  charity_name TEXT NOT NULL,
  order_amount_cents INTEGER NOT NULL CHECK (order_amount_cents >= 0),
  donation_base_cents INTEGER NOT NULL CHECK (donation_base_cents >= 0),
  donation_bonus_cents INTEGER NOT NULL DEFAULT 0 CHECK (donation_bonus_cents >= 0),
  donation_total_cents INTEGER GENERATED ALWAYS AS (donation_base_cents + donation_bonus_cents) STORED,
  currency TEXT NOT NULL DEFAULT 'usd',
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','void')),
  paid_at TIMESTAMPTZ,
  paid_reference TEXT,
  paid_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charity_donations_status_created
  ON public.charity_donations (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_charity_donations_charity_created
  ON public.charity_donations (charity_id, created_at DESC);

-- Lock this table down. Only the service role (edge functions) touches it.
-- Admin UI reads/writes exclusively via authenticated edge functions (admin-auth session).
ALTER TABLE public.charity_donations ENABLE ROW LEVEL SECURITY;

-- No policies for authenticated/anon roles = all reads/writes denied by default.
-- Service role bypasses RLS, so stripe-webhook and the admin-donations edge function
-- can still operate on the table.

COMMENT ON TABLE public.charity_donations IS
  'Ledger of 10%-of-order charity donations. Inserted by stripe-webhook on checkout.session.completed. Marked paid monthly via /admin/donations.';

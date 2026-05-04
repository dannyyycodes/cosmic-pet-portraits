-- Portraits SaaS layer: credits ledger + Stripe subscriptions sync.
--
-- Sources lifted (per build-plan-locked-2026-05-04.md):
--   • vercel/nextjs-subscription-payments schema.sql (Supabase-native, MIT)
--   • Makerkit consume_credits() PL/pgSQL pattern (FOR UPDATE row lock)
--   • Supabase auth.users trigger pattern (handle_new_user)
--
-- Tables added:
--   portraits_credits             — current balance per user (1 row per user)
--   portraits_credit_transactions — append-only audit log (every grant + spend)
--   portraits_subscriptions       — synced from Stripe webhooks
--   portraits_stripe_events       — idempotency dedupe table
--
-- Functions added:
--   public.consume_credits(p_account_id uuid, p_tokens int)
--     -> boolean: TRUE if decremented, FALSE if insufficient. Atomic via FOR UPDATE.
--   public.grant_credits(p_account_id uuid, p_tokens int, p_reason text)
--     -> int: new balance.
--
-- Triggers:
--   on_auth_user_created — grants 20 credits (5 portraits × 4 variants) on signup.

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.portraits_credits (
  account_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens     integer NOT NULL DEFAULT 0 CHECK (tokens >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.portraits_credits IS
  '1 token = 1 fal.ai generation. 4 tokens = 1 portrait (4 variants). Never goes negative — consume_credits() enforces.';

CREATE TABLE IF NOT EXISTS public.portraits_credit_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta       integer NOT NULL,
  reason      text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portraits_credit_tx_account
  ON public.portraits_credit_transactions(account_id, created_at DESC);
COMMENT ON TABLE public.portraits_credit_transactions IS
  'Append-only audit log. delta>0 = grant, delta<0 = spend. reason: signup-grant | invoice-paid | one-off-pack | generation | refund.';

CREATE TABLE IF NOT EXISTS public.portraits_subscriptions (
  id                    text PRIMARY KEY,             -- Stripe subscription id (sub_*)
  account_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id    text NOT NULL,
  status                text NOT NULL,                -- active | canceled | past_due | trialing | etc.
  price_id              text NOT NULL,                -- Stripe Price id
  tier                  text NOT NULL,                -- "pass" | "elite"
  monthly_token_grant   integer NOT NULL,             -- 100 (pass) | 300 (elite)
  current_period_start  timestamptz NOT NULL,
  current_period_end    timestamptz NOT NULL,
  cancel_at_period_end  boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portraits_subs_account
  ON public.portraits_subscriptions(account_id, status);
CREATE INDEX IF NOT EXISTS idx_portraits_subs_customer
  ON public.portraits_subscriptions(stripe_customer_id);

CREATE TABLE IF NOT EXISTS public.portraits_stripe_events (
  id           text PRIMARY KEY,                      -- Stripe event id (evt_*)
  type         text NOT NULL,
  payload      jsonb,
  processed_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.portraits_stripe_events IS
  'Idempotency dedupe. INSERT ... ON CONFLICT (id) DO NOTHING — duplicate event = no-op.';

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.portraits_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portraits_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portraits_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portraits_stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY portraits_credits_self_read ON public.portraits_credits
  FOR SELECT USING (auth.uid() = account_id);

CREATE POLICY portraits_credit_tx_self_read ON public.portraits_credit_transactions
  FOR SELECT USING (auth.uid() = account_id);

CREATE POLICY portraits_subs_self_read ON public.portraits_subscriptions
  FOR SELECT USING (auth.uid() = account_id);

-- stripe_events is service-role only; no policies = no public access.

-- ─── Atomic credit decrement ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.consume_credits(
  p_account_id uuid,
  p_tokens     integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current integer;
BEGIN
  IF p_tokens <= 0 THEN
    RAISE EXCEPTION 'p_tokens must be positive';
  END IF;

  -- Lock the row so concurrent calls serialise.
  SELECT tokens INTO v_current
    FROM public.portraits_credits
   WHERE account_id = p_account_id
   FOR UPDATE;

  IF v_current IS NULL OR v_current < p_tokens THEN
    RETURN FALSE;
  END IF;

  UPDATE public.portraits_credits
     SET tokens = tokens - p_tokens, updated_at = now()
   WHERE account_id = p_account_id;

  INSERT INTO public.portraits_credit_transactions (account_id, delta, reason)
       VALUES (p_account_id, -p_tokens, 'generation');

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_credits(uuid, integer) TO service_role;

-- ─── Grant credits (idempotent helper for webhook handlers) ────────────────

CREATE OR REPLACE FUNCTION public.grant_credits(
  p_account_id uuid,
  p_tokens     integer,
  p_reason     text,
  p_metadata   jsonb DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  INSERT INTO public.portraits_credits (account_id, tokens)
       VALUES (p_account_id, p_tokens)
  ON CONFLICT (account_id)
  DO UPDATE SET tokens = portraits_credits.tokens + EXCLUDED.tokens,
                updated_at = now()
  RETURNING tokens INTO v_new_balance;

  INSERT INTO public.portraits_credit_transactions (account_id, delta, reason, metadata)
       VALUES (p_account_id, p_tokens, p_reason, p_metadata);

  RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, jsonb) TO service_role;

-- ─── Auth trigger: 20 credits on signup ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_portraits_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Wrap so a credit-grant failure never breaks signup.
  BEGIN
    INSERT INTO public.portraits_credits (account_id, tokens)
         VALUES (NEW.id, 20)
    ON CONFLICT (account_id) DO NOTHING;

    INSERT INTO public.portraits_credit_transactions (account_id, delta, reason)
         VALUES (NEW.id, 20, 'signup-grant');
  EXCEPTION WHEN OTHERS THEN
    -- Log but never propagate — signup must succeed.
    RAISE WARNING 'handle_new_portraits_user failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_portraits ON auth.users;
CREATE TRIGGER on_auth_user_created_portraits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_portraits_user();

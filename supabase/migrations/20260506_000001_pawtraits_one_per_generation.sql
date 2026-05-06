-- Pawtraits: collapse 4-variant pack model → 1 generation = 1 image.
-- Locked 2026-05-06 by Danny: customer downloads a single full-size portrait
-- per generation; if they want a different result they spend another credit.
--
-- Effects of this migration:
--   1. Signup grant drops from 12 (= 3 × 4-pack) → 3 (= 3 × 1-image). Same
--      number of free attempts, just no longer wrapped as 4-variant bundles.
--   2. All EXISTING positive credit balances are divided by 4 to preserve the
--      generation count customers paid for. A rebalance transaction is logged
--      against each affected account so the audit trail stays clean.
--   3. Future top-up grants are written by the Stripe webhook with the new
--      smaller token amounts (PACK_TOKENS=5, pass=25/mo, elite=75/mo).

-- ─── 1. Signup grant function: 12 → 3 ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_portraits_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
  v_grant_first_time boolean := false;
BEGIN
  v_normalized := public.normalize_email(NEW.email);

  IF v_normalized IS NOT NULL THEN
    BEGIN
      INSERT INTO public.portraits_signup_grants (normalized_email, granted_to_user_id)
           VALUES (v_normalized, NEW.id)
      ON CONFLICT (normalized_email) DO NOTHING;
      IF FOUND THEN v_grant_first_time := true; END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'signup-grant dedup check failed for %: %', NEW.id, SQLERRM;
      v_grant_first_time := true;
    END;
  END IF;

  BEGIN
    IF v_grant_first_time THEN
      INSERT INTO public.portraits_credits (account_id, tokens)
           VALUES (NEW.id, 3)
      ON CONFLICT (account_id) DO NOTHING;

      INSERT INTO public.portraits_credit_transactions (account_id, delta, reason)
           VALUES (NEW.id, 3, 'signup-grant');
    ELSE
      INSERT INTO public.portraits_credits (account_id, tokens)
           VALUES (NEW.id, 0)
      ON CONFLICT (account_id) DO NOTHING;

      INSERT INTO public.portraits_credit_transactions (account_id, delta, reason)
           VALUES (NEW.id, 0, 'signup-no-grant-duplicate-alias');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_portraits_user grant failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_portraits ON auth.users;
CREATE TRIGGER on_auth_user_created_portraits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_portraits_user();

-- ─── 2. Rebalance existing balances (÷4, floor) ──────────────────────────────
-- Customers had paid in 4-token-per-generation units. The simple, correct
-- thing is to divide every positive balance by 4, so each customer keeps the
-- same generation count they paid for. We log a transaction per affected
-- account so it shows up in their history as 'rebalance-1-per-generation'.
DO $$
DECLARE
  r record;
  new_tokens int;
  delta int;
BEGIN
  FOR r IN
    SELECT account_id, tokens
      FROM public.portraits_credits
     WHERE tokens > 0
  LOOP
    new_tokens := r.tokens / 4;  -- integer floor divide
    delta := new_tokens - r.tokens;  -- negative; the amount we're removing
    IF delta = 0 THEN CONTINUE; END IF;

    UPDATE public.portraits_credits
       SET tokens = new_tokens
     WHERE account_id = r.account_id;

    INSERT INTO public.portraits_credit_transactions (account_id, delta, reason, metadata)
         VALUES (r.account_id, delta, 'rebalance-1-per-generation',
                 jsonb_build_object('old_tokens', r.tokens, 'new_tokens', new_tokens));
  END LOOP;
END$$;

-- ─── 3. Update column comment ────────────────────────────────────────────────
COMMENT ON COLUMN public.portraits_credits.tokens IS
  '1 token = 1 generation = 1 full-size portrait. Locked 2026-05-06 (was 4 tokens = 1 portrait pre-rebalance).';

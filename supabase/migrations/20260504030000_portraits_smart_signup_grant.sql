-- Smart signup-grant: allow aliases to sign up but prevent repeat free credits.
-- Per Danny direction 2026-05-04 — don't ban anyone, just don't double-grant.
--
-- Logic:
--   1. Normalize incoming email (strip +aliases everywhere; strip dots for Gmail).
--   2. Try to claim that normalized email in portraits_signup_grants table.
--      Conflict = same person already had their free trial → grant 0 credits.
--      Success = first-time customer → grant 12 credits (3 generations).
--   3. Account is created EITHER WAY — repeat customers can still buy packs.
--
-- Apple Hide-My-Email / SimpleLogin / DuckDuckGo aliases each get a unique
-- address per service so they look like first-time customers (correctly).

-- ─── 1. Email normalization function ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.normalize_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_email text;
  v_local text;
  v_domain text;
  v_at int;
  v_plus int;
BEGIN
  IF p_email IS NULL THEN RETURN NULL; END IF;
  v_email := lower(trim(p_email));
  v_at := position('@' in v_email);
  IF v_at = 0 THEN RETURN v_email; END IF;
  v_local := substring(v_email from 1 for v_at - 1);
  v_domain := substring(v_email from v_at + 1);

  -- Strip "+anything" alias for ALL providers (universal convention).
  v_plus := position('+' in v_local);
  IF v_plus > 0 THEN
    v_local := substring(v_local from 1 for v_plus - 1);
  END IF;

  -- For Gmail family: ignore dots in local part, canonicalize domain.
  IF v_domain IN ('gmail.com', 'googlemail.com') THEN
    v_local := replace(v_local, '.', '');
    v_domain := 'gmail.com';
  END IF;

  RETURN v_local || '@' || v_domain;
END;
$$;

-- ─── 2. Dedup table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portraits_signup_grants (
  normalized_email text PRIMARY KEY,
  granted_to_user_id uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.portraits_signup_grants TO service_role;

COMMENT ON TABLE public.portraits_signup_grants IS
  'One row per unique normalized email that has been granted free signup credits. Used to prevent alias abuse of the free trial.';

-- ─── 3. Replace signup trigger with smart-grant logic ───────────────────
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

  -- Try to claim the normalized email. ON CONFLICT DO NOTHING leaves FOUND=false
  -- if it already existed (i.e. someone with this normalized email already had
  -- their free trial). On clean insert, FOUND=true.
  IF v_normalized IS NOT NULL THEN
    BEGIN
      INSERT INTO public.portraits_signup_grants (normalized_email, granted_to_user_id)
           VALUES (v_normalized, NEW.id)
      ON CONFLICT (normalized_email) DO NOTHING;
      IF FOUND THEN v_grant_first_time := true; END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Don't break signup if dedup check fails — log + treat as first-time.
      RAISE WARNING 'signup-grant dedup check failed for %: %', NEW.id, SQLERRM;
      v_grant_first_time := true;
    END;
  END IF;

  -- Always create the credits row (with 0 if duplicate, 12 if first-time).
  -- This way consume_credits() never errors on a missing row.
  BEGIN
    IF v_grant_first_time THEN
      INSERT INTO public.portraits_credits (account_id, tokens)
           VALUES (NEW.id, 12)
      ON CONFLICT (account_id) DO NOTHING;

      INSERT INTO public.portraits_credit_transactions (account_id, delta, reason)
           VALUES (NEW.id, 12, 'signup-grant');
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

-- Trigger itself stays the same; just rebound to the new function definition.
DROP TRIGGER IF EXISTS on_auth_user_created_portraits ON auth.users;
CREATE TRIGGER on_auth_user_created_portraits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_portraits_user();

-- ─── 4. Backfill: seed the dedup table with existing users so they don't
--      get re-granted if they happen to sign up again with an alias. ─────
INSERT INTO public.portraits_signup_grants (normalized_email, granted_to_user_id)
SELECT public.normalize_email(u.email), u.id
  FROM auth.users u
 WHERE u.email IS NOT NULL
ON CONFLICT (normalized_email) DO NOTHING;

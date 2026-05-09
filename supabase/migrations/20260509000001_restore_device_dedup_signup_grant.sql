-- Restore device-fingerprint dedup to handle_new_portraits_user.
--
-- BACKGROUND
-- Migration 20260504040000 added device-fingerprint dedup as a second guard
-- behind the email-alias dedup. Same browser + a new SimpleLogin/AnonAddy/
-- Apple-Hide-My-Email alias was meant to be detected and grant 0 credits.
--
-- Migration 20260506_000001 (the "1 generation = 1 image" rebalance) replaced
-- the function but reverted to email-only dedup, silently dropping device
-- dedup. Same person can now farm unlimited free trials by spinning up new
-- email aliases on the same browser. The portraits_signup_devices table still
-- exists, just is no longer written.
--
-- THIS MIGRATION
-- Re-replaces handle_new_portraits_user with the union of both prior
-- behaviours: device dedup + email dedup, both must be first-time, with the
-- 3-token grant amount that 20260506_000001 established (was 12).
--
-- Idempotent — CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS.

CREATE OR REPLACE FUNCTION public.handle_new_portraits_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
  v_visitor_id text;
  v_email_first_time boolean := false;
  v_device_first_time boolean := false;
  v_grant boolean := false;
BEGIN
  v_normalized := public.normalize_email(NEW.email);
  -- Visitor ID is passed by the client via signInWithOtp options.data.visitor_id
  -- (set in api/portraits.ts handleInstantSignup) and lands in
  -- auth.users.raw_user_meta_data.
  v_visitor_id := NULLIF(NEW.raw_user_meta_data->>'visitor_id', '');

  -- ── Email dedup ────────────────────────────────────────────────────
  -- Catches plus-aliases, dot-tricks, and the same canonical address.
  IF v_normalized IS NOT NULL THEN
    BEGIN
      INSERT INTO public.portraits_signup_grants (normalized_email, granted_to_user_id)
           VALUES (v_normalized, NEW.id)
      ON CONFLICT (normalized_email) DO NOTHING;
      IF FOUND THEN v_email_first_time := true; END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'email dedup failed for %: %', NEW.id, SQLERRM;
      v_email_first_time := true; -- fail-open on email layer
    END;
  END IF;

  -- ── Device dedup ───────────────────────────────────────────────────
  -- Catches alias services (SimpleLogin, AnonAddy, DuckDuckGo, Apple Hide-My-
  -- Email) where the SAME person can mint unlimited unique addresses pointing
  -- to one inbox. Same browser fingerprint = same person.
  IF v_visitor_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.portraits_signup_devices (visitor_id, granted_to_user_id)
           VALUES (v_visitor_id, NEW.id)
      ON CONFLICT (visitor_id) DO NOTHING;
      IF FOUND THEN v_device_first_time := true; END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'device dedup failed for %: %', NEW.id, SQLERRM;
      v_device_first_time := true; -- fail-open on device layer
    END;
  ELSE
    -- No visitor_id passed (legacy client, JS disabled, FingerprintJS blocked
    -- by privacy extension). Treat as unseen so we don't block legitimate
    -- signups; email dedup still runs.
    v_device_first_time := true;
  END IF;

  -- ── Grant decision: BOTH layers must be first-time ─────────────────
  -- Token amount = 3 (locked 2026-05-06 in migration 20260506_000001 — one
  -- token per generation, one generation per portrait).
  v_grant := v_email_first_time AND v_device_first_time;

  BEGIN
    IF v_grant THEN
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
           VALUES (NEW.id, 0,
             CASE
               WHEN NOT v_email_first_time AND NOT v_device_first_time THEN 'signup-no-grant-duplicate-email-and-device'
               WHEN NOT v_email_first_time THEN 'signup-no-grant-duplicate-alias'
               ELSE 'signup-no-grant-duplicate-device'
             END);
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

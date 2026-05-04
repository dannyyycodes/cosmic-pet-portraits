-- Device-fingerprint dedup layer.
-- Plugs the gap where email-only dedup misses (SimpleLogin, AnonAddy, DuckDuckGo,
-- Apple Hide-My-Email — services where the SAME person generates unlimited
-- unique aliases pointing to one inbox).
--
-- Logic:
--   At signup, the client passes a stable browser visitor_id (FingerprintJS).
--   Trigger checks if that visitor_id has already received a free-trial grant.
--   If yes → 0 credits regardless of email novelty.
--   Combined with the email dedup layer — BOTH must be unseen for free credits.

CREATE TABLE IF NOT EXISTS public.portraits_signup_devices (
  visitor_id text PRIMARY KEY,
  granted_to_user_id uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.portraits_signup_devices TO service_role;

COMMENT ON TABLE public.portraits_signup_devices IS
  'Device fingerprint dedup. One row per visitor_id that has been granted free signup credits. Catches alias-spam from same browser/device across SimpleLogin, AnonAddy, DuckDuckGo, Apple Hide-My-Email etc.';

-- Replace the trigger function — now requires BOTH email AND device to be
-- unseen before granting credits.
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
  -- Stored on auth.users.raw_user_meta_data.
  v_visitor_id := NULLIF(NEW.raw_user_meta_data->>'visitor_id', '');

  -- ── Email dedup ────────────────────────────────────────────────────
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
    -- No visitor_id passed (e.g. legacy client, JS disabled). Treat as unseen
    -- to avoid blocking legitimate signups; email dedup still applies.
    v_device_first_time := true;
  END IF;

  -- ── Grant decision: BOTH layers must be first-time ─────────────────
  v_grant := v_email_first_time AND v_device_first_time;

  BEGIN
    IF v_grant THEN
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

-- Go-live reliability + atomicity fixes (blockers #7, #9, #10).
--
-- #9  reserve_coupon_use          — atomic single-use reservation for coupons
-- #10 reserve_redeem_code_uses    — atomic N-use reservation for redeem codes
-- #10 release_redeem_code_uses    — roll back a redeem reservation on failure
-- #7  stale-report-generation-backfill cron — retries reports stuck in
--     status='generating' / retryable status='failed'.
--
-- All three RPCs use a single conditional UPDATE as the concurrency gate, so
-- two racing requests can never both pass a usage cap (the old code read the
-- count, checked it, then incremented — a classic check-then-act TOCTOU race
-- that let limited coupons / redeem codes oversell).

-- ─────────────────────────────────────────────────────────────────────────
-- #9 Coupons: atomic single-use reservation.
-- Returns TRUE only if this call is the one that incremented the counter
-- while capacity remained. NULL max_uses = unlimited.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reserve_coupon_use(p_coupon_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int;
BEGIN
  UPDATE coupons
     SET current_uses = COALESCE(current_uses, 0) + 1
   WHERE id = p_coupon_id
     AND is_active = true
     AND (max_uses IS NULL OR COALESCE(current_uses, 0) < max_uses);
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows = 1;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- #10 Redeem codes: atomic N-use reservation.
-- Increments current_uses by p_count in one statement, only if the code is
-- active, unexpired, and has room for the whole batch (current + N <= max).
-- Returns the reserved code row on success, empty set on any failure so the
-- caller can distinguish "reserved" from "exhausted/invalid".
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reserve_redeem_code_uses(p_code text, p_count int)
RETURNS TABLE (id uuid, current_uses int, max_uses int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_count IS NULL OR p_count < 1 THEN
    RETURN;
  END IF;

  UPDATE redeem_codes rc
     SET current_uses = COALESCE(rc.current_uses, 0) + p_count
   WHERE rc.code = p_code
     AND rc.is_active = true
     AND (rc.expires_at IS NULL OR rc.expires_at > now())
     AND (rc.max_uses IS NULL OR COALESCE(rc.current_uses, 0) + p_count <= rc.max_uses)
   RETURNING rc.id INTO v_id;

  IF v_id IS NULL THEN
    RETURN; -- exhausted / inactive / expired / not found
  END IF;

  RETURN QUERY
    SELECT rc.id, rc.current_uses, rc.max_uses
      FROM redeem_codes rc
     WHERE rc.id = v_id;
END;
$$;

-- Roll back a redeem-code reservation (used when report creation fails after
-- capacity was reserved). Clamped at 0 so it can never drive the count negative.
CREATE OR REPLACE FUNCTION release_redeem_code_uses(p_id uuid, p_count int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE redeem_codes
     SET current_uses = GREATEST(0, COALESCE(current_uses, 0) - p_count)
   WHERE id = p_id;
$$;

-- Lock these down: only the service role (edge functions) may call them.
REVOKE ALL ON FUNCTION reserve_coupon_use(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION reserve_redeem_code_uses(text, int) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION release_redeem_code_uses(uuid, int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION reserve_coupon_use(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION reserve_redeem_code_uses(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION release_redeem_code_uses(uuid, int) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- #7 Stale-report backfill cron.
-- generate-report-background now flips a report to a retryable status='failed'
-- marker when the n8n trigger fails, and (belt-and-braces) any report can get
-- stuck on status='generating' if a trigger silently dropped. This cron finds
-- those and re-POSTs them to generate-report-background, which re-marks
-- 'generating' and re-fires the n8n trigger. Bounded: only paid reports, only
-- those older than ~10 min, capped attempts (<5), LIMIT 20 per tick.
--
-- app.settings.* GUCs are NULL on Supabase-hosted PG, so the service key is
-- read from Supabase Vault (vault.decrypted_secrets, secret name
-- 'service_role_key') instead of being hardcoded — no secret lives in git.
-- Bootstrap once per project:
--   select vault.create_secret('<service-role-jwt>', 'service_role_key', 'pg_cron edge-fn auth');
-- The service key bypasses the endpoint's per-IP limit.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  PERFORM cron.unschedule('stale-report-generation-backfill');
EXCEPTION WHEN OTHERS THEN
  NULL; -- first run, nothing to unschedule
END $$;

SELECT cron.schedule(
  'stale-report-generation-backfill',
  '*/10 * * * *',  -- every 10 minutes
  $job$
  SELECT net.http_post(
    url := 'https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/generate-report-background',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := jsonb_build_object(
      'reportId', pr.id,
      'attempt', COALESCE((pr.report_content->>'attempt')::int, 1) + 1
    ),
    timeout_milliseconds := 20000
  )
  FROM pet_reports pr
  WHERE pr.payment_status IN ('paid', 'completed')
    AND pr.report_content->>'status' IN ('generating', 'failed')
    AND COALESCE(
          (pr.report_content->>'started_at')::timestamptz,
          (pr.report_content->>'failed_at')::timestamptz,
          pr.updated_at
        ) < now() - interval '10 minutes'
    AND COALESCE((pr.report_content->>'attempt')::int, 1) < 5
    -- Only retry failed rows explicitly flagged retryable, OR generating rows
    -- (which have no retryable flag) that are simply stale.
    AND (
      pr.report_content->>'status' = 'generating'
      OR COALESCE((pr.report_content->>'retryable')::boolean, false) = true
    )
  LIMIT 20;
  $job$
);

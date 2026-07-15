-- Fix: increment_chat_credits must credit the SAME row soul-chat reads + debits.
--
-- THE BUG (load-bearing, buyer pays and nothing happens):
--   soul-chat gates + debits the HOUSEHOLD-POOLED row
--     (chat_credits WHERE order_id IS NULL AND lower(email) = <buyer email>)
--   for any report with a real (non-placeholder) email. But every GRANT path
--   funnels through increment_chat_credits(p_order_id, p_amount), which keyed
--   on order_id via ON CONFLICT (order_id). So a top-up / membership / renewal
--   / wheel-bonus credited the ORDER-scoped row (order_id = reportId) that
--   soul-chat never reads. The buyer's balance never moved.
--
--   Observed live (test email littlesouls-app.relative617@passmail.net):
--     household row (order_id NULL) = 150 credits  <- soul-chat reads THIS
--     per-order row (order_id = reportId) = 400    <- old increment wrote HERE
--
-- THE FIX:
--   increment_chat_credits now resolves the report's email from pet_reports
--   (p_order_id is always a pet_reports.id at every call site) and:
--     * real email       -> upserts the HOUSEHOLD row (order_id NULL, email),
--                           the exact row soul-chat reads + debits;
--     * placeholder/none  -> keeps the original per-order upsert
--                           (order_id = p_order_id), matching soul-chat's
--                           token-only fallback gate.
--   Placeholder detection mirrors soul-chat exactly: empty, 'pending@%', '%.temp'.
--   The household branch is update-first / insert-on-miss with a unique_violation
--   retry, so two racing grants can't double-mint (chat_credits_household_unique
--   enforces one household row per email).
--
--   All grant callers keep the same signature — no edge-fn call-site changes:
--     stripe-webhook: chat_credits top-up, chat_subscription initial + renewal,
--                     wheel soul_speak_credits bonus
--     refresh-chat-credits: weekly membership refresh
--
-- ─── OLD FUNCTION BODY (recorded before change, for rollback) ───────────────
--   CREATE OR REPLACE FUNCTION public.increment_chat_credits(p_order_id uuid, p_amount integer)
--    RETURNS void
--    LANGUAGE sql
--   AS $function$
--     INSERT INTO chat_credits (order_id, credits_remaining, credits_total_purchased)
--     VALUES (p_order_id, p_amount, p_amount)
--     ON CONFLICT (order_id) DO UPDATE
--     SET credits_remaining = chat_credits.credits_remaining + p_amount,
--         credits_total_purchased = chat_credits.credits_total_purchased + p_amount,
--         updated_at = now();
--   $function$
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_chat_credits(p_order_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_email          text;
  v_is_placeholder boolean;
  v_id             uuid;
BEGIN
  -- p_order_id is a pet_reports.id everywhere this RPC is called from.
  SELECT lower(trim(email)) INTO v_email
  FROM pet_reports
  WHERE id = p_order_id;

  v_is_placeholder := v_email IS NULL
    OR v_email = ''
    OR v_email LIKE 'pending@%'
    OR v_email LIKE '%.temp';

  IF NOT v_is_placeholder THEN
    -- Household-pooled row (order_id IS NULL, email set) — the SAME row
    -- soul-chat reads and debits. Update-first; insert on miss; on a racing
    -- concurrent insert (household unique index) fall back to update.
    UPDATE chat_credits
    SET credits_remaining        = credits_remaining + p_amount,
        credits_total_purchased  = credits_total_purchased + p_amount,
        updated_at               = now()
    WHERE order_id IS NULL
      AND lower(email) = v_email
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      BEGIN
        INSERT INTO chat_credits (order_id, email, credits_remaining, credits_total_purchased)
        VALUES (NULL, v_email, p_amount, p_amount);
      EXCEPTION WHEN unique_violation THEN
        UPDATE chat_credits
        SET credits_remaining        = credits_remaining + p_amount,
            credits_total_purchased  = credits_total_purchased + p_amount,
            updated_at               = now()
        WHERE order_id IS NULL
          AND lower(email) = v_email;
      END;
    END IF;
  ELSE
    -- Token-only / placeholder-email reports stay per-order scoped, matching
    -- soul-chat's fallback gate. Preserves the original upsert behaviour.
    INSERT INTO chat_credits (order_id, credits_remaining, credits_total_purchased)
    VALUES (p_order_id, p_amount, p_amount)
    ON CONFLICT (order_id) DO UPDATE
    SET credits_remaining        = chat_credits.credits_remaining + p_amount,
        credits_total_purchased  = chat_credits.credits_total_purchased + p_amount,
        updated_at               = now();
  END IF;
END;
$function$;

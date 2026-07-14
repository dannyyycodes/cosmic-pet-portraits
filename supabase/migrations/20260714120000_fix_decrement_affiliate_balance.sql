-- Fix decrement_affiliate_balance: stop double-counting lifetime earnings
--
-- Background:
--   The original definition (20260317100000_affiliate_security_fixes.sql) did:
--     total_earnings_cents = total_earnings_cents + p_amount_cents
--   on every payout. But total_earnings_cents is already incremented at
--   referral/earn time by increment_affiliate_stats, so adding it again here
--   double-counted lifetime earnings on every payout.
--
--   Live was hotfixed to remove that line; this migration makes the source
--   match live so a future deploy cannot re-introduce the bug.
--
-- Corrected behaviour: move the paid amount out of pending_balance_cents ONLY.
-- Never touch total_earnings_cents here.

CREATE OR REPLACE FUNCTION public.decrement_affiliate_balance(
  p_affiliate_id UUID,
  p_amount_cents INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Move the paid amount out of pending ONLY. total_earnings_cents already
  -- counted this commission at referral time (increment_affiliate_stats), so
  -- adding it again here double-counted lifetime earnings on every payout.
  UPDATE affiliates
  SET pending_balance_cents = GREATEST(0, pending_balance_cents - p_amount_cents),
      updated_at = now()
  WHERE id = p_affiliate_id;
END;
$function$;

-- Restrict to service role (idempotent, matches original grants)
REVOKE ALL ON FUNCTION decrement_affiliate_balance(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrement_affiliate_balance(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION decrement_affiliate_balance(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION decrement_affiliate_balance(UUID, INTEGER) TO service_role;

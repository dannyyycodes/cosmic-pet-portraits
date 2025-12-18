-- Replace the increment_affiliate_stats function with proper input validation
CREATE OR REPLACE FUNCTION public.increment_affiliate_stats(
  p_affiliate_id UUID,
  p_commission_cents INTEGER
) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Validate inputs
  IF p_affiliate_id IS NULL THEN
    RAISE EXCEPTION 'affiliate_id cannot be null';
  END IF;
  
  IF p_commission_cents IS NULL OR p_commission_cents < 0 THEN
    RAISE EXCEPTION 'commission_cents must be a positive integer';
  END IF;
  
  IF p_commission_cents > 1000000 THEN -- $10,000 max commission per transaction
    RAISE EXCEPTION 'commission_cents exceeds maximum allowed value';
  END IF;
  
  -- SECURITY: Verify affiliate exists and is active before updating
  IF NOT EXISTS (SELECT 1 FROM affiliates WHERE id = p_affiliate_id AND status = 'active') THEN
    RAISE EXCEPTION 'affiliate not found or inactive';
  END IF;
  
  -- Atomic update with validated inputs
  UPDATE affiliates
  SET 
    total_referrals = total_referrals + 1,
    total_earnings_cents = total_earnings_cents + p_commission_cents,
    pending_balance_cents = pending_balance_cents + p_commission_cents,
    updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- Ensure only service_role can execute this function
REVOKE ALL ON FUNCTION public.increment_affiliate_stats(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_affiliate_stats(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.increment_affiliate_stats(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_affiliate_stats(UUID, INTEGER) TO service_role;
-- Create atomic function to increment affiliate stats
-- This prevents race conditions with concurrent webhook calls
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
  UPDATE affiliates
  SET 
    total_referrals = total_referrals + 1,
    total_earnings_cents = total_earnings_cents + p_commission_cents,
    pending_balance_cents = pending_balance_cents + p_commission_cents,
    updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- Grant execute to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.increment_affiliate_stats TO service_role;
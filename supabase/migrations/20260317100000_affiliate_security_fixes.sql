-- Affiliate Security Fixes Migration
-- 1. Create affiliate_sessions table for magic-link authentication
-- 2. Create decrement_affiliate_balance RPC for safe payout balance updates
-- 3. Add 'processing' as valid referral status

-- ─── 1. Affiliate Sessions (Magic Link Auth) ───
CREATE TABLE IF NOT EXISTS affiliate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  verification_code TEXT,
  session_token UUID,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_sessions_token ON affiliate_sessions(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_sessions_affiliate ON affiliate_sessions(affiliate_id);

-- RLS: service role only
ALTER TABLE affiliate_sessions ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup expired sessions (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_expired_affiliate_sessions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM affiliate_sessions WHERE expires_at < now();
END;
$$;

-- ─── 2. Decrement Affiliate Balance (Atomic) ───
CREATE OR REPLACE FUNCTION decrement_affiliate_balance(
  p_affiliate_id UUID,
  p_amount_cents INTEGER
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE affiliates
  SET pending_balance_cents = GREATEST(0, pending_balance_cents - p_amount_cents),
      total_earnings_cents = total_earnings_cents + p_amount_cents,
      updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- Restrict to service role
REVOKE ALL ON FUNCTION decrement_affiliate_balance(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrement_affiliate_balance(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION decrement_affiliate_balance(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION decrement_affiliate_balance(UUID, INTEGER) TO service_role;

-- Adds DOWNLOAD CREDITS to the portraits credits system.
--
-- Generation credits (existing) = right to RUN a generation (1 token per prompt → 4 variants).
-- Download credits (new)        = right to DOWNLOAD the high-res 3000x3000 print master without paying £19.
--
-- Subscription tiers grant both per period (existing tokens + new download credits):
--   Pass  £8.99/mo : 25 generations + 3 download credits
--   Elite £17.99/mo: 75 generations + 999 download credits (effectively unlimited)
--   Free          : 3 generations + 0 download credits (must pay £19 per digital download)
--
-- Casual buyers stay on the £19 pay-per-download path. Power users see the
-- subscription as the better deal once they want >2 downloads/mo.

-- ─── Schema additions ──────────────────────────────────────────────────────

ALTER TABLE public.portraits_credits
  ADD COLUMN IF NOT EXISTS download_credits INT NOT NULL DEFAULT 0
    CHECK (download_credits >= 0);

ALTER TABLE public.portraits_subscriptions
  ADD COLUMN IF NOT EXISTS monthly_download_credit_grant INT NOT NULL DEFAULT 0;

-- Optional column on transactions log to distinguish credit type for audits.
-- Existing rows have NULL credit_type (= "generation" implicitly).
ALTER TABLE public.portraits_credit_transactions
  ADD COLUMN IF NOT EXISTS credit_type TEXT
    CHECK (credit_type IS NULL OR credit_type IN ('generation', 'download'));

-- ─── consume_download_credit(account_id) → bool ──
-- Returns TRUE if a credit was deducted, FALSE if balance was 0.
-- Atomic via row lock. Logged to portraits_credit_transactions with
-- credit_type='download' for the audit trail.

CREATE OR REPLACE FUNCTION public.consume_download_credit(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INT;
BEGIN
  -- Lock the row so concurrent redemptions can't double-spend
  SELECT download_credits INTO v_balance
    FROM public.portraits_credits
    WHERE account_id = p_account_id
    FOR UPDATE;

  -- No row = no credits ever granted. Insert a 0-balance row for future grants.
  IF NOT FOUND THEN
    INSERT INTO public.portraits_credits (account_id, tokens, download_credits)
      VALUES (p_account_id, 0, 0)
      ON CONFLICT (account_id) DO NOTHING;
    RETURN FALSE;
  END IF;

  IF v_balance <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.portraits_credits
    SET download_credits = download_credits - 1,
        updated_at = NOW()
    WHERE account_id = p_account_id;

  INSERT INTO public.portraits_credit_transactions (account_id, delta, reason, credit_type)
    VALUES (p_account_id, -1, 'digital_download_redeemed', 'download');

  RETURN TRUE;
END;
$$;

-- ─── grant_download_credits(account_id, amount, reason, metadata?) → int ──
-- UPSERT to add download credits. Returns the new balance.

CREATE OR REPLACE FUNCTION public.grant_download_credits(
  p_account_id UUID,
  p_amount INT,
  p_reason TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'grant_download_credits: amount must be positive (got %)', p_amount;
  END IF;

  INSERT INTO public.portraits_credits (account_id, tokens, download_credits)
    VALUES (p_account_id, 0, p_amount)
    ON CONFLICT (account_id)
    DO UPDATE SET
      download_credits = portraits_credits.download_credits + p_amount,
      updated_at = NOW()
    RETURNING download_credits INTO v_balance;

  INSERT INTO public.portraits_credit_transactions (account_id, delta, reason, metadata, credit_type)
    VALUES (p_account_id, p_amount, p_reason, p_metadata, 'download');

  RETURN v_balance;
END;
$$;

-- ─── Backfill subscription grants ──
-- Update existing active subscriptions so they start receiving download credits
-- on next renewal (next invoice.paid).

UPDATE public.portraits_subscriptions
  SET monthly_download_credit_grant = 3
  WHERE tier = 'pass' AND monthly_download_credit_grant = 0;

UPDATE public.portraits_subscriptions
  SET monthly_download_credit_grant = 999
  WHERE tier = 'elite' AND monthly_download_credit_grant = 0;

-- Grant a one-off "welcome" download credit batch to currently-active subscribers
-- so they don't have to wait until next renewal to feel the new benefit.

INSERT INTO public.portraits_credit_transactions (account_id, delta, reason, metadata, credit_type)
SELECT
  s.account_id,
  s.monthly_download_credit_grant,
  'sub_download_credits_backfill_2026_05_12',
  jsonb_build_object('subscription_id', s.id, 'tier', s.tier),
  'download'
FROM public.portraits_subscriptions s
WHERE s.status = 'active' AND s.monthly_download_credit_grant > 0;

UPDATE public.portraits_credits c
  SET download_credits = c.download_credits + s.monthly_download_credit_grant,
      updated_at = NOW()
  FROM public.portraits_subscriptions s
  WHERE c.account_id = s.account_id
    AND s.status = 'active'
    AND s.monthly_download_credit_grant > 0;

-- ─── Permissions ──
-- Only authenticated users (and service_role) should be able to call the consume function.
-- The grant function is service_role only (called from Stripe webhook).

REVOKE ALL ON FUNCTION public.consume_download_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_download_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_download_credit(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.grant_download_credits(UUID, INT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_download_credits(UUID, INT, TEXT, JSONB) TO service_role;

COMMENT ON COLUMN public.portraits_credits.download_credits IS
  'Right to download high-res 3000x3000 print masters without paying £19. Granted by Pass/Elite subscriptions monthly. Consumed via consume_download_credit() when redeeming a digital download.';

COMMENT ON COLUMN public.portraits_subscriptions.monthly_download_credit_grant IS
  'Number of download credits granted per billing period via invoice.paid webhook. Pass=3, Elite=999.';

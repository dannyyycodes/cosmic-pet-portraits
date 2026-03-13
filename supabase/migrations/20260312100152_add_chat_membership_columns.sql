-- Add columns for chat membership (Soul Bond subscription)
ALTER TABLE chat_credits
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS weekly_credits integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_credit_refresh timestamptz;

-- Index for finding active memberships that need weekly credit refresh
CREATE INDEX IF NOT EXISTS idx_chat_credits_next_refresh
  ON chat_credits (next_credit_refresh)
  WHERE weekly_credits > 0 AND next_credit_refresh IS NOT NULL;

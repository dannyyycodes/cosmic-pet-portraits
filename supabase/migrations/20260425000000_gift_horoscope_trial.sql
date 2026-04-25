-- Gift horoscope trial: 28-day cap with conversion-to-paid path.
--
-- Today's behaviour: when a gift recipient redeems a Soul Bond reading,
-- redeem-gift creates a horoscope_subscriptions row with status='active'
-- and no time limit. The Monday batch generator then sends them weekly
-- horoscopes forever, free, with no conversion moment.
--
-- This migration adds:
--   - trial_ends_at TIMESTAMPTZ — null on paid subs (existing behaviour
--     preserved). Stamped to redemption + 28 days on gift-redeemed subs.
--     Batch generator filters out rows where trial_ends_at < now() AND
--     stripe_subscription_id IS NULL.
--   - is_gift BOOLEAN — true when sub originated from a gift redemption.
--     Lets the batch generator send conversion-prompt emails only to
--     gift recipients during weeks 3 and 4.
--   - reminder_sent_at_week3, reminder_sent_at_week4 — once-only flags
--     so we don't spam the recipient with the same conversion email each
--     time the cron runs in the trigger window.
--   - converted_at — stamped when recipient successfully subscribes via
--     the keep-horoscopes flow, for analytics.
--
-- Backwards compatible: all existing subs have these as NULL/false and
-- the batch filter only excludes rows where trial_ends_at IS NOT NULL.

ALTER TABLE horoscope_subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_gift BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent_at_week3 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at_week4 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- Speeds up the batch generator's "trial expired and not yet converted" filter.
CREATE INDEX IF NOT EXISTS idx_horoscope_subs_trial_ends_at
  ON horoscope_subscriptions (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL AND stripe_subscription_id IS NULL;

-- Add plan, occasion_mode columns to horoscope_subscriptions
ALTER TABLE horoscope_subscriptions
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS occasion_mode TEXT DEFAULT 'discover';

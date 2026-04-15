-- chat_credits.credits_remaining default was 15 (legacy starter value).
-- soul-chat/index.ts now explicitly sets STARTER_CREDITS (400), so the 15
-- default only ever fires on the webhook's membership upsert path — causing
-- new Soul Bond members to get 1,015 credits instead of 1,000 on signup.
-- Reset default to 0 so every code path has to be explicit about grants.

ALTER TABLE chat_credits ALTER COLUMN credits_remaining SET DEFAULT 0;

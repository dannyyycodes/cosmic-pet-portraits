-- Prevent double-mint when two soul-chat sessions hit simultaneously for the
-- same household (email + null order_id). A partial unique index lets the
-- first insert win and the second bounce off for an upsert-on-conflict.

create unique index if not exists chat_credits_household_unique
  on public.chat_credits (lower(email))
  where order_id is null and email is not null;

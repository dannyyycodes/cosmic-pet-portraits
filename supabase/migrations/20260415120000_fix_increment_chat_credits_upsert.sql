-- Fix: increment_chat_credits must upsert, not update-only.
--
-- BEFORE: the function was UPDATE-only. If the chat_credits row did not exist
-- yet for an order_id (the row is only created when a user sends their first
-- chat message), the top-up webhook's call would silently affect 0 rows —
-- Stripe kept the money, the user got no credits, and no error was raised.
--
-- AFTER: upsert. Credits always land whether or not the row already exists.
-- Existing callers (stripe-webhook top-up, stripe-webhook membership initial,
-- refresh-chat-credits weekly) continue to work unchanged.

CREATE OR REPLACE FUNCTION increment_chat_credits(p_order_id uuid, p_amount integer)
RETURNS void AS $$
  INSERT INTO chat_credits (order_id, credits_remaining, credits_total_purchased)
  VALUES (p_order_id, p_amount, p_amount)
  ON CONFLICT (order_id) DO UPDATE
  SET credits_remaining = chat_credits.credits_remaining + p_amount,
      credits_total_purchased = chat_credits.credits_total_purchased + p_amount,
      updated_at = now();
$$ LANGUAGE sql;

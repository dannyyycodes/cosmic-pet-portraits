-- Soul Chat security hardening
-- 1. Lock RLS on chat_credits so anon CANNOT self-grant or raise credits
-- 2. Add atomic decrement RPC so the server is the source of truth for credit spend

-- Drop the permissive anon INSERT/UPDATE policies
DROP POLICY IF EXISTS "Allow anonymous insert" ON chat_credits;
DROP POLICY IF EXISTS "Allow anonymous update" ON chat_credits;

-- Anon retains SELECT only (so the client can display the current balance)
-- INSERT/UPDATE now happen exclusively via the service role from edge functions

-- Atomic decrement: returns the new balance, or NULL if row is missing / insufficient
CREATE OR REPLACE FUNCTION decrement_chat_credits(p_order_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE chat_credits
  SET credits_remaining = credits_remaining - p_amount,
      updated_at = now()
  WHERE order_id = p_order_id
    AND is_unlimited = false
    AND credits_remaining >= p_amount
  RETURNING credits_remaining INTO new_balance;

  RETURN new_balance;
END;
$$;

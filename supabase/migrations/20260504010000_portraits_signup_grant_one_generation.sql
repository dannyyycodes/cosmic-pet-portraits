-- Reduce signup grant from 20 credits (5 generations) → 4 credits (1 generation).
-- Per Danny direction 2026-05-04: 1 free try only, then paywall (£4.99 pack or
-- £8.99 Pass / £17.99 Elite subscription).
--
-- TOKENS_PER_GENERATION = 4 (one fal Kontext call returns 4 image variants).

CREATE OR REPLACE FUNCTION public.handle_new_portraits_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.portraits_credits (account_id, tokens)
         VALUES (NEW.id, 4)
    ON CONFLICT (account_id) DO NOTHING;

    INSERT INTO public.portraits_credit_transactions (account_id, delta, reason)
         VALUES (NEW.id, 4, 'signup-grant');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_portraits_user failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

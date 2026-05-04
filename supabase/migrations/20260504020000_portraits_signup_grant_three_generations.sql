-- Bump signup grant from 1 generation (4 credits) → 3 generations (12 credits).
-- Per Danny direction 2026-05-04: 1 try wasn't enough — older customers need
-- room to refine their prompt before being asked to pay.

CREATE OR REPLACE FUNCTION public.handle_new_portraits_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.portraits_credits (account_id, tokens)
         VALUES (NEW.id, 12)
    ON CONFLICT (account_id) DO NOTHING;

    INSERT INTO public.portraits_credit_transactions (account_id, delta, reason)
         VALUES (NEW.id, 12, 'signup-grant');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_portraits_user failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

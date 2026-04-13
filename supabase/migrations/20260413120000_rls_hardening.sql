-- Security hardening — lock down tables that were accidentally exposed to anon
--
-- Background: an audit found three tables reachable by the public anon key
-- in ways that allow abuse:
--   1. redeem_codes       — RLS disabled AND anon has full DML (read/write/delete)
--   2. calendar_orders    — permissive SELECT + UPDATE policies using(true) for all roles
--   3. chat_messages      — permissive SELECT + INSERT policies using(true) for all roles
--
-- All three are only accessed by edge functions using the service role key,
-- which bypasses RLS. Locking these down to service role only does not break
-- any user-facing flow.

-- ─── 1. redeem_codes ────────────────────────────────────────────────────
-- Enable RLS (it was off) and strip anon/authenticated grants. Service role
-- bypasses RLS so the redeem-free-code / admin-redeem-codes edge functions
-- continue to work.
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.redeem_codes FROM anon, authenticated;

-- ─── 2. calendar_orders ─────────────────────────────────────────────────
DROP POLICY IF EXISTS calendar_orders_public_read   ON public.calendar_orders;
DROP POLICY IF EXISTS calendar_orders_public_update ON public.calendar_orders;
REVOKE ALL ON public.calendar_orders FROM anon, authenticated;

-- ─── 3. chat_messages ───────────────────────────────────────────────────
-- Messages belong to an order. Reading another user's conversation = privacy
-- breach. All legitimate reads/writes happen via the soul-chat edge function
-- (service role). Lock the table to service role only.
DROP POLICY IF EXISTS "Allow anonymous read"   ON public.chat_messages;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.chat_messages;
REVOKE ALL ON public.chat_messages FROM anon, authenticated;

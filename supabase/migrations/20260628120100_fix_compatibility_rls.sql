-- SECURITY FIX 2026-06-28: pet_compatibilities RLS hole.
-- The original "public read by share_token" policy (migration
-- 20260415120000) used `using (share_token is not null)`. Because every row
-- gets a non-null share_token by default, that predicate is true for EVERY
-- row, so any holder of the public anon key could `select email,
-- reading_content, share_token ...` and harvest all customer emails + reading
-- content for the whole table.
--
-- Fix: drop the over-broad anon/public SELECT policy and revoke the anon
-- role's table SELECT grant entirely. Token-based share reads are unaffected
-- because they are served by the get-compatibility edge function using the
-- service role, which bypasses RLS (the "service role full access on
-- pet_compatibilities" policy stays in place). Authenticated owners keep
-- email-matched read access via the existing "owners read by email match"
-- policy (it is `to authenticated`, not `to anon`, and is left untouched).
--
-- Idempotent: guarded by to_regclass + `drop policy if exists`; revoke is a
-- no-op when the grant is already absent. Safe to run repeatedly.

do $$
begin
  if to_regclass('public.pet_compatibilities') is not null then
    -- SECURITY FIX 2026-06-28: kill the policy whose predicate matched every row.
    drop policy if exists "public read by share_token" on public.pet_compatibilities;

    -- SECURITY FIX 2026-06-28: anon must not read this table directly; all
    -- unauthenticated reads go through the service-role get-compatibility
    -- edge function, which gates on the supplied share_token.
    revoke select on public.pet_compatibilities from anon;
  end if;
end$$;

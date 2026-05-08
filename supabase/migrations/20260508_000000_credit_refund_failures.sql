-- Credit refund failure log
--
-- handleGenerate refunds a customer's credit (via grant_credits RPC) any time
-- a generation attempt fails after the credit has already been consumed:
--   - fal balance exhausted
--   - generation returned no url
--   - exception thrown mid-flight
--
-- The grant_credits RPC itself can fail (DB hiccup, RPC permissions drift,
-- transient network). When that happens the customer has paid for a portrait
-- they never received AND the refund silently dropped on the floor. This table
-- captures every failed refund attempt so a sweeper job (or human) can retry.
--
-- Service-role only — refunds are an internal concern, never surfaced to
-- end-users directly.

create table if not exists public.credit_refund_failures (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  tokens int not null,
  reason text not null,                -- e.g. 'fal-balance-exhausted', 'generation-failed', 'exception'
  error_detail text,                   -- the grant_credits RPC error message
  created_at timestamptz not null default now(),
  retried_at timestamptz,              -- set by the sweeper when it next retries
  resolved_at timestamptz              -- set when the retry finally succeeds
);

create index if not exists credit_refund_failures_unresolved_idx
  on public.credit_refund_failures (created_at desc)
  where resolved_at is null;

create index if not exists credit_refund_failures_account_idx
  on public.credit_refund_failures (account_id, created_at desc);

alter table public.credit_refund_failures enable row level security;

create policy "service_role_all_credit_refund_failures"
  on public.credit_refund_failures for all
  to service_role
  using (true) with check (true);

comment on table public.credit_refund_failures is
  'Audit log of grant_credits refund calls that failed after a generation aborted. Sweeper retries unresolved rows.';

-- Activation onboarding drip — per-affiliate stage tracking.
-- stage 0 = not yet welcomed; 1 = welcome sent; 2 = first-share sent; 3 = bonus sent (done).
alter table public.affiliates add column if not exists onboarding_stage integer not null default 0;
alter table public.affiliates add column if not exists onboarding_last_sent_at timestamptz;
create index if not exists affiliates_onboarding_stage_idx on public.affiliates (onboarding_stage) where onboarding_stage < 3;

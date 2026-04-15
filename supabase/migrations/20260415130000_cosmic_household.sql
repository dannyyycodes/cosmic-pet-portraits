-- Cosmic Household — parent subscription that groups multiple pets under ONE
-- Stripe subscription and ONE weekly digest email.
--
-- Design intent:
--   - The legacy `horoscope_subscriptions` table stays exactly as-is (one row
--     per pet). Each row optionally points to a `cosmic_households` parent via
--     `household_id`, which is how we collapse billing + delivery.
--   - A household lives at the buyer-email level. Adding a new pet to a
--     household is a Stripe subscription-item quantity change, not a new
--     subscription.
--   - The weekly digest reads pet horoscopes for each household and sends a
--     single email with per-pet sections.
--
-- Pricing is intentionally NOT hardcoded here — prices live in Stripe, we
-- just record whatever the user paid (`monthly_cents` is the last snapshot).

create table if not exists public.cosmic_households (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'active' check (status in ('active', 'past_due', 'paused', 'cancelled')),
  -- Snapshot of the current monthly price (base + per-pet). Pure record-keeping.
  monthly_cents integer,
  -- Delivery preferences.
  weekly_digest_enabled boolean not null default true,
  digest_day smallint not null default 0 check (digest_day between 0 and 6),  -- 0 = Sunday
  last_digest_sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists cosmic_households_email_active
  on public.cosmic_households(lower(email))
  where status = 'active';

create index if not exists cosmic_households_stripe_sub_idx
  on public.cosmic_households(stripe_subscription_id);

alter table public.cosmic_households enable row level security;

create policy "service role full access on cosmic_households"
  on public.cosmic_households for all to service_role using (true) with check (true);

create policy "owner read by email match"
  on public.cosmic_households for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Attach legacy per-pet horoscope subscriptions to a household.
alter table public.horoscope_subscriptions
  add column if not exists household_id uuid references public.cosmic_households(id) on delete set null;

create index if not exists horoscope_subs_household_idx
  on public.horoscope_subscriptions(household_id);

-- Backfill: create one household per distinct email that has at least one
-- active horoscope subscription, so existing subscribers get grouped
-- automatically when we enable digest delivery.
insert into public.cosmic_households (email, status, monthly_cents)
select distinct lower(hs.email), 'active', null::integer
from public.horoscope_subscriptions hs
where hs.status = 'active'
  and not exists (
    select 1 from public.cosmic_households ch
    where lower(ch.email) = lower(hs.email) and ch.status = 'active'
  );

update public.horoscope_subscriptions hs
set household_id = ch.id
from public.cosmic_households ch
where hs.household_id is null
  and hs.status = 'active'
  and lower(ch.email) = lower(hs.email);

-- Automatic updated_at bump.
create or replace function public.bump_cosmic_household_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cosmic_household_updated_at on public.cosmic_households;
create trigger cosmic_household_updated_at
  before update on public.cosmic_households
  for each row execute function public.bump_cosmic_household_updated_at();

comment on table public.cosmic_households is
  'Cosmic Household — parent record for a buyer who subscribes to weekly horoscopes for 1+ pets. One row per buyer email, one Stripe subscription, one weekly digest email.';

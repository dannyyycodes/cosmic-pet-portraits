-- Cross-pet compatibility readings: "how two souls move through the world together"
-- Lets a buyer with 2+ pet reports add a reading that compares any pair of their pets.
-- A separate Claude call composes the compatibility content so the two underlying
-- reports stay untouched.

create table if not exists public.pet_compatibilities (
  id uuid primary key default gen_random_uuid(),
  pet_report_a_id uuid not null references public.pet_reports(id) on delete cascade,
  pet_report_b_id uuid not null references public.pet_reports(id) on delete cascade,
  -- Owner of the reading — one of the two source reports' emails. Used for
  -- ownership checks and weekly digest fan-out.
  email text not null,
  -- Generated reading payload, matches the shape the React viewer expects.
  reading_content jsonb,
  -- Payment + lifecycle
  payment_status text not null default 'paid',
  stripe_session_id text,
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'failed')),
  error_message text,
  -- Shareable token so a buyer can send their compatibility reading to
  -- the other pet's family without exposing the raw database id.
  share_token text unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Enforce a canonical ordering so (A,B) and (B,A) collapse into one row.
  constraint pet_compat_ordered_pair check (pet_report_a_id < pet_report_b_id),
  constraint pet_compat_distinct_pets check (pet_report_a_id <> pet_report_b_id)
);

create unique index if not exists pet_compat_unique_pair
  on public.pet_compatibilities(pet_report_a_id, pet_report_b_id);

create index if not exists pet_compat_email_idx
  on public.pet_compatibilities(email);

create index if not exists pet_compat_status_idx
  on public.pet_compatibilities(status);

-- RLS: readers of either source report can read the compatibility reading.
alter table public.pet_compatibilities enable row level security;

-- Service role does everything.
create policy "service role full access on pet_compatibilities"
  on public.pet_compatibilities
  for all
  to service_role
  using (true)
  with check (true);

-- Public read by share_token (so a redeem-like URL works without auth).
create policy "public read by share_token"
  on public.pet_compatibilities
  for select
  to anon, authenticated
  using (share_token is not null);

-- Authenticated users can read compatibilities whose email matches their auth email.
create policy "owners read by email match"
  on public.pet_compatibilities
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Automatic updated_at bump.
create or replace function public.bump_pet_compat_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pet_compat_updated_at on public.pet_compatibilities;
create trigger pet_compat_updated_at
  before update on public.pet_compatibilities
  for each row execute function public.bump_pet_compat_updated_at();

comment on table public.pet_compatibilities is
  'Cross-pet compatibility readings — composed from two existing pet_reports via a dedicated Claude prompt on the worker. Ordered pair constraint guarantees (A,B) = (B,A).';

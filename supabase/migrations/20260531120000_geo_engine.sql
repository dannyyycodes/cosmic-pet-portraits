-- Little Souls daily AI-SEO page engine — content_queue + seeds + ai_visibility
-- RLS locked to service-role. Columns match WF-2 (n8n) generator/publish flow.
create extension if not exists "uuid-ossp";

create table if not exists public.content_queue (
  id                  uuid primary key default uuid_generate_v4(),
  cluster             text not null,                 -- 'breed' | 'grief' | 'name' | 'gotcha'
  slug                text not null unique,          -- 'golden-retriever-aries'
  target_query        text,
  intent              text default 'informational',
  species             text,                          -- 'dog' | 'cat'
  breed               text,                          -- breed slug for breed cluster
  pet_name            text,
  birth_date          date,
  zodiac_sign         text,                          -- sign key e.g. 'aries'
  unique_data_payload jsonb not null default '{}'::jsonb,
  status              text not null default 'pending'
                        check (status in ('pending','processing','published','qa_failed','quarantined')),
  priority            smallint not null default 50,  -- higher = sooner
  gsc_impressions     integer not null default 0,
  cited_signal        text,
  qa_reasons          text,
  created_at          timestamptz not null default now(),
  claimed_at          timestamptz,
  published_at        timestamptz,
  live_url            text
);
create index if not exists content_queue_status_priority on public.content_queue (status, priority desc, created_at asc);
create index if not exists content_queue_cluster on public.content_queue (cluster);
alter table public.content_queue enable row level security;
drop policy if exists "service_role_all" on public.content_queue;
create policy "service_role_all" on public.content_queue to service_role using (true) with check (true);

create table if not exists public.keyword_seeds (
  id              uuid primary key default uuid_generate_v4(),
  cluster         text not null,
  query           text not null unique,
  monthly_volume  integer,
  gsc_impressions integer default 0,
  gsc_clicks      integer default 0,
  competition     text check (competition in ('low','medium','high')),
  promoted        boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists keyword_seeds_cluster on public.keyword_seeds (cluster, promoted);
alter table public.keyword_seeds enable row level security;
drop policy if exists "service_role_all" on public.keyword_seeds;
create policy "service_role_all" on public.keyword_seeds to service_role using (true) with check (true);

create table if not exists public.ai_visibility (
  id               uuid primary key default uuid_generate_v4(),
  content_queue_id uuid references public.content_queue(id) on delete cascade,
  checked_at       timestamptz not null default now(),
  model            text not null,
  query_used       text not null,
  cited            boolean not null default false,
  excerpt          text,
  notes            text
);
create index if not exists ai_visibility_cq on public.ai_visibility (content_queue_id);
alter table public.ai_visibility enable row level security;
drop policy if exists "service_role_all" on public.ai_visibility;
create policy "service_role_all" on public.ai_visibility to service_role using (true) with check (true);

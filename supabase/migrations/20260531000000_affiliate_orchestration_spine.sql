-- Affiliate Army — orchestration spine (additive, RLS-locked to service-role)
-- Plan: vault/projects/little-souls/marketing/affiliate-army-expansion-plan-2026-05-31.md
-- All tables are new; no existing table is altered except an additive column on affiliates.

-- 1) Person-level contact graph: every outreach source upserts here so we never
--    double-touch the same human across YouTube / IG / TikTok / blog / podcast.
create table if not exists public.outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  primary_handle text,
  platforms jsonb not null default '{}'::jsonb,   -- {youtube:"@x", instagram:"@y", website:"..."}
  niche text,
  source text,                                     -- youtube | instagram | tiktok | blog | podcast | linkbio
  best_channel text default 'email',
  status text not null default 'new',              -- new | queued | contacted | replied | converted | dead
  reply_status text,                               -- interested | not_interested | ooo | bounce | unsub
  suppressed boolean not null default false,
  touch_count integer not null default 0,
  last_touch_at timestamptz,
  prospect_id uuid,                                -- soft link to legacy influencer_prospects.id
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists outreach_contacts_email_uniq
  on public.outreach_contacts (lower(email)) where email is not null;
create unique index if not exists outreach_contacts_handle_uniq
  on public.outreach_contacts (lower(primary_handle)) where primary_handle is not null;
create index if not exists outreach_contacts_status_idx on public.outreach_contacts (status);
create index if not exists outreach_contacts_suppressed_idx on public.outreach_contacts (suppressed);

-- 2) Per-send ledger across all channels (attribution + central cap enforcement).
create table if not exists public.channel_sends (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.outreach_contacts(id) on delete cascade,
  channel text not null,                           -- email | ig | tiktok | comment
  domain text,                                     -- sending domain used (for warmup accounting)
  sent_at timestamptz not null default now(),
  replied boolean not null default false,
  claimed boolean not null default false,          -- clicked the free-reading claim link
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists channel_sends_contact_idx on public.channel_sends (contact_id);
create index if not exists channel_sends_sent_at_idx on public.channel_sends (sent_at);

-- 3) Hard suppression list — checked (case-insensitive) before EVERY send.
create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text,                                     -- unsubscribe | bounce | complaint | manual
  source text,
  created_at timestamptz not null default now()
);
create unique index if not exists suppression_list_email_uniq
  on public.suppression_list (lower(email));

-- 4) Customer flywheel: buyers we invite to become affiliates (warm channel).
create table if not exists public.customer_advocates (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  first_order_at timestamptz default now(),
  report_occasion text,                            -- memorial buyers are suppressed from the invite
  invite_sent_at timestamptz,
  invited_via text,                                -- resend_email | post_reveal
  became_affiliate boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customer_advocates_email_uniq
  on public.customer_advocates (lower(email));

-- 5) Attribution: where each affiliate came from.
alter table public.affiliates add column if not exists signup_source text;

-- Lock everything to service-role: enable RLS, add NO policies => anon/auth blocked,
-- service-role key (used by every edge fn) bypasses RLS.
alter table public.outreach_contacts enable row level security;
alter table public.channel_sends    enable row level security;
alter table public.suppression_list enable row level security;
alter table public.customer_advocates enable row level security;

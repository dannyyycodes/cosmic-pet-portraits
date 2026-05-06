-- Pawtrait content library — autonomous content engine
-- Storage for AI-generated pet imagery (portraits + customer-style scenes)
-- with per-platform captions, quality score, and used-on log.
--
-- Two tables:
--   pawtrait_library  — one row per generated image + its captions/metadata
--   pawtrait_post_log — append-only log of every post attempt across platforms

create table if not exists public.pawtrait_library (
  id uuid primary key default gen_random_uuid(),

  -- creative attributes
  pet_kind text not null check (pet_kind in ('dog','cat','small-pet','other')),
  breed text not null,
  pet_name text,

  -- two image modes:
  --   'portrait' = pure full-frame artistic portrait (canvas-style art only)
  --   'scene'    = realistic customer phone photo with the portrait in the room
  image_style text not null check (image_style in ('portrait','scene')),

  -- artistic style of the portrait itself
  -- e.g. 'watercolour-floral', 'cowboy-poster', 'art-deco-black-gold', 'noir-villain'
  art_style text not null,

  -- 'scene' mode only — leave null for 'portrait'
  home_setting text,
  pet_action text,
  canvas_format text,

  aspect_ratio text not null,            -- '1:1','2:3','3:4','9:16','16:9'

  -- generation prompts + narrative
  prompt text not null,
  negative_prompt text,
  backstory text,                        -- short pet narrative
  story_long text,                       -- longer Pinterest/blog version

  -- per-platform captions, jsonb so we can ship platforms incrementally
  -- shape:
  --   { pinterest: { title, description, board, destination_url, hashtags },
  --     instagram: { caption, hashtags },
  --     tiktok:    { caption, hashtags },
  --     facebook:  { caption },
  --     youtube:   { title, description, hashtags } }
  captions jsonb not null default '{}'::jsonb,

  -- storage (bucket: pawtrait-library)
  image_path text not null,
  image_url text not null,
  thumbnail_path text,
  thumbnail_url text,
  width int not null,
  height int not null,

  -- quality scoring (Filer)
  quality_score numeric,                 -- 0.0–1.0
  quality_notes text,
  approved boolean not null default false,
  approved_at timestamptz,

  -- generation metadata (audit)
  generated_by text,                     -- 'codex-cli','n8n-maker','manual'
  generation_model text,                 -- 'fal-ai/flux-pro/kontext','gpt-image-1','kie-nano-banana'
  generation_cost_usd numeric default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pawtrait_library_approved_created_idx
  on public.pawtrait_library (approved, created_at desc);

create index if not exists pawtrait_library_kind_style_idx
  on public.pawtrait_library (pet_kind, image_style);

create index if not exists pawtrait_library_breed_idx
  on public.pawtrait_library (breed);

create index if not exists pawtrait_library_art_style_idx
  on public.pawtrait_library (art_style);

-- Poster log — every attempt (success or failure). Posters check this before
-- re-using a library row.
create table if not exists public.pawtrait_post_log (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.pawtrait_library(id) on delete cascade,
  platform text not null,                -- 'pinterest','instagram','tiktok','facebook','youtube','reddit'
  account text,                          -- '@littlesoulsapp','@cat_aura','@loyal_bond0' etc
  status text not null check (status in ('queued','success','failed')),
  post_url text,
  post_id text,
  error_text text,
  posted_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

create index if not exists pawtrait_post_log_lib_platform_idx
  on public.pawtrait_post_log (library_id, platform, status);

create index if not exists pawtrait_post_log_platform_status_idx
  on public.pawtrait_post_log (platform, status, posted_at desc);

-- Row-level security: service role only. Public gallery uses the read API,
-- never the table directly.
alter table public.pawtrait_library enable row level security;
alter table public.pawtrait_post_log enable row level security;

create policy "service_role_all_library"
  on public.pawtrait_library for all
  to service_role
  using (true) with check (true);

create policy "service_role_all_post_log"
  on public.pawtrait_post_log for all
  to service_role
  using (true) with check (true);

-- Optional: a read policy for anon (for the public gallery), restricted to
-- approved rows only and excluding the prompt + story_long (those are spoilers).
-- Front-end will use the read API which already strips those fields, but this
-- gives us a safety net if someone ever queries with anon by mistake.
create policy "anon_read_approved_library"
  on public.pawtrait_library for select
  to anon
  using (approved = true);

-- updated_at trigger
create or replace function public.tg_pawtrait_library_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists pawtrait_library_touch on public.pawtrait_library;
create trigger pawtrait_library_touch
  before update on public.pawtrait_library
  for each row execute function public.tg_pawtrait_library_touch();

-- Helper view: unused rows per platform.
-- Posters call /api/portraits?action=library op=list&platform=pinterest&limit=10
-- which selects from this view filtered + ordered.
create or replace view public.pawtrait_library_unused as
  select l.*
  from public.pawtrait_library l
  where l.approved = true;
-- The "unused per platform" filter is applied in the API layer because it's
-- platform-specific. This view just gives the approved subset.

comment on table public.pawtrait_library is
  'Pawtraits content library — AI-generated pet imagery used for autonomous social posting.';
comment on table public.pawtrait_post_log is
  'Append-only log of every post attempt. Posters check here before re-using a library row.';

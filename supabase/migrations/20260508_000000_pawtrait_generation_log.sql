-- Pawtrait generation log
--
-- Audit trail for every customer portrait generation. Captures inputs, the
-- pre-gen Vision identification, the prompt that was sent to fal, the output,
-- a post-gen Vision re-pass, and the drift score that quantifies how far the
-- rendered pet drifted from the source.
--
-- Used by the auto-regen path in api/portraits.ts → handleGenerate: if the
-- drift score exceeds DRIFT_THRESHOLD (0.3) we update this row, retry once
-- with a stronger anchor prompt, and (if still drifted) refund the credit
-- and surface a failure message to the customer.
--
-- Service-role gets full access. Authenticated users can read their own rows
-- only — useful for "show me my generation history" UI later.
--
-- Created: 2026-05-08

create table if not exists public.pawtrait_generation_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id),
  -- inputs
  source_image_urls text[] not null,
  pet_count int not null default 1,
  style_id text,
  theme_id text,
  custom_prompt text,
  -- pre-gen vision (one entry per pet)
  source_vision jsonb,                     -- [{breed, furColor, eyeColor, earShape, distinguishing, species}, ...]
  -- prompt that was sent to fal
  prompt_sent text,
  negative_prompt text,
  -- output
  output_image_url text,
  output_vision jsonb,                     -- post-gen vision result, same shape as source_vision
  -- drift analysis
  drift_score numeric,                     -- 0.0 (perfect match) to 1.0 (totally different)
  drift_flags jsonb,                       -- {breed_changed: true, fur_diverged: false, ...}
  regen_count int not null default 0,
  -- outcome
  status text not null check (status in (
    'pending',
    'vision_pre_done',
    'generated',
    'vision_post_done',
    'drift_detected',
    'regen_triggered',
    'success',
    'failed',
    'refunded'
  )),
  error_text text,
  -- cost + timing
  cost_usd numeric,
  duration_ms int,
  -- metadata
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_pawtrait_gen_log_user
  on public.pawtrait_generation_log (user_id, created_at desc);

create index if not exists idx_pawtrait_gen_log_status
  on public.pawtrait_generation_log (status, created_at desc);

create index if not exists idx_pawtrait_gen_log_drift
  on public.pawtrait_generation_log (drift_score)
  where drift_score > 0.3;

alter table public.pawtrait_generation_log enable row level security;

-- Service-role has full access (used by api/portraits.ts via the
-- service-role client; bypasses RLS but the policy is here for completeness).
create policy "service_role_all_pawtrait_generation_log"
  on public.pawtrait_generation_log for all
  to service_role
  using (true) with check (true);

-- Authenticated users can read their own rows only.
create policy "authenticated_read_own_pawtrait_generation_log"
  on public.pawtrait_generation_log for select
  to authenticated
  using (user_id = auth.uid());

comment on table public.pawtrait_generation_log is
  'Audit trail for every Pawtraits portrait generation. Captures pre/post Vision pre-pass, drift score, regen attempts, and refund outcome.';

-- Little Souls FB Auto-Poster — fb_posts queue table
-- Run this once in Supabase SQL editor (project: aduibsyrnenzobuyetmn)
-- Created: 2026-05-09

create type fb_post_status as enum (
  'pending_approval',  -- queued, waiting for Telegram approve/reject
  'approved',          -- approved, scheduled, awaiting publish window
  'rejected',          -- killed by approval flow
  'flagged',           -- voice-check or ethics-gate failed
  'publishing',        -- in flight (Blotato call started)
  'posted',            -- published successfully
  'failed'             -- publish error
);

create type fb_post_format as enum (
  'reel',
  'carousel',
  'photo',
  'album',
  'video'
);

create table fb_posts (
  id                  uuid primary key default gen_random_uuid(),
  slot                text not null,                       -- reveal-monday, breed-pride-tuesday, etc.
  cast_member         text,                                -- clover, atlas, hazel, beans, mochi, or null for real-customer
  style               text,                                -- watercolour-floral, oil-on-linen, etc.
  format              fb_post_format not null,
  status              fb_post_status not null default 'pending_approval',

  caption             text not null,
  caption_word_count  int generated always as (cardinality(string_to_array(trim(caption), ' '))) stored,
  first_comment       text not null,
  self_reply          text,

  image_urls          text[] not null,                     -- Supabase storage public URLs in carousel order
  image_count         int generated always as (cardinality(image_urls)) stored,

  story_anchor        text,
  wisdom_snippet      text,
  connector_pattern   text,
  ethics_gate         jsonb,                               -- Five Love Test results for memorial slot

  scheduled_for       timestamptz,                         -- when to publish; null = ASAP after approval
  posted_at           timestamptz,
  blotato_submission_id text,                              -- Blotato API submission tracking
  fb_post_id          text,                                -- FB-side post ID after successful publish
  fb_first_comment_id text,                                -- after first-comment posted via Graph API
  fb_self_reply_id    text,                                -- after self-reply posted

  voice_check_passed  boolean,
  voice_check_warnings text[],
  manifest_path       text,                                -- original on-disk manifest for traceability

  approval_sent_at    timestamptz,                         -- when Telegram approval was sent
  approved_at         timestamptz,
  approved_by         text,                                -- 'telegram_tap' | 'manual' | etc.
  rejection_reason    text,

  failure_reason      text,
  retry_count         int default 0,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index fb_posts_status_scheduled_idx on fb_posts (status, scheduled_for);
create index fb_posts_slot_created_idx on fb_posts (slot, created_at desc);
create index fb_posts_pending_approval_idx on fb_posts (created_at desc) where status = 'pending_approval';
create index fb_posts_due_idx on fb_posts (scheduled_for) where status = 'approved';

-- updated_at trigger
create or replace function fb_posts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger fb_posts_set_updated_at
  before update on fb_posts
  for each row execute function fb_posts_set_updated_at();

-- RLS: service role only (n8n uses service role key)
alter table fb_posts enable row level security;
create policy "service role full access"
  on fb_posts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Convenience view for pending approvals (Telegram bot reads this)
create or replace view fb_posts_pending as
select
  id, slot, cast_member, style, format,
  caption, first_comment, self_reply,
  image_urls, image_count,
  wisdom_snippet, story_anchor,
  voice_check_passed, voice_check_warnings,
  ethics_gate,
  created_at
from fb_posts
where status = 'pending_approval'
order by created_at asc;

-- Convenience view for due-to-publish (FB Auto-Poster cron reads this)
create or replace view fb_posts_due as
select
  id, slot, cast_member,
  caption, first_comment, self_reply,
  image_urls, image_count, format,
  scheduled_for
from fb_posts
where status = 'approved'
  and (scheduled_for is null or scheduled_for <= now())
order by scheduled_for asc nulls first;

comment on table fb_posts is 'Little Souls Facebook content queue. Codex generates manifests; queue-post.cjs uploads them as pending_approval; n8n FB Auto-Poster handles Telegram approval + Blotato publish + Graph API comment thread.';

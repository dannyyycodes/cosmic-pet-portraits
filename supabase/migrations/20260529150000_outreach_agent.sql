-- Affiliate-recruitment outreach agent — schema
-- 2026-05-29

-- influencer_prospects: outreach-agent columns
ALTER TABLE public.influencer_prospects ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email';
ALTER TABLE public.influencer_prospects ADD COLUMN IF NOT EXISTS shlink_slug TEXT;
ALTER TABLE public.influencer_prospects ADD COLUMN IF NOT EXISTS email_valid BOOLEAN;
ALTER TABLE public.influencer_prospects ADD COLUMN IF NOT EXISTS followup_stage INTEGER DEFAULT 0;
ALTER TABLE public.influencer_prospects ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ;

-- outreach_touches: log every send / follow-up / reply (one row per touch)
CREATE TABLE IF NOT EXISTS public.outreach_touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES public.influencer_prospects(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- initial | followup_d3 | followup_d7 | reply
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'sent',         -- sent | failed | replied
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outreach_touches_prospect ON public.outreach_touches(prospect_id);

-- outreach_warmup: daily send-cap ramp (protects DKIM reputation)
CREATE TABLE IF NOT EXISTS public.outreach_warmup (
  day DATE PRIMARY KEY,
  cap INTEGER NOT NULL,
  sent INTEGER DEFAULT 0
);

-- affiliates: which channel/prospect recruited them (per-avenue revenue attribution)
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS recruited_via_channel TEXT;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS recruited_prospect_id UUID;

-- Memorial follow-up touchpoints — scheduling table
--
-- The memorial product (distinct from the cosmic reading) sends the owner
-- gentle follow-ups on a slow cadence:
--   • ~30 days after the reading is delivered — "we thought of {pet} today"
--   • Annually on the pet's birthday
--   • Annually on the anniversary of their passing
--
-- The worker inserts three rows into this table when a memorial report saves.
-- A separate sender (n8n cron / edge function) reads rows where
-- sent_at IS NULL AND scheduled_for <= now() and emails + marks them sent.
--
-- Emailing is NOT wired in this migration — only the schema + insert path.
-- Wire the sender separately (n8n workflow or Supabase cron edge function).

CREATE TABLE IF NOT EXISTS public.memorial_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.pet_reports(id) ON DELETE CASCADE,

  -- Which of the three memorial touchpoints this row represents.
  touchpoint_type text NOT NULL
    CHECK (touchpoint_type IN ('thirty_day', 'anniversary_birth', 'anniversary_passing')),

  -- When it should be sent. For 30-day this is set at insert; for anniversaries
  -- the sender advances this forward by one year after each send.
  scheduled_for timestamptz NOT NULL,

  -- Set when successfully emailed. Null = pending.
  sent_at timestamptz,

  -- Denormalised for the sender's convenience (avoids a join on every cron tick).
  email text,
  pet_name text,
  pronoun_subject text,        -- "he" / "she" / "they"
  pet_birth_date date,
  pet_passed_date date,

  -- Free-form payload the sender can use when composing the email.
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup: "what's pending to send right now?"
CREATE INDEX IF NOT EXISTS idx_memorial_touchpoints_pending
  ON public.memorial_touchpoints (scheduled_for)
  WHERE sent_at IS NULL;

-- Fast lookup by report_id (for admin audit + cascade delete)
CREATE INDEX IF NOT EXISTS idx_memorial_touchpoints_report
  ON public.memorial_touchpoints (report_id);

-- Prevent duplicate insert of the same touchpoint type per report.
CREATE UNIQUE INDEX IF NOT EXISTS uq_memorial_touchpoints_report_type
  ON public.memorial_touchpoints (report_id, touchpoint_type);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.set_memorial_touchpoints_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memorial_touchpoints_updated_at
  ON public.memorial_touchpoints;
CREATE TRIGGER trg_memorial_touchpoints_updated_at
  BEFORE UPDATE ON public.memorial_touchpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_memorial_touchpoints_updated_at();

-- RLS: lock down; only service role should read/write touchpoints.
ALTER TABLE public.memorial_touchpoints ENABLE ROW LEVEL SECURITY;
-- No policy = default deny for anon + authenticated. Service role bypasses RLS.

COMMENT ON TABLE public.memorial_touchpoints IS
  'Scheduled memorial follow-up emails (30-day, anniversary of birth, anniversary of passing). Sender reads where sent_at IS NULL AND scheduled_for <= now().';

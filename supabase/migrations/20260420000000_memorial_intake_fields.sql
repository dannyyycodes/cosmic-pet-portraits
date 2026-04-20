-- Memorial intake fields on pet_reports
--
-- The memorial reading prompt (worker/memorial-prompt.ts) reads three optional
-- fields when composing a memorial reading:
--
--   • passed_date       — date the pet passed; drives anniversary touchpoints
--                         and grounds the reading's sense of "when"
--   • remembered_by     — a single word (~80 chars) the owner chose as the
--                         essence of who they were ("golden light", "gentle")
--   • favorite_memory   — a small, specific moment the owner wants held in
--                         the reading (~500 chars)
--
-- Worker already reads reportRow.passed_date / remembered_by / favorite_memory
-- with empty-string fallback. This migration adds the columns so those
-- fallbacks stop being hit.
--
-- All three fields are optional and nullable. No defaults. Non-destructive.

ALTER TABLE public.pet_reports
  ADD COLUMN IF NOT EXISTS passed_date DATE,
  ADD COLUMN IF NOT EXISTS remembered_by TEXT,
  ADD COLUMN IF NOT EXISTS favorite_memory TEXT;

COMMENT ON COLUMN public.pet_reports.passed_date IS
  'Date the pet passed (memorial mode only). Drives anniversary touchpoints and grounds the memorial reading.';

COMMENT ON COLUMN public.pet_reports.remembered_by IS
  'Single-word or short phrase the owner chose as the pet''s essence. Memorial mode only.';

COMMENT ON COLUMN public.pet_reports.favorite_memory IS
  'A small, specific moment the owner wants held in the memorial reading. Memorial mode only.';

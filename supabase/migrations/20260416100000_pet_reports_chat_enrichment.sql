-- Chat enrichment columns on pet_reports.
-- photo_description: Gemini 2.0 Flash vision description of the pet's uploaded
--   photo, used by soul-chat so the pet can reference its own appearance
--   naturally ("my one floppy ear", "the fluffy tummy you love").
-- owner_memory: one memory the owner wrote during intake that's SO them —
--   injected into the chat prompt as a FACT the pet can casually reference.
--
-- Both nullable, generated lazily / optionally at other layers.

ALTER TABLE pet_reports
  ADD COLUMN IF NOT EXISTS photo_description text,
  ADD COLUMN IF NOT EXISTS owner_memory text;

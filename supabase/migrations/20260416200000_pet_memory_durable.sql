-- Durable, server-side "what your pet remembers about you" memory.
--
-- Replaces the client-side localStorage regex memory (see soul-chat.html
-- MEMORY_KEY_PREFIX) with an LLM-summarised payload stored on the report.
-- Injected back into the chat system prompt so the pet can *actually*
-- reference memories in replies, not just list them in a panel.
--
-- Shape:
--   {
--     "summary": "warm prose — things your pet has learned about you",
--     "facts": ["their mum is named Sarah", "they're training for a marathon"],
--     "messages_summarized": 20,      -- checkpoint so we only re-summarise once per 10-msg batch
--     "updated_at": "2026-04-16T…"
--   }

ALTER TABLE pet_reports
  ADD COLUMN IF NOT EXISTS pet_memory jsonb;

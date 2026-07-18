-- Persist the discovery/memorial register (and first-party utm) onto the
-- email_subscribers lead so free-reading leads can be segmented into the right
-- drip instead of every lead landing in the living-pet welcome sequence.
-- Additive + idempotent (safe to re-run).
--
--   intent_register — which register the visitor chose (memorial vs discovery).
--     Existing rows backfill to 'discovery'. The track-subscriber edge function
--     writes it UPGRADE-ONLY: a memorial row is never downgraded to discovery.
--   utm — first-party attribution the client already collects via getUtm().
ALTER TABLE public.email_subscribers
  ADD COLUMN IF NOT EXISTS intent_register text NOT NULL DEFAULT 'discovery';

ALTER TABLE public.email_subscribers
  ADD COLUMN IF NOT EXISTS utm jsonb;

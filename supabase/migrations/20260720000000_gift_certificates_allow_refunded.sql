-- BLOCKER 3: allow gift_certificates.payment_status = 'refunded'.
--
-- On a gift refund / chargeback, stripe-webhook now flips the cert to
-- payment_status='refunded' so redeem-gift + validate-gift-code (both require
-- 'paid') stop honouring it. Previously refunded gift codes stayed redeemable
-- forever.
--
-- payment_status is a plain free-text column (see 20260715160000 —
-- `text NOT NULL DEFAULT 'pending'`, no CHECK constraint), so 'refunded' is
-- ALREADY a valid value and this migration is a no-op on the current schema.
-- It exists to (a) document the new allowed value and (b) defensively widen the
-- column should a value-restricting CHECK constraint ever be added to this
-- table: the DO block below drops any CHECK constraint on gift_certificates
-- whose definition references payment_status but does not already permit
-- 'refunded'. Idempotent and safe to re-run.

DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT c.conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'gift_certificates'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%payment_status%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%refunded%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.gift_certificates DROP CONSTRAINT %I',
      con.conname
    );
    RAISE NOTICE 'Dropped payment_status CHECK constraint % to allow refunded', con.conname;
  END LOOP;
END $$;

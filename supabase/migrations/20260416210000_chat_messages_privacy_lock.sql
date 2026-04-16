-- Privacy lock on chat_messages.
--
-- Previously chat_messages had anon SELECT and INSERT policies with USING/WITH
-- CHECK (true), meaning anyone holding the anon key + a guessed order UUID
-- could read or write any user's private chat transcript. All real reads and
-- writes now go through the soul-chat and get-chat-history edge functions,
-- which verify ownership (email match OR valid share_token) and use the
-- service role to bypass RLS internally.
--
-- Keeping the row-level policies as SELECT USING (false) effectively locks
-- anon clients out while still allowing service-role writes from the edge
-- functions.

DROP POLICY IF EXISTS "Allow anonymous read" ON chat_messages;
DROP POLICY IF EXISTS "Allow anonymous insert" ON chat_messages;

CREATE POLICY "Deny anon access to chat_messages"
  ON chat_messages
  FOR ALL
  USING (false)
  WITH CHECK (false);

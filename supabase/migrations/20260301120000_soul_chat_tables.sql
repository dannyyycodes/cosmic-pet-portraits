-- Soul Chat: chat_credits table
CREATE TABLE IF NOT EXISTS chat_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  credits_remaining integer DEFAULT 15 NOT NULL,
  credits_total_purchased integer DEFAULT 0 NOT NULL,
  is_unlimited boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE chat_credits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (the chat page uses anon key)
CREATE POLICY "Allow anonymous read" ON chat_credits FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON chat_credits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON chat_credits FOR UPDATE USING (true);

-- Index for fast lookups
CREATE INDEX idx_chat_credits_order_id ON chat_credits(order_id);

-- Soul Chat: chat_messages table (for conversation history/analytics)
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous insert" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read" ON chat_messages FOR SELECT USING (true);
CREATE INDEX idx_chat_messages_order_id ON chat_messages(order_id);

-- RPC function to increment chat credits
CREATE OR REPLACE FUNCTION increment_chat_credits(p_order_id uuid, p_amount integer)
RETURNS void AS $$
  UPDATE chat_credits
  SET credits_remaining = credits_remaining + p_amount,
      credits_total_purchased = credits_total_purchased + p_amount,
      updated_at = now()
  WHERE order_id = p_order_id;
$$ LANGUAGE sql;


CREATE TABLE IF NOT EXISTS chat_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES pet_reports(id) ON DELETE CASCADE,
  credits_remaining integer DEFAULT 15 NOT NULL,
  credits_total_purchased integer DEFAULT 0 NOT NULL,
  is_unlimited boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(order_id)
);
ALTER TABLE chat_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON chat_credits FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON chat_credits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON chat_credits FOR UPDATE USING (true);
CREATE INDEX idx_chat_credits_order_id ON chat_credits(order_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES pet_reports(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous insert" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read" ON chat_messages FOR SELECT USING (true);
CREATE INDEX idx_chat_messages_order_id ON chat_messages(order_id);

CREATE OR REPLACE FUNCTION increment_chat_credits(p_order_id uuid, p_amount integer)
RETURNS void AS $$
  UPDATE chat_credits
  SET credits_remaining = credits_remaining + p_amount,
      credits_total_purchased = credits_total_purchased + p_amount,
      updated_at = now()
  WHERE order_id = p_order_id;
$$ LANGUAGE sql;

-- Create table to track scheduled email replies
CREATE TABLE public.scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  original_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role only for scheduled emails" 
ON public.scheduled_emails 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create table to track customer contact history
CREATE TABLE public.contact_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  is_refund_request BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role only for contact history" 
ON public.contact_history 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Index for quick lookups
CREATE INDEX idx_contact_history_email ON public.contact_history(email);
CREATE INDEX idx_scheduled_emails_send_at ON public.scheduled_emails(send_at) WHERE sent_at IS NULL;
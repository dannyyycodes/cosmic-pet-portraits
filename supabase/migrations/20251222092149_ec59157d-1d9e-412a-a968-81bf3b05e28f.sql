-- Create page analytics table to track user behavior
CREATE TABLE public.page_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'scroll_depth', 'section_view', 'cta_click', 'error'
  page_path TEXT NOT NULL,
  event_data JSONB, -- flexible data like scroll %, section name, error message
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT
);

-- Enable RLS but allow anonymous inserts (tracking should work for all visitors)
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics (visitors aren't logged in)
CREATE POLICY "Anyone can insert analytics" 
ON public.page_analytics 
FOR INSERT 
WITH CHECK (true);

-- Only allow reading via service role (admin dashboard)
CREATE POLICY "Service role can read analytics" 
ON public.page_analytics 
FOR SELECT 
USING (false);

-- Create index for efficient querying
CREATE INDEX idx_page_analytics_created_at ON public.page_analytics(created_at DESC);
CREATE INDEX idx_page_analytics_event_type ON public.page_analytics(event_type);
CREATE INDEX idx_page_analytics_session ON public.page_analytics(session_id);
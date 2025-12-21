-- Create influencer prospects table
CREATE TABLE public.influencer_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  website TEXT,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  niche TEXT, -- dog, cat, exotic, general
  follower_estimate TEXT, -- micro, small, medium, large
  content_summary TEXT, -- AI-generated summary of their content
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, replied, converted, rejected
  pitch_content TEXT,
  pitch_sent_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  source TEXT DEFAULT 'firecrawl', -- firecrawl, manual
  priority INTEGER DEFAULT 0, -- higher = more priority
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.influencer_prospects ENABLE ROW LEVEL SECURITY;

-- Service role only access (admin feature)
CREATE POLICY "Service role only for influencer prospects"
  ON public.influencer_prospects
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create index for status filtering
CREATE INDEX idx_influencer_prospects_status ON public.influencer_prospects(status);

-- Create index for email uniqueness check
CREATE INDEX idx_influencer_prospects_email ON public.influencer_prospects(email);

-- Add trigger for updated_at
CREATE TRIGGER update_influencer_prospects_updated_at
  BEFORE UPDATE ON public.influencer_prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
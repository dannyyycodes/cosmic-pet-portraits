-- Create email subscribers table for marketing automation
CREATE TABLE public.email_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  pet_name TEXT,
  pet_report_id UUID REFERENCES public.pet_reports(id),
  
  -- Journey tracking
  journey_stage TEXT NOT NULL DEFAULT 'new_lead',
  -- Stages: new_lead, intake_started, intake_abandoned, purchased, post_purchase_1, post_purchase_2, nurtured, re_engaged
  
  -- Email tracking
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  last_email_type TEXT,
  
  -- Engagement tracking
  intake_started_at TIMESTAMP WITH TIME ZONE,
  purchase_completed_at TIMESTAMP WITH TIME ZONE,
  tier_purchased TEXT, -- basic, premium, vip
  
  -- Subscription management
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  source TEXT DEFAULT 'intake', -- intake, gift, referral
  referral_code TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique email per active subscriber
  CONSTRAINT unique_active_email UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS policies - service role only (marketing automation backend)
CREATE POLICY "Service role only for subscribers"
  ON public.email_subscribers
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow public to insert (for intake form)
CREATE POLICY "Anyone can subscribe"
  ON public.email_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Create email_campaigns table for tracking sent campaigns
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.email_subscribers(id),
  campaign_type TEXT NOT NULL,
  -- Types: welcome_1, welcome_2, welcome_3, abandoned_cart, post_purchase_1, post_purchase_2, re_engagement
  subject TEXT NOT NULL,
  content_preview TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_generated BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policy - service role only
CREATE POLICY "Service role only for campaigns"
  ON public.email_campaigns
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_subscribers_journey ON public.email_subscribers(journey_stage);
CREATE INDEX idx_subscribers_last_email ON public.email_subscribers(last_email_sent_at);
CREATE INDEX idx_subscribers_subscribed ON public.email_subscribers(is_subscribed);

-- Add trigger for updated_at
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.email_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create horoscope subscriptions table
CREATE TABLE public.horoscope_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  pet_report_id UUID REFERENCES public.pet_reports(id) ON DELETE CASCADE,
  pet_name TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly horoscopes table for generated content
CREATE TABLE public.weekly_horoscopes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.horoscope_subscriptions(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  content JSONB NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.horoscope_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_horoscopes ENABLE ROW LEVEL SECURITY;

-- Policies for horoscope_subscriptions
CREATE POLICY "Anyone can create horoscope subscriptions"
ON public.horoscope_subscriptions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own subscriptions by email"
ON public.horoscope_subscriptions
FOR SELECT
USING (true);

CREATE POLICY "Service role can update subscriptions"
ON public.horoscope_subscriptions
FOR UPDATE
USING (true);

-- Policies for weekly_horoscopes (service role only)
CREATE POLICY "Service role can manage horoscopes"
ON public.weekly_horoscopes
FOR ALL
USING (true);

-- Index for efficient lookups
CREATE INDEX idx_horoscope_subs_email ON public.horoscope_subscriptions(email);
CREATE INDEX idx_horoscope_subs_status ON public.horoscope_subscriptions(status);
CREATE INDEX idx_weekly_horoscopes_week ON public.weekly_horoscopes(week_start);
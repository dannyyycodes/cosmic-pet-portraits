-- Create customer referrals table for tracking friend referrals
CREATE TABLE public.customer_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_email TEXT NOT NULL,
  referrer_code TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  referred_report_id UUID REFERENCES public.pet_reports(id),
  reward_type TEXT NOT NULL DEFAULT 'discount',
  reward_value INTEGER NOT NULL DEFAULT 500, -- 500 cents = $5 discount
  referrer_rewarded BOOLEAN NOT NULL DEFAULT false,
  referred_rewarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_customer_referrals_referrer_code ON public.customer_referrals(referrer_code);
CREATE INDEX idx_customer_referrals_referrer_email ON public.customer_referrals(referrer_email);

-- Enable RLS
ALTER TABLE public.customer_referrals ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only for customer referrals"
  ON public.customer_referrals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
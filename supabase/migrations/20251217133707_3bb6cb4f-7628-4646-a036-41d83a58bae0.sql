-- Create table for pet intake submissions
CREATE TABLE public.pet_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  gender TEXT,
  birth_date DATE,
  birth_location TEXT,
  soul_type TEXT,
  superpower TEXT,
  stranger_reaction TEXT,
  occasion_mode TEXT,
  payment_status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  report_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pet_reports ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for checkout flow before auth)
CREATE POLICY "Anyone can create pet reports" 
ON public.pet_reports 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own reports by email
CREATE POLICY "Users can view reports by email" 
ON public.pet_reports 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pet_reports_updated_at
BEFORE UPDATE ON public.pet_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
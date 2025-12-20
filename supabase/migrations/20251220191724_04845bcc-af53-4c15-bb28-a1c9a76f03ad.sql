-- Create testimonials table for collecting user reviews
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.pet_reports(id),
  email TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  species TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  would_recommend BOOLEAN DEFAULT true,
  improvement_feedback TEXT,
  favorite_feature TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  photo_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access testimonials"
  ON public.testimonials
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anyone can insert their own testimonial
CREATE POLICY "Anyone can submit testimonials"
  ON public.testimonials
  FOR INSERT
  WITH CHECK (true);

-- Only approved testimonials are publicly readable (for homepage)
CREATE POLICY "Approved testimonials are public"
  ON public.testimonials
  FOR SELECT
  USING (is_approved = true);

-- Create index for faster queries
CREATE INDEX idx_testimonials_approved ON public.testimonials(is_approved, is_featured);
CREATE INDEX idx_testimonials_report ON public.testimonials(report_id);
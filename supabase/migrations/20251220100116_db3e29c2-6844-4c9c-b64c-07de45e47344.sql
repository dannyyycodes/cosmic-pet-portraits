-- Add columns to store pet photo and AI-generated portrait
ALTER TABLE public.pet_reports 
ADD COLUMN IF NOT EXISTS pet_photo_url TEXT,
ADD COLUMN IF NOT EXISTS portrait_url TEXT;

-- Add index for reports with portraits (for admin views)
CREATE INDEX IF NOT EXISTS idx_pet_reports_portrait ON public.pet_reports (portrait_url) WHERE portrait_url IS NOT NULL;
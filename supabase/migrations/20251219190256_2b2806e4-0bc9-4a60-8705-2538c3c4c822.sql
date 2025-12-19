-- Add share_token column to pet_reports for public sharing
ALTER TABLE public.pet_reports 
ADD COLUMN IF NOT EXISTS share_token text UNIQUE;

-- Add language column for multi-language support
ALTER TABLE public.pet_reports 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Create an index for faster share token lookups
CREATE INDEX IF NOT EXISTS idx_pet_reports_share_token ON public.pet_reports(share_token) WHERE share_token IS NOT NULL;
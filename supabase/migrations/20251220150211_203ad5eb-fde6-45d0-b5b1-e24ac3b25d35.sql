-- Add birth_time column to pet_reports for more accurate astrological calculations
ALTER TABLE public.pet_reports 
ADD COLUMN IF NOT EXISTS birth_time text;
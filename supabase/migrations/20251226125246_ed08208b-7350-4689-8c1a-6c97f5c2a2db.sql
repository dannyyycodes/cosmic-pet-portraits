-- Add owner birth details to pet_reports for compatibility calculations
ALTER TABLE public.pet_reports 
ADD COLUMN owner_birth_date date,
ADD COLUMN owner_birth_time text,
ADD COLUMN owner_birth_location text,
ADD COLUMN owner_name text;

-- Add compatibility scores (calculated and stored for quick access)
ALTER TABLE public.pet_reports 
ADD COLUMN owner_compatibility_score integer,
ADD COLUMN owner_compatibility_insights jsonb;

-- Add index for reports with owner data (for future queries)
CREATE INDEX idx_pet_reports_owner_birth ON public.pet_reports(owner_birth_date) WHERE owner_birth_date IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.pet_reports.owner_birth_date IS 'Optional: Owner birth date for compatibility calculation';
COMMENT ON COLUMN public.pet_reports.owner_birth_time IS 'Optional: Owner birth time for more accurate compatibility';
COMMENT ON COLUMN public.pet_reports.owner_birth_location IS 'Optional: Owner birth location for full chart calculation';
COMMENT ON COLUMN public.pet_reports.owner_name IS 'Optional: Owner name for personalized compatibility display';
COMMENT ON COLUMN public.pet_reports.owner_compatibility_score IS 'Calculated compatibility percentage (0-100)';
COMMENT ON COLUMN public.pet_reports.owner_compatibility_insights IS 'JSON containing detailed compatibility insights';
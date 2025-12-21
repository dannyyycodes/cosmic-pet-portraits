-- Add column to store per-pet tier configuration for multi-pet gifts
ALTER TABLE public.gift_certificates 
ADD COLUMN IF NOT EXISTS gift_pets_json JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.gift_certificates.gift_pets_json IS 'JSON array storing individual pet tier configuration for multi-pet gifts, e.g., [{"id":"uuid","tier":"portrait"},{"id":"uuid","tier":"essential"}]';
-- Add gift_tier column to gift_certificates to track which tier was purchased
ALTER TABLE public.gift_certificates
ADD COLUMN gift_tier text;

-- Create index for faster lookups by tier
CREATE INDEX idx_gift_certificates_gift_tier ON public.gift_certificates(gift_tier);

-- Add comment for clarity
COMMENT ON COLUMN public.gift_certificates.gift_tier IS 'The product tier this gift is valid for: essential, portrait, or vip';
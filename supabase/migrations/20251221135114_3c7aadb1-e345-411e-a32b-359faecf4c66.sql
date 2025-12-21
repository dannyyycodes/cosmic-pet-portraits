-- Add pet_count column to gift_certificates for multi-pet gifts
ALTER TABLE public.gift_certificates 
ADD COLUMN IF NOT EXISTS pet_count integer NOT NULL DEFAULT 1;
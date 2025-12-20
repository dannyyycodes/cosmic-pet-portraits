-- Update default commission rate to 50% for new affiliates
ALTER TABLE public.affiliates ALTER COLUMN commission_rate SET DEFAULT 0.50;

-- Also update any existing affiliates that have 35% to 50%
UPDATE public.affiliates SET commission_rate = 0.50 WHERE commission_rate = 0.35;
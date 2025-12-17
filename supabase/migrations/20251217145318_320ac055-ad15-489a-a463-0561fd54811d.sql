-- Coupons table for discount codes
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  min_purchase_cents INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gift certificates table
CREATE TABLE public.gift_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  purchaser_email TEXT NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  gift_message TEXT,
  amount_cents INTEGER NOT NULL,
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by_report_id UUID REFERENCES public.pet_reports(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Upsales/products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  product_type TEXT NOT NULL, -- 'base_report', 'premium', 'bundle', 'addon'
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items for tracking purchases
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.pet_reports(id),
  product_id UUID REFERENCES public.products(id),
  price_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  coupon_id UUID REFERENCES public.coupons(id),
  gift_certificate_id UUID REFERENCES public.gift_certificates(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Coupons: public read for validation
CREATE POLICY "Anyone can validate coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

-- Gift certificates: read by code or email
CREATE POLICY "Anyone can validate gift certificates" ON public.gift_certificates
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create gift certificates" ON public.gift_certificates
  FOR INSERT WITH CHECK (true);

-- Products: public read
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (is_active = true);

-- Order items: insert only
CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- Insert default products
INSERT INTO public.products (name, description, price_cents, product_type, features) VALUES
  ('Cosmic Pet Report', 'Your pet''s complete astrological profile', 1497, 'base_report', '["Zodiac Analysis", "Personality Traits", "Care Tips"]'),
  ('Premium Cosmic Report', 'Extended report with compatibility & life path', 2997, 'premium', '["Everything in Basic", "Compatibility Analysis", "Life Path Prediction", "Monthly Forecasts", "Priority Delivery"]'),
  ('Cosmic Family Bundle', 'Reports for up to 3 pets + family compatibility', 3997, 'bundle', '["3 Full Reports", "Family Dynamics", "Pet-to-Pet Compatibility", "Household Harmony Guide"]'),
  ('Digital Wallpaper Pack', 'Custom cosmic artwork for all devices', 497, 'addon', '["Phone Wallpaper", "Desktop Background", "Social Media Graphics"]'),
  ('Yearly Cosmic Updates', '12 months of monthly cosmic forecasts', 1497, 'addon', '["Monthly Email Updates", "Seasonal Predictions", "Lucky Days Calendar"]');

-- Create indexes
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_gift_certificates_code ON public.gift_certificates(code);
CREATE INDEX idx_products_type ON public.products(product_type);
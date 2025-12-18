-- Create admin_users table for affiliate dashboard access
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no public access)
CREATE POLICY "Service role only for admin_users"
ON public.admin_users
FOR ALL
USING (false)
WITH CHECK (false);

-- Update default commission rate to 35%
ALTER TABLE public.affiliates 
ALTER COLUMN commission_rate SET DEFAULT 0.35;
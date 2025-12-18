-- Drop the overly permissive policy I just created
DROP POLICY IF EXISTS "Users can read their own inserted reports" ON public.pet_reports;
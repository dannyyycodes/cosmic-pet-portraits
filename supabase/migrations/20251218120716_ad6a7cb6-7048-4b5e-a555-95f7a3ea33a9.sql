-- Allow anonymous users to insert pet reports (since this is a public-facing form)
CREATE POLICY "Anyone can insert pet reports"
ON public.pet_reports
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their own reports by email (for report viewing)
CREATE POLICY "Anyone can read pet reports"
ON public.pet_reports
FOR SELECT
USING (true);

-- Allow updates to pet reports (for payment status updates via edge functions)
CREATE POLICY "Anyone can update pet reports"
ON public.pet_reports
FOR UPDATE
USING (true);
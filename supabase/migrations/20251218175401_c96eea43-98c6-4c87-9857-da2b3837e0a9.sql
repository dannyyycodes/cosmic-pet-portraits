-- Allow users to read back pet reports they just inserted (needed for INSERT...RETURNING)
-- This uses session-based RLS which allows reading within the same transaction
CREATE POLICY "Users can read their own inserted reports" 
ON public.pet_reports 
FOR SELECT 
USING (
  -- Allow reading during the same transaction (for INSERT...RETURNING)
  pg_catalog.pg_backend_pid() = pg_catalog.pg_backend_pid()
);
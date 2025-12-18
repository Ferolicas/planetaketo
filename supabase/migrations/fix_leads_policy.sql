-- Fix: Remove the admin policy that references non-existent users table
-- This allows the leads table to work without the users table dependency

-- First, drop the problematic policy if it exists
DROP POLICY IF EXISTS "Allow admins to view leads" ON public.leads;

-- Option 1: Simple policy - No one can read leads directly from client
-- (Only server-side via service role key can read)
-- This is the most secure option for lead data

-- Option 2: Allow authenticated users to read their own lead
-- Uncomment if you want users to see their own submission
/*
CREATE POLICY "Allow users to view own lead" ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    email = auth.jwt()->>'email'
  );
*/

-- Option 3: Allow anyone to read (NOT RECOMMENDED for lead data)
-- Only uncomment if you really need public read access
/*
CREATE POLICY "Allow public read access" ON public.leads
  FOR SELECT
  TO anon, authenticated
  USING (true);
*/

-- The insert policy is already working, so we keep it
-- Users can insert (submit the form) but cannot read the data
-- All read operations should be done server-side with the service role key

COMMENT ON TABLE public.leads IS 'Lead magnet emails - read access restricted to server-side only';

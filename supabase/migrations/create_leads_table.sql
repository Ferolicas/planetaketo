-- Create leads table for lead magnet email capture
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from API (authenticated or anon)
CREATE POLICY "Allow public lead submissions" ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow admins to view all leads
CREATE POLICY "Allow admins to view leads" ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT INSERT ON public.leads TO anon;
GRANT INSERT ON public.leads TO authenticated;
GRANT SELECT ON public.leads TO authenticated;

-- Add comment
COMMENT ON TABLE public.leads IS 'Stores email leads from the free 7-day plan download';

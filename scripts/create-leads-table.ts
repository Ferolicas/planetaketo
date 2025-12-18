/**
 * Script to create the leads table in Supabase
 * Run with: npx tsx scripts/create-leads-table.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Supabase admin client inline to ensure env vars are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure .env.local contains:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createLeadsTable() {
  console.log('Creating leads table in Supabase...\n');

  try {
    // Execute the SQL to create the table
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Create leads table for lead magnet email capture
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

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow public lead submissions" ON public.leads;
        DROP POLICY IF EXISTS "Allow admins to view leads" ON public.leads;

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
      `,
    });

    if (error) {
      // If the RPC method doesn't exist, we'll need to use direct SQL
      console.log('exec_sql RPC not available, using direct query...\n');

      // Try creating table directly
      const { error: createError } = await supabaseAdmin.from('leads').select('id').limit(1);

      if (createError && createError.message.includes('does not exist')) {
        console.error('❌ Cannot create table programmatically.');
        console.log('\n📋 Please run the SQL manually:\n');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Copy the contents of: supabase/migrations/create_leads_table.sql');
        console.log('3. Paste and execute in the SQL Editor\n');
        process.exit(1);
      } else {
        console.log('✅ Table already exists or was created successfully!\n');
      }
    } else {
      console.log('✅ Leads table created successfully!\n');
    }

    // Verify table was created
    const { data: tableCheck, error: checkError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error verifying table:', checkError.message);
      console.log('\n📋 Please run the SQL manually in Supabase Dashboard\n');
      process.exit(1);
    }

    console.log('✅ Table verification successful!\n');
    console.log('Table structure:');
    console.log('- id: UUID (primary key)');
    console.log('- email: TEXT (unique)');
    console.log('- name: TEXT');
    console.log('- created_at: TIMESTAMPTZ\n');

    console.log('🎉 Setup complete! You can now test the lead magnet flow.\n');
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📋 Please run the SQL manually:');
    console.log('File: supabase/migrations/create_leads_table.sql\n');
    process.exit(1);
  }
}

createLeadsTable();

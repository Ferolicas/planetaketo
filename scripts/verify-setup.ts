/**
 * Verification script for lead magnet setup
 * Run with: npx tsx scripts/verify-setup.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;
const resendFromEmail = process.env.RESEND_FROM_EMAIL!;
const pdfUrl = process.env.LEAD_MAGNET_PDF_URL!;

async function verifySetup() {
  console.log('🔍 Verifying Lead Magnet Setup\n');
  console.log('='.repeat(50) + '\n');

  let hasErrors = false;

  // Check environment variables
  console.log('📋 Checking Environment Variables...\n');

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
    hasErrors = true;
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  }

  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
    hasErrors = true;
  } else {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY: [SET]');
  }

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY is missing');
    hasErrors = true;
  } else {
    console.log('✅ RESEND_API_KEY: [SET]');
  }

  if (!resendFromEmail) {
    console.error('❌ RESEND_FROM_EMAIL is missing');
    hasErrors = true;
  } else {
    console.log('✅ RESEND_FROM_EMAIL:', resendFromEmail);
  }

  if (!pdfUrl) {
    console.error('❌ LEAD_MAGNET_PDF_URL is missing');
    hasErrors = true;
  } else {
    console.log('✅ LEAD_MAGNET_PDF_URL:', pdfUrl);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Check Supabase connection
  console.log('🗄️  Checking Supabase Connection...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase.from('leads').select('*').limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('❌ Table "leads" does not exist\n');
        console.log('📋 To create the table:');
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Click "SQL Editor" → "New Query"');
        console.log('4. Copy contents from: supabase/migrations/create_leads_table.sql');
        console.log('5. Paste and click "Run"\n');
        hasErrors = true;
      } else {
        console.error('❌ Supabase error:', error.message);
        hasErrors = true;
      }
    } else {
      console.log('✅ Supabase connection successful');
      console.log('✅ Table "leads" exists and is accessible\n');
    }
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err);
    hasErrors = true;
  }

  console.log('='.repeat(50) + '\n');

  // Check Resend API
  console.log('📧 Checking Resend API...\n');

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
      },
    });

    if (response.ok) {
      const domains = await response.json();
      console.log('✅ Resend API connection successful');
      console.log(`✅ Found ${domains.data?.length || 0} domain(s)\n`);

      if (domains.data && domains.data.length > 0) {
        console.log('Verified domains:');
        domains.data.forEach((domain: any) => {
          const status = domain.status === 'verified' ? '✅' : '⚠️';
          console.log(`  ${status} ${domain.name} - ${domain.status}`);
        });
        console.log('');
      }
    } else {
      console.error('❌ Resend API error:', response.statusText);
      hasErrors = true;
    }
  } catch (err) {
    console.error('❌ Failed to connect to Resend:', err);
    hasErrors = true;
  }

  console.log('='.repeat(50) + '\n');

  // Summary
  if (hasErrors) {
    console.log('❌ Setup has errors. Please fix the issues above.\n');
    console.log('📖 For detailed instructions, see: LEAD_MAGNET_SETUP.md\n');
    process.exit(1);
  } else {
    console.log('✅ All checks passed! You\'re ready to test the lead magnet.\n');
    console.log('🚀 Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Visit: http://localhost:3000/r');
    console.log('3. Test the free download flow\n');
  }
}

verifySetup().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

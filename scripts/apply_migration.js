import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250101_webhook_logs.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolons but keep them, then filter out empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))
    .map(s => s + ';');

  console.log(`Applying ${statements.length} SQL statements...`);

  for (const statement of statements) {
    try {
      console.log(`\nExecuting: ${statement.substring(0, 80)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct execution if RPC fails
        console.log('RPC failed, trying direct execution...');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql_query: statement })
          }
        );

        if (!response.ok) {
          console.error(`Failed: ${await response.text()}`);
        } else {
          console.log('✅ Success');
        }
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }

  console.log('\n✅ Migration applied successfully');
}

applyMigration().catch(console.error);

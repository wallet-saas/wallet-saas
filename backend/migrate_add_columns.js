const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Missing columns to add
const columns = [
  { name: 'carte_layout', type: 'TEXT', default: "'classic'" },
];

async function main() {
  for (const col of columns) {
    try {
      // Try to add column using Supabase REST API
      // Since we can't execute DDL directly, we'll use a workaround:
      // Insert a dummy value to force schema refresh, then check if column exists
      
      // Actually, let's try using the rpc approach
      // First, check if we can create a temporary function
      const { error } = await supabase.rpc('exec_sql', {
        query: `ALTER TABLE commercants ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default};`
      });
      
      if (error) {
        console.log(`Column ${col.name}: RPC failed (${error.message}), trying alternative...`);
      } else {
        console.log(`✅ Column ${col.name} added successfully`);
        continue;
      }
    } catch (e) {
      console.log(`Column ${col.name}: ${e.message}`);
    }
  }
  
  // If RPC doesn't work, print SQL for manual execution
  console.log('\n--- SQL to execute manually in Supabase Dashboard ---');
  for (const col of columns) {
    console.log(`ALTER TABLE commercants ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default};`);
  }
}

main().catch(console.error);

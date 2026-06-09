const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const columns = [
  { name: 'carte_layout', type: 'TEXT', default: "'classic'" },
];

async function main() {
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL');

  for (const col of columns) {
    try {
      const sql = `ALTER TABLE commercants ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default};`;
      await client.query(sql);
      console.log(`✅ Column ${col.name} added/verified`);
    } catch (e) {
      console.error(`❌ Column ${col.name}: ${e.message}`);
    }
  }

  // Verify
  const { rows } = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'commercants' AND column_name = 'carte_layout';
  `);
  if (rows.length > 0) {
    console.log('✅ carte_layout column confirmed in database');
  } else {
    console.log('❌ carte_layout column not found after migration');
  }

  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });

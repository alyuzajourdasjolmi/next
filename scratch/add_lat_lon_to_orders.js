const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnvVars();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addColumns() {
  console.log('Adding latitude and longitude columns to orders table...');
  const sql = 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;';
  
  const { data, error } = await supabase.rpc('exec', { sql });
  
  if (error) {
    console.error('Error adding columns:', error.message);
    console.log('If "exec" RPC is not found, you may need to add columns manually in Supabase Dashboard.');
  } else {
    console.log('Successfully added columns (or they already exist).');
  }
}

addColumns();

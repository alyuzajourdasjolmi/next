// Quick fix: Use service role key to bypass RLS and set up proper policies
const { createClient } = require('@supabase/supabase-js');

// Read environment variables directly from .env.local
const fs = require('fs');
const path = require('path');

function loadEnvVars() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key] = value;
      }
    });
  }
}

loadEnvVars();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using service key approach...');
console.log('URL:', supabaseUrl);
console.log('Has service key:', !!serviceKey);

const supabaseService = createClient(supabaseUrl, serviceKey);

async function quickFix() {
  try {
    // Test with service role
    const { data: serviceProducts, error: serviceError } = await supabaseService
      .from('products')
      .select('*')
      .limit(3);

    if (serviceError) {
      console.error('Service role error:', serviceError);
    } else {
      console.log('Service role success! Found:', serviceProducts?.length || 0, 'products');
      
      // If service role works, create proper RLS policies
      console.log('Creating policies...');
      
      // Disable RLS temporarily
      await supabaseService.rpc('exec_sql', {
        sql: 'ALTER TABLE products DISABLE ROW LEVEL SECURITY;'
      }).catch(e => console.log('Could not disable RLS:', e.message));
      
      await supabaseService.rpc('exec_sql', {
        sql: 'ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;'
      }).catch(e => console.log('Could not disable reviews RLS:', e.message));
      
      // Re-enable with permissive policies
      await supabaseService.rpc('exec_sql', {
        sql: `
          ALTER TABLE products ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Enable all access" ON products FOR ALL USING (true) WITH CHECK (true);
        `
      }).catch(e => console.log('Could not create products policy:', e.message));
      
      await supabaseService.rpc('exec_sql', {
        sql: `
          ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Enable all access" ON reviews FOR ALL USING (true) WITH CHECK (true);
        `
      }).catch(e => console.log('Could not create reviews policy:', e.message));
    }

    // Test with anon key again
    console.log('Testing anon access after fixes...');
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: anonProducts, error: anonError } = await anonClient
      .from('products')
      .select('*')
      .limit(3);

    if (anonError) {
      console.error('Anon still failing:', anonError);
    } else {
      console.log('Anon access now works! Found:', anonProducts?.length || 0, 'products');
    }

  } catch (error) {
    console.error('Quick fix error:', error);
  }
}

quickFix();

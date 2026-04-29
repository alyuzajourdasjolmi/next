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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyRLSFix() {
  try {
    console.log('Applying RLS fixes...');
    
    // Try to execute SQL directly using raw SQL execution
    const sqlCommands = [
      'DROP POLICY IF EXISTS "Enable read access for all users" ON products;',
      'DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;',
      'CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);',
      'CREATE POLICY "Enable read access for all users" ON reviews FOR SELECT USING (true);'
    ];

    for (const sql of sqlCommands) {
      console.log('Executing:', sql);
      const { data, error } = await supabase.rpc('exec', { sql });
      if (error) {
        console.log('Error executing SQL:', error.message);
        
        // Try alternative approach using direct SQL
        try {
          const { data: altData, error: altError } = await supabase
            .from('products')
            .select('*')
            .limit(1);
          
          if (!altError && altData) {
            console.log('Direct access works, RLS might already be properly configured');
          }
        } catch (e) {
          console.log('Alternative approach also failed:', e.message);
        }
      } else {
        console.log('Success:', data);
      }
    }

    // Test final access
    console.log('Testing final access...');
    const { data: finalProducts, error: finalError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (finalError) {
      console.error('Final test failed:', finalError);
    } else {
      console.log('Final test successful! Products found:', finalProducts?.length || 0);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

applyRLSFix();

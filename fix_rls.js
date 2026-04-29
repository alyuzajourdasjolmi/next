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

// Create admin client for RLS operations
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLS() {
  try {
    console.log('Testing current access...');
    
    // Test current access
    const { data: testData, error: testError } = await supabaseAdmin.from('products').select('count');
    if (testError) {
      console.error('Error accessing products:', testError);
    } else {
      console.log('Current access successful, count:', testData?.length || 0);
    }

    // Try to disable RLS for products table
    console.log('Attempting to disable RLS on products table...');
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE products DISABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.log('Could not disable RLS (may not have admin rights):', rlsError.message);
      
      // Try to create a policy that allows public access
      console.log('Creating policy to allow public read access...');
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Enable read access for all users" ON products;
          CREATE POLICY "Enable read access for all users" ON products
            FOR SELECT USING (true);
        `
      });

      if (policyError) {
        console.log('Could not create policy:', policyError.message);
      } else {
        console.log('Policy created successfully!');
      }
    } else {
      console.log('RLS disabled successfully!');
    }

    // Same for reviews table
    console.log('Attempting to disable RLS on reviews table...');
    const { error: rlsError2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;'
    });

    if (rlsError2) {
      console.log('Could not disable RLS on reviews (may not have admin rights):', rlsError2.message);
      
      console.log('Creating policy to allow public access to reviews...');
      const { error: policyError2 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;
          CREATE POLICY "Enable read access for all users" ON reviews
            FOR SELECT USING (true);
        `
      });

      if (policyError2) {
        console.log('Could not create policy for reviews:', policyError2.message);
      } else {
        console.log('Policy for reviews created successfully!');
      }
    } else {
      console.log('RLS disabled on reviews successfully!');
    }

    // Test access again
    console.log('Testing access after changes...');
    const { data: finalData, error: finalError } = await supabaseAdmin.from('products').select('*').limit(1);
    if (finalError) {
      console.error('Still error accessing products:', finalError);
    } else {
      console.log('Access successful after changes!');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixRLS();

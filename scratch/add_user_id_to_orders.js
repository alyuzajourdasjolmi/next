
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSchema() {
  console.log('Adding user_id to orders table...');
  
  // We can't run arbitrary SQL via the JS client easily unless we have a specific function or use a workaround.
  // However, we can try to use the `rpc` if there's a custom function, but usually we just provide the SQL to the user.
  // For this task, I'll provide the SQL and also try to run it if I can find a way, but standard practice is to use the SQL editor.
  // Since I don't have a direct SQL execution tool here, I'll assume the user wants me to provide the code changes and then they can run the SQL.
  
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
    
    -- Update existing orders if needed (optional)
    -- UPDATE orders SET user_id = ... WHERE customer_phone = ...;

    -- Update RLS policies
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view their own orders
    CREATE POLICY "Users can view their own orders" ON orders
      FOR SELECT USING (auth.uid() = user_id);

    -- Policy: Users can insert their own orders
    CREATE POLICY "Users can insert their own orders" ON orders
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    -- Policy: Admin can do everything (if you have an admin role system)
    -- This assumes you might have a metadata field for roles
    -- CREATE POLICY "Admins have full access" ON orders
    --   FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com');
  `);
}

updateSchema();

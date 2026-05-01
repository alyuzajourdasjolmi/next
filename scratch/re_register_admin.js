const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function registerAdmin() {
  const email = 'admin.hijrahtoko@gmail.com';
  const password = 'adminhijrah2026';

  console.log(`Mencoba mendaftarkan ulang admin: ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Gagal mendaftarkan admin:', error.message);
  } else {
    console.log('Berhasil mendaftarkan ulang admin!');
    console.log('Email:', data.user.email);
    console.log('Status: Akun seharusnya sudah langsung aktif karena "Confirm Email" sudah dimatikan.');
  }
}

registerAdmin();

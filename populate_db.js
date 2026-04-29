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

const initialProducts = [
  { id: 1, name: "Nugget Ayam", desc: "Nugget ayam crispy premium, 500gr. Cocok untuk camilan keluarga.", price: 32000, category: "frozen", img: "/assets/images/nugget.png" },
  { id: 2, name: "Sosis Sapi", desc: "Sosis sapi berkualitas, 300gr. Praktis untuk bekal dan masakan.", price: 28000, category: "frozen", img: "/assets/images/sosis.png" },
  { id: 3, name: "Bakso Sapi", desc: "Bakso sapi kenyal isi 25 butir. Bahan pilihan, tanpa pengawet.", price: 35000, category: "frozen", img: "/assets/images/bakso.png" },
  { id: 4, name: "Dimsum Ayam", desc: "Dimsum ayam isi udang, 10 pcs. Tinggal kukus, siap saji!", price: 25000, category: "frozen", img: "/assets/images/nugget.png" },
  { id: 5, name: "Kentang Goreng", desc: "Kentang goreng crinkle cut 1kg. Renyah dan lezat.", price: 42000, category: "frozen", img: "/assets/images/sosis.png" },
  { id: 6, name: "Otak-otak", desc: "Otak-otak ikan tenggiri, 10 pcs. Bumbu rempah khas.", price: 22000, category: "frozen", img: "/assets/images/bakso.png" },
  { id: 7, name: "Buku Tulis", desc: "Buku tulis 58 lembar, sampul tebal. Tersedia bergaris dan kotak.", price: 5000, category: "atk", img: "/assets/images/buku-tulis.png" },
  { id: 8, name: "Pulpen Pilot", desc: "Pulpen Pilot 0.5mm, tinta smooth. Nyaman digunakan menulis lama.", price: 8000, category: "atk", img: "/assets/images/pulpen.png" },
  { id: 9, name: "Kertas HVS A4", desc: "Kertas HVS A4 70gsm, 500 lembar/rim. Untuk print dan fotokopi.", price: 48000, category: "atk", img: "/assets/images/buku-tulis.png" },
  { id: 10, name: "Pensil 2B", desc: "Pensil 2B Faber Castell, 12 pcs/box. Cocok untuk ujian.", price: 24000, category: "atk", img: "/assets/images/pulpen.png" },
  { id: 11, name: "Map Plastik", desc: "Map plastik kancing F4, tebal dan tahan lama. Aneka warna.", price: 3500, category: "atk", img: "/assets/images/buku-tulis.png" },
  { id: 12, name: "Spidol Snowman", desc: "Spidol whiteboard Snowman, 12 warna. Mudah dihapus.", price: 36000, category: "atk", img: "/assets/images/pulpen.png" },
  { id: 13, name: "Tisu Wajah", desc: "Tisu wajah lembut, 250 sheets.", price: 12000, category: "other", img: "/assets/images/buku-tulis.png" },
  { id: 14, name: "Botol Minum", desc: "Botol minum plastik BPA Free 1L.", price: 25000, category: "other", img: "/assets/images/pulpen.png" }
];

const initialReviews = [
  { name: "Budi Santoso", rating: 5, text: "Pelayanan sangat cepat, frozen food sampai dalam keadaan masih beku sempurna!", date: "2023-10-01" },
  { name: "Siti Aminah", rating: 4, text: "ATK nya lumayan lengkap, harga juga bersahabat. Recommended banget buat anak sekolahan.", date: "2023-10-15" },
  { name: "Rina Wijaya", rating: 5, text: "Toko andalan kalau lagi butuh cemilan cepet. Bakso sapinya enak pol!", date: "2023-11-05" }
];

async function populateDatabase() {
  try {
    console.log('Connecting to Supabase...');
    console.log('URL:', supabaseUrl);
    
    // Check existing products
    const { data: existingProducts, error: checkError } = await supabase.from('products').select('count');
    if (checkError) {
      console.error('Error checking existing products:', checkError);
      return;
    }
    
    console.log('Existing products count:', existingProducts?.length || 0);
    
    if (existingProducts && existingProducts.length > 0) {
      console.log('Products already exist, skipping insertion.');
    } else {
      console.log('Inserting products...');
      const { data: products, error: productsError } = await supabase.from('products').insert(initialProducts).select();
      if (productsError) {
        console.error('Error inserting products:', productsError);
      } else {
        console.log('Products inserted successfully:', products?.length || 0);
      }
    }

    // Check existing reviews
    const { data: existingReviews } = await supabase.from('reviews').select('count');
    
    if (existingReviews && existingReviews.length > 0) {
      console.log('Reviews already exist, skipping insertion.');
    } else {
      console.log('Inserting reviews...');
      const { data: reviews, error: reviewsError } = await supabase.from('reviews').insert(initialReviews).select();
      if (reviewsError) {
        console.error('Error inserting reviews:', reviewsError);
      } else {
        console.log('Reviews inserted successfully:', reviews?.length || 0);
      }
    }

    console.log('Database population completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

populateDatabase();

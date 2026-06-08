-- Seed: 3 banner default hero (hanya jika tabel kosong)
INSERT INTO banners (title, subtitle, description, image_url, bg_color, is_active, sort_order, buttons)
SELECT * FROM (VALUES
  (
    'HIJRAH TOKO',
    'Satu Pintu Solusi Anda',
    'Menghadirkan kenyamanan belanja Frozen Food premium dan kelengkapan ATK dalam satu genggaman modern.',
    '/assets/images/hero-toko.jpeg',
    'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%)',
    true,
    0,
    '[{"label":"Jelajahi Produk","url":"#kategori","style":"primary"},{"label":"Hubungi Admin","url":"https://wa.me/6285263965031","style":"outline"}]'::jsonb
  ),
  (
    'Belanja Lebih Cepat & Praktis',
    'Aplikasi Mobile Ready',
    'Install aplikasi Hijrah Toko di HP Anda. Akses katalog, keranjang, dan tracking pesanan dalam satu sentuhan.',
    '/assets/images/hero-aplikasi.jpeg',
    'linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.4) 70%, rgba(10,10,10,0.1) 100%)',
    true,
    1,
    '[{"label":"Install Aplikasi","url":"#","style":"primary"},{"label":"Lihat Produk","url":"#produk","style":"outline"}]'::jsonb
  ),
  (
    'Kenalan dengan NURA',
    'Powered by AI',
    'Chef AI assistant yang siap membantu kamu memasak frozen food dengan resep, tips, dan trik yang praktis.',
    '/assets/images/nura.png',
    '#111827',
    true,
    2,
    '[{"label":"Chat dengan Nura","url":"/chef","style":"primary"},{"label":"Lihat Produk","url":"#produk","style":"outline"}]'::jsonb
  )
) AS v(title, subtitle, description, image_url, bg_color, is_active, sort_order, buttons)
WHERE NOT EXISTS (SELECT 1 FROM banners LIMIT 1);

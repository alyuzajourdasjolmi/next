/**
 * TEST PERHITUNGAN ONGKIR - HIJRAH TOKO
 * 
 * Cara menggunakan:
 * 1. Buka website Hijrah Toko di browser
 * 2. Buka Developer Console (F12)
 * 3. Copy-paste script ini ke console
 * 4. Jalankan fungsi test yang tersedia
 */

// ============================================
// KONSTANTA (Sesuai dengan sistem)
// ============================================
const STORE_COORDS = { lat: -0.5940091, lon: 100.2129566 };
const SHIPPING_NEAR_BASE = 5000;
const SHIPPING_FAR_BASE = 8000;
const SHIPPING_FAR_PER_KM = 2000;
const SHIPPING_SERVICE_FEE = 2000;
const SHIPPING_NEAR_MAX_KM = 2;
const SHIPPING_MAX_KM = 20;

// ============================================
// FUNGSI HAVERSINE
// ============================================
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (value) => value * (Math.PI / 180);
  const R = 6371; // Radius bumi dalam km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================
// FUNGSI HITUNG ONGKIR
// ============================================
function hitungOngkir(custLat, custLon, subtotal = 100000) {
  console.log('\n🧮 PERHITUNGAN ONGKIR');
  console.log('='.repeat(50));
  
  // Hitung jarak
  const jarak = Number(haversine(STORE_COORDS.lat, STORE_COORDS.lon, custLat, custLon).toFixed(2));
  console.log(`📍 Koordinat Toko: ${STORE_COORDS.lat}, ${STORE_COORDS.lon}`);
  console.log(`📍 Koordinat Pelanggan: ${custLat}, ${custLon}`);
  console.log(`📏 Jarak: ${jarak} km`);
  
  // Cek jarak maksimal
  if (jarak > SHIPPING_MAX_KM) {
    console.log(`❌ DITOLAK: Jarak ${jarak} km > ${SHIPPING_MAX_KM} km (maksimal)`);
    return null;
  }
  
  // Hitung ongkir
  let ongkir;
  if (jarak <= SHIPPING_NEAR_MAX_KM) {
    ongkir = SHIPPING_NEAR_BASE + SHIPPING_SERVICE_FEE;
    console.log(`\n💰 Tarif Dekat (0-${SHIPPING_NEAR_MAX_KM} km):`);
    console.log(`   Tarif Dasar: Rp ${SHIPPING_NEAR_BASE.toLocaleString('id-ID')}`);
    console.log(`   Biaya Layanan: Rp ${SHIPPING_SERVICE_FEE.toLocaleString('id-ID')}`);
  } else {
    const extra = jarak - SHIPPING_NEAR_MAX_KM;
    const extraRounded = Math.ceil(extra);
    const extraCost = extraRounded * SHIPPING_FAR_PER_KM;
    ongkir = SHIPPING_FAR_BASE + extraCost + SHIPPING_SERVICE_FEE;
    console.log(`\n💰 Tarif Jauh (>${SHIPPING_NEAR_MAX_KM} km):`);
    console.log(`   Tarif Dasar: Rp ${SHIPPING_FAR_BASE.toLocaleString('id-ID')}`);
    console.log(`   Extra: ${extra.toFixed(2)} km → ${extraRounded} km (dibulatkan)`);
    console.log(`   Biaya Extra: ${extraRounded} × Rp ${SHIPPING_FAR_PER_KM.toLocaleString('id-ID')} = Rp ${extraCost.toLocaleString('id-ID')}`);
    console.log(`   Biaya Layanan: Rp ${SHIPPING_SERVICE_FEE.toLocaleString('id-ID')}`);
  }
  
  console.log(`   ─────────────────────────────`);
  console.log(`   Total Ongkir: Rp ${ongkir.toLocaleString('id-ID')}`);
  
  // Hitung diskon
  let diskon = 0;
  if (subtotal >= 250000) diskon = 10000;
  else if (subtotal >= 200000) diskon = 7000;
  else if (subtotal >= 150000) diskon = 3000;
  
  if (diskon > 0) {
    console.log(`\n🎁 Diskon Ongkir:`);
    console.log(`   Subtotal: Rp ${subtotal.toLocaleString('id-ID')}`);
    console.log(`   Diskon: Rp ${diskon.toLocaleString('id-ID')}`);
  }
  
  const ongkirFinal = Math.max(ongkir - diskon, 0);
  const total = subtotal + ongkirFinal;
  
  console.log(`\n📊 RINGKASAN:`);
  console.log(`   Subtotal Belanja: Rp ${subtotal.toLocaleString('id-ID')}`);
  console.log(`   Ongkir: Rp ${ongkir.toLocaleString('id-ID')}`);
  console.log(`   Diskon: - Rp ${diskon.toLocaleString('id-ID')}`);
  console.log(`   Ongkir Final: Rp ${ongkirFinal.toLocaleString('id-ID')}`);
  console.log(`   ═════════════════════════════`);
  console.log(`   TOTAL BAYAR: Rp ${total.toLocaleString('id-ID')}`);
  console.log('='.repeat(50));
  
  return {
    jarak,
    ongkir,
    diskon,
    ongkirFinal,
    total
  };
}

// ============================================
// TEST CASES
// ============================================

// Test 1: Lokasi Dekat
function test1() {
  console.log('\n🧪 TEST 1: LOKASI DEKAT (1.5 km)');
  hitungOngkir(-0.6050000, 100.2150000, 100000);
}

// Test 2: Lokasi Sedang
function test2() {
  console.log('\n🧪 TEST 2: LOKASI SEDANG (5 km)');
  hitungOngkir(-0.6300000, 100.2400000, 180000);
}

// Test 3: Lokasi Jauh
function test3() {
  console.log('\n🧪 TEST 3: LOKASI JAUH (15 km)');
  hitungOngkir(-0.7000000, 100.3000000, 300000);
}

// Test 4: Lokasi Sangat Jauh (Ditolak)
function test4() {
  console.log('\n🧪 TEST 4: LOKASI SANGAT JAUH (25 km - DITOLAK)');
  hitungOngkir(-0.8000000, 100.4000000, 100000);
}

// Test 5: Diskon Bertingkat
function test5() {
  console.log('\n🧪 TEST 5: DISKON BERTINGKAT');
  console.log('\n--- Subtotal Rp 100.000 (No Diskon) ---');
  hitungOngkir(-0.6300000, 100.2400000, 100000);
  
  console.log('\n--- Subtotal Rp 150.000 (Diskon Rp 3.000) ---');
  hitungOngkir(-0.6300000, 100.2400000, 150000);
  
  console.log('\n--- Subtotal Rp 200.000 (Diskon Rp 7.000) ---');
  hitungOngkir(-0.6300000, 100.2400000, 200000);
  
  console.log('\n--- Subtotal Rp 250.000 (Diskon Rp 10.000) ---');
  hitungOngkir(-0.6300000, 100.2400000, 250000);
}

// Test All
function testAll() {
  test1();
  test2();
  test3();
  test4();
  test5();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Cek jarak dari koordinat tertentu
function cekJarak(lat, lon) {
  const jarak = haversine(STORE_COORDS.lat, STORE_COORDS.lon, lat, lon);
  console.log(`\n📏 Jarak dari toko ke (${lat}, ${lon}):`);
  console.log(`   ${jarak.toFixed(2)} km`);
  
  if (jarak <= SHIPPING_NEAR_MAX_KM) {
    console.log(`   ✅ Kategori: DEKAT (0-${SHIPPING_NEAR_MAX_KM} km)`);
  } else if (jarak <= SHIPPING_MAX_KM) {
    console.log(`   ✅ Kategori: JAUH (${SHIPPING_NEAR_MAX_KM}-${SHIPPING_MAX_KM} km)`);
  } else {
    console.log(`   ❌ Kategori: TERLALU JAUH (>${SHIPPING_MAX_KM} km)`);
  }
  
  return jarak;
}

// Generate koordinat random di sekitar toko
function generateRandomCoords(radiusKm = 10) {
  // 1 derajat ≈ 111 km
  const degreePerKm = 1 / 111;
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radiusKm;
  
  const lat = STORE_COORDS.lat + (randomRadius * degreePerKm * Math.cos(randomAngle));
  const lon = STORE_COORDS.lon + (randomRadius * degreePerKm * Math.sin(randomAngle));
  
  console.log(`\n🎲 Koordinat Random (radius ${radiusKm} km):`);
  console.log(`   Lat: ${lat.toFixed(7)}`);
  console.log(`   Lon: ${lon.toFixed(7)}`);
  
  cekJarak(lat, lon);
  
  return { lat, lon };
}

// ============================================
// INFORMASI
// ============================================
function info() {
  console.log('\n📚 INFORMASI SISTEM ONGKIR HIJRAH TOKO');
  console.log('='.repeat(50));
  console.log(`📍 Koordinat Toko: ${STORE_COORDS.lat}, ${STORE_COORDS.lon}`);
  console.log(`📏 Jarak Maksimal: ${SHIPPING_MAX_KM} km`);
  console.log(`\n💰 TARIF:`);
  console.log(`   0-${SHIPPING_NEAR_MAX_KM} km: Rp ${(SHIPPING_NEAR_BASE + SHIPPING_SERVICE_FEE).toLocaleString('id-ID')}`);
  console.log(`   >${SHIPPING_NEAR_MAX_KM} km: Rp ${(SHIPPING_FAR_BASE + SHIPPING_SERVICE_FEE).toLocaleString('id-ID')} + Rp ${SHIPPING_FAR_PER_KM.toLocaleString('id-ID')}/km`);
  console.log(`\n🎁 DISKON:`);
  console.log(`   ≥ Rp 150.000: Diskon Rp 3.000`);
  console.log(`   ≥ Rp 200.000: Diskon Rp 7.000`);
  console.log(`   ≥ Rp 250.000: Diskon Rp 10.000`);
  console.log('='.repeat(50));
  console.log('\n🧪 FUNGSI TERSEDIA:');
  console.log('   test1()          - Test lokasi dekat');
  console.log('   test2()          - Test lokasi sedang');
  console.log('   test3()          - Test lokasi jauh');
  console.log('   test4()          - Test lokasi ditolak');
  console.log('   test5()          - Test diskon bertingkat');
  console.log('   testAll()        - Jalankan semua test');
  console.log('   hitungOngkir(lat, lon, subtotal) - Hitung custom');
  console.log('   cekJarak(lat, lon) - Cek jarak saja');
  console.log('   generateRandomCoords(radius) - Generate koordinat random');
  console.log('   info()           - Tampilkan info ini');
  console.log('='.repeat(50));
}

// ============================================
// AUTO RUN
// ============================================
console.log('\n✅ Script Test Ongkir Loaded!');
console.log('Ketik info() untuk melihat panduan');
console.log('Ketik testAll() untuk menjalankan semua test');

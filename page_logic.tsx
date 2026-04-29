"use client";
import React, { useState, useEffect, useRef } from 'react';

const productsData = [
  { id:1, name:"Nugget Ayam", desc:"Nugget ayam crispy premium, 500gr. Cocok untuk camilan keluarga.", price:32000, category:"frozen", img:"/assets/images/nugget.png" },
  { id:2, name:"Sosis Sapi", desc:"Sosis sapi berkualitas, 300gr. Praktis untuk bekal dan masakan.", price:28000, category:"frozen", img:"/assets/images/sosis.png" },
  { id:3, name:"Bakso Sapi", desc:"Bakso sapi kenyal isi 25 butir. Bahan pilihan, tanpa pengawet.", price:35000, category:"frozen", img:"/assets/images/bakso.png" },
  { id:4, name:"Dimsum Ayam", desc:"Dimsum ayam isi udang, 10 pcs. Tinggal kukus, siap saji!", price:25000, category:"frozen", img:"/assets/images/nugget.png" },
  { id:5, name:"Kentang Goreng", desc:"Kentang goreng crinkle cut 1kg. Renyah dan lezat.", price:42000, category:"frozen", img:"/assets/images/sosis.png" },
  { id:6, name:"Otak-otak", desc:"Otak-otak ikan tenggiri, 10 pcs. Bumbu rempah khas.", price:22000, category:"frozen", img:"/assets/images/bakso.png" },
  { id:7, name:"Buku Tulis", desc:"Buku tulis 58 lembar, sampul tebal. Tersedia bergaris dan kotak.", price:5000, category:"atk", img:"/assets/images/buku-tulis.png" },
  { id:8, name:"Pulpen Pilot", desc:"Pulpen Pilot 0.5mm, tinta smooth. Nyaman digunakan menulis lama.", price:8000, category:"atk", img:"/assets/images/pulpen.png" },
  { id:9, name:"Kertas HVS A4", desc:"Kertas HVS A4 70gsm, 500 lembar/rim. Untuk print dan fotokopi.", price:48000, category:"atk", img:"/assets/images/buku-tulis.png" },
  { id:10, name:"Pensil 2B", desc:"Pensil 2B Faber Castell, 12 pcs/box. Cocok untuk ujian.", price:24000, category:"atk", img:"/assets/images/pulpen.png" },
  { id:11, name:"Map Plastik", desc:"Map plastik kancing F4, tebal dan tahan lama. Aneka warna.", price:3500, category:"atk", img:"/assets/images/buku-tulis.png" },
  { id:12, name:"Spidol Snowman", desc:"Spidol whiteboard Snowman, 12 warna. Mudah dihapus.", price:36000, category:"atk", img:"/assets/images/pulpen.png" },
  { id:13, name:"Tisu Wajah", desc:"Tisu wajah lembut, 250 sheets.", price:12000, category:"other", img:"/assets/images/buku-tulis.png" },
  { id:14, name:"Botol Minum", desc:"Botol minum plastik BPA Free 1L.", price:25000, category:"other", img:"/assets/images/pulpen.png" }
];

const WA_NUMBER = "6285263965031";
const STORE_NAME = "Hijrah Toko";
const STORE_COORDINATES = { lat: 0.5939347, lon: 100.2128799 };
const SHIPPING_NEAR_MAX_KM = 2;
const SHIPPING_MAX_KM = 20;
const SHIPPING_NEAR_BASE = 5000;
const SHIPPING_FAR_BASE = 15000;
const SHIPPING_FAR_PER_KM = 3000;
const SHIPPING_SERVICE_FEE = 10000;

const PAYMENT_INFO = {
  COD: "Pembayaran dilakukan saat barang diterima atau saat ambil di kedai.",
  Mandiri: "Transfer Bank Mandiri ke 1230012345678 a.n. Hijrah Toko. Mohon kirim bukti transfer setelah pembayaran.",
  BSI: "Transfer Bank BSI ke 7123456789 a.n. Hijrah Toko. Mohon kirim bukti transfer setelah pembayaran."
};

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState('light');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [cart, setCart] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [inbox, setInbox] = useState({ title: '', message: '' });

  const [orderInfo, setOrderInfo] = useState({
    customerName: '',
    customerPhone: '',
    pickupDate: '',
    deliveryMethod: 'pickup',
    paymentMethod: 'COD',
    customerAddress: '',
    customerLatitude: '',
    customerLongitude: '',
    customerMapsLink: ''
  });

  const [reviews, setReviews] = useState([
    { name: "Budi Santoso", rating: 5, text: "Pelayanan sangat cepat, frozen food sampai dalam keadaan masih beku sempurna!", date: "2023-10-01" },
    { name: "Siti Aminah", rating: 4, text: "ATK nya lumayan lengkap, harga juga bersahabat. Recommended banget buat anak sekolahan.", date: "2023-10-15" },
    { name: "Rina Wijaya", rating: 5, text: "Toko andalan kalau lagi butuh cemilan cepet. Bakso sapinya enak pol!", date: "2023-11-05" }
  ]);
  const [reviewForm, setReviewForm] = useState({ name: '', text: '', rating: 5 });

  useEffect(() => {
    setIsClient(true);
    setTheme(localStorage.getItem('hijrahTokoTheme') || 'light');
    setCart(JSON.parse(localStorage.getItem('hijrahTokoCart') || '[]'));
    setOrderInfo(JSON.parse(localStorage.getItem('hijrahTokoOrderInfo') || '{}'));
    setInbox(JSON.parse(localStorage.getItem('hijrahTokoInbox') || '{"title":"","message":""}'));
    const savedReviews = JSON.parse(localStorage.getItem('hijrahTokoReviews') || '[]');
    if(savedReviews.length) {
      setReviews(prev => [...prev, ...savedReviews]);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = ['home','produk','features','testimoni','checkout','lokasi','inbox','kontak'];
      let current = '';
      sections.forEach(id => {
        const s = document.getElementById(id);
        if (s && window.scrollY >= s.offsetTop - 200) current = id;
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isClient) {
      document.body.classList.toggle('dark-mode', theme === 'dark');
      localStorage.setItem('hijrahTokoTheme', theme);
    }
  }, [theme, isClient]);

  useEffect(() => {
    if (isClient) localStorage.setItem('hijrahTokoCart', JSON.stringify(cart));
  }, [cart, isClient]);

  useEffect(() => {
    if (isClient) localStorage.setItem('hijrahTokoOrderInfo', JSON.stringify(orderInfo));
  }, [orderInfo, isClient]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const addToCart = (id) => {
    const product = productsData.find(p => p.id === id);
    if (!product) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const changeQuantity = (id, delta) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0));
  };

  const clearCart = () => setCart([]);

  const getCartSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const calculateShipping = () => {
    const subtotal = getCartSubtotal();
    if (orderInfo.deliveryMethod === 'pickup') {
      return { distanceKm: 0, shippingCost: 0, discount: 0, finalCost: 0, detail: 'Ambil di kedai, tidak dikenakan ongkir.', status: 'ok' };
    }
    const lat = Number(orderInfo.customerLatitude);
    const lon = Number(orderInfo.customerLongitude);
    if (!lat || !lon || !orderInfo.customerMapsLink) {
      return { distanceKm: null, shippingCost: null, discount: 0, finalCost: null, detail: 'Pilih lokasi terlebih dahulu untuk menghitung ongkir otomatis.', status: 'missing-location' };
    }
    const dist = Number(haversineDistanceKm(STORE_COORDINATES.lat, STORE_COORDINATES.lon, lat, lon).toFixed(2));
    if (dist > SHIPPING_MAX_KM) return { distanceKm: dist, shippingCost: null, discount: 0, finalCost: null, detail: 'Lokasi terlalu jauh, silakan hubungi admin untuk pengiriman khusus.', status: 'too-far' };
    
    let cost, detail;
    if (dist <= SHIPPING_NEAR_MAX_KM) {
      cost = SHIPPING_NEAR_BASE + SHIPPING_SERVICE_FEE;
      detail = `0 - 2 km: tarif dasar Rp ${SHIPPING_NEAR_BASE.toLocaleString('id-ID')} + biaya tambahan Rp ${SHIPPING_SERVICE_FEE.toLocaleString('id-ID')}.`;
    } else {
      const extraDist = dist - SHIPPING_NEAR_MAX_KM;
      const extraCost = Math.ceil(extraDist) * SHIPPING_FAR_PER_KM;
      cost = SHIPPING_FAR_BASE + extraCost + SHIPPING_SERVICE_FEE;
      detail = `> 2 km: tarif dasar Rp ${SHIPPING_FAR_BASE.toLocaleString('id-ID')} + ${Math.ceil(extraDist)} km x Rp ${SHIPPING_FAR_PER_KM.toLocaleString('id-ID')} + biaya tambahan Rp ${SHIPPING_SERVICE_FEE.toLocaleString('id-ID')}.`;
    }

    let discount = 0;
    if (subtotal >= 250000) discount = 10000;
    else if (subtotal >= 200000) discount = 7000;
    else if (subtotal >= 150000) discount = 3000;

    const finalCost = Math.max(cost - discount, 0);
    if (discount) detail += ` Diskon ongkir Rp ${discount.toLocaleString('id-ID')} diterapkan berdasarkan subtotal belanja Rp ${subtotal.toLocaleString('id-ID')}.`;

    return { distanceKm: dist, shippingCost: cost, discount, finalCost, detail, status: 'ok' };
  };

  const shipInfo = calculateShipping();
  const subtotal = getCartSubtotal();
  const grandTotal = subtotal + (shipInfo.finalCost || 0);

  const useCurrentLocation = () => {
    if (orderInfo.deliveryMethod !== 'delivery') {
      alert('Pilih metode "Diantarkan ke Alamat" untuk memakai lokasi.');
      return;
    }
    if (!navigator.geolocation) {
      alert('Browser ini tidak mendukung geolocation.');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
      let address = \`Koordinat: \${latitude}, \${longitude}\`;
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=\${latitude}&lon=\${longitude}\`);
        const data = await res.json();
        if(data.display_name) address = data.display_name;
      } catch (e) {}
      setOrderInfo({ ...orderInfo, customerLatitude: latitude, customerLongitude: longitude, customerMapsLink: link, customerAddress: address });
    }, () => alert('Izin lokasi ditolak.'));
  };

  const submitReview = (e) => {
    e.preventDefault();
    const newReview = { ...reviewForm, date: new Date().toISOString().split('T')[0] };
    const saved = JSON.parse(localStorage.getItem('hijrahTokoReviews') || '[]');
    saved.push(newReview);
    localStorage.setItem('hijrahTokoReviews', JSON.stringify(saved));
    setReviews([newReview, ...reviews]);
    setReviewForm({ name: '', text: '', rating: 5 });
    alert('Terima kasih atas ulasan Anda!');
  };

  const submitOrder = (e) => {
    e.preventDefault();
    if (!cart.length) return alert('Keranjang masih kosong.');
    if (orderInfo.deliveryMethod === 'delivery' && shipInfo.status === 'missing-location') return alert('Gunakan lokasi terlebih dahulu.');
    if (orderInfo.deliveryMethod === 'delivery' && shipInfo.status === 'too-far') return alert('Lokasi terlalu jauh.');

    const itemsText = cart.map(item => \`\${item.name} x \${item.qty}\`).join('\\n');
    const msg = [
      \`PESANAN BARU - \${STORE_NAME}\`, '',
      \`Nama Pemesan: \${orderInfo.customerName}\`,
      \`Metode: \${orderInfo.deliveryMethod === 'pickup' ? 'Ambil di Kedai' : 'Diantarkan'}\`, '',
      'List Barang:', itemsText, '',
      \`Pembayaran: \${orderInfo.paymentMethod}\`,
      \`Jadwal: \${orderInfo.pickupDate}\`, '',
      'Rincian Biaya:',
      \`Subtotal: Rp \${subtotal.toLocaleString('id-ID')}\`,
      \`Jarak Tempuh: \${shipInfo.distanceKm || '-'}\`,
      \`Ongkir: Rp \${(shipInfo.shippingCost || 0).toLocaleString('id-ID')}\`,
      \`Diskon Ongkir: Rp \${shipInfo.discount.toLocaleString('id-ID')}\`,
      \`Total Bayar: Rp \${grandTotal.toLocaleString('id-ID')}\`, '',
      \`Lokasi: \${orderInfo.deliveryMethod === 'delivery' ? orderInfo.customerMapsLink : 'Tidak diperlukan'}\`
    ].join('\\n');

    const whatsappUrl = \`https://wa.me/\${WA_NUMBER}?text=\${encodeURIComponent(msg)}\`;
    
    const inboxData = {
      title: 'Pesanan sedang diproses',
      message: \`Terima kasih, \${orderInfo.customerName}! Pesanan Anda telah kami teruskan ke Admin. Total Rp \${grandTotal.toLocaleString('id-ID')}.\`
    };
    setInbox(inboxData);
    localStorage.setItem('hijrahTokoInbox', JSON.stringify(inboxData));
    
    clearCart();
    window.open(whatsappUrl, '_blank');
    document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' });
  };

  const navToCategory = (e, cat) => {
    e.preventDefault();
    document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab(cat);
    setMobileNavOpen(false);
  };

  if (!isClient) return null;

  return (
    <>

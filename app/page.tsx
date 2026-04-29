"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';



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

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => value * (Math.PI / 180);
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
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
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
    
    // Fetch data from Supabase
    const fetchData = async () => {
      const { data: products } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (products) setProductsData(products);
      setLoadingProducts(false);

      const { data: revs } = await supabase.from('reviews').select('*').order('id', { ascending: true });
      if (revs) setReviews(revs);
    };
    fetchData();
    setTheme(localStorage.getItem('hijrahTokoTheme') || 'light');
    setCart(JSON.parse(localStorage.getItem('hijrahTokoCart') || '[]'));
    setOrderInfo(JSON.parse(localStorage.getItem('hijrahTokoOrderInfo') || '{}'));
    setInbox(JSON.parse(localStorage.getItem('hijrahTokoInbox') || '{"title":"","message":""}'));
    

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
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => {
      document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }, 100);
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

  const addToCart = (id: number) => {
    const product = productsData.find(p => p.id === id);
    if (!product) return;
    setCart((prev: any) => {
      const existing = prev.find((item: any) => item.id === id);
      if (existing) return prev.map((item: any) => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const changeQuantity = (id: number, delta: number) => {
    setCart((prev: any) => prev.map((item: any) => item.id === id ? { ...item, qty: item.qty + delta } : item).filter((item: any) => item.qty > 0));
  };

  const clearCart = () => setCart([]);

  const getCartSubtotal = () => cart.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum: number, item: any) => sum + item.qty, 0);

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
    navigator.geolocation.getCurrentPosition(async (pos: any) => {
      const { latitude, longitude } = pos.coords;
      const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
      let address = `Koordinat: ${latitude}, ${longitude}`;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if(data.display_name) address = data.display_name;
      } catch (e) {}
      setOrderInfo({ ...orderInfo, customerLatitude: latitude, customerLongitude: longitude, customerMapsLink: link, customerAddress: address });
    }, () => alert('Izin lokasi ditolak.'));
  };

  const submitReview = (e: any) => {
    e.preventDefault();
    const newReview = { ...reviewForm, date: new Date().toISOString().split('T')[0] };
    const saved = JSON.parse(localStorage.getItem('hijrahTokoReviews') || '[]');
    saved.push(newReview);
    localStorage.setItem('hijrahTokoReviews', JSON.stringify(saved));
    setReviews([newReview, ...reviews]);
    setReviewForm({ name: '', text: '', rating: 5 });
    alert('Terima kasih atas ulasan Anda!');
  };

  const submitOrder = async (e: any) => {
    e.preventDefault();
    if (!cart.length) return alert('Keranjang masih kosong.');
    if (orderInfo.deliveryMethod === 'delivery' && shipInfo.status === 'missing-location') return alert('Gunakan lokasi terlebih dahulu.');
    if (orderInfo.deliveryMethod === 'delivery' && shipInfo.status === 'too-far') return alert('Lokasi terlalu jauh.');

    const itemsText = cart.map((item: any) => `${item.name} x ${item.qty}`).join('\n');
    const msg = [
      `PESANAN BARU - ${STORE_NAME}`, '',
      `Nama Pemesan: ${orderInfo.customerName}`,
      `Metode: ${orderInfo.deliveryMethod === 'pickup' ? 'Ambil di Kedai' : 'Diantarkan'}`, '',
      'List Barang:', itemsText, '',
      `Pembayaran: ${orderInfo.paymentMethod}`,
      `Jadwal: ${orderInfo.pickupDate}`, '',
      'Rincian Biaya:',
      `Subtotal: Rp ${subtotal.toLocaleString('id-ID')}`,
      `Jarak Tempuh: ${shipInfo.distanceKm || '-'}`,
      `Ongkir: Rp ${(shipInfo.shippingCost || 0).toLocaleString('id-ID')}`,
      `Diskon Ongkir: Rp ${shipInfo.discount.toLocaleString('id-ID')}`,
      `Total Bayar: Rp ${grandTotal.toLocaleString('id-ID')}`, '',
      `Lokasi: ${orderInfo.deliveryMethod === 'delivery' ? orderInfo.customerMapsLink : 'Tidak diperlukan'}`
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    
    const inboxData = {
      title: 'Pesanan sedang diproses',
      message: `Terima kasih, ${orderInfo.customerName}! Pesanan Anda telah kami teruskan ke Admin. Total Rp ${grandTotal.toLocaleString('id-ID')}.`
    };
    setInbox(inboxData);
    localStorage.setItem('hijrahTokoInbox', JSON.stringify(inboxData));
    
    clearCart();
    window.open(whatsappUrl, '_blank');
    document.getElementById('inbox')?.scrollIntoView({ behavior: 'smooth' });
  };

  const navToCategory = (e: any, cat: string) => {
    e.preventDefault();
    document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab(cat);
    setMobileNavOpen(false);
  };

  if (!isClient) return null;

  return (
    <>


{/*  Navbar  */}
<nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
  <div className="nav-container">
    <a href="#" className="nav-logo">
      <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="brand-logo" />
      <span className="brand-text">Hijrah<span>Toko</span></span>
    </a>
    <ul className="nav-links">
      <li><a href="#home" className="active">Home</a></li>
      <li className="dropdown">
        <a href="#produk" className="dropbtn">Produk <svg className="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></a>
        <div className="dropdown-content">
          <a href="#frozen" onClick={(e) => navToCategory(e, 'frozen')}>Frozen Food</a>
          <a href="#atk" onClick={(e) => navToCategory(e, 'atk')}>ATK</a>
          <a href="#other" onClick={(e) => navToCategory(e, 'other')}>Other</a>
        </div>
      </li>
      <li><a href="#testimoni">Testimoni</a></li>
      <li><a href="#checkout">Checkout</a></li>
      <li><a href="#lokasi">Lokasi Kami</a></li>
      <li><a href="#kontak">Kontak</a></li>
    </ul>
    <div className="nav-right">
      <button className="theme-toggle" id="themeToggle" type="button" aria-label="Ubah tema" onClick={toggleTheme}>
        <span className="theme-icon" id="themeIcon">{theme === 'dark' ? '☀️' : '🌙'}</span>
      </button>
      <button className="cart-btn" onClick={() => document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth' })}>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/></svg>
        <span className="cart-count" id="cartCount">{cartCount}</span>
      </button>
      <button className="mobile-toggle" id="mobileToggle" aria-label="Menu" onClick={() => setMobileNavOpen(true)}>
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

{/*  Mobile Nav  */}
<div className={`mobile-nav ${mobileNavOpen ? 'open' : ''}`} id="mobileNav">
  <div className="mobile-nav-content">
    <button className="mobile-nav-close" id="mobileClose" onClick={() => setMobileNavOpen(false)}>&times;</button>
    <ul className="mobile-nav-links">
      <li><a href="#home" >Home</a></li>
      <li className="dropdown">
        <a href="#produk" className="dropbtn" >Produk <svg className="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></a>
        <div className="dropdown-content">
          <a href="#frozen" >Frozen Food</a>
          <a href="#atk" >ATK</a>
          <a href="#other" >Other</a>
        </div>
      </li>
      <li><a href="#testimoni" >Testimoni</a></li>
      <li><a href="#checkout" >Checkout</a></li>
      <li><a href="#lokasi" >Lokasi Kami</a></li>
      <li><a href="#kontak" >Kontak</a></li>
    </ul>
  </div>
</div>

{/*  Hero  */}
<section className="hero" id="home">
  <div className="hero-container">
    <div className="hero-content fade-in">
      <div className="hero-brand-badge">
        <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="hero-logo" />
        <span>Brand Resmi Hijrah Toko</span>
      </div>
      <h1>Solusi <span className="highlight">Dapur & Meja Kerja</span> dalam Satu Pintu.</h1>
      <p>Hijrah Toko menyediakan frozen food berkualitas dan alat tulis kantor lengkap dengan harga terjangkau. Belanja mudah, langsung via WhatsApp!</p>
      <div className="hero-buttons">
        <a href="#produk" className="btn-primary">🛒 Lihat Produk</a>
        <a href="https://wa.me/6285263965031" className="btn-secondary" target="_blank">💬 Hubungi Kami</a>
      </div>
    </div>
    <div className="hero-image fade-in">
      <img src="/assets/images/hero-banner.png" alt="Hijrah Toko Products" />
    </div>
  </div>
</section>

{/*  Stats  */}
<div className="stats-bar">
  <div className="stats-container">
    <div className="stat-item fade-in"><h3>500+</h3><p>Produk Tersedia</p></div>
    <div className="stat-item fade-in"><h3>1000+</h3><p>Pelanggan Puas</p></div>
    <div className="stat-item fade-in"><h3>⭐ 4.9</h3><p>Rating Toko</p></div>
    <div className="stat-item fade-in"><h3>24 Jam</h3><p>Respon Cepat</p></div>
  </div>
</div>

{/*  Products Section  */}
<section className="section" id="produk">
  <div className="section-header fade-in">
    <h2>Produk Kami</h2>
    <p>Pilihan lengkap untuk kebutuhan dapur dan kantor Anda</p>
    <div className="underline"></div>
  </div>
  <div className="filter-tabs fade-in">
    <button className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>🏪 Semua</button>
    <button className={`filter-btn ${activeTab === 'frozen' ? 'active' : ''}`} onClick={() => setActiveTab('frozen')}>🧊 Frozen Food</button>
    <button className={`filter-btn ${activeTab === 'atk' ? 'active' : ''}`} onClick={() => setActiveTab('atk')}>📝 ATK</button>
    <button className={`filter-btn ${activeTab === 'other' ? 'active' : ''}`} onClick={() => setActiveTab('other')}>📦 Other</button>
  </div>
  {loadingProducts && <div style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Memuat produk...</div>}
  <div className="products-grid" id="productsGrid">
    {productsData.filter((p: any) => activeTab === 'all' || p.category === activeTab).map((p: any, i: number) => (
      <div key={p.id} className="product-card fade-in visible" style={{ transitionDelay: `${i * 0.08}s` }} data-category={p.category}>
        <span className={`card-badge badge-${p.category}`}>
          {p.category === 'frozen' ? '🧊 Frozen Food' : p.category === 'atk' ? '📝 ATK' : '📦 Other'}
        </span>
        <div className="card-img-wrap"><img src={p.img} alt={p.name} className="card-img" loading="lazy" /></div>
        <div className="card-body">
          <h3>{p.name}</h3>
          <p className="desc">{p.desc}</p>
        </div>
        <div className="card-footer">
          <span className="price">Rp {p.price.toLocaleString('id-ID')}</span>
          <button type="button" className="btn-wa" onClick={() => addToCart(p.id)}>
            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.61.606l4.584-1.47A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.332-.726-6.033-1.96l-.424-.316-2.727.874.892-2.654-.346-.55A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            Tambah
          </button>
        </div>
      </div>
    ))}
  </div>
</section>

{/*  Features  */}
<section className="section features-section" id="features">
  <div className="section-header fade-in">
    <h2>Kenapa Hijrah Toko?</h2>
    <p>Keunggulan berbelanja di toko kami</p>
    <div className="underline"></div>
  </div>
  <div className="features-grid">
    <div className="feature-card fade-in">
      <div className="feature-icon">🚚</div>
      <h3>Pengiriman Cepat</h3>
      <p>Pesanan diantar langsung ke alamat Anda dengan cepat dan aman</p>
    </div>
    <div className="feature-card fade-in">
      <div className="feature-icon">💰</div>
      <h3>Harga Bersahabat</h3>
      <p>Harga kompetitif dengan kualitas produk yang terjamin</p>
    </div>
    <div className="feature-card fade-in">
      <div className="feature-icon">✅</div>
      <h3>Produk Berkualitas</h3>
      <p>Semua produk terjamin kualitas dan keamanannya</p>
    </div>
    <div className="feature-card fade-in">
      <div className="feature-icon">💬</div>
      <h3>Order via WhatsApp</h3>
      <p>Pemesanan mudah langsung melalui WhatsApp</p>
    </div>
  </div>
</section>

{/*  Testimoni  */}
<section className="section testimoni-section" id="testimoni">
  <div className="section-header fade-in">
    <h2>Testimoni Pelanggan</h2>
    <p>Apa kata mereka yang sudah berbelanja di Hijrah Toko?</p>
    <div className="underline"></div>
  </div>
  <div className="testimoni-grid">
    <div className="testimoni-list fade-in" id="testimoniList">
    {reviews.map((r: any, i: number) => (
      <div key={i} className="testimoni-card">
        <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
        <h4>{r.name}</h4>
        <p>{r.text}</p>
        <small style={{ color: 'var(--gray)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
          {new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
        </small>
      </div>
    ))}
  </div>
    <div className="testimoni-form-card fade-in">
      <h3>Berikan Ulasan Anda</h3>
      <p style={{"color":"var(--gray)","fontSize":"0.9rem","marginBottom":"1rem"}}>Bagaimana pengalaman Anda berbelanja di sini?</p>
      <form id="reviewForm" className="order-form" onSubmit={submitReview}>
        <div className="star-rating-input" id="starInput">
          {[1, 2, 3, 4, 5].map(val => (
    <span key={val} className={`star ${val <= reviewForm.rating ? 'active' : ''}`} onClick={() => setReviewForm({...reviewForm, rating: val})}>★</span>
  ))}
        </div>
        <input type="hidden" id="reviewRating" value={reviewForm.rating} />
        <div className="form-group">
          <label htmlFor="reviewName">Nama</label>
          <input type="text" id="reviewName" placeholder="Nama Anda" required value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} />
        </div>
        <div className="form-group">
          <label htmlFor="reviewText">Ulasan</label>
          <textarea id="reviewText" rows={3} placeholder="Tuliskan ulasan Anda tentang toko atau produk kami" required value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})}></textarea>
        </div>
        <button className="btn-primary" type="submit" style={{"width":"100%","justifyContent":"center","marginTop":"0.5rem"}}>Kirim Ulasan</button>
      </form>
    </div>
  </div>
</section>

{/*  Checkout  */}
<section className="section checkout-section" id="checkout">
  <div className="section-header fade-in">
    <h2>Checkout Pesanan</h2>
    <p>Periksa keranjang, isi data pemesan, lalu kirim pesanan langsung ke WhatsApp admin.</p>
    <div className="underline"></div>
  </div>
  <div className="checkout-grid">
    <div className="checkout-card fade-in">
      <div className="checkout-card-head">
        <div>
          <h3>Keranjang Anda</h3>
          <p>Daftar barang tersimpan otomatis meski halaman di-refresh.</p>
        </div>
        <button className="btn-secondary btn-small" type="button" onClick={clearCart}>Kosongkan</button>
      </div>
      <div className="cart-items" id="cartItems">
    {!cart.length ? (
      <div className="empty-cart">Keranjang masih kosong. Tambahkan produk dari katalog di atas.</div>
    ) : (
      cart.map((item: any) => (
        <div key={item.id} className="cart-item">
          <div>
            <h4>{item.name}</h4>
            <p>Rp {item.price.toLocaleString('id-ID')} x {item.qty}</p>
          </div>
          <div className="cart-item-actions">
            <button type="button" onClick={() => changeQuantity(item.id, -1)}>-</button>
            <span>{item.qty}</span>
            <button type="button" onClick={() => changeQuantity(item.id, 1)}>+</button>
          </div>
        </div>
      ))
    )}
  </div>
      <div className="cart-summary">
        <div>
          <span>Total Item</span>
          <strong id="checkoutItemCount">{cartCount}</strong>
        </div>
        <div>
          <span>Total Harga</span>
          <strong id="checkoutTotal">Rp {getCartSubtotal().toLocaleString('id-ID')}</strong>
        </div>
      </div>
    </div>

    <div className="checkout-card fade-in">
      <div className="checkout-card-head form-head">
        <div>
          <h3>Data Pemesan</h3>
          <p>Lengkapi informasi agar admin bisa memproses pesanan Anda.</p>
        </div>
      </div>
      <form id="orderForm" className="order-form" onSubmit={submitOrder}>
        <div className="form-group">
          <label htmlFor="customerName">Nama</label>
          <input type="text" id="customerName" name="customerName" placeholder="Masukkan nama lengkap" required value={orderInfo.customerName} onChange={e => setOrderInfo({...orderInfo, customerName: e.target.value})} />
        </div>
        <div className="form-group">
          <label htmlFor="customerPhone">Nomor Telepon</label>
          <input type="tel" id="customerPhone" name="customerPhone" placeholder="08xxxxxxxxxx" required value={orderInfo.customerPhone} onChange={e => setOrderInfo({...orderInfo, customerPhone: e.target.value})} />
        </div>
        <div className="form-group">
          <label htmlFor="pickupDate">Tanggal Pengambilan / Pengiriman</label>
          <input type="date" id="pickupDate" name="pickupDate" required value={orderInfo.pickupDate} onChange={e => setOrderInfo({...orderInfo, pickupDate: e.target.value})} />
        </div>

        <div className="form-group">
          <label>Metode Pengambilan</label>
          <div className="option-grid">
            <label className="option-card">
              <input type="radio" name="deliveryMethod" value="pickup" checked={orderInfo.deliveryMethod === "pickup"} onChange={() => setOrderInfo({...orderInfo, deliveryMethod: "pickup"})} />
              <span>Ambil di Kedai</span>
              <small>Tanpa ongkir, ambil langsung ke toko.</small>
            </label>
            <label className="option-card">
              <input type="radio" name="deliveryMethod" value="delivery" checked={orderInfo.deliveryMethod === "delivery"} onChange={() => setOrderInfo({...orderInfo, deliveryMethod: "delivery"})} />
              <span>Diantarkan ke Alamat</span>
              <small>Ongkir dihitung otomatis dari lokasi Anda.</small>
            </label>
          </div>
        </div>

        <div id="deliveryFields" className={`delivery-fields ${orderInfo.deliveryMethod === 'delivery' ? '' : 'hidden'}`}>
          <div className="form-group">
            <label htmlFor="customerAddress">Alamat Lengkap / Lokasi</label>
            <textarea id="customerAddress" name="customerAddress" rows={4} placeholder="Masukkan alamat lengkap atau gunakan lokasi saat ini"></textarea>
          </div>
          <div className="location-tools">
            <button className="btn-secondary" type="button" id="useLocationBtn" onClick={useCurrentLocation}>Gunakan Lokasi Saya</button>
            <p className="location-status" id="locationStatus">Lokasi belum diambil.</p>
          </div>
        </div>

        <div className="form-group">
          <label>Metode Pembayaran</label>
          <div className="option-grid">
            <label className="option-card">
              <input type="radio" name="paymentMethod" value="COD" checked={orderInfo.paymentMethod === "COD"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "COD"})} />
              <span>COD (Bayar di Tempat)</span>
              <small>Bayar saat barang diterima atau diambil.</small>
            </label>
            <label className="option-card">
              <input type="radio" name="paymentMethod" value="Mandiri" checked={orderInfo.paymentMethod === "Mandiri"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "Mandiri"})} />
              <span>Transfer Bank Mandiri</span>
              <small>Transfer ke rekening Mandiri.</small>
            </label>
            <label className="option-card">
              <input type="radio" name="paymentMethod" value="BSI" checked={orderInfo.paymentMethod === "BSI"} onChange={() => setOrderInfo({...orderInfo, paymentMethod: "BSI"})} />
              <span>Transfer Bank BSI</span>
              <small>Transfer ke rekening BSI.</small>
            </label>
          </div>
        </div>
        <div className="payment-instructions" id="paymentInstructions">
          <h4>Instruksi Pembayaran</h4>
          <p id="paymentInstructionText">{PAYMENT_INFO[orderInfo.paymentMethod as keyof typeof PAYMENT_INFO]}</p>
        </div>

        <div className="cost-breakdown">
          <div><span>Subtotal Barang</span><strong id="subtotalPrice">Rp {getCartSubtotal().toLocaleString('id-ID')}</strong></div>
          <div><span>Ongkir</span><strong id="shippingCost">{shipInfo.shippingCost === null ? '-' : `Rp ${shipInfo.shippingCost.toLocaleString('id-ID')}`}</strong></div>
          <div><span>Diskon Ongkir</span><strong id="shippingDiscount">Rp {shipInfo.discount.toLocaleString('id-ID')}</strong></div>
          <div><span>Total Bayar</span><strong id="grandTotal">Rp {grandTotal.toLocaleString('id-ID')}</strong></div>
        </div>
        <div className="shipping-meta">
          <p id="distanceInfo">Jarak tempuh: {shipInfo.distanceKm === null ? '-' : `${shipInfo.distanceKm.toLocaleString('id-ID')} km`}</p>
          <p id="shippingDetail">{shipInfo.detail}</p>
        </div>
        <input type="hidden" id="customerLatitude" name="customerLatitude" />
        <input type="hidden" id="customerLongitude" name="customerLongitude" />
        <input type="hidden" id="customerMapsLink" name="customerMapsLink" />
        <button className="btn-primary submit-order-btn" type="submit">Kirim Pesanan</button>
      </form>
    </div>
  </div>
</section>

{/*  Location  */}
<section className="section location-section" id="lokasi">
  <div className="section-header fade-in">
    <h2>Lokasi Kami</h2>
    <p>Lihat posisi toko dan rute menuju Hijrah Toko melalui peta di bawah ini.</p>
    <div className="underline"></div>
  </div>
  <div className="location-card fade-in">
    <div className="location-info">
      <h3>Hijrah Toko</h3>
      <p>C647+95W, Jl. Raya Pariaman - Sicincin, Sungai Sariak, VII Koto Sungai Sarik, Kabupaten Padang Pariaman, Sumatera Barat 25574</p>
      <a className="btn-secondary" href="https://www.google.com/maps/place/Hijrah+TOKO/@0.5939347,100.2128799,19z" target="_blank" rel="noopener noreferrer">Buka di Google Maps</a>
    </div>
    <div className="map-embed">
      <iframe
        title="Lokasi Hijrah Toko"
        src="https://www.google.com/maps?q=Hijrah%20TOKO%20Pariaman%200.5939347,100.2128799&z=18&output=embed"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>

{/*  Inbox Notification  */}
<section className="section inbox-section" id="inbox">
  <div className="section-header fade-in">
    <h2>Pesan & Notifikasi</h2>
    <p>Status pesanan terbaru Anda akan tampil di sini setelah pesanan dikirim.</p>
    <div className="underline"></div>
  </div>
  <div className={`inbox-card fade-in ${inbox.title ? 'active' : ''}`} id="inboxCard">
    <div className="inbox-icon">📨</div>
    <div>
      <h3 id="inboxTitle">{inbox.title || 'Belum ada pesanan'}</h3>
      <p id="inboxMessage">{inbox.message || 'Silakan pilih produk dan kirim pesanan Anda melalui form checkout.'}</p>
    </div>
  </div>
</section>

{/*  Footer  */}
<footer className="footer" id="kontak">
  <div className="footer-grid">
    <div className="footer-brand">
      <div className="footer-brand-head">
        <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="footer-logo" />
        <h4>Hijrah Toko</h4>
      </div>
      <p>Toko serba ada yang menyediakan frozen food berkualitas dan alat tulis kantor lengkap untuk kebutuhan Anda sehari-hari.</p>
      <div className="social-links">
        <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
        <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
        <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>
      </div>
    </div>
    <div>
      <h4>Menu</h4>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#produk">Produk</a></li>
        <li><a href="#frozen" >Frozen Food</a></li>
        <li><a href="#atk" >ATK</a></li>
        <li><a href="#other" >Other</a></li>
        <li><a href="#testimoni">Testimoni</a></li>
      </ul>
    </div>
    <div>
      <h4>Jam Operasional</h4>
      <ul>
        <li>Senin - Sabtu</li>
        <li>08:00 - 21:00 WIB</li>
        <li style={{"marginTop":"0.5rem"}}>Minggu</li>
        <li>09:00 - 17:00 WIB</li>
      </ul>
    </div>
    <div>
      <h4>Kontak</h4>
      <ul>
        <li>📍 C647+95W, Jl. Raya Pariaman - Sicincin, Sungai Sariak, VII Koto Sungai Sarik, Kabupaten Padang Pariaman, Sumatera Barat 25574</li>
        <li>📱 0852-6396-5031</li>
        <li>📧 hijrahtoko@gmail.com</li>
      </ul>
    </div>
  </div>
  <div className="footer-bottom">
    <p>&copy; 2026 Hijrah Toko. All rights reserved.</p>
  </div>
</footer>

{/*  Scroll to Top  */}
<button className={`scroll-top ${scrolled ? 'visible' : ''}`} id="scrollTop" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
</button>


    </>
  );
}

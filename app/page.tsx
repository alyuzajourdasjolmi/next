"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  ChevronDown,
  Moon,
  Sun,
  User as UserIcon,
  LogOut,
  MapPin,
  Phone,
  MessageSquare,
  Package,
  Star,
  Sparkles,
  ChefHat,
  Snowflake,
  PenLine,
  Box,
  Shield,
  Truck,
  CreditCard,
  Heart,
  Check,
  ArrowRight,
  Clock,
  Download,
  Bell,
  CheckCircle2,
  Bot,
  Wifi,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart-context';
import { ADMIN_EMAIL, STORE_NAME, STORE_COORDINATES } from '../lib/store-constants';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const homeAnchor = (hash: string) => (isHome ? hash : `/${hash}`);
  const { cartCount, setIsCartOpen, addToCart } = useCart();

  // Local state
  const [isClient, setIsClient] = useState(false);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [theme, setTheme] = useState('light');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTheme(localStorage.getItem('hijrahTokoTheme') || 'light');
  }, []);

  // Theme effect
  useEffect(() => {
    if (isClient) {
      document.body.classList.toggle('dark-mode', theme === 'dark');
      localStorage.setItem('hijrahTokoTheme', theme);
    }
  }, [theme, isClient]);

  // Auth listener
  useEffect(() => {
    if (!isClient) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, [isClient]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Fetch products
  useEffect(() => {
    if (!isClient) return;
    const fetchData = async () => {
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        setProductsData(products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        // Fallback data
        setProductsData([
          { id: 1, name: 'Nugget Ayam', desc: 'Nugget ayam crispy premium, 500gr.', price: 32000, category: 'frozen', img: '/assets/images/nugget.png', stock: 25 },
          { id: 2, name: 'Sosis Sapi', desc: 'Sosis sapi berkualitas, 300gr.', price: 28000, category: 'frozen', img: '/assets/images/sosis.png', stock: 18 },
          { id: 3, name: 'Bakso Sapi', desc: 'Bakso sapi kenyal isi 25 butir.', price: 35000, category: 'frozen', img: '/assets/images/bakso.png', stock: 12 },
          { id: 4, name: 'Buku Tulis', desc: 'Buku tulis 58 lembar, sampul tebal.', price: 5000, category: 'atk', img: '/assets/images/buku-tulis.png', stock: 100 },
          { id: 5, name: 'Pulpen Pilot', desc: 'Pulpen Pilot 0.5mm, tinta smooth.', price: 8000, category: 'atk', img: '/assets/images/pulpen.png', stock: 60 },
          { id: 6, name: 'Kertas HVS A4', desc: 'Kertas HVS A4 70gsm, 500 lembar.', price: 48000, category: 'atk', img: '/assets/images/buku-tulis.png', stock: 30 },
          { id: 7, name: 'Tisu Wajah', desc: 'Tisu wajah lembut, 250 sheets.', price: 12000, category: 'other', img: '/assets/images/buku-tulis.png', stock: 40 },
          { id: 8, name: 'Botol Minum', desc: 'Botol minum plastik BPA Free 1L.', price: 25000, category: 'other', img: '/assets/images/pulpen.png', stock: 20 },
        ]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchData();
  }, [isClient]);

  // Scroll spy + scrolled state
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sectionIds = ['home', 'kategori', 'produk', 'keunggulan', 'lokasi'];
      let current = '';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 200) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hero auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      if (!heroPaused) setHeroSlide((p) => (p + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroPaused]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const navToCategory = (e: React.MouseEvent, cat: string) => {
    e.preventDefault();
    document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' });
    setActiveTab(cat);
    setMobileNavOpen(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') console.log('PWA installed');
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      alert(
        isIOS
          ? '📱 Install di iOS:\n1. Tap tombol Share\n2. "Add to Home Screen"\n3. Tap "Add"'
          : '💻 Install di Chrome:\n1. Klik ikon ⊕ di address bar\n2. Pilih "Install Hijrah Toko"\n3. Klik "Install"'
      );
    }
  };

  // Products filtered by category and search
  const filteredProducts = productsData
    .filter((p) => activeTab === 'all' || p.category === activeTab)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 8);

  const categories = [
    {
      id: 'frozen',
      name: 'Frozen Food',
      icon: Snowflake,
      desc: 'Nugget, sosis, bakso, dimsum & lainnya',
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.08)',
    },
    {
      id: 'atk',
      name: 'Alat Tulis',
      icon: PenLine,
      desc: 'Buku, pulpen, kertas, spidol & lainnya',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.08)',
    },
    {
      id: 'other',
      name: 'Lainnya',
      icon: Box,
      desc: 'Tisu, botol minum, dan kebutuhan lain',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Kualitas Terjamin',
      desc: 'Produk frozen food halal & ATK original dari brand terpercaya.',
    },
    {
      icon: Truck,
      title: 'Pengiriman Cepat',
      desc: 'Same-day delivery untuk area Padang Pariaman dan sekitarnya.',
    },
    {
      icon: CreditCard,
      title: 'Pembayaran Fleksibel',
      desc: 'COD, transfer bank, atau bayar di tempat. Aman & mudah.',
    },
    {
      icon: MessageSquare,
      title: 'CS Responsif',
      desc: 'Hubungi kami via WhatsApp untuk bantuan & pertanyaan.',
    },
    {
      icon: ChefHat,
      title: 'Resep & Tips',
      desc: 'Konsultasi resep frozen food gratis dengan Nura AI assistant.',
    },
    {
      icon: Heart,
      title: 'Harga Bersahabat',
      desc: 'Harga grosir untuk reseller, diskon ongkir untuk belanja min. 150rb.',
    },
  ];

  const heroSlideLabels = ['Belanja Lengkap', 'Install Aplikasi', 'NURA AI'];

  return (
    <>
      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="brand-logo" />
            <span className="brand-text">
              Hijrah<span>Toko</span>
            </span>
          </Link>

          <ul className="nav-links">
            <li>
              <Link href={homeAnchor('#home')} className={activeSection === 'home' ? 'active' : ''}>
                Beranda
              </Link>
            </li>
            <li className="dropdown">
              <Link href={homeAnchor('#kategori')} className="dropbtn">
                Kategori <ChevronDown className="chevron" size={16} />
              </Link>
              <div className="dropdown-content">
                <a href="#frozen" onClick={(e) => navToCategory(e, 'frozen')}>🧊 Frozen Food</a>
                <a href="#atk" onClick={(e) => navToCategory(e, 'atk')}>📝 ATK</a>
                <a href="#other" onClick={(e) => navToCategory(e, 'other')}>📦 Lainnya</a>
              </div>
            </li>
            <li>
              <Link href={homeAnchor('#produk')} className={activeSection === 'produk' ? 'active' : ''}>
                Produk
              </Link>
            </li>
            <li>
              <Link href="/tracking" className={pathname === '/tracking' ? 'active' : ''}>
                Lacak
              </Link>
            </li>
            <li>
              <Link href={homeAnchor('#keunggulan')} className={activeSection === 'keunggulan' ? 'active' : ''}>
                Keunggulan
              </Link>
            </li>
            <li>
              <Link href={homeAnchor('#lokasi')} className={activeSection === 'lokasi' ? 'active' : ''}>
                Lokasi
              </Link>
            </li>
          </ul>

          <div className="nav-right">
            <div className="nav-actions">
              {user ? (
                <div className="user-dropdown">
                  <div className="user-profile-trigger">
                    <div className="user-avatar">
                      {user.user_metadata?.full_name?.charAt(0).toUpperCase() || <UserIcon size={18} />}
                    </div>
                    <span className="user-name-short">
                      {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                  <div className="user-menu-content">
                    <div className="user-menu-header">
                      <strong>{user.user_metadata?.full_name || 'Pelanggan'}</strong>
                      <p>{user.email}</p>
                    </div>
                    <div className="user-menu-divider"></div>
                    <Link href="/profile">
                      <UserIcon size={16} /> Profil Saya
                    </Link>
                    <Link href="/tracking">
                      <Package size={16} /> Pesanan Saya
                    </Link>
                    <Link href="/addresses">
                      <MapPin size={16} /> Kelola Alamat
                    </Link>
                    {user?.email === ADMIN_EMAIL && (
                      <Link href="/dashboard">
                        <CheckCircle2 size={16} /> Dashboard Admin
                      </Link>
                    )}
                    <div className="user-menu-divider"></div>
                    <button className="user-logout-btn" onClick={handleLogout}>
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="btn-login-pill">
                  Masuk
                </Link>
              )}
            </div>

            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="cart-btn" onClick={() => setIsCartOpen(true)} aria-label="Buka keranjang">
              <ShoppingCart size={20} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    className="cart-count"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button className="mobile-toggle" onClick={() => setMobileNavOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            className="mobile-nav open"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="mobile-nav-content">
              <div className="mobile-nav-header">
                <div className="mobile-nav-brand">
                  <img src="/assets/images/logo-hijrah-toko.png" alt="Logo" />
                  <span>Hijrah Toko</span>
                </div>
                <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="mobile-nav-scroll">
                <ul className="mobile-nav-links">
                  <li><Link href={homeAnchor('#home')} onClick={() => setMobileNavOpen(false)}>🏠 Beranda</Link></li>
                  <li><Link href={homeAnchor('#kategori')} onClick={() => setMobileNavOpen(false)}>📂 Kategori</Link></li>
                  <li><Link href={homeAnchor('#produk')} onClick={() => setMobileNavOpen(false)}>📦 Produk Unggulan</Link></li>
                  <li><Link href={homeAnchor('#keunggulan')} onClick={() => setMobileNavOpen(false)}>✨ Keunggulan</Link></li>
                  <li><Link href="/tracking" onClick={() => setMobileNavOpen(false)}>🔍 Lacak Pesanan</Link></li>
                  <li><Link href={homeAnchor('#lokasi')} onClick={() => setMobileNavOpen(false)}>📍 Lokasi</Link></li>
                  {user && user?.email === ADMIN_EMAIL && (
                    <li style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                      <Link href="/dashboard" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>⚙️ Dashboard Admin</Link>
                    </li>
                  )}
                </ul>
              </div>

              <div className="mobile-nav-footer">
                {user ? (
                  <div className="mobile-user-info">
                    <div className="user-details">
                      <div className="user-avatar">
                        {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <strong>{user.user_metadata?.full_name || 'User'}</strong>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <button className="mobile-logout-btn" onClick={handleLogout}>
                      Keluar
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="mobile-auth-btn" onClick={() => setMobileNavOpen(false)}>
                    Masuk / Daftar
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section
        className="hero hero-v2"
        id="home"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="hero-progress-track" aria-hidden="true">
          <motion.div
            className="hero-progress-bar"
            key={`progress-${heroSlide}-${heroPaused}`}
            initial={{ width: '0%' }}
            animate={{ width: heroPaused ? '0%' : '100%' }}
            transition={{ duration: heroPaused ? 0 : 6, ease: 'linear' }}
          />
        </div>

        <AnimatePresence mode="wait">
          {heroSlide === 0 && (
            <motion.div
              key="slide-toko"
              className="hero-slide hero-slide-toko"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="hero-bg-image"
                style={{ inset: 0, width: '100%', height: '100%', borderRadius: 0, border: 'none', boxShadow: 'none', transform: 'none', top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <Image src="/assets/images/hero-toko.jpeg" alt="Toko Hijrah TOKO" fill priority unoptimized sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%)' }} />
              </div>

              <div className="hero-container-new" style={{ position: 'relative', zIndex: 4 }}>
                <motion.div
                  className="hero-content-new hero-slide-toko"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <div className="hero-eyebrow-v2">
                    <Sparkles size={14} />
                    <span>Satu Pintu Solusi Anda</span>
                  </div>
                  <h1 className="hero-title-new">HIJRAH<span>TOKO</span></h1>
                  <p className="hero-desc-new">
                    Menghadirkan kenyamanan belanja <strong>Frozen Food</strong> premium dan kelengkapan <strong>ATK</strong> dalam satu genggaman modern.
                  </p>
                  <div className="hero-actions-new">
                    <motion.a
                      href="#kategori"
                      className="btn-hero-primary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Jelajahi Produk <ShoppingCart size={18} />
                    </motion.a>
                    <motion.a
                      href="https://wa.me/6285263965031"
                      className="btn-hero-outline"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageSquare size={18} /> Hubungi Admin
                    </motion.a>
                  </div>

                  <div className="hero-trust-row">
                    <div className="hero-trust-item">
                      <div className="hero-trust-avatars">
                        <span className="hero-trust-avatar" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>A</span>
                        <span className="hero-trust-avatar" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>B</span>
                        <span className="hero-trust-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>C</span>
                      </div>
                      <div>
                        <strong>1.000+</strong>
                        <span>Pelanggan puas</span>
                      </div>
                    </div>
                    <div className="hero-trust-divider"></div>
                    <div className="hero-trust-item">
                      <div className="hero-trust-rating">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill="#f59e0b" stroke="#f59e0b" />
                        ))}
                      </div>
                      <div>
                        <strong>4.9 / 5.0</strong>
                        <span>Rating toko</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {heroSlide === 1 && (
            <motion.div
              key="slide-promo"
              className="hero-slide hero-slide-app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <Image src="/assets/images/hero-aplikasi.jpeg" alt="Frozen Food" fill unoptimized sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'right center' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.4) 70%, rgba(10,10,10,0.1) 100%)' }} />
              </div>

              <div className="hero-container-new" style={{ position: 'relative', zIndex: 4 }}>
                <motion.div
                  className="hero-content-new hero-content-app"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <div className="hero-eyebrow-v2">
                    <Download size={14} />
                    <span>Aplikasi Mobile Ready</span>
                  </div>
                  <h1 className="hero-title-new" style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.75rem)' }}>
                    Belanja Lebih <span>Cepat & Praktis</span>
                  </h1>
                  <p className="hero-desc-new">
                    Install aplikasi <strong>{STORE_NAME}</strong> di HP Anda. Akses katalog, keranjang, dan tracking pesanan dalam satu sentuhan.
                  </p>
                  <div className="hero-actions-new">
                    <button
                      onClick={handleInstallClick}
                      className="btn-hero-primary"
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      <Download size={18} /> Install Aplikasi
                    </button>
                    <a href="#produk" className="btn-hero-outline">
                      <ShoppingCart size={18} /> Lihat Produk
                    </a>
                  </div>

                  <div className="hero-feature-grid-app">
                    {[
                      { icon: Check, text: 'Akses cepat dari home screen' },
                      { icon: Bell, text: 'Notifikasi promo & pesanan' },
                      { icon: Wifi, text: 'Mode hemat data' },
                    ].map((f, i) => (
                      <div key={i} className="hero-feature-item-app">
                        <span className="hero-feature-icon-app"><f.icon size={16} /></span>
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {heroSlide === 2 && (
            <motion.div
              key="slide-nura"
              className="hero-slide hero-slide-nura"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="hero-nura-bg" aria-hidden="true" />

              <div className="hero-container-new hero-container-nura" style={{ position: 'relative', zIndex: 4 }}>
                <div className="hero-nura-layout">
                  <motion.div
                    className="hero-content-new hero-content-nura"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    <div className="hero-eyebrow-v2 hero-eyebrow-nura">
                      <Sparkles size={14} />
                      <span>Powered by AI</span>
                    </div>
                    <h1 className="hero-title-new">
                      Kenalan dengan <span className="hero-nura-highlight">NURA</span>
                    </h1>
                    <p className="hero-desc-new hero-desc-nura">
                      Chef AI assistant yang siap membantu kamu memasak frozen food dengan resep, tips, dan trik yang praktis.
                    </p>

                    <div className="hero-nura-features">
                      {[
                        { icon: '⚡', text: 'Respon cepat 24/7' },
                        { icon: '🍳', text: 'Resep terlengkap' },
                        { icon: '🎯', text: 'Rekomendasi personal' },
                      ].map((f, i) => (
                        <motion.div
                          key={i}
                          className="hero-nura-feature"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                        >
                          <span className="hero-nura-feature-icon">{f.icon}</span>
                          <span>{f.text}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="hero-actions-new">
                      <Link href="/chef" className="btn-hero-primary btn-nura">
                        <Bot size={18} /> Chat dengan Nura
                      </Link>
                      <a href="#produk" className="btn-hero-outline">
                        <ShoppingCart size={18} /> Lihat Produk
                      </a>
                    </div>
                  </motion.div>

                  <motion.div
                    className="hero-nura-visual"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <div className="hero-nura-card">
                      <Image
                        src="/assets/images/nura.png"
                        alt="Nura AI Assistant"
                        width={1536}
                        height={1024}
                        unoptimized
                        priority
                        className="hero-nura-img"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="hero-slide-dots">
          {heroSlideLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`hero-dot ${heroSlide === i ? 'active' : ''}`}
              aria-label={`Slide ${i + 1}: ${label}`}
            />
          ))}
        </div>
      </section>

      {/* ── KATEGORI ── */}
      <section className="section" id="kategori" style={{ background: 'var(--bg-main)' }}>
        <div className="section-container">
          <div className="section-header">
            <div className="section-eyebrow">
              <Sparkles size={14} /> Kategori Produk
            </div>
            <h2 className="section-title">Pilih Sesuai Kebutuhan</h2>
            <p className="section-subtitle">
              Temukan produk favoritmu berdasarkan kategori
            </p>
          </div>

          <div className="kategori-grid">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              const count = productsData.filter((p) => p.category === cat.id).length;
              return (
                <motion.button
                  key={cat.id}
                  onClick={(e) => navToCategory(e as any, cat.id)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="kategori-card"
                  style={{ background: cat.bg, borderColor: `${cat.color}30` }}
                >
                  <div
                    className="kategori-icon"
                    style={{ background: cat.color, color: '#fff' }}
                  >
                    <Icon size={28} />
                  </div>
                  <div className="kategori-info">
                    <h3>{cat.name}</h3>
                    <p>{cat.desc}</p>
                    <span className="kategori-count" style={{ color: cat.color }}>
                      {count > 0 ? `${count} produk` : 'Lihat'} <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRODUK UNGGULAN ── */}
      <section className="section" id="produk" style={{ background: 'var(--bg-surface-soft)' }}>
        <div className="section-container">
          <div className="section-header">
            <div className="section-eyebrow">
              <Star size={14} /> Produk Unggulan
            </div>
            <h2 className="section-title">Best Seller Kami</h2>
            <p className="section-subtitle">Pilihan produk terlaris dan favorit pelanggan</p>
          </div>

          {/* Filter tabs */}
          <div className="product-filter-bar">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'frozen', label: '🧊 Frozen' },
              { id: 'atk', label: '📝 ATK' },
              { id: 'other', label: '📦 Lainnya' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`product-filter-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
            <div className="product-search-mini">
              <Search size={14} />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Products grid */}
          {loadingProducts ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card-skeleton" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={48} strokeWidth={1} color="#cbd5e1" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── KEUNGGULAN ── */}
      <section className="section" id="keunggulan" style={{ background: 'var(--bg-main)' }}>
        <div className="section-container">
          <div className="section-header">
            <div className="section-eyebrow">
              <Sparkles size={14} /> Kenapa Pilih Kami
            </div>
            <h2 className="section-title">Keunggulan {STORE_NAME}</h2>
            <p className="section-subtitle">6 alasan mengapa pelanggan kami tetap setia</p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="feature-card"
                >
                  <div className="feature-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section cta-section">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="cta-card"
          >
            <div className="cta-content">
              <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <Sparkles size={14} /> Saatnya Belanja
              </div>
              <h2 className="cta-title">Siap Memenuhi Kebutuhan Anda?</h2>
              <p className="cta-desc">
                Frozen food premium, ATK lengkap, dan kebutuhan lain. Semuanya dalam satu aplikasi.
              </p>
              <div className="cta-actions">
                <a href="#kategori" className="btn-cta-primary">
                  <ShoppingCart size={18} /> Mulai Belanja
                </a>
                <a href="https://wa.me/6285263965031" className="btn-cta-outline">
                  <MessageSquare size={18} /> Tanya Admin
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── LOKASI ── */}
      <section className="section location-section" id="lokasi">
        <div className="section-container">
          <div className="section-header">
            <div className="section-eyebrow">
              <MapPin size={14} /> Lokasi Toko
            </div>
            <h2 className="section-title">Temukan Kami</h2>
            <p className="section-subtitle">Kunjungi toko kami atau gunakan layanan antar</p>
          </div>

          <div className="location-grid">
            <div className="location-info">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {STORE_NAME}
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Pusat frozen food & ATK terlengkap di Padang Pariaman
              </p>
              <ul className="location-contact-list">
                <li>
                  <span className="loc-icon"><MapPin size={16} /></span>
                  <div>
                    <strong>Alamat</strong>
                    <span>Padang Pariaman, Sumatera Barat</span>
                  </div>
                </li>
                <li>
                  <span className="loc-icon"><Phone size={16} /></span>
                  <div>
                    <strong>Telepon / WhatsApp</strong>
                    <span>0852-6396-5031</span>
                  </div>
                </li>
                <li>
                  <span className="loc-icon"><Clock size={16} /></span>
                  <div>
                    <strong>Jam Operasional</strong>
                    <span>Senin – Sabtu, 08.00 – 21.00 WIB</span>
                  </div>
                </li>
                <li>
                  <span className="loc-icon"><MessageSquare size={16} /></span>
                  <div>
                    <strong>Email</strong>
                    <span>admin.hijrahtoko@gmail.com</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="location-map">
              <iframe
                title="Lokasi Toko"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${STORE_COORDINATES.lon - 0.01},${STORE_COORDINATES.lat - 0.01},${STORE_COORDINATES.lon + 0.01},${STORE_COORDINATES.lat + 0.01}&layer=mapnik&marker=${STORE_COORDINATES.lat},${STORE_COORDINATES.lon}`}
                style={{ border: 0, width: '100%', height: '100%', borderRadius: 16 }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="nav-logo" style={{ marginBottom: '1.5rem' }}>
              <img src="/assets/images/logo-hijrah-toko.png" alt="Logo" className="brand-logo" />
              <span className="brand-text" style={{ color: '#ffffff' }}>
                Hijrah<span style={{ color: 'var(--primary)' }}>Toko</span>
              </span>
            </div>
            <p>
              {STORE_NAME} adalah pusat penyedia frozen food premium dan alat tulis kantor terlengkap. Kami berkomitmen memberikan kualitas terbaik dan layanan cepat untuk Anda.
            </p>
          </div>

          <div className="footer-col">
            <h4>Belanja</h4>
            <ul>
              <li><a href="#kategori">Kategori</a></li>
              <li><a href="#produk">Produk Unggulan</a></li>
              <li><Link href="/cart">Keranjang</Link></li>
              <li><Link href="/tracking">Lacak Pesanan</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Bantuan</h4>
            <ul>
              <li><a href="https://wa.me/6285263965031">WhatsApp</a></li>
              <li><Link href="/profile">Akun Saya</Link></li>
              <li><Link href="/addresses">Kelola Alamat</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Hubungi Kami</h4>
            <ul className="footer-contact-list">
              <li>
                <Phone size={18} />
                <span>+62 852-6396-5031</span>
              </li>
              <li>
                <MessageSquare size={18} />
                <span>admin.hijrahtoko@gmail.com</span>
              </li>
              <li>
                <MapPin size={18} />
                <span>Padang Pariaman, Sumatera Barat</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} {STORE_NAME}. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="product-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedProduct(null)}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
              <div className="modal-img-wrap">
                {selectedProduct.img ? (
                  <Image
                    src={selectedProduct.img}
                    alt={selectedProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="product-img-placeholder">
                    <Package size={48} strokeWidth={1.4} />
                  </div>
                )}
              </div>
              <div className="modal-body">
                <span className="product-category-pill">
                  {selectedProduct.category === 'frozen' ? '🧊 Frozen Food' : selectedProduct.category === 'atk' ? '📝 ATK' : '📦 Lainnya'}
                </span>
                <h2>{selectedProduct.name}</h2>
                <p className="modal-price">Rp {selectedProduct.price.toLocaleString('id-ID')}</p>
                <p className="modal-desc">{selectedProduct.desc}</p>
                <div className="modal-stock">
                  {(selectedProduct.stock || 0) > 0 ? (
                    <span className="stock-available">
                      <CheckCircle2 size={14} /> Stok tersedia: {selectedProduct.stock}
                    </span>
                  ) : (
                    <span className="stock-out">
                      <X size={14} /> Stok habis
                    </span>
                  )}
                </div>
                <button
                  className="modal-add-btn"
                  disabled={(selectedProduct.stock || 0) <= 0}
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <ShoppingCart size={18} />
                  Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install PWA prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="install-prompt"
          >
            <div className="install-prompt-content">
              <Download size={20} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <strong>Install Aplikasi</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Akses lebih cepat dari home screen
                </p>
              </div>
              <button onClick={handleInstallClick} className="install-prompt-btn">
                Install
              </button>
              <button onClick={() => setShowInstallPrompt(false)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

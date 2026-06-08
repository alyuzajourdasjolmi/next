"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  X,
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
  Navigation,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart-context';
import { ADMIN_EMAIL, STORE_NAME, STORE_COORDINATES } from '../lib/store-constants';
import { fetchRealSoldCounts, mergeSoldCount } from '../lib/product-stats';
import SiteNavbar from '../components/SiteNavbar';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { addToCart } = useCart();

  // Local state
  const [isClient, setIsClient] = useState(false);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for category nav from SiteNavbar
  useEffect(() => {
    const handler = (e: Event) => {
      const catId = (e as CustomEvent).detail?.category;
      if (catId) setActiveTab(catId);
    };
    window.addEventListener('nav-category', handler);
    return () => window.removeEventListener('nav-category', handler);
  }, []);

  // Fetch products
  useEffect(() => {
    if (!isClient) return;
    const fetchData = async () => {
      try {
        const [{ data: products, error }, realSold] = await Promise.all([
          supabase.from('products').select('*').order('id', { ascending: true }),
          fetchRealSoldCounts(),
        ]);
        if (error) throw error;
        const enriched = (products || []).map((p: any) => ({
          ...p,
          sold_count: mergeSoldCount(p, realSold),
        }));
        setProductsData(enriched);
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

  // Fetch active banners
  useEffect(() => {
    if (!isClient) return;
    supabase.from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setBanners(data);
        }
      });
  }, [isClient]);

  // Hero auto-slide
  const slideCount = banners.length || 3;
  useEffect(() => {
    const timer = setInterval(() => {
      if (!heroPaused) setHeroSlide((p) => (p + 1) % slideCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroPaused, slideCount]);

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

  // Best seller products (sorted by sold_count)
  const bestSellerProducts = [...productsData]
    .filter((p) => activeTab === 'all' || p.category === activeTab)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
    .slice(0, 8);

  // Products filtered by category and search (for the regular grid if needed, but we use bestSeller for the section)
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

  const mapRef = useRef<HTMLDivElement>(null);
  const [leafletMap, setLeafletMap] = useState<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  const initLeafletMap = useCallback(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;
    if (mapRef.current.dataset.mapInit === 'true') return;
    mapRef.current.dataset.mapInit = 'true';

    const store = STORE_COORDINATES;
    const newMap = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([store.lat, store.lon], 16);

    L.control.zoom({ position: 'bottomleft' }).addTo(newMap);

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google',
      maxZoom: 20,
    }).addTo(newMap);

    const customIcon = L.divIcon({
      className: 'leaflet-store-marker',
      html: `<div class="store-marker-pin"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    L.marker([store.lat, store.lon], { icon: customIcon })
      .addTo(newMap)
      .bindPopup(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:600;padding:2px 0">${STORE_NAME}</div><div style="font-size:11px;color:#64748b">Padang Pariaman, Sumbar</div>`
      );

    newMap.once('moveend', () => newMap.invalidateSize());
    setTimeout(() => { try { newMap.invalidateSize(); } catch (e) { /* ignore */ } }, 500);

    setLeafletMap(newMap);
    setLeafletReady(true);
  }, []);

  const centerMapToStore = useCallback(() => {
    if (!leafletMap) return;
    const store = STORE_COORDINATES;
    leafletMap.setView([store.lat, store.lon], 16, { animate: true, duration: 0.5 });
  }, [leafletMap]);

  useEffect(() => {
    if ((window as any).L) {
      initLeafletMap();
      return;
    }
    const check = setInterval(() => {
      if ((window as any).L) {
        initLeafletMap();
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, [initLeafletMap]);

  return (
    <>
      {/* Navbar */}
      <SiteNavbar />

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
          {banners.length > 0 ? banners.map((banner, idx) => (
            heroSlide === idx && (
              <motion.div
                key={banner.id}
                className="hero-slide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0,
                  backgroundImage: `url(${banner.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}>
                  {(() => {
                    const raw = banner.bg_color || '';
                    const isGradient = raw.startsWith('linear-gradient') || raw.startsWith('radial-gradient');
                    let overlayBg = raw;
                    if (!isGradient && raw.startsWith('#') && raw.length >= 7) {
                      const r = parseInt(raw.slice(1, 3), 16);
                      const g = parseInt(raw.slice(3, 5), 16);
                      const b = parseInt(raw.slice(5, 7), 16);
                      overlayBg = `linear-gradient(to right, rgba(${r},${g},${b},0.88) 0%, rgba(${r},${g},${b},0.65) 45%, rgba(${r},${g},${b},0.15) 100%)`;
                    }
                    return <div style={{ position: 'absolute', inset: 0, background: overlayBg || 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%)' }} />;
                  })()}
                </div>

                <div className="hero-container-new" style={{ position: 'relative', zIndex: 4 }}>
                  <motion.div
                    className="hero-content-new"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    <h1 className="hero-title-new" style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.75rem)' }}>
                      {(() => {
                        const words = banner.title.split(' ');
                        const lastWord = words.pop()!;
                        return (
                          <>
                            {words.length > 0 && <>{words.join(' ')} </>}
                            <span>{lastWord}</span>
                          </>
                        );
                      })()}
                    </h1>
                    {banner.subtitle && <div className="hero-eyebrow-v2"><span>{banner.subtitle}</span></div>}
                    {banner.description && <p className="hero-desc-new">{banner.description}</p>}
                    {banner.buttons && banner.buttons.length > 0 && (
                      <div className="hero-actions-new">
                        {banner.buttons.map((btn: any, bi: number) => (
                          btn.style === 'outline' ? (
                            <a key={bi} href={btn.url} className="btn-hero-outline">{btn.label}</a>
                          ) : (
                            <a key={bi} href={btn.url} className="btn-hero-primary">{btn.label}</a>
                          )
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )
          )) : (
            <>
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
                  <div className="hero-bg-image-right">
                    <Image
                      src="/assets/images/nura.png"
                      alt="Nura AI Assistant"
                      fill
                      unoptimized
                      sizes="50vw"
                      priority
                      style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                  </div>

                  <div className="hero-container-new" style={{ position: 'relative', zIndex: 4 }}>
                    <motion.div
                      className="hero-content-new hero-content-nura"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.7 }}
                    >
                      <div className="hero-eyebrow-v2">
                        <Bot size={14} />
                        <span>Powered by AI</span>
                      </div>
                      <h1 className="hero-title-new">
                        Kenalan dengan <span>NURA</span>
                      </h1>
                      <p className="hero-desc-new">
                        Chef AI assistant yang siap membantu kamu memasak frozen food dengan resep, tips, dan trik yang praktis.
                      </p>
                      <div className="hero-actions-new">
                        <Link href="/chef" className="btn-hero-primary btn-nura">
                          <Bot size={18} /> Chat dengan Nura
                        </Link>
                        <a href="#produk" className="btn-hero-outline">
                          <ShoppingCart size={18} /> Lihat Produk
                        </a>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="hero-slide-dots">
          {Array.from({ length: banners.length || 3 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`hero-dot ${heroSlide === i ? 'active' : ''}`}
              aria-label={`Slide ${i + 1}`}
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
                  onClick={() => { setActiveTab(cat.id); document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' }); }}
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

          {/* Filter card */}
          <div className="product-filter-bar">
            <div className="filter-tabs-group">
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
            </div>

            <div className="product-search-mini">
              <Search size={16} />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="search-clear">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* Products grid */}
          {loadingProducts ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card-skeleton" />
              ))}
            </div>
          ) : bestSellerProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={48} strokeWidth={1} color="#cbd5e1" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {bestSellerProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetail={setSelectedProduct}
                  />
                ))}
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <Link href="/products" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.8rem 2rem', borderRadius: 14,
                  background: 'linear-gradient(135deg, var(--primary), #be123c)',
                  color: '#fff', fontWeight: 700, fontSize: '0.92rem',
                  textDecoration: 'none', transition: 'all 0.25s',
                  boxShadow: '0 6px 20px -4px rgba(225, 29, 72, 0.4)',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px -6px rgba(225, 29, 72, 0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px -4px rgba(225, 29, 72, 0.4)'; }}
                >
                  Lihat Semua Produk <ArrowRight size={18} />
                </Link>
              </div>
            </>
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

      {/* ── CARA PESAN ── */}
      <section className="section tutorial-section" id="carapesan" style={{ background: 'var(--bg-surface-soft)' }}>
        <div className="section-container">
          <div className="section-header">
            <div className="section-eyebrow">
              <Sparkles size={14} /> Panduan Belanja
            </div>
            <h2 className="section-title">Cara Memesan</h2>
            <p className="section-subtitle">Cukup 5 langkah mudah, pesanan siap diantar</p>
          </div>

          <div className="tutorial-grid">
            {[
              { icon: Search, title: 'Pilih Produk', desc: 'Jelajahi frozen food & ATK favorit, cari atau lihat per kategori.' },
              { icon: ShoppingCart, title: 'Keranjang', desc: 'Review pesanan, atur jumlah, pastikan semua sesuai sebelum checkout.' },
              { icon: PenLine, title: 'Checkout', desc: 'Isi data & alamat, pilih antar/jemput, tentukan metode bayar.' },
              { icon: MessageSquare, title: 'Konfirmasi', desc: 'Pesanan terkirim, admin konfirmasi via WhatsApp dalam beberapa menit.' },
              { icon: Package, title: 'Lacak', desc: 'Pantau status pesanan real-time lewat halaman Lacak atau dashboard.' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="tutorial-card"
              >
                <div className="tutorial-step-num">{i + 1}</div>
                <div className="tutorial-card-icon">
                  <step.icon size={28} />
                </div>
                <h3 className="tutorial-card-title">{step.title}</h3>
                <p className="tutorial-card-desc">{step.desc}</p>
              </motion.div>
            ))}
          </div>
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
              <h3 className="location-title">{STORE_NAME}</h3>
              <p className="location-desc">
                Pusat frozen food & ATK terlengkap di Padang Pariaman
              </p>
              <div className="location-divider" />
              <ul className="location-contact-list">
                <li>
                  <span className="loc-icon rose"><MapPin size={18} /></span>
                  <div>
                    <strong>Alamat</strong>
                    <span>Padang Pariaman, Sumatera Barat</span>
                  </div>
                </li>
                <li>
                  <span className="loc-icon blue"><Phone size={18} /></span>
                  <div>
                    <strong>Telepon / WhatsApp</strong>
                    <span>0852-6396-5031</span>
                  </div>
                </li>
                <li>
                  <span className="loc-icon amber"><Clock size={18} /></span>
                  <div>
                    <strong>Jam Operasional</strong>
                    <span>Senin – Sabtu, 08.00 – 21.00 WIB</span>
                  </div>
                </li>
                <li>
                  <span className="loc-icon purple"><MessageSquare size={18} /></span>
                  <div>
                    <strong>Email</strong>
                    <span>admin.hijrahtoko@gmail.com</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="location-map">
              <div ref={mapRef} className="location-map-container" />
              <div className="location-map-actions">
                <button
                  className="btn-map btn-map-reset"
                  onClick={centerMapToStore}
                  title="Pusatkan ke lokasi toko"
                >
                  <MapPin size={15} /> Pusatkan Toko
                </button>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(STORE_NAME)}/@${STORE_COORDINATES.lat},${STORE_COORDINATES.lon},17z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-map btn-map-gmaps"
                  title="Buka di Google Maps"
                >
                  <Navigation size={15} /> Buka Google Maps
                </a>
              </div>
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

      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="lazyOnload" />
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .location-map-container { width: 100%; height: 100%; border-radius: 20px; z-index: 1; }
        .location-map-container .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 15px rgba(0,0,0,0.12) !important; border-radius: 12px !important; overflow: hidden; margin-bottom: 20px !important; margin-left: 12px !important; }
        .location-map-container .leaflet-control-zoom a { color: #334155 !important; background: white !important; width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 18px !important; }
        .location-map-container .leaflet-control-zoom a:hover { color: #e11d48 !important; background: #fff1f2 !important; }
        .leaflet-store-marker { background: none !important; border: none !important; }
        .store-marker-pin { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: linear-gradient(135deg, #e11d48, #be123c); border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(225,29,72,0.4); }
        .store-marker-pin svg { transform: rotate(45deg); filter: drop-shadow(0 0 2px rgba(0,0,0,0.2)); }
        .leaflet-popup-content-wrapper { border-radius: 16px !important; padding: 2px 4px !important; box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-tip { box-shadow: none !important; }
        .location-map-actions { position: absolute; bottom: 16px; right: 16px; z-index: 1000; display: flex; gap: 8px; }
        .btn-map { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 12px; font-size: 0.78rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: all 0.2s ease; font-family: 'Plus Jakarta Sans', sans-serif; text-decoration: none; border: 1px solid #e2e8f0; }
        .btn-map:hover { transform: translateY(-1px); }
        .btn-map:active { transform: translateY(0); }
        .btn-map-reset { background: white; color: #e11d48; }
        .btn-map-reset:hover { background: #fff1f2; border-color: #fda4af; box-shadow: 0 6px 20px rgba(225,29,72,0.15); }
        .btn-map-gmaps { background: #e11d48; color: white; border-color: #e11d48; }
        .btn-map-gmaps:hover { background: #be123c; border-color: #be123c; box-shadow: 0 6px 20px rgba(225,29,72,0.3); }
      `}</style>
    </>
  );
}

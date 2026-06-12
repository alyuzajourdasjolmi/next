"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  ChefHat,
  Package,
  MapPin,
  LogOut,
  CheckCircle2,
  Phone,
  Navigation as NavigationIcon,
  Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart-context';
import { ADMIN_EMAIL, STORE_NAME } from '../lib/store-constants';
import { loadSettings, StoreSettings } from '../lib/store-settings';

const CATEGORIES = [
  { id: 'frozen', label: '🧊 Frozen Food' },
  { id: 'atk', label: '📝 ATK' },
  { id: 'other', label: '📦 Lainnya' },
];

const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.href = '/';
};

export default function SiteNavbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isChefPage = pathname === '/chef';
  const isProductsPage = pathname === '/products';
  const { cartCount, setIsCartOpen } = useCart();

  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('light');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(loadSettings());

  const isSolidNav = isChefPage || isProductsPage;

  // Theme + Auth init
  useEffect(() => {
    const saved = localStorage.getItem('hijrahTokoTheme') || 'light';
    setTheme(saved);
    document.body.classList.toggle('dark-mode', saved === 'dark');

    setSettings(loadSettings());

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('hijrahTokoTheme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navToCategory = (e: React.MouseEvent, catId: string) => {
    if (isHome) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('nav-category', { detail: { category: catId } }));
      document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLokasiClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLocation(true);
    setMobileOpen(false);
  };

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${settings.lat},${settings.lon}`, '_blank');
  };

  const formatSchedule = (schedule: StoreSettings['schedule']): string => {
    const activeDays = Object.entries(schedule).filter(([, s]) => s.active);
    if (activeDays.length === 0) return 'Tutup';
    const grouped: Record<string, string[]> = {};
    for (const [day, s] of activeDays) {
      const key = `${s.open}–${s.close}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(day);
    }
    return Object.entries(grouped)
      .map(([time, days]) => {
        if (days.length === 7) return `Setiap Hari: ${time.replace('–', '.00–').replace(/\d{2}$/, m => m + ' WIB')}`;
        if (days.length >= 5 && days.includes('Senin') && days.includes('Sabtu')) return `Senin–Sabtu: ${time.replace('–', '.00–').replace(/\d{2}$/, m => m + ' WIB')}`;
        return `${days.join(', ')}: ${time.replace('–', '.00–').replace(/\d{2}$/, m => m + ' WIB')}`;
      })
      .join('\n');
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className={`navbar ${scrolled || isSolidNav ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" className="brand-logo" />
            <span className="brand-text">
              Hijrah<span>Toko</span>
            </span>
          </Link>

          <ul className="nav-links">
            {/* Kategori dropdown — hanya di homepage */}
            {isHome && (
              <li className="dropdown">
                <a href="#kategori" className="dropbtn" onClick={(e) => e.preventDefault()}>
                  Kategori <ChevronDown className="chevron" size={16} />
                </a>
                <div className="dropdown-content">
                  {CATEGORIES.map((cat) => (
                    <a key={cat.id} href={`#${cat.id}`} onClick={(e) => navToCategory(e, cat.id)}>
                      {cat.label}
                    </a>
                  ))}
                </div>
              </li>
            )}

            <li><Link href="/products" className={isActive('/products') ? 'active' : ''}>Produk</Link></li>
            <li><Link href="/tracking" className={isActive('/tracking') ? 'active' : ''}>Lacak</Link></li>

            <li>
              <a href="#lokasi" className="" onClick={handleLokasiClick}>
                Lokasi
              </a>
            </li>

            <li>
              <Link href="/chef" className={isChefPage ? 'active' : ''} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ChefHat size={14} />
                Chef
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
                    <div className="user-menu-divider" />
                    <Link href="/profile"><UserIcon size={16} /> Profil Saya</Link>
                    <Link href="/tracking"><Package size={16} /> Pesanan Saya</Link>
                    <Link href="/addresses"><MapPin size={16} /> Kelola Alamat</Link>
                    {user?.email === ADMIN_EMAIL && (
                      <>
                        <div className="user-menu-divider" />
                        <Link href="/dashboard" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          <CheckCircle2 size={16} /> Dashboard Admin
                        </Link>
                      </>
                    )}
                    <div className="user-menu-divider" />
                    <button className="user-logout-btn" onClick={handleLogout}>
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="btn-login-pill">Masuk</Link>
              )}
            </div>

            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button type="button" className="cart-btn" onClick={() => setIsCartOpen(true)} aria-label="Keranjang">
              <ShoppingCart size={20} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span className="cart-count" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button type="button" className="mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
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
                <button type="button" className="mobile-nav-close" onClick={() => setMobileOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="mobile-nav-scroll">
                <ul className="mobile-nav-links">
                  {isHome && (
                    <>
                      {CATEGORIES.map((cat) => (
                        <li key={cat.id}>
                          <a href={`#${cat.id}`} onClick={(e) => { navToCategory(e, cat.id); setMobileOpen(false); }}>
                            {cat.label}
                          </a>
                        </li>
                      ))}
                      <li style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }} />
                    </>
                  )}
                  <li><Link href="/products" onClick={() => setMobileOpen(false)}>📦 Katalog Produk</Link></li>
                  <li><Link href="/tracking" onClick={() => setMobileOpen(false)}>🔍 Lacak Pesanan</Link></li>
                  <li>
                    <a href="#lokasi" onClick={handleLokasiClick}>📍 Lokasi Toko</a>
                  </li>
                  <li><Link href="/chef" onClick={() => setMobileOpen(false)}>👨‍🍳 Chef Virtual</Link></li>
                  {user?.email === ADMIN_EMAIL && (
                    <li style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                      <Link href="/dashboard" style={{ color: 'var(--primary)', fontWeight: 700 }} onClick={() => setMobileOpen(false)}>
                        ⚙️ Dashboard Admin
                      </Link>
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
                    <button className="mobile-logout-btn" onClick={handleLogout}>Keluar</button>
                  </div>
                ) : (
                  <Link href="/login" className="mobile-auth-btn" onClick={() => setMobileOpen(false)}>Masuk / Daftar</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Lokasi — global, bisa dibuka dari halaman mana pun */}
      <AnimatePresence>
        {showLocation && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLocation(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(10px)', zIndex: 2000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 20, padding: '1.5rem',
                maxWidth: 480, width: '100%', position: 'relative',
                boxShadow: '0 30px 60px -10px rgba(0,0,0,0.3)',
              }}
            >
              <button
                onClick={() => setShowLocation(false)}
                aria-label="Tutup"
                style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  background: 'var(--bg-surface-soft, #f1f5f9)',
                  color: 'var(--text-main, #1e293b)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--primary, #E11D48)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main, #1e293b)' }}>
                    Lokasi {settings.storeName || STORE_NAME}
                  </h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                    Kunjungi toko kami
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: 12, padding: '0.75rem', background: 'var(--bg-surface-soft, #f8fafc)', borderRadius: 12 }}>
                  <MapPin size={18} style={{ color: 'var(--primary, #E11D48)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main, #1e293b)' }}>Alamat</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)' }}>{settings.address}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, padding: '0.75rem', background: 'var(--bg-surface-soft, #f8fafc)', borderRadius: 12 }}>
                  <Phone size={18} style={{ color: 'var(--primary, #E11D48)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main, #1e293b)' }}>Telepon / WhatsApp</strong>
                    <a href={`tel:${settings.phone}`} style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', textDecoration: 'none' }}>{settings.phone}</a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, padding: '0.75rem', background: 'var(--bg-surface-soft, #f8fafc)', borderRadius: 12 }}>
                  <Clock size={18} style={{ color: 'var(--primary, #E11D48)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main, #1e293b)' }}>Jam Operasional</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'pre-line' }}>{formatSchedule(settings.schedule)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={openGoogleMaps}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '0.85rem', borderRadius: 12, border: 'none',
                  background: 'var(--primary, #E11D48)', color: '#fff',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <NavigationIcon size={16} /> Buka di Google Maps
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

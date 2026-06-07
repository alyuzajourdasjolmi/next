"use client";

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart-context';
import { ADMIN_EMAIL } from '../lib/store-constants';

const SECTION_IDS = ['home', 'kategori', 'produk', 'keunggulan', 'carapesan', 'lokasi'];
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
  const [activeSection, setActiveSection] = useState('home');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const isSolidNav = isChefPage || isProductsPage;

  // Theme + Auth init
  useEffect(() => {
    const saved = localStorage.getItem('hijrahTokoTheme') || 'light';
    setTheme(saved);
    document.body.classList.toggle('dark-mode', saved === 'dark');

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
      observerRef.current?.disconnect();
    };
  }, []);

  // Scroll spy — only on homepage
  useEffect(() => {
    if (!isHome) return;
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (SECTION_IDS.includes(id)) setActiveSection(id);
          }
        }
      },
      { rootMargin: '-45% 0px -55% 0px' }
    );
    els.forEach((el) => el && observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, [isHome]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('hijrahTokoTheme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const anchor = (hash: string) => (isHome ? hash : `/${hash}`);

  const scrollToSection = (hash: string) => {
    if (isHome) {
      const el = document.getElementById(hash.replace('#', ''));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navToCategory = (e: React.MouseEvent, catId: string) => {
    if (isHome) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('nav-category', { detail: { category: catId } }));
      document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isActive = (href: string) => pathname === href;
  const isAnchorActive = (id: string) => isHome && activeSection === id;

  const linkClass = (href: string, sectionId?: string) => {
    if (sectionId && isAnchorActive(sectionId)) return 'active';
    if (isActive(href)) return 'active';
    return '';
  };

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
            {/* Beranda — only on non-home pages; on home use anchor */}
            {isHome ? (
              <li>
                <a href="#home" className={linkClass('/', 'home')} onClick={(e) => { e.preventDefault(); scrollToSection('#home'); }}>
                  Beranda
                </a>
              </li>
            ) : (
              <li><Link href="/" className={linkClass('/')}>Beranda</Link></li>
            )}

            {/* Kategori dropdown — only on homepage */}
            {isHome && (
              <li className="dropdown">
                <a href="#kategori" className="dropbtn">
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

            {/* Produk */}
            <li><Link href="/products" className={linkClass('/products')}>Produk</Link></li>

            {/* Keunggulan */}
            {isHome ? (
              <li>
                <a href="#keunggulan" className={linkClass('/#keunggulan', 'keunggulan')} onClick={(e) => { e.preventDefault(); scrollToSection('#keunggulan'); }}>
                  Keunggulan
                </a>
              </li>
            ) : (
              <li><Link href="/#keunggulan">Keunggulan</Link></li>
            )}

            {/* Cara Pesan — only on homepage */}
            {isHome && (
              <li>
                <a href="#carapesan" className={linkClass('/#carapesan', 'carapesan')} onClick={(e) => { e.preventDefault(); scrollToSection('#carapesan'); }}>
                  Cara Pesan
                </a>
              </li>
            )}

            {/* Lacak */}
            <li><Link href="/tracking" className={linkClass('/tracking')}>Lacak</Link></li>

            {/* Lokasi */}
            {isHome ? (
              <li>
                <a href="#lokasi" className={linkClass('/#lokasi', 'lokasi')} onClick={(e) => { e.preventDefault(); scrollToSection('#lokasi'); }}>
                  Lokasi
                </a>
              </li>
            ) : (
              <li><Link href="/#lokasi">Lokasi</Link></li>
            )}

            {/* Chef Virtual — always */}
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
                  <li>
                    <Link href={isHome ? '/' : '/'} onClick={() => setMobileOpen(false)}>
                      🏠 Beranda
                    </Link>
                  </li>
                  {isHome && (
                    <>
                      {CATEGORIES.map((cat) => (
                        <li key={cat.id}>
                          <Link href={anchor(`#${cat.id}`)} onClick={(e) => { e.preventDefault(); navToCategory(e as any, cat.id); setMobileOpen(false); }}>
                            {cat.label}
                          </Link>
                        </li>
                      ))}
                      <li style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }} />
                    </>
                  )}
                  <li><Link href="/products" onClick={() => setMobileOpen(false)}>📦 Katalog Produk</Link></li>
                  <li>
                    <Link href={anchor('#keunggulan')} onClick={(e) => { if (isHome) e.preventDefault(); scrollToSection('#keunggulan'); setMobileOpen(false); }}>
                      ✨ Keunggulan
                    </Link>
                  </li>
                  {isHome && (
                    <li>
                      <Link href={anchor('#carapesan')} onClick={(e) => { e.preventDefault(); scrollToSection('#carapesan'); setMobileOpen(false); }}>
                        📖 Cara Pesan
                      </Link>
                    </li>
                  )}
                  <li><Link href="/tracking" onClick={() => setMobileOpen(false)}>🔍 Lacak Pesanan</Link></li>
                  <li>
                    <Link href={anchor('#lokasi')} onClick={(e) => { if (isHome) e.preventDefault(); scrollToSection('#lokasi'); setMobileOpen(false); }}>
                      📍 Lokasi
                    </Link>
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
    </>
  );
}

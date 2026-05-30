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
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SiteNavbar() {
  const pathname = usePathname();
  const isChefPage = pathname === '/chef';

  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('light');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);

  const isSolidNav = isChefPage;

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

    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('hijrahTokoCart_guest') || '[]');
      setCartCount(cart.reduce((acc: number, item: any) => acc + item.qty, 0));
    };
    updateCart();
    window.addEventListener('storage', updateCart);

    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', updateCart);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('hijrahTokoTheme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navLink = (href: string, label: string, active = false) => (
    <li>
      <Link href={href} className={active ? 'active' : ''}>
        {label}
      </Link>
    </li>
  );

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
            {navLink('/#home', 'Home')}
            <li className="dropdown">
              <Link href="/#produk" className="dropbtn">
                Produk <ChevronDown className="chevron" size={16} />
              </Link>
              <div className="dropdown-content">
                <Link href="/#produk">🧊 Frozen Food</Link>
                <Link href="/#produk">📝 ATK</Link>
                <Link href="/#produk">📦 Lainnya</Link>
              </div>
            </li>
            {navLink('/#testimoni', 'Testimoni')}
            {navLink('/#inbox', 'Lacak')}
            {navLink('/#kontak', 'Kontak')}
            <li>
              <Link href="/chef" className={`dropbtn ${isChefPage ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ChefHat size={14} />
                Chef Virtual
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
                    <Link href="/#inbox">
                      Pesanan Saya
                    </Link>
                    <Link href="/">Kembali ke Toko</Link>
                  </div>
                </div>
              ) : (
                <Link href="/" className="btn-login-pill">
                  Masuk
                </Link>
              )}
            </div>

            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link href="/#checkout" className="cart-btn" aria-label="Keranjang">
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
            </Link>

            <button type="button" className="mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

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
                  <li><Link href="/#home" onClick={() => setMobileOpen(false)}>Home</Link></li>
                  <li><Link href="/#produk" onClick={() => setMobileOpen(false)}>Produk</Link></li>
                  <li><Link href="/#testimoni" onClick={() => setMobileOpen(false)}>Testimoni</Link></li>
                  <li><Link href="/#inbox" onClick={() => setMobileOpen(false)}>Lacak</Link></li>
                  <li><Link href="/#kontak" onClick={() => setMobileOpen(false)}>Kontak</Link></li>
                  <li>
                    <Link href="/chef" className={isChefPage ? 'active' : ''} onClick={() => setMobileOpen(false)}>
                      Chef Virtual
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

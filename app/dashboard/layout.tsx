"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ShoppingCart,
  ClipboardList,
  Box,
  Users,
  BarChart3,
  Edit3,
  Package,
  ScanLine,
  Settings,
  LogOut,
  X,
  Menu,
  RefreshCw,
  Loader2,
  Lock,
} from 'lucide-react';
import { DashboardProvider, useDashboard } from '../../lib/dashboard-context';
import './dashboard.css';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/cashier', label: 'Kasir (POS)', icon: ShoppingCart },
  { href: '/dashboard/transactions', label: 'Pesanan', icon: ClipboardList },
  { href: '/dashboard/products', label: 'Produk', icon: Box },
  { href: '/dashboard/customers', label: 'Pengguna', icon: Users },
  { href: '/dashboard/inventory', label: 'Stok', icon: Package },
  { href: '/dashboard/scanner', label: 'Scanner', icon: ScanLine },
  { href: '/dashboard/reviews', label: 'Ulasan', icon: Edit3 },
  { href: '/dashboard/reports', label: 'Analitik', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Toko', icon: Settings },
];

const titleMap: Record<string, string> = navItems.reduce((acc, item) => {
  acc[item.href] = item.label;
  return acc;
}, {} as Record<string, string>);

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUnauthorized, loading, fetchData, signOut } = useDashboard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError('');
    try {
      const { error } = await import('../../lib/supabase').then((m) =>
        m.supabase.auth.signInWithPassword({ email, password })
      );
      if (error) throw error;
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Gagal login');
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Unauthenticated
  if (!user) {
    if (isUnauthorized) {
      return (
        <div className="admin-v2" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fff',
              padding: '2.5rem',
              borderRadius: 20,
              maxWidth: 420,
              width: '100%',
              margin: '1rem',
              textAlign: 'center',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'rgba(225, 29, 72, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#e11d48', margin: '0 auto 1rem',
            }}>
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
              Akses Ditolak
            </h2>
            <p style={{ color: '#64748b', margin: '0 0 1.5rem' }}>
              Akun Anda tidak memiliki akses ke dashboard admin.
            </p>
            <Link href="/" className="admin-btn admin-btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Kembali ke Toko
            </Link>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="admin-v2" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff',
            padding: '2.5rem',
            borderRadius: 20,
            maxWidth: 420,
            width: '100%',
            margin: '1rem',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img
              src="/assets/images/logo-hijrah-toko.png"
              alt="Logo"
              style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 0.75rem', display: 'block' }}
            />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
              Admin Portal
            </h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
              Masuk untuk mengelola toko
            </p>
          </div>

          {loginError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: 10,
              marginBottom: '1rem',
              fontSize: '0.88rem',
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hijrahtoko.com"
                className="admin-searchbox"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.375rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="admin-searchbox"
                style={{ width: '100%' }}
              />
            </div>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={isLoginLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isLoginLoading ? (
                <><Loader2 size={16} className="spin" /> Memproses...</>
              ) : (
                'Masuk Dashboard'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const currentTitle = titleMap[pathname] || 'Dashboard';

  return (
    <div className="admin-v2">
      <aside className={`admin-v2-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <img src="/assets/images/logo-hijrah-toko.png" alt="Logo Hijrah Toko" />
          <div>
            <strong>Hijrah Toko</strong>
            <span>Admin Portal</span>
          </div>
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-sidebar-link">
            <Home size={18} />
            <span>Ke Toko</span>
          </Link>
          <button type="button" className="admin-sidebar-link danger" onClick={signOut}>
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="admin-v2-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="topbar-title-wrap">
              <h1>{currentTitle}</h1>
              <p className="admin-user-info">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Memuat...' : 'Refresh Data'}</span>
          </button>
        </header>

        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}

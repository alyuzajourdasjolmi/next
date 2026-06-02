"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowLeft,
  LogIn,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Store,
  Star,
  Shield,
  Package,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.07 },
  },
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.push('/');
      }
    });
  }, [router]);

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        router.push('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
              phone: form.phone,
              address: form.address,
            },
          },
        });
        if (error) throw error;

        if (form.address) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            await supabase.from('user_addresses').insert([{
              user_phone: form.phone,
              label: 'Utama',
              recipient_name: form.name,
              recipient_phone: form.phone,
              full_address: form.address,
              is_primary: true,
            }]);
          }
        }

        setMessage({
          type: 'success',
          text: 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi atau langsung login.',
        });
        setMode('login');
        setForm(prev => ({ ...prev, password: '' }));
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full px-4 py-3.5 bg-[var(--bg-surface-soft)] border-2 border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-base font-medium font-sans transition-all duration-200 placeholder:text-[var(--text-light)] focus:border-[var(--primary)] focus:bg-[var(--bg-surface)] focus:shadow-[0_0_0_4px_rgba(225,29,72,0.08)] focus:outline-none';

  const labelClasses =
    'block text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[var(--text-light)] mb-2';

  return (
    <div className="auth-page">
      <div className="auth-grid">
        {/* Left Panel — Brand Showcase */}
        <motion.div
          className="auth-brand-panel"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="auth-brand-overlay" />
          <div className="auth-brand-gradient-orb a" />
          <div className="auth-brand-gradient-orb b" />
          <div className="auth-brand-grid" />

          <div className="auth-brand-content">
            <Link href="/" className="auth-brand-logo">
              <Store size={28} />
              <span>
                Hijrah<span>Toko</span>
              </span>
            </Link>

            <motion.div
              className="auth-brand-hero"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <div className="auth-brand-badge">
                <Star size={14} fill="currentColor" />
                Toko Terpercaya
              </div>
              <h1 className="auth-brand-title">
                Belanja Kebutuhan
                <br />
                <span>Jadi Lebih Mudah</span>
              </h1>
              <p className="auth-brand-desc">
                Nikmati kemudahan berbelanja frozen food & ATK lengkap dari rumah.
                Cepat, aman, dan terpercaya.
              </p>
            </motion.div>

            <motion.div
              className="auth-brand-features"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {[
                { icon: Package, text: 'Produk berkualitas dan lengkap' },
                { icon: Shield, text: 'Transaksi aman & terpercaya' },
                { icon: Star, text: 'Pelayanan cepat & ramah' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="auth-brand-feature"
                  variants={fadeUp}
                >
                  <div className="auth-feature-icon">
                    <item.icon size={16} />
                  </div>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="auth-brand-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Link href="/" className="auth-brand-back">
                <ArrowLeft size={16} />
                Kembali ke beranda
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel — Form */}
        <motion.div
          className="auth-form-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="auth-form-container">
            {/* Mode Tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setMessage(null); }}
              >
                <LogIn size={16} />
                Masuk
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setMessage(null); }}
              >
                <UserPlus size={16} />
                Daftar
              </button>
              <div
                className="auth-tab-indicator"
                style={{ left: mode === 'login' ? '0%' : '50%' }}
              />
            </div>

            {/* Header */}
            <motion.div
              className="auth-form-header"
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>
                {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
              </h2>
              <p>
                {mode === 'login'
                  ? 'Masuk ke akun Anda untuk melanjutkan'
                  : 'Isi data diri Anda untuk mendaftar'}
              </p>
            </motion.div>

            {/* Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  className={`auth-toast auth-toast-${message.type}`}
                  initial={{ opacity: 0, y: -12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -12, height: 0 }}
                >
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form-fields">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="auth-field">
                      <label className={labelClasses}>
                        <User size={13} />
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => updateForm('name', e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        className={inputClasses}
                      />
                    </div>

                    <div className="auth-field">
                      <label className={labelClasses}>
                        <Phone size={13} />
                        Nomor WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={e => updateForm('phone', e.target.value)}
                        placeholder="Contoh: 08123456789"
                        pattern="[0-9]{10,13}"
                        title="Masukkan nomor WA yang valid (10-13 digit)"
                        className={inputClasses}
                      />
                    </div>

                    <div className="auth-field">
                      <label className={labelClasses}>
                        <MapPin size={13} />
                        Alamat Lengkap
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={form.address}
                        onChange={e => updateForm('address', e.target.value)}
                        placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan, Kecamatan..."
                        className={`${inputClasses} resize-none`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="auth-field">
                <label className={labelClasses}>
                  <Mail size={13} />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  placeholder="email@contoh.com"
                  className={inputClasses}
                />
              </div>

              <div className="auth-field">
                <label className={labelClasses}>
                  <Lock size={13} />
                  Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    placeholder="Masukkan password"
                    minLength={6}
                    className={`${inputClasses} pr-[3.25rem]`}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                className="auth-submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : mode === 'login' ? (
                  <>
                    <LogIn size={18} />
                    Masuk ke Akun
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Daftar Akun
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <motion.div
              className="auth-form-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p>
                {mode === 'login'
                  ? 'Belum punya akun?'
                  : 'Sudah punya akun?'}
              </p>
              <button
                type="button"
                className="auth-mode-toggle"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setMessage(null);
                }}
              >
                {mode === 'login' ? 'Daftar Sekarang' : 'Login di Sini'}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Decorative corner blobs */}
      <div className="auth-corner-blob tl" />
      <div className="auth-corner-blob br" />
    </div>
  );
}

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
  UserPlus,
  AlertCircle,
  Store,
  Star,
  Shield,
  Package,
  Check,
  CheckCircle,
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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

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

      setShowSuccess(true);
      setForm({ email: '', password: '', name: '', phone: '', address: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

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
            {/* Header */}
            <motion.div
              className="auth-form-header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Buat Akun Baru</h2>
              <p>Isi data diri Anda untuk mendaftar</p>
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
              <div className="auth-field">
                <label className="auth-label">
                  <User size={13} />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
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
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <MapPin size={13} />
                  Alamat Lengkap
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.address}
                  onChange={e => updateForm('address', e.target.value)}
                  placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan, Kecamatan..."
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <Mail size={13} />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  placeholder="email@contoh.com"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <Lock size={13} />
                  Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    className="auth-input has-toggle"
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
              <p>Sudah punya akun?</p>
              <Link href="/login" className="auth-mode-toggle">
                Login di Sini
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="auth-corner-blob tl" />
      <div className="auth-corner-blob br" />

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              className="success-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="success-check-wrap">
                <Check size={40} strokeWidth={3} className="success-check" />
              </div>
              <h2>Akun Berhasil Dibuat! 🎉</h2>
              <p>Silakan cek email Anda untuk verifikasi, lalu login.</p>
              <Link href="/login" className="success-btn">
                Lanjut ke Login
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

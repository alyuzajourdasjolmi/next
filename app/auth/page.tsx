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
  ChefHat,
  LogIn,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Store,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
          text: 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi (jika diaktifkan) atau langsung login.',
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

  return (
    <div className="auth-page">
      {/* Background */}
      <div className="auth-bg">
        <div className="auth-gradient-blob top-left" />
        <div className="auth-gradient-blob bottom-right" />
        <div className="auth-dot-grid top-right" />
        <div className="auth-dot-grid bottom-left" />
      </div>

      {/* Navbar */}
      <nav className="auth-nav">
        <div className="auth-nav-inner">
          <Link href="/" className="auth-logo">
            <Store size={24} />
            <span className="auth-brand-text">
              Hijrah<span>Toko</span>
            </span>
          </Link>
          <Link href="/" className="auth-back-link">
            <ArrowLeft size={18} />
            Kembali ke Beranda
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-main">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="auth-card-header">
            <div className="auth-icon-wrap">
              {mode === 'login' ? <LogIn size={28} /> : <UserPlus size={28} />}
            </div>
            <h1 className="auth-title">
              {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Masuk untuk melanjutkan belanja'
                : 'Daftar dan mulai pengalaman belanja Anda'}
            </p>
          </div>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                className={`auth-message auth-message-${message.type}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="form-group">
                    <label>
                      <User size={14} />
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => updateForm('name', e.target.value)}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Phone size={14} />
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
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <MapPin size={14} />
                      Alamat Lengkap
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={form.address}
                      onChange={e => updateForm('address', e.target.value)}
                      placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan, Kecamatan..."
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label>
                <Mail size={14} />
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                placeholder="email@contoh.com"
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={14} />
                Password
              </label>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  placeholder="Masukkan password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-loading-spinner" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={18} />
                  Masuk
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Daftar Sekarang
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="auth-toggle">
            {mode === 'login' ? (
              <p>
                Belum punya akun?{' '}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => {
                    setMode('register');
                    setMessage(null);
                  }}
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => {
                    setMode('login');
                    setMessage(null);
                  }}
                >
                  Login di sini
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

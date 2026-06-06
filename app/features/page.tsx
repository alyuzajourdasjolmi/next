"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, Zap, Wifi, Bell, Shield, Smartphone, ChefHat,
  Check, Star, Sparkles, Package, Truck, Clock, MessageSquare, HelpCircle
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
};

const features = [
  {
    icon: Zap,
    title: 'Akses Cepat',
    desc: 'Pemesanan hanya dengan beberapa klik dari aplikasi yang ringan dan responsif.',
    color: 'rose',
  },
  {
    icon: Wifi,
    title: 'Bisa Offline',
    desc: 'Jelajahi katalog dan lakukan pemesanan meski tanpa koneksi internet.',
    color: 'amber',
  },
  {
    icon: Bell,
    title: 'Notifikasi Promo',
    desc: 'Dapatkan info promo terbaru langsung ke perangkat Anda.',
    color: 'emerald',
  },
  {
    icon: Shield,
    title: 'Aman & Terpercaya',
    desc: 'Transaksi aman dengan enkripsi dan sistem yang terpercaya.',
    color: 'sky',
  },
  {
    icon: ChefHat,
    title: 'Chef AI Assistant',
    desc: 'Tanya resep, cara masak, dan tips料理 dari asisten AI pintar kami.',
    color: 'rose',
  },
  {
    icon: Package,
    title: 'Manajemen Stok',
    desc: 'Sistem manajemen stok otomatis untuk memastikan ketersediaan produk.',
    color: 'amber',
  },
  {
    icon: Truck,
    title: 'Pengiriman Cepat',
    desc: 'Layanan pengiriman same-day untuk area sekitar toko.',
    color: 'emerald',
  },
  {
    icon: MessageSquare,
    title: 'Customer Support',
    desc: 'Tim support yang siap membantu Anda kapan saja melalui WhatsApp.',
    color: 'sky',
  },
];

const colorMap: Record<string, { bg: string; icon: string }> = {
  rose: { bg: 'rgba(225, 29, 72, 0.1)', icon: '#e11d48' },
  amber: { bg: 'rgba(245, 158, 11, 0.1)', icon: '#f59e0b' },
  emerald: { bg: 'rgba(16, 185, 129, 0.1)', icon: '#10b981' },
  sky: { bg: 'rgba(56, 189, 248, 0.1)', icon: '#0ea5e9' },
};

export default function FeaturesPage() {
  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-main, #F8FAFC)' }}>
      {/* Hero */}
      <section style={{ padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>
        <motion.div {...fadeUp}>
          <div className="section-eyebrow" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Fitur Unggulan
          </div>
          <h1 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--text-main, #0F172A)',
            marginBottom: '1rem',
          }}>
            Semua yang Anda Butuhkan,<br />
            <span style={{ color: 'var(--primary, #E11D48)' }}>dalam Satu Aplikasi</span>
          </h1>
          <p style={{
            maxWidth: 640,
            margin: '0 auto',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: 'var(--text-muted, #64748B)',
          }}>
            HijrahToko hadir dengan fitur lengkap untuk memudahkan belanja frozen food dan ATK,
            dari pemesanan hingga pengiriman, semuanya dalam satu platform.
          </p>
        </motion.div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '2rem 1.5rem 5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            const colors = colorMap[f.color];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(226, 232, 240, 0.6)',
                  borderRadius: 20,
                  padding: '2rem 1.5rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'default',
                }}
                whileHover={{ y: -4, boxShadow: '0 12px 30px -10px rgba(0,0,0,0.1)' }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.icon,
                  marginBottom: '1.25rem',
                }}>
                  <Icon size={28} />
                </div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-main, #0F172A)',
                  margin: '0 0 0.5rem',
                }}>
                  {f.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-muted, #64748B)',
                  margin: 0,
                }}>
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            marginTop: '3rem',
            padding: '2.5rem 1.5rem',
            background: 'linear-gradient(135deg, var(--primary, #E11D48) 0%, #be123c 100%)',
            borderRadius: 24,
            color: '#fff',
          }}
        >
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
            Siap untuk mulai belanja?
          </h2>
          <p style={{ margin: '0 0 1.5rem', opacity: 0.9 }}>
            Jelajahi produk kami atau install aplikasi untuk pengalaman terbaik.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="btn-hero-primary" style={{
              background: '#fff',
              color: 'var(--primary, #E11D48)',
            }}>
              Lihat Produk <ArrowRight size={16} />
            </Link>
            <Link href="/contact" style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '0.9rem 1.5rem',
              borderRadius: 12,
              fontWeight: 600,
              textDecoration: 'none',
              backdropFilter: 'blur(10px)',
            }}>
              Hubungi Kami
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

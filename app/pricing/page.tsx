"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Gratis',
    period: '',
    desc: 'Untuk pengguna individu yang ingin belanja dengan mudah.',
    features: [
      'Belanja frozen food & ATK',
      'Lacak pesanan real-time',
      'Notifikasi promo',
      'Akses Chef AI Assistant',
      'Pengiriman same-day',
    ],
    cta: 'Mulai Sekarang',
    href: '/register',
    featured: false,
  },
  {
    name: 'Reseller',
    price: 'Rp 99rb',
    period: '/bulan',
    desc: 'Untuk reseller dan pemilik usaha kecil.',
    features: [
      'Semua fitur Starter',
      'Harga khusus reseller',
      'Manajemen inventori',
      'Laporan penjualan',
      'Priority support',
      'Diskon hingga 20%',
    ],
    cta: 'Daftar Reseller',
    href: '/register',
    featured: true,
  },
  {
    name: 'Business',
    price: 'Custom',
    period: '',
    desc: 'Untuk bisnis besar dengan kebutuhan spesifik.',
    features: [
      'Semua fitur Reseller',
      'Harga grosir',
      'API integration',
      'Account manager dedicated',
      'Custom branding',
      'SLA 99.9%',
    ],
    cta: 'Hubungi Sales',
    href: '/contact',
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-main, #F8FAFC)' }}>
      <section style={{ padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-eyebrow" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Harga Sederhana
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
            Pilih Paket yang<br />
            <span style={{ color: 'var(--primary, #E11D48)' }}>Sesuai Kebutuhan Anda</span>
          </h1>
          <p style={{
            maxWidth: 640,
            margin: '0 auto',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: 'var(--text-muted, #64748B)',
          }}>
            Mulai gratis, upgrade kapan saja. Tidak ada biaya tersembunyi.
          </p>
        </motion.div>
      </section>

      <section style={{ padding: '2rem 1.5rem 5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: '#fff',
                borderRadius: 24,
                padding: '2rem 1.75rem',
                border: plan.featured
                  ? '2px solid var(--primary, #E11D48)'
                  : '1px solid rgba(226, 232, 240, 0.6)',
                boxShadow: plan.featured
                  ? '0 20px 40px -12px rgba(225, 29, 72, 0.25)'
                  : '0 1px 2px rgba(0,0,0,0.03)',
                position: 'relative',
                transition: 'all 0.3s',
              }}
            >
              {plan.featured && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--primary, #E11D48)',
                  color: '#fff',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 999,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Paling Populer
                </div>
              )}
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-main, #0F172A)',
                margin: '0 0 0.25rem',
              }}>
                {plan.name}
              </h3>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted, #64748B)',
                margin: '0 0 1.25rem',
              }}>
                {plan.desc}
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  color: 'var(--text-main, #0F172A)',
                  letterSpacing: '-0.02em',
                }}>{plan.price}</span>
                {plan.period && (
                  <span style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.9rem' }}>
                    {plan.period}
                  </span>
                )}
              </div>
              <Link
                href={plan.href}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.75rem',
                  borderRadius: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: plan.featured
                    ? 'var(--primary, #E11D48)'
                    : 'rgba(225, 29, 72, 0.08)',
                  color: plan.featured ? '#fff' : 'var(--primary, #E11D48)',
                  marginBottom: '1.5rem',
                  transition: 'all 0.2s',
                }}
              >
                {plan.cta} <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Check size={16} style={{
                      color: 'var(--primary, #E11D48)',
                      marginTop: 2,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-main, #0F172A)' }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

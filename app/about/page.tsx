"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Target, Users, Award, ArrowRight } from 'lucide-react';

const values = [
  { icon: Heart, title: 'Berkah & Berkah', desc: 'Setiap produk dipilih dengan cermat untuk kualitas terbaik.' },
  { icon: Target, title: 'Fokus Pelanggan', desc: 'Kepuasan Anda adalah prioritas utama kami.' },
  { icon: Users, title: 'Komunitas', desc: 'Membangun hubungan jangka panjang dengan pelanggan.' },
  { icon: Award, title: 'Kualitas', desc: 'Standar kualitas tinggi di setiap produk yang kami jual.' },
];

export default function AboutPage() {
  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-main, #F8FAFC)' }}>
      <section style={{ padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-eyebrow" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Tentang Kami
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
            Cerita di Balik<br />
            <span style={{ color: 'var(--primary, #E11D48)' }}>HijrahToko</span>
          </h1>
          <p style={{
            maxWidth: 700,
            margin: '0 auto',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            color: 'var(--text-muted, #64748B)',
          }}>
            Didirikan dengan semangat memberikan akses mudah ke produk frozen food berkualitas
            dan kebutuhan ATK dengan harga terjangkau untuk komunitas kami.
          </p>
        </motion.div>
      </section>

      {/* Story */}
      <section style={{ padding: '2rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            background: '#fff',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            borderRadius: 24,
            padding: '2.5rem 2rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #0F172A)', marginBottom: '1rem' }}>
            Misi Kami
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-muted, #64748B)', margin: 0 }}>
            Menyediakan produk frozen food higienis dan ATK berkualitas dengan harga yang transparan,
            pelayanan yang ramah, dan pengiriman yang cepat. Kami percaya bahwa belanja kebutuhan
            pokok haruslah mudah, cepat, dan menyenangkan.
          </p>
        </motion.div>
      </section>

      {/* Values */}
      <section style={{ padding: '2rem 1.5rem 5rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '1.6rem',
          fontWeight: 800,
          color: 'var(--text-main, #0F172A)',
          marginBottom: '2rem',
        }}>
          Nilai-Nilai Kami
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}>
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(226, 232, 240, 0.6)',
                  borderRadius: 20,
                  padding: '1.75rem 1.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(225, 29, 72, 0.1)',
                  color: 'var(--primary, #E11D48)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Icon size={28} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #0F172A)', margin: '0 0 0.4rem' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748B)', margin: 0, lineHeight: 1.5 }}>
                  {v.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link
            href="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1.5rem',
              background: 'var(--primary, #E11D48)',
              color: '#fff',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 600,
              boxShadow: '0 10px 25px -8px rgba(225, 29, 72, 0.35)',
            }}
          >
            Hubungi Kami <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

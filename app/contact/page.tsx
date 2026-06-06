"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Phone, MapPin, Mail, Send, Loader2, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--bg-main, #F8FAFC)' }}>
      <section style={{ padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-eyebrow" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Hubungi Kami
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
            Ada Pertanyaan?<br />
            <span style={{ color: 'var(--primary, #E11D48)' }}>Kami Siap Membantu</span>
          </h1>
          <p style={{
            maxWidth: 600,
            margin: '0 auto',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: 'var(--text-muted, #64748B)',
          }}>
            Tim kami siap melayani Anda. Hubungi kami melalui form di bawah atau langsung via WhatsApp.
          </p>
        </motion.div>
      </section>

      <section style={{ padding: '2rem 1.5rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: MessageSquare, label: 'WhatsApp', value: '0852-6396-5031', href: 'https://wa.me/6285263965031' },
              { icon: Phone, label: 'Telepon', value: '0852-6396-5031', href: 'tel:+6285263965031' },
              { icon: Mail, label: 'Email', value: 'admin.hijrahtoko@gmail.com', href: 'mailto:admin.hijrahtoko@gmail.com' },
              { icon: MapPin, label: 'Lokasi', value: 'Padang, Sumatera Barat', href: '#' },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.a
                  key={i}
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(226, 232, 240, 0.6)',
                    borderRadius: 16,
                    padding: '1.25rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s',
                  }}
                  whileHover={{ y: -2, boxShadow: '0 8px 20px -6px rgba(0,0,0,0.08)' }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(225, 29, 72, 0.1)',
                    color: 'var(--primary, #E11D48)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)', marginBottom: 2 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main, #0F172A)' }}>
                      {c.value}
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>

          {/* Contact Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              background: '#fff',
              border: '1px solid rgba(226, 232, 240, 0.6)',
              borderRadius: 20,
              padding: '2rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main, #0F172A)', marginBottom: '1.25rem' }}>
              Kirim Pesan
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <input
                type="text"
                placeholder="Nama Anda"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '0.92rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: 'var(--text-main, #0F172A)',
                }}
              />
              <input
                type="email"
                placeholder="Email Anda"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '0.92rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: 'var(--text-main, #0F172A)',
                }}
              />
              <textarea
                placeholder="Pesan Anda..."
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '0.92rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: 'var(--text-main, #0F172A)',
                  resize: 'vertical',
                  minHeight: 120,
                }}
              />
              <button
                type="submit"
                disabled={sending}
                style={{
                  padding: '0.85rem 1.5rem',
                  background: sent ? '#22c55e' : 'var(--primary, #E11D48)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: sending ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                {sent ? (
                  <><CheckCircle2 size={18} /> Terkirim!</>
                ) : sending ? (
                  <><Loader2 size={18} className="spin" /> Mengirim...</>
                ) : (
                  <><Send size={18} /> Kirim Pesan</>
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </section>
    </div>
  );
}

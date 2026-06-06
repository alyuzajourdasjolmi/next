"use client";

import React from 'react';
import { Settings, Store, Phone, MapPin, MessageSquare, Mail, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header split">
        <h2>
          <Settings size={18} />
          Pengaturan Toko
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {[
          { icon: Store, label: 'Nama Toko', value: 'Hijrah Toko' },
          { icon: Phone, label: 'WhatsApp', value: '0852-6396-5031' },
          { icon: MessageSquare, label: 'Telepon', value: '0852-6396-5031' },
          { icon: Mail, label: 'Email', value: 'admin.hijrahtoko@gmail.com' },
          { icon: MapPin, label: 'Lokasi', value: 'Padang Pariaman, Sumatera Barat' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(225, 29, 72, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                  {item.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(225,29,72,0.04) 0%, rgba(99,102,241,0.04) 100%)',
          border: '1px dashed rgba(225,29,72,0.2)',
          borderRadius: 12,
          textAlign: 'center',
        }}
      >
        <Sparkles size={24} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>
          Pengaturan Lanjutan Segera Hadir
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Edit profil toko, jam operasional, dan kebijakan toko akan tersedia di sini.
        </p>
      </div>
    </section>
  );
}

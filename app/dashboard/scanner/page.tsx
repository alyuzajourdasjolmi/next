"use client";

import React from 'react';
import { ScanLine, Sparkles } from 'lucide-react';

export default function ScannerPage() {
  return (
    <section className="admin-panel">
      <div
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(225,29,72,0.05) 0%, rgba(99,102,241,0.05) 100%)',
          border: '1px dashed rgba(225,29,72,0.3)',
          borderRadius: 16,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 1rem',
            background: 'rgba(225, 29, 72, 0.1)',
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <ScanLine size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
          Barcode Scanner
        </h2>
        <p style={{ color: '#64748b', margin: '0 0 1rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Fitur scan barcode produk akan segera hadir. Anda akan bisa scan barcode kemasan
          untuk langsung menambahkan produk ke keranjang POS atau inventori.
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(225,29,72,0.1)',
            color: 'var(--primary)',
            borderRadius: 999,
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <Sparkles size={14} /> Coming Soon
        </div>
      </div>
    </section>
  );
}

"use client";

import React from 'react';
import Link from 'next/link';
import { Package, AlertCircle, ArrowRight } from 'lucide-react';
import { useDashboard } from '../../../lib/dashboard-context';

export default function InventoryPage() {
  const { products } = useDashboard();
  const lowStock = products.filter((p: any) => (p.stock || 0) <= 5);
  const outOfStock = products.filter((p: any) => (p.stock || 0) <= 0);

  return (
    <section className="admin-panel">
      <div className="admin-panel-header split">
        <h2>
          <Package size={18} />
          Manajemen Stok
        </h2>
        <span className="panel-chip">{products.length} produk</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '1.25rem',
            borderRadius: 12,
          }}
        >
          <AlertCircle size={20} color="#dc2626" />
          <h4 style={{ margin: '0.5rem 0', color: '#dc2626' }}>Stok Habis</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {outOfStock.length}
          </p>
        </div>
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '1.25rem',
            borderRadius: 12,
          }}
        >
          <AlertCircle size={20} color="#d97706" />
          <h4 style={{ margin: '0.5rem 0', color: '#d97706' }}>Stok Menipis</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {lowStock.length}
          </p>
        </div>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '1.25rem',
            borderRadius: 12,
          }}
        >
          <Package size={20} color="#16a34a" />
          <h4 style={{ margin: '0.5rem 0', color: '#16a34a' }}>Stok Sehat</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {products.length - lowStock.length}
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
        }}
      >
        <p style={{ margin: 0, color: '#64748b' }}>
          💡 Untuk mengelola stok per produk, buka halaman{' '}
          <Link
            href="/dashboard/products"
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
          >
            Manajemen Produk <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </Link>
        </p>
      </div>
    </section>
  );
}

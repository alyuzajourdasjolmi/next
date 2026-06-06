"use client";

import React from 'react';
import { BarChart3, Upload } from 'lucide-react';
import { useDashboard } from '../../../lib/dashboard-context';

export default function ReportsPage() {
  const { orders } = useDashboard();

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tanggal',
      'Pelanggan',
      'No WhatsApp',
      'Alamat',
      'Pengiriman',
      'Pembayaran',
      'Status',
      'Subtotal',
      'Ongkir',
      'Total',
      'Items',
    ];
    const rows = orders.map((order: any, i: number) => {
      const items = (order.order_items || [])
        .map((item: any) => `${item.product_name} (${item.qty}x)`)
        .join('; ');
      return [
        i + 1,
        new Date(order.created_at).toLocaleString('id-ID'),
        order.customer_name,
        order.customer_phone || '',
        order.customer_address || '',
        order.delivery_method === 'pickup' ? 'Ambil di Toko' : 'Diantar',
        order.payment_method || 'COD',
        order.status,
        order.subtotal || 0,
        order.shipping_cost || 0,
        order.grand_total || 0,
        items,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell: any) => {
            const str = String(cell);
            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-penjualan-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-header split">
        <h2>
          <BarChart3 size={18} />
          Laporan Penjualan
        </h2>
        <button onClick={handleExportCSV} className="admin-btn admin-btn-primary">
          <Upload size={16} style={{ transform: 'rotate(180deg)' }} />
          Export CSV
        </button>
      </div>
      <div
        style={{
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginTop: '1rem',
        }}
      >
        <p style={{ margin: 0, color: '#64748b' }}>
          Gunakan tombol di atas untuk mengunduh laporan seluruh data transaksi dalam format
          CSV untuk pembukuan. Total {orders.length} pesanan akan diekspor.
        </p>
      </div>
    </section>
  );
}

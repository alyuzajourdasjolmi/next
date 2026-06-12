"use client";

import React, { useState, useMemo } from 'react';
import {
  BarChart3, Upload, Calendar, DollarSign, ShoppingCart,
  Package, TrendingUp, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import { useDashboard } from '../../../lib/dashboard-context';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Menunggu',    color: '#D97706', bg: '#FFFBEB' },
  confirmed:  { label: 'Dikonfirmasi', color: '#2563EB', bg: '#EFF6FF' },
  processing: { label: 'Diproses',    color: '#7C3AED', bg: '#F5F3FF' },
  shipped:    { label: 'Dikirim',     color: '#4F46E5', bg: '#EEF2FF' },
  completed:  { label: 'Selesai',     color: '#059669', bg: '#ECFDF5' },
  cancelled:  { label: 'Dibatalkan',  color: '#DC2626', bg: '#FEF2F2' },
};

export default function ReportsPage() {
  const { orders } = useDashboard();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const years = useMemo(() => {
    const set = new Set<number>();
    orders.forEach((o: any) => {
      const d = new Date(o.created_at);
      set.add(d.getFullYear());
    });
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const d = new Date(o.created_at);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [orders, selectedMonth, selectedYear]);

  const searchedOrders = useMemo(() => {
    if (!searchTerm.trim()) return filteredOrders;
    const q = searchTerm.toLowerCase();
    return filteredOrders.filter((o: any) =>
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q) ||
      String(o.id).includes(q)
    );
  }, [filteredOrders, searchTerm]);

  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0),
    [filteredOrders]
  );

  const totalOrders = filteredOrders.length;

  const avgPerOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const totalItems = useMemo(
    () => filteredOrders.reduce((sum: number, o: any) =>
      sum + (o.order_items || []).reduce((s: number, i: any) => s + (i.qty || 0), 0), 0),
    [filteredOrders]
  );

  const dailyRevenue = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const result: { day: number; revenue: number; orders: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOrders = filteredOrders.filter((o: any) => {
        const od = new Date(o.created_at);
        return od.getDate() === d;
      });
      result.push({
        day: d,
        revenue: dayOrders.reduce((s: number, o: any) => s + (o.grand_total || 0), 0),
        orders: dayOrders.length,
      });
    }
    return result;
  }, [filteredOrders, selectedMonth, selectedYear]);

  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);

  const topProducts = useMemo(() => {
    const map = new Map<number, { name: string; qty: number; revenue: number }>();
    filteredOrders.forEach((o: any) => {
      (o.order_items || []).forEach((item: any) => {
        const existing = map.get(item.product_id) || { name: item.product_name, qty: 0, revenue: 0 };
        existing.qty += item.qty || 0;
        existing.revenue += (item.price || 0) * (item.qty || 0);
        map.set(item.product_id, existing);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredOrders]);

  const handleExportCSV = () => {
    const headers = [
      'No', 'Tanggal', 'Pelanggan', 'No WhatsApp', 'Alamat',
      'Pengiriman', 'Pembayaran', 'Status', 'Subtotal', 'Ongkir', 'Total', 'Items',
    ];
    const rows = searchedOrders.map((order: any, i: number) => {
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
        row.map((cell: any) => {
          const str = String(cell);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      )
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const navigateMonth = (dir: -1 | 1) => {
    let newMonth = selectedMonth + dir;
    let newYear = selectedYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const fmtRp = (v: number) => 'Rp ' + v.toLocaleString('id-ID');
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <section className="admin-panel" style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header + Month Picker */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BarChart3 size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Laporan Penjualan</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Ringkasan data transaksi per bulan</p>
            </div>
          </div>
          <button onClick={handleExportCSV} style={{
            padding: '0.6rem 1.2rem', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 4px 14px -3px rgba(225,29,72,0.5)',
          }}>
            <Upload size={15} style={{ transform: 'rotate(180deg)' }} />
            Export CSV ({MONTHS[selectedMonth]} {selectedYear})
          </button>
        </div>

        {/* Month Navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          marginTop: '1.25rem', padding: '0.75rem', background: '#fff', borderRadius: 14,
          border: '1px solid #e2e8f0',
        }}>
          <button onClick={() => navigateMonth(-1)} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0',
            background: '#fff', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#e11d48" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{
                padding: '0.45rem 0.75rem', borderRadius: 8, border: '1.5px solid #e2e8f0',
                fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', background: '#f8fafc',
                fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
              }}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '0.45rem 0.75rem', borderRadius: 8, border: '1.5px solid #e2e8f0',
                fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', background: '#f8fafc',
                fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
              }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={() => navigateMonth(1)} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0',
            background: '#fff', color: '#64748b', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Pendapatan', value: fmtRp(totalRevenue), icon: DollarSign, gradient: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', iconColor: '#16a34a' },
          { label: 'Pesanan', value: String(totalOrders), icon: ShoppingCart, gradient: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', iconColor: '#7c3aed' },
          { label: 'Rata-rata/Pesanan', value: fmtRp(avgPerOrder), icon: TrendingUp, gradient: 'linear-gradient(135deg, #fef3c7, #fde68a)', iconColor: '#d97706' },
          { label: 'Item Terjual', value: String(totalItems), icon: Package, gradient: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', iconColor: '#2563eb' },
        ].map((card, i) => (
          <div key={i} style={{
            padding: '1rem 1.1rem', background: '#fff', borderRadius: 14,
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 11, background: card.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <card.icon size={20} color={card.iconColor} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{card.value}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Revenue Chart + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {/* Chart */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
          padding: '1.1rem 1.25rem',
        }}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
            Pendapatan Harian
          </h3>
          {totalOrders === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
              Tidak ada data di bulan ini
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160 }}>
              {dailyRevenue.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div
                    title={`${d.day}: ${fmtRp(d.revenue)} (${d.orders} pesanan)`}
                    style={{
                      width: '100%', maxWidth: 20, borderRadius: 4,
                      background: d.revenue > 0
                        ? 'linear-gradient(to top, #e11d48, #fb7185)'
                        : '#f1f5f9',
                      height: d.revenue > 0 ? `${Math.max((d.revenue / maxDailyRevenue) * 100, 4)}%` : '4%',
                      transition: 'height 0.3s',
                      cursor: 'default',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {totalOrders > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem',
              fontSize: '0.6rem', color: '#94a3b8',
            }}>
              <span>1</span>
              <span>{new Date(selectedYear, selectedMonth + 1, 0).getDate()}</span>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
          padding: '1.1rem 1.25rem',
        }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
            Produk Terlaris
          </h3>
          {topProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
              Tidak ada data
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {topProducts.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.55rem 0.65rem', background: '#f8fafc', borderRadius: 10,
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 7, background: i === 0 ? '#fef3c7' : i === 1 ? '#e2e8f0' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 800,
                    color: i === 0 ? '#d97706' : i === 1 ? '#64748b' : '#94a3b8',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>
                      {p.qty} terjual · {fmtRp(p.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Table */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
            Detail Pesanan ({searchedOrders.length})
          </h3>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nama/HP/ID..."
              style={{
                padding: '0.45rem 0.65rem 0.45rem 2rem', borderRadius: 8,
                border: '1.5px solid #e2e8f0', fontSize: '0.78rem', fontFamily: 'inherit',
                outline: 'none', width: 180, background: '#f8fafc',
              }}
            />
          </div>
        </div>

        {searchedOrders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            Tidak ada pesanan di bulan ini
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Tanggal', 'Pelanggan', 'Items', 'Total', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 700,
                      color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase',
                      letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {searchedOrders.map((o: any) => {
                  const st = STATUS_LABEL[o.status] || { label: o.status, color: '#64748b', bg: '#F1F5F9' };
                  const itemCount = (o.order_items || []).reduce((s: number, i: any) => s + (i.qty || 0), 0);
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: '#0f172a' }}>
                        #{String(o.id).slice(-6).toUpperCase()}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#64748b' }}>
                        {fmtDate(o.created_at)}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{o.customer_name}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{o.customer_phone}</p>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#64748b' }}>
                        {itemCount} item
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        {fmtRp(o.grand_total || 0)}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                          borderRadius: 6, background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .admin-panel > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

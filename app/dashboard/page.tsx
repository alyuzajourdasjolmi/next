"use client";

import React, { useMemo } from 'react';
import {
  DollarSign,
  AlertCircle,
  Package,
  Users,
  TrendingUp,
  BarChart3,
  Home,
  Loader2,
} from 'lucide-react';
import { useDashboard } from '../../lib/dashboard-context';

export default function DashboardOverviewPage() {
  const { loading, orders, products, users, fetchData } = useDashboard();

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (o.grand_total || 0), 0),
    [orders]
  );
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders]
  );
  const totalProducts = products.length;
  const totalUsers = users.length;

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    return orders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);
  }, [orders]);

  const revenueHistory = useMemo(() => {
    const now = new Date();
    const months: { key: string; name: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('id-ID', { month: 'short' });
      const total = orders
        .filter((o) => {
          const od = new Date(o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        })
        .reduce((sum, o) => sum + (o.grand_total || 0), 0);
      months.push({ key, name, total });
    }
    return months;
  }, [orders]);

  const maxRevenue = Math.max(...revenueHistory.map((m) => m.total), 1);

  if (loading) {
    return (
      <section className="admin-loading-state">
        <Loader2 size={20} className="spin" />
        <p>Memuat data dashboard...</p>
      </section>
    );
  }

  const lowStockProducts = products.filter((p: any) => (p.stock || 0) <= 5);
  const todayOrders = orders.filter(
    (o: any) => new Date(o.created_at).toDateString() === new Date().toDateString()
  );

  return (
    <>
      <section className="admin-kpi-grid">
        <article className="admin-kpi-card">
          <span className="kpi-icon green">
            <DollarSign size={18} />
          </span>
          <h3>Omzet Total</h3>
          <strong>Rp {totalRevenue.toLocaleString('id-ID')}</strong>
        </article>
        <article className="admin-kpi-card">
          <span className="kpi-icon amber">
            <AlertCircle size={18} />
          </span>
          <h3>Pesanan Pending</h3>
          <strong>{pendingOrders}</strong>
        </article>
        <article className="admin-kpi-card">
          <span className="kpi-icon blue">
            <Package size={18} />
          </span>
          <h3>Total Produk</h3>
          <strong>{totalProducts}</strong>
        </article>
        <article className="admin-kpi-card">
          <span className="kpi-icon slate">
            <Users size={18} />
          </span>
          <h3>Total Pengguna</h3>
          <strong>{totalUsers}</strong>
        </article>
        <article className="admin-kpi-card featured">
          <span className="kpi-icon rose">
            <TrendingUp size={18} />
          </span>
          <h3>Omzet Bulan Ini</h3>
          <strong>Rp {monthlyRevenue.toLocaleString('id-ID')}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <h2>
            <BarChart3 size={18} />
            Tren Pendapatan 6 Bulan
          </h2>
        </div>
        <div className="admin-chart">
          {revenueHistory.map((month) => (
            <div key={month.key} className="admin-bar-wrapper">
              <span>Rp {(month.total / 1000).toFixed(0)}k</span>
              <div
                className="admin-bar"
                style={{ height: `${Math.max((month.total / maxRevenue) * 150, 8)}px` }}
                title={`Rp ${month.total.toLocaleString('id-ID')}`}
              />
              <small>{month.name}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header split">
          <h2>
            <Home size={18} />
            Ringkasan Dashboard
          </h2>
          <span className="panel-chip">Hari Ini</span>
        </div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {lowStockProducts.length > 0 && (
            <div
              style={{
                background: '#fef2f2',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #fecaca',
              }}
            >
              <h4
                style={{
                  margin: '0 0 0.5rem 0',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={18} /> Peringatan Stok Menipis
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#991b1b', fontSize: '0.9rem' }}>
                {lowStockProducts.map((p: any) => (
                  <li key={p.id}>
                    <strong>{p.name}</strong> - Sisa stok: {p.stock || 0}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                Pesanan Hari Ini
              </h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                {todayOrders.length}
              </p>
            </div>
            <div
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                Produk Aktif
              </h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                {products.length}
              </p>
            </div>
            <div
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                Total Pelanggan
              </h4>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                {users.length}
              </p>
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Pesanan Terbaru</h4>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {orders.slice(0, 5).map((order: any) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <strong>{order.customer_name}</strong>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                      Rp {order.grand_total.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: order.status === 'completed' ? '#dcfce7' : '#fef3c7',
                      color: order.status === 'completed' ? '#166534' : '#92400e',
                    }}
                  >
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

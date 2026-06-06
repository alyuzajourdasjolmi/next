"use client";

import React, { useMemo } from 'react';
import {
  DollarSign, AlertCircle, Package, Users,
  TrendingUp, BarChart3, Home, Loader2,
} from 'lucide-react';
import { useDashboard } from '../../lib/dashboard-context';

export default function DashboardOverviewPage() {
  const { loading, orders, products, users } = useDashboard();

  const totalRevenue = useMemo(
    () => orders.reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0),
    [orders]
  );
  const pendingOrders = useMemo(
    () => orders.filter((o: any) => o.status === 'pending').length,
    [orders]
  );
  const totalProducts = products.length;
  const totalUsers = users.length;

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    return orders
      .filter((o: any) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0);
  }, [orders]);

  const revenueHistory = useMemo(() => {
    const now = new Date();
    const months: { key: string; name: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('id-ID', { month: 'short' });
      const total = orders
        .filter((o: any) => {
          const od = new Date(o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        })
        .reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0);
      months.push({ key, name, total });
    }
    return months;
  }, [orders]);

  const maxRevenue = Math.max(...revenueHistory.map((m) => m.total), 1);
  const lowStockProducts = products.filter((p: any) => (p.stock || 0) <= 5);
  const todayOrders = orders.filter(
    (o: any) => new Date(o.created_at).toDateString() === new Date().toDateString()
  );

  if (loading) {
    return (
      <section className="admin-loading-state">
        <Loader2 size={20} className="spin" />
        <p>Memuat data dashboard...</p>
      </section>
    );
  }

  const statusClass = (s: string) => {
    const map: Record<string, string> = {
      pending: 'pending', confirmed: 'confirmed', processing: 'processing',
      shipped: 'shipped', completed: 'completed', cancelled: 'cancelled',
    };
    return map[s] || 'pending';
  };

  return (
    <>
      {/* KPI Cards */}
      <section className="admin-kpi-grid">
        <article className="admin-kpi-card fb-stagger">
          <span className="kpi-icon green"><DollarSign size={18} /></span>
          <h3>Omzet Total</h3>
          <strong>Rp {totalRevenue.toLocaleString('id-ID')}</strong>
        </article>
        <article className="admin-kpi-card fb-stagger">
          <span className="kpi-icon amber"><AlertCircle size={18} /></span>
          <h3>Pesanan Pending</h3>
          <strong>{pendingOrders}</strong>
        </article>
        <article className="admin-kpi-card fb-stagger">
          <span className="kpi-icon blue"><Package size={18} /></span>
          <h3>Total Produk</h3>
          <strong>{totalProducts}</strong>
        </article>
        <article className="admin-kpi-card fb-stagger">
          <span className="kpi-icon slate"><Users size={18} /></span>
          <h3>Total Pengguna</h3>
          <strong>{totalUsers}</strong>
        </article>
        <article className="admin-kpi-card featured fb-stagger">
          <span className="kpi-icon rose"><TrendingUp size={18} /></span>
          <h3>Omzet Bulan Ini</h3>
          <strong>Rp {monthlyRevenue.toLocaleString('id-ID')}</strong>
        </article>
      </section>

      {/* Revenue Chart */}
      <section className="admin-panel">
        <div className="admin-panel-header">
          <h2><BarChart3 size={18} /> Tren Pendapatan 6 Bulan</h2>
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

      {/* Ringkasan + Recent Orders */}
      <section className="admin-panel">
        <div className="admin-panel-header split">
          <h2><Home size={18} /> Ringkasan Dashboard</h2>
          <span className="panel-chip">Hari Ini</span>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="admin-alert-card" style={{ marginBottom: '1rem' }}>
            <h4><AlertCircle size={18} /> Peringatan Stok Menipis</h4>
            <ul>
              {lowStockProducts.map((p: any) => (
                <li key={p.id}><strong>{p.name}</strong> — Sisa stok: {p.stock || 0}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="admin-summary-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="admin-summary-card fb-stagger">
            <div className="summary-icon rose"><Package size={16} /></div>
            <h4>Pesanan Hari Ini</h4>
            <strong>{todayOrders.length}</strong>
          </div>
          <div className="admin-summary-card fb-stagger">
            <div className="summary-icon blue"><Package size={16} /></div>
            <h4>Produk Aktif</h4>
            <strong>{products.length}</strong>
          </div>
          <div className="admin-summary-card fb-stagger">
            <div className="summary-icon slate"><Users size={16} /></div>
            <h4>Total Pelanggan</h4>
            <strong>{users.length}</strong>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
            Pesanan Terbaru
          </h4>
          <div className="admin-recent-list">
            {orders.slice(0, 5).map((order: any, i: number) => (
              <div key={order.id} className="admin-recent-item fb-row" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="order-info">
                  <strong>{order.customer_name}</strong>
                  <span>Rp {order.grand_total.toLocaleString('id-ID')}</span>
                </div>
                <span className={`order-badge ${statusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  MapPin,
  Phone,
  XCircle,
  Loader2,
  ChefHat,
  Inbox as InboxIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/cart-context';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', icon: Clock, color: '#f59e0b' },
  { value: 'confirmed', label: 'Dikonfirmasi', icon: CheckCircle2, color: '#3b82f6' },
  { value: 'processing', label: 'Diproses', icon: ChefHat, color: '#8b5cf6' },
  { value: 'shipped', label: 'Dikirim', icon: Truck, color: '#0ea5e9' },
  { value: 'completed', label: 'Selesai', icon: CheckCircle2, color: '#22c55e' },
  { value: 'cancelled', label: 'Dibatalkan', icon: XCircle, color: '#ef4444' },
];

function statusInfo(status: string) {
  return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
}

export default function TrackingPage() {
  const { user } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackingPhone, setTrackingPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const ordersRef = useRef<any[]>([]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const fetchUserOrders = async (showAlert = false) => {
    const targetUserId = user?.id;
    if (!targetUserId) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (showAlert) alert('Gagal memuat pesanan.');
    } finally {
      setLoading(false);
    }
  };

  // Track by phone (for guest users)
  const trackByPhone = async () => {
    if (!trackingPhone.trim()) {
      alert('Masukkan nomor WhatsApp Anda.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_phone', trackingPhone.trim())
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
      if ((data || []).length === 0) {
        alert('Tidak ada pesanan dengan nomor tersebut.');
      }
    } catch (error) {
      console.error('Error tracking by phone:', error);
      alert('Gagal melacak pesanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const currentUserId = userIdRef.current;
          const isAlreadyInList = ordersRef.current.some((o) => o.id === payload.new.id);
          if (currentUserId && (payload.new.user_id === currentUserId || isAlreadyInList)) {
            setOrders((current) => {
              const existing = current.find((o) => o.id === payload.new.id);
              if (existing) {
                return current.map((o) =>
                  o.id === payload.new.id ? { ...o, ...payload.new } : o
                );
              }
              return [payload.new, ...current];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const visibleOrders = orders.filter((o) => o.status !== 'cancelled');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main, #F8FAFC)',
        paddingTop: '5rem',
        paddingBottom: '4rem',
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 1.25rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted, #64748B)',
            textDecoration: 'none',
            fontSize: '0.88rem',
            marginBottom: '1rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} /> Kembali ke Beranda
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
          <InboxIcon size={24} color="var(--primary, #E11D48)" />
          <h1
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 900,
              color: 'var(--text-main, #0F172A)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Lacak Pesanan
          </h1>
        </div>
        <p style={{ color: '#64748b', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>
          {user
            ? 'Pantau status pesanan Anda secara real-time'
            : 'Masukkan nomor WhatsApp untuk melihat pesanan'}
        </p>

        {!user && (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            {showPhoneInput ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  value={trackingPhone}
                  onChange={(e) => setTrackingPhone(e.target.value)}
                  className="auth-input"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={trackByPhone}
                  disabled={loading}
                  style={{
                    padding: '0.7rem 1.1rem',
                    background: 'var(--primary, #E11D48)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                  Lacak
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>Belum login?</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Lacak pesanan dengan nomor WhatsApp atau login untuk pengalaman lengkap.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowPhoneInput(true)}
                    style={{
                      padding: '0.6rem 1rem',
                      background: 'rgba(225, 29, 72, 0.08)',
                      color: 'var(--primary, #E11D48)',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                    }}
                  >
                    Lacak via No. WA
                  </button>
                  <Link
                    href="/login"
                    style={{
                      padding: '0.6rem 1rem',
                      background: 'var(--primary, #E11D48)',
                      color: '#fff',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                    }}
                  >
                    Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <Loader2 size={28} className="spin" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Memuat pesanan...</p>
          </div>
        )}

        {!loading && visibleOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              padding: '3rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 1rem',
                borderRadius: 20,
                background: 'rgba(225, 29, 72, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary, #E11D48)',
              }}
            >
              <Package size={36} strokeWidth={1.4} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
              Belum ada pesanan
            </h2>
            <p style={{ color: '#64748b', margin: '0 0 1.5rem', fontSize: '0.92rem' }}>
              Pesananmu akan muncul di sini setelah checkout.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary, #E11D48)',
                color: '#fff',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Mulai Belanja
            </Link>
          </motion.div>
        )}

        {!loading && visibleOrders.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <AnimatePresence>
              {visibleOrders.map((order) => {
                const s = statusInfo(order.status);
                const Icon = s.icon;
                return (
                  <motion.li
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 16,
                      padding: '1.1rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        marginBottom: '0.875rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: '#94a3b8',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                          }}
                        >
                          ORDER #{String(order.id).slice(-6).toUpperCase()}
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '0.95rem',
                            marginTop: 2,
                          }}
                        >
                          {new Date(order.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.375rem 0.75rem',
                          background: `${s.color}1a`,
                          color: s.color,
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        <Icon size={13} /> {s.label}
                      </div>
                    </div>

                    <ul
                      style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: '0.75rem 0',
                        borderTop: '1px dashed #e2e8f0',
                        borderBottom: '1px dashed #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.375rem',
                      }}
                    >
                      {(order.order_items || []).map((item: any) => (
                        <li
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.88rem',
                            color: '#475569',
                          }}
                        >
                          <span>
                            {item.product_name} <strong style={{ color: '#0f172a' }}>x{item.qty}</strong>
                          </span>
                          <span>Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.875rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.82rem', color: '#64748b' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {order.delivery_method === 'pickup' ? (
                            <><Package size={12} /> Ambil di Toko</>
                          ) : (
                            <><Truck size={12} /> Diantar</>
                          )}
                        </span>
                        {order.delivery_method === 'delivery' && order.customer_address && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: 280 }}>
                            <MapPin size={12} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {order.customer_address}
                            </span>
                          </span>
                        )}
                        {order.customer_phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={12} /> {order.customer_phone}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total</div>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--primary, #E11D48)' }}>
                          Rp {order.grand_total.toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

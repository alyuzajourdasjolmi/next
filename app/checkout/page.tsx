"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Truck,
  CreditCard,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Home,
  Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/cart-context';
import {
  WA_NUMBER,
  STORE_NAME,
  PAYMENT_INFO,
  PAYMENT_METHODS,
  calculateShipping,
  haversineDistanceKm,
} from '../../lib/store-constants';
import { loadSettings } from '../../lib/store-settings';

const ORDER_INFO_KEY = 'hijrahTokoOrderInfo';

type OrderInfo = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerMapsLink: string;
  customerLatitude: number | string;
  customerLongitude: number | string;
  deliveryMethod: 'pickup' | 'delivery';
  pickupDate: string;
  paymentMethod: 'COD' | 'Mandiri' | 'BSI';
};

const defaultOrderInfo: OrderInfo = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  customerMapsLink: '',
  customerLatitude: '',
  customerLongitude: '',
  deliveryMethod: 'pickup',
  pickupDate: '',
  paymentMethod: 'COD',
};

export default function CheckoutPage() {
  const { cart, subtotal, clearCart, user } = useCart();
  const [orderInfo, setOrderInfo] = useState<OrderInfo>(defaultOrderInfo);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load saved order info
  useEffect(() => {
    const saved = localStorage.getItem(ORDER_INFO_KEY);
    if (saved) {
      try {
        setOrderInfo((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
    }
  }, []);

  // Pre-fill from user
  useEffect(() => {
    if (user) {
      setOrderInfo((prev) => ({
        ...prev,
        customerName: user.user_metadata?.full_name || prev.customerName,
        customerPhone: user.user_metadata?.phone || user.phone || prev.customerPhone,
        customerAddress: user.user_metadata?.address || prev.customerAddress,
      }));
    }
  }, [user]);

  // Persist
  useEffect(() => {
    if (submitted) return;
    localStorage.setItem(ORDER_INFO_KEY, JSON.stringify(orderInfo));
  }, [orderInfo, submitted]);

  const shipInfo = useMemo(() => {
    const s = loadSettings();
    return calculateShipping(
      orderInfo.deliveryMethod,
      orderInfo.customerLatitude ? Number(orderInfo.customerLatitude) : null,
      orderInfo.customerLongitude ? Number(orderInfo.customerLongitude) : null,
      Boolean(orderInfo.customerMapsLink),
      subtotal,
      {
        storeLat: s.lat,
        storeLon: s.lon,
        nearMaxKm: s.shippingNearMaxKm,
        maxKm: s.shippingMaxKm,
        nearBase: s.shippingNearBase,
        farBase: s.shippingFarBase,
        farPerKm: s.shippingFarPerKm,
        discounts: s.shippingDiscounts,
      }
    );
  }, [orderInfo, subtotal]);

  const grandTotal = subtotal + (shipInfo.finalCost || 0);

  const updateField = (field: keyof OrderInfo, value: any) => {
    setOrderInfo((prev) => ({ ...prev, [field]: value }));
  };

  const useCurrentLocation = () => {
    if (orderInfo.deliveryMethod !== 'delivery') {
      alert('Pilih metode "Diantarkan ke Alamat" terlebih dahulu.');
      return;
    }
    if (!navigator.geolocation) {
      alert('Browser ini tidak mendukung geolocation.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setOrderInfo((prev) => ({
          ...prev,
          customerLatitude: latitude,
          customerLongitude: longitude,
          customerMapsLink: mapsLink,
          customerAddress: prev.customerAddress || `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`,
        }));
        setIsLocating(false);
      },
      (err) => {
        alert('Gagal mendapatkan lokasi: ' + err.message);
        setIsLocating(false);
      }
    );
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setErrorMsg('Silakan login terlebih dahulu untuk melakukan pemesanan.');
      return;
    }
    if (!cart.length) {
      setErrorMsg('Keranjang masih kosong.');
      return;
    }
    if (shipInfo.status === 'missing-location') {
      setErrorMsg('Gunakan lokasi terlebih dahulu untuk metode diantar.');
      return;
    }
    if (shipInfo.status === 'too-far') {
      setErrorMsg('Lokasi terlalu jauh untuk diantar.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name:
            orderInfo.customerName ||
            user?.user_metadata?.full_name ||
            user?.email?.split('@')[0] ||
            'Pelanggan',
          customer_phone: orderInfo.customerPhone,
          delivery_method: orderInfo.deliveryMethod,
          customer_address: orderInfo.customerAddress,
          payment_method: orderInfo.paymentMethod,
          pickup_date: orderInfo.pickupDate,
          subtotal,
          shipping_cost: shipInfo.shippingCost || 0,
          shipping_discount: shipInfo.discount,
          grand_total: grandTotal,
          status: 'pending',
          user_id: user.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (order) {
        const orderItems = cart.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          qty: item.qty,
          price: item.price,
        }));
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        if (itemsError) throw itemsError;

        // Update stock and sold_count
        for (const item of cart) {
          const { data: product } = await supabase
            .from('products')
            .select('stock, sold_count')
            .eq('id', item.id)
            .single();
          if (product) {
            const newStock = typeof product.stock === 'number' ? Math.max(0, product.stock - item.qty) : 0;
            const newSoldCount = (product.sold_count || 0) + item.qty;
            await supabase
              .from('products')
              .update({ 
                stock: newStock,
                sold_count: newSoldCount
              })
              .eq('id', item.id);
          }
        }
      }

      // Build WhatsApp message
      const itemsText = cart.map((item) => `${item.name} x ${item.qty}`).join('\n');
      const msg = [
        `PESANAN BARU - ${STORE_NAME}`,
        '',
        `Nama Pemesan: ${orderInfo.customerName}`,
        `Metode: ${orderInfo.deliveryMethod === 'pickup' ? 'Ambil di Kedai' : 'Diantarkan'}`,
        '',
        'List Barang:',
        itemsText,
        '',
        `Pembayaran: ${orderInfo.paymentMethod}`,
        orderInfo.deliveryMethod === 'pickup'
          ? `Jadwal Ambil: ${orderInfo.pickupDate}`
          : `Alamat Kirim: ${orderInfo.customerAddress}\nJadwal: Segera (Diantar)`,
        '',
        'Rincian Biaya:',
        `Subtotal: Rp ${subtotal.toLocaleString('id-ID')}`,
        `Jarak Tempuh: ${shipInfo.distanceKm || '-'} km`,
        `Ongkir: Rp ${(shipInfo.shippingCost || 0).toLocaleString('id-ID')}`,
        `Diskon Ongkir: Rp ${shipInfo.discount.toLocaleString('id-ID')}`,
        `Total Bayar: Rp ${grandTotal.toLocaleString('id-ID')}`,
        '',
        `Link Lokasi: ${
          orderInfo.deliveryMethod === 'delivery' ? orderInfo.customerMapsLink : 'Tidak diperlukan'
        }`,
      ].join('\n');

      const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

      clearCart();
      setSubmitted(true);
      window.open(whatsappUrl, '_blank');
    } catch (error: any) {
      console.error('Error saving order:', error);
      setErrorMsg('Gagal menyimpan pesanan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 1.25rem 2rem',
          background: 'var(--bg-main, #F8FAFC)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '2.5rem 1.75rem',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.12)',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 1rem',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 10px 30px -8px rgba(34, 197, 94, 0.4)',
            }}
          >
            <CheckCircle2 size={44} strokeWidth={2.5} />
          </motion.div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
            Pesanan Berhasil! 🎉
          </h1>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>
            Pesananmu sudah diteruskan ke Admin via WhatsApp. Kami akan segera memprosesnya.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href="/tracking"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                background: 'var(--primary, #E11D48)',
                color: '#fff',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.92rem',
              }}
            >
              Lacak Pesanan <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              style={{
                padding: '0.75rem',
                background: 'transparent',
                color: 'var(--primary, #E11D48)',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: '1.5px solid var(--primary, #E11D48)',
              }}
            >
              Kembali ke Beranda
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 1.25rem 2rem',
          background: 'var(--bg-main, #F8FAFC)',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            padding: '2.5rem 1.75rem',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={48} color="var(--primary, #E11D48)" style={{ marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
            Login Diperlukan
          </h2>
          <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.92rem' }}>
            Silakan login terlebih dahulu untuk melanjutkan pemesanan.
          </p>
          <Link
            href="/login"
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
            Login Sekarang
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          paddingTop: '6rem',
          padding: '6rem 1.25rem 2rem',
          background: 'var(--bg-main, #F8FAFC)',
          textAlign: 'center',
        }}
      >
        <ShoppingBag size={64} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
          Keranjangmu Kosong
        </h2>
        <p style={{ color: '#64748b', margin: '0 0 1.5rem' }}>
          Tambahkan produk ke keranjang dulu sebelum checkout.
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
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main, #F8FAFC)',
        paddingTop: '5rem',
        paddingBottom: '4rem',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.25rem' }}>
        <Link
          href="/cart"
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
          <ArrowLeft size={14} /> Kembali ke Keranjang
        </Link>
        <h1
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            color: 'var(--text-main, #0F172A)',
            margin: '0 0 0.25rem',
            letterSpacing: '-0.02em',
          }}
        >
          Checkout
        </h1>
        <p style={{ color: '#64748b', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>
          Lengkapi data pengiriman dan pilih metode pembayaran
        </p>

        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.875rem 1rem',
              borderRadius: 12,
              marginBottom: '1rem',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        <form
          onSubmit={submitOrder}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 360px',
            gap: '1.25rem',
            alignItems: 'start',
          }}
          className="checkout-grid"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Customer Info */}
            <section
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '1.25rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <User size={18} color="var(--primary, #E11D48)" /> Data Pemesan
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap"
                  value={orderInfo.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  className="auth-input"
                />
                <input
                  type="tel"
                  required
                  placeholder="Nomor WhatsApp"
                  value={orderInfo.customerPhone}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  className="auth-input"
                />
              </div>
            </section>

            {/* Delivery Method */}
            <section
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '1.25rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Truck size={18} color="var(--primary, #E11D48)" /> Metode Pengiriman
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                {[
                  { value: 'pickup', icon: ShoppingBag, label: 'Ambil di Toko' },
                  { value: 'delivery', icon: MapPin, label: 'Diantar' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = orderInfo.deliveryMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField('deliveryMethod', opt.value)}
                      style={{
                        padding: '1rem',
                        border: active
                          ? '2px solid var(--primary, #E11D48)'
                          : '1.5px solid #e2e8f0',
                        background: active ? 'rgba(225, 29, 72, 0.04)' : '#fff',
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        color: active ? 'var(--primary, #E11D48)' : '#64748b',
                        fontSize: '0.9rem',
                      }}
                    >
                      <Icon size={18} /> {opt.label}
                    </button>
                  );
                })}
              </div>

              {orderInfo.deliveryMethod === 'pickup' ? (
                <div style={{ marginTop: '0.75rem' }}>
                  <label
                    style={{
                      fontSize: '0.82rem',
                      color: '#475569',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Jadwal Ambil
                  </label>
                  <input
                    type="datetime-local"
                    value={orderInfo.pickupDate}
                    onChange={(e) => updateField('pickupDate', e.target.value)}
                    className="auth-input"
                  />
                </div>
              ) : (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <textarea
                    required
                    rows={3}
                    placeholder="Alamat lengkap (Jl, RT/RW, Kelurahan, Kecamatan)"
                    value={orderInfo.customerAddress}
                    onChange={(e) => updateField('customerAddress', e.target.value)}
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={isLocating}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.6rem 0.9rem',
                      background: 'rgba(225, 29, 72, 0.08)',
                      color: 'var(--primary, #E11D48)',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: isLocating ? 'wait' : 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {isLocating ? (
                      <><Loader2 size={14} className="spin" /> Mencari lokasi...</>
                    ) : (
                      <><MapPin size={14} /> Gunakan Lokasi Saya</>
                    )}
                  </button>
                  {orderInfo.customerLatitude && orderInfo.customerLongitude && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#64748b',
                        background: '#f8fafc',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                      }}
                    >
                      📍 Lat: {Number(orderInfo.customerLatitude).toFixed(5)}, Lon:{' '}
                      {Number(orderInfo.customerLongitude).toFixed(5)} (
                      {shipInfo.distanceKm ? shipInfo.distanceKm.toFixed(2) : '?'} km dari toko)
                    </div>
                  )}
                </div>
              )}

              {/* Shipping info box */}
              {shipInfo.detail && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    background:
                      shipInfo.status === 'ok' || shipInfo.status === 'pickup'
                        ? 'rgba(34, 197, 94, 0.06)'
                        : 'rgba(245, 158, 11, 0.06)',
                    border:
                      shipInfo.status === 'ok' || shipInfo.status === 'pickup'
                        ? '1px solid rgba(34, 197, 94, 0.2)'
                        : '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: 10,
                    fontSize: '0.82rem',
                    color:
                      shipInfo.status === 'ok' || shipInfo.status === 'pickup'
                        ? '#166534'
                        : '#92400e',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                  }}
                >
                  <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>{shipInfo.detail}</span>
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '1.25rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CreditCard size={18} color="var(--primary, #E11D48)" /> Metode Pembayaran
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {PAYMENT_METHODS.map((pm) => {
                  const active = orderInfo.paymentMethod === pm.value;
                  return (
                    <label
                      key={pm.value}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.625rem',
                        padding: '0.875rem',
                        border: active
                          ? '2px solid var(--primary, #E11D48)'
                          : '1.5px solid #e2e8f0',
                        background: active ? 'rgba(225, 29, 72, 0.04)' : '#fff',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.value}
                        checked={active}
                        onChange={() => updateField('paymentMethod', pm.value as any)}
                        style={{ marginTop: 2, accentColor: 'var(--primary, #E11D48)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>
                          {pm.label}
                        </div>
                        {PAYMENT_INFO[pm.value] && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: '#64748b',
                              marginTop: 2,
                              whiteSpace: 'pre-line',
                              lineHeight: 1.5,
                            }}
                          >
                            {PAYMENT_INFO[pm.value]}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside
            style={{
              position: 'sticky',
              top: '6rem',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>
              Ringkasan Pesanan
            </h2>

            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px dashed #e2e8f0',
              }}
            >
              {cart.map((item) => (
                <li
                  key={item.id}
                  style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: '#f8fafc',
                      flexShrink: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.img ? (
                      <Image src={item.img} alt={item.name} width={44} height={44} style={{ objectFit: 'cover' }} />
                    ) : (
                      <ShoppingBag size={18} color="#cbd5e1" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>x{item.qty}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    Rp {(item.price * item.qty).toLocaleString('id-ID')}
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: '#64748b' }}>Ongkir</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  {shipInfo.finalCost !== null
                    ? `Rp ${shipInfo.finalCost.toLocaleString('id-ID')}`
                    : '-'}
                </span>
              </div>
              {shipInfo.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#16a34a' }}>Diskon ongkir</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                    - Rp {shipInfo.discount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Total Bayar</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--primary, #E11D48)' }}>
                Rp {grandTotal.toLocaleString('id-ID')}
              </strong>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: 'var(--primary, #E11D48)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: submitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 6px 16px -4px rgba(225, 29, 72, 0.35)',
              }}
            >
              {submitting ? (
                <><Loader2 size={16} className="spin" /> Memproses...</>
              ) : (
                <>Konfirmasi & Kirim <ArrowRight size={16} /></>
              )}
            </button>
          </aside>
        </form>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.checkout-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

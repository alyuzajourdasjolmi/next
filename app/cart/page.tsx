"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../../lib/cart-context';
import { STORE_NAME } from '../../lib/store-constants';

export default function CartPage() {
  const { cart, subtotal, changeQuantity, removeFromCart, clearCart } = useCart();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main, #F8FAFC)',
        paddingTop: '5rem',
        paddingBottom: '4rem',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '0 1.25rem',
        }}
      >
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
          <ArrowLeft size={14} /> Kembali Belanja
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
          Keranjang Belanja
        </h1>
        <p
          style={{
            color: 'var(--text-muted, #64748B)',
            margin: '0 0 1.5rem',
            fontSize: '0.95rem',
          }}
        >
          {cart.length > 0
            ? `${cart.length} produk di keranjang Anda`
            : 'Belum ada produk di keranjang'}
        </p>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              padding: '3rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
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
              <ShoppingBag size={36} strokeWidth={1.4} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
              Keranjangmu masih kosong
            </h2>
            <p style={{ color: '#64748b', margin: '0 0 1.5rem', fontSize: '0.92rem' }}>
              Yuk, mulai belanja dan tambahkan produk favoritmu!
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary, #E11D48)',
                color: '#fff',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.92rem',
                boxShadow: '0 6px 16px -4px rgba(225, 29, 72, 0.3)',
              }}
            >
              Mulai Belanja <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 320px',
              gap: '1.25rem',
              alignItems: 'start',
            }}
            className="cart-page-grid"
          >
            {/* Items */}
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 16,
                      padding: '0.875rem',
                      display: 'flex',
                      gap: '0.875rem',
                      alignItems: 'center',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        background: '#f8fafc',
                        flexShrink: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.img ? (
                        <Image
                          src={item.img}
                          alt={item.name}
                          width={72}
                          height={72}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      ) : (
                        <ShoppingBag size={24} color="#cbd5e1" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#0f172a',
                          fontSize: '0.95rem',
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--primary, #E11D48)',
                          fontWeight: 700,
                        }}
                      >
                        Rp {item.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: 4,
                      }}
                    >
                      <button
                        onClick={() => changeQuantity(item.id, -1)}
                        aria-label="Kurangi"
                        style={{
                          background: '#fff',
                          border: 'none',
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#64748b',
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <span
                        style={{
                          minWidth: 28,
                          textAlign: 'center',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#0f172a',
                        }}
                      >
                        {item.qty}
                      </span>
                      <button
                        onClick={() => changeQuantity(item.id, 1)}
                        aria-label="Tambah"
                        style={{
                          background: 'var(--primary, #E11D48)',
                          border: 'none',
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#fff',
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Hapus item"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>

              <button
                onClick={clearCart}
                style={{
                  alignSelf: 'flex-start',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0',
                  fontWeight: 500,
                }}
              >
                Kosongkan keranjang
              </button>
            </ul>

            {/* Summary */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
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
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 1rem',
                }}
              >
                Ringkasan
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px dashed #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>Subtotal ({cart.length} item)</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  * Ongkos kirim dihitung di halaman checkout berdasarkan jarak
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Total sementara</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--primary, #E11D48)' }}>
                  Rp {subtotal.toLocaleString('id-ID')}
                </strong>
              </div>

              <Link
                href="/checkout"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.9rem',
                  background: 'var(--primary, #E11D48)',
                  color: '#fff',
                  borderRadius: 12,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 6px 16px -4px rgba(225, 29, 72, 0.35)',
                  boxSizing: 'border-box',
                }}
              >
                Lanjut Checkout <ArrowRight size={16} />
              </Link>

              <p
                style={{
                  margin: '1rem 0 0',
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  textAlign: 'center',
                }}
              >
                Pesananmu aman & diproses cepat oleh tim {STORE_NAME}
              </p>
            </motion.aside>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          :global(.cart-page-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

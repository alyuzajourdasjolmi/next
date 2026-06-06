"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../lib/cart-context';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    subtotal,
    changeQuantity,
    removeFromCart,
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />
          <motion.aside
            key="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(420px, 100vw)',
              background: '#fff',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.15)',
            }}
          >
            <header
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <ShoppingBag size={20} color="var(--primary, #e11d48)" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Keranjang
                </h2>
                {cart.length > 0 && (
                  <span
                    style={{
                      background: 'var(--primary, #e11d48)',
                      color: '#fff',
                      borderRadius: 999,
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {cart.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Tutup keranjang"
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>
            </header>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 1.5rem',
              }}
            >
              {cart.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: '#94a3b8',
                  }}
                >
                  <ShoppingBag size={48} strokeWidth={1.2} style={{ marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>Keranjangmu masih kosong</p>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          background: '#fff',
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
                            width={60}
                            height={60}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        ) : (
                          <ShoppingBag size={20} color="#cbd5e1" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#0f172a',
                            marginBottom: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--primary, #e11d48)', fontWeight: 700 }}>
                          Rp {item.price.toLocaleString('id-ID')}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 6,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              padding: 2,
                            }}
                          >
                            <button
                              onClick={() => changeQuantity(item.id, -1)}
                              aria-label="Kurangi"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#64748b',
                              }}
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ minWidth: 22, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                              {item.qty}
                            </span>
                            <button
                              onClick={() => changeQuantity(item.id, 1)}
                              aria-label="Tambah"
                              style={{
                                background: 'var(--primary, #e11d48)',
                                border: 'none',
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#fff',
                              }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Hapus"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 4,
                              borderRadius: 6,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <footer
                style={{
                  padding: '1.25rem 1.5rem',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Subtotal</span>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                    Rp {subtotal.toLocaleString('id-ID')}
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Link
                    href="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem',
                      background: 'var(--primary, #e11d48)',
                      color: '#fff',
                      borderRadius: 12,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
                    }}
                  >
                    Checkout <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setIsCartOpen(false)}
                    style={{
                      textAlign: 'center',
                      padding: '0.75rem',
                      background: 'transparent',
                      color: 'var(--primary, #e11d48)',
                      borderRadius: 12,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      border: '1.5px solid var(--primary, #e11d48)',
                    }}
                  >
                    Lihat Keranjang
                  </Link>
                </div>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import { useCart } from '../lib/cart-context';

export default function CartToast() {
  const { cartToast } = useCart();

  return (
    <AnimatePresence>
      {cartToast && (
        <motion.div
          key="cart-toast"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid rgba(225, 29, 72, 0.2)',
            borderRadius: 14,
            padding: '0.85rem 1.1rem',
            boxShadow: '0 20px 40px -8px rgba(0,0,0,0.18), 0 4px 12px rgba(225, 29, 72, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#0f172a',
            maxWidth: 'calc(100vw - 48px)',
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(225, 29, 72, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #e11d48)',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={18} />
          </span>
          <span>{cartToast.replace(/^✓\s*/, '')}</span>
          <ShoppingCart size={14} color="#94a3b8" style={{ marginLeft: 4 }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

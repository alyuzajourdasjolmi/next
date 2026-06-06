"use client";

import React from 'react';
import { CartProvider } from '../lib/cart-context';
import { SettingsProvider } from '../lib/settings-context';
import CartDrawer from '../components/CartDrawer';
import CartToast from '../components/CartToast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <CartProvider>
        {children}
        <CartDrawer />
        <CartToast />
      </CartProvider>
    </SettingsProvider>
  );
}

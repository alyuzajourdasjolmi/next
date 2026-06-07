"use client";

import React from 'react';
import { CartProvider } from '../lib/cart-context';
import { SettingsProvider } from '../lib/settings-context';
import { FeedbackProvider } from '../lib/feedback-context';
import CartDrawer from '../components/CartDrawer';
import CartToast from '../components/CartToast';
import FeedbackHost from '../components/Feedback';
import ScrollToHomeButton from '../components/ScrollToHomeButton';
import './feedback.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <FeedbackProvider>
        <CartProvider>
          {children}
          <CartDrawer />
          <CartToast />
          <FeedbackHost />
          <ScrollToHomeButton />
        </CartProvider>
      </FeedbackProvider>
    </SettingsProvider>
  );
}

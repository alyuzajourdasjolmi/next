"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export type CartItem = {
  id: number;
  name: string;
  price: number;
  img?: string;
  stock?: number;
  category?: string;
  qty: number;
};

type CartContextValue = {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  user: any;
  cartToast: string;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: any) => void;
  changeQuantity: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  showToast: (message: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = 'hijrahTokoCart_guest';
const cartKey = (userId: string) => `hijrahTokoCart_${userId}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartToast, setCartToast] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auth listener
  useEffect(() => {
    if (!isClient) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, [isClient]);

  // Load cart on user change
  useEffect(() => {
    if (!isClient) return;
    const key = user ? cartKey(user.id) : GUEST_CART_KEY;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, [user, isClient]);

  // Persist cart
  useEffect(() => {
    if (!isClient) return;
    const key = user ? cartKey(user.id) : GUEST_CART_KEY;
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, user, isClient]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!cartToast) return;
    const t = setTimeout(() => setCartToast(''), 2500);
    return () => clearTimeout(t);
  }, [cartToast]);

  const showToast = useCallback((message: string) => setCartToast(message), []);

  const addToCart = useCallback(
    (product: any) => {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!product) return;
      if ((product.stock || 0) <= 0) {
        alert('Maaf, stok produk ini sedang habis!');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.img,
            stock: product.stock,
            category: product.category,
            qty: 1,
          },
        ];
      });
      setCartToast(`✓ ${product.name} ditambahkan`);
    },
    [user, router]
  );

  const changeQuantity = useCallback(
    (id: number, delta: number) => {
      setCart((prev) =>
        prev
          .map((item) => {
            if (item.id !== id) return item;
            const newQty = item.qty + delta;
            if (delta > 0 && (item.stock || 0) > 0 && newQty > (item.stock || 0)) {
              alert(`Maaf, stok ${item.name} tidak mencukupi!`);
              return item;
            }
            return { ...item, qty: newQty };
          })
          .filter((item) => item.qty > 0)
      );
    },
    []
  );

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        user,
        cartToast,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        changeQuantity,
        removeFromCart,
        clearCart,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}

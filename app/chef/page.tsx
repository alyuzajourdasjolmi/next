"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  ShoppingCart,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Moon,
  Sun,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'next/navigation';
import ChefChatArea from '../../components/ChefChatArea';
import './chef.css';

type Product = {
  id: number;
  name: string;
  desc?: string;
  description?: string;
  price: number;
  category: string;
  img?: string;
  image_url?: string;
  stock?: number;
};

function formatProductName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('-')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
        .join('-')
    )
    .join(' ');
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = src?.trim();

  if (!imageSrc || failed) {
    return (
      <div className="chef-card-img-placeholder">
        <Package size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img src={imageSrc} alt={alt} onError={() => setFailed(true)} />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="chef-skeleton">
      <div className="chef-skeleton-img" />
      <div className="chef-skeleton-body">
        <div className="chef-skeleton-line short" />
        <div className="chef-skeleton-line" />
        <div className="chef-skeleton-line" />
      </div>
    </div>
  );
}

function ChefContent() {
  const searchParams = useSearchParams();
  const recipeParam = searchParams.get('recipe');

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState('dark');
  const [cartCount, setCartCount] = useState(0);
  const [initialChefMessage, setInitialChefMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (recipeParam) {
      setInitialChefMessage(`Tolong berikan resep kreatif menggunakan ${decodeURIComponent(recipeParam)}`);
    }
  }, [recipeParam]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchProducts();

    const savedTheme = localStorage.getItem('hijrahTokoTheme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('hijrahTokoCart_guest') || '[]');
      setCartCount(cart.reduce((acc: number, item: any) => acc + item.qty, 0));
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'frozen')
      .limit(4);
    setProducts(data || []);
    setLoadingProducts(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('hijrahTokoTheme', newTheme);
  };

  const scrollToChat = () => {
    document.getElementById('chef-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const askRecipe = (productName: string) => {
    setInitialChefMessage(`Tolong berikan resep kreatif menggunakan ${productName}`);
    scrollToChat();
  };

  const startChefChat = () => {
    setInitialChefMessage('Halo Chef! Aku bingung mau masak apa hari ini, bisa beri saran?');
    scrollToChat();
  };

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('hijrahTokoCart_guest') || '[]');
    const existing = cart.find((item: any) => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        img: product.img || product.image_url,
      });
    }
    localStorage.setItem('hijrahTokoCart_guest', JSON.stringify(cart));
    setCartCount(cart.reduce((acc: number, item: any) => acc + item.qty, 0));
    window.dispatchEvent(new Event('storage'));
  };

  const getProductImage = (p: Product) => p.img || p.image_url;
  const getProductDesc = (p: Product) => {
    const desc = (p.desc || p.description || '').trim();
    return desc || 'Produk frozen pilihan dari Toko Hijrah.';
  };

  const extractWeight = (p: Product) => {
    const text = getProductDesc(p);
    const match = text.match(/\d+\s*(?:gr|g|kg|ml|l|pcs|butir)/i);
    return match ? match[0] : null;
  };

  return (
    <div className="chef-page">
      <header className="chef-nav">
        <div className="chef-nav-inner">
          <Link href="/" className="chef-brand">
            <div className="chef-brand-icon">
              <ChefHat color="#fff" size={22} />
            </div>
            <div>
              <div className="chef-brand-name">Hijrah Toko</div>
              <div className="chef-brand-sub">Chef Virtual</div>
            </div>
          </Link>

          <div className="chef-nav-actions">
            <Link href="/" className="chef-nav-btn" aria-label="Keranjang">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="chef-cart-badge">{cartCount}</span>}
            </Link>

            <button type="button" onClick={toggleTheme} className="chef-nav-btn" aria-label="Ganti tema">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="chef-avatar">
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <Link href="/#login" className="chef-btn-login">
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="chef-main">
        <div className="chef-layout">
          <div className="chef-content">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="chef-hero"
            >
              <div className="chef-hero-glow" aria-hidden />
              <div className="chef-hero-inner">
                <span className="chef-badge">✨ Fitur AI Terbaru</span>
                <h1 className="chef-hero-title">Bingung Mau Masak Apa Hari Ini?</h1>
                <p className="chef-hero-desc">
                  Tanya langsung ke <strong>Chef Virtual Hijrah</strong> untuk rekomendasi resep
                  praktis, ide olahan frozen food, dan tips dapur.
                </p>
                <div className="chef-hero-actions">
                  <button type="button" onClick={startChefChat} className="chef-btn-primary">
                    Mulai Tanya Chef
                    <ArrowRight size={16} />
                  </button>
                  <Link href="/#produk" className="chef-btn-secondary">
                    Lihat Bahan Frozen
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.section>

            <section>
              <div className="chef-section-head">
                <h2 className="chef-section-title">Bahan Frozen Terlaris</h2>
                <Link href="/#produk" className="chef-section-link">
                  Semua Produk
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="chef-product-grid">
                {loadingProducts &&
                  Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}

                {!loadingProducts && products.length === 0 && (
                  <p className="chef-empty">Belum ada produk frozen.</p>
                )}

                {!loadingProducts &&
                  products.map((p, idx) => {
                    const displayName = formatProductName(p.name);
                    const weight = extractWeight(p);
                    const desc = getProductDesc(p);

                    return (
                      <motion.article
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="chef-card"
                      >
                        <div className="chef-card-img-wrap">
                          <ProductImage src={getProductImage(p)} alt={displayName} />
                          <span className="chef-card-tag">Best Seller</span>
                        </div>

                        <div className="chef-card-body">
                          <div className="chef-card-top">
                            <h3 className="chef-card-name">{displayName}</h3>
                            {weight && <span className="chef-card-weight">{weight}</span>}
                          </div>

                          <p className="chef-card-desc">{desc}</p>

                          <div className="chef-card-footer">
                            <div>
                              <div className="chef-card-price-label">Harga</div>
                              <div className="chef-card-price">
                                Rp {p.price.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <div className="chef-card-actions">
                              <button
                                type="button"
                                onClick={() => askRecipe(p.name)}
                                className="chef-btn-resep"
                              >
                                Resep
                                <Sparkles size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => addToCart(p)}
                                className="chef-btn-cart"
                                aria-label={`Tambah ${displayName}`}
                              >
                                <ShoppingCart size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
              </div>
            </section>
          </div>

          <aside id="chef-chat" className="chef-sidebar">
            <div className="chef-sidebar-inner">
              <ChefChatArea initialMessage={initialChefMessage} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function ChefPage() {
  return (
    <Suspense fallback={<div className="chef-loading-page">Memuat...</div>}>
      <ChefContent />
    </Suspense>
  );
}

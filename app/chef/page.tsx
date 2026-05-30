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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1e2433] to-[#141824] text-white/25">
        <Package size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#161B22] animate-pulse">
      <div className="h-[160px] bg-white/5" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded bg-white/5" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-10 rounded-xl bg-white/5" />
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
    <div className="min-h-screen bg-[#0B0E14] text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0E14]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-[1400px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF006E]">
              <ChefHat className="text-white" size={22} />
            </div>
            <div>
              <p className="text-[15px] font-bold leading-tight tracking-tight">Hijrah Toko</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF006E]">
                Chef Virtual
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/5 hover:text-white"
              aria-label="Keranjang"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF006E] px-1 text-[9px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/5 hover:text-white"
              aria-label="Ganti tema"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF006E] text-sm font-bold">
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <Link
                href="/#login"
                className="rounded-xl bg-[#FF006E] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#e60063]"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main — grid 8/4 seperti mockup */}
      <main className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">

          {/* Kolom kiri — hero + produk */}
          <div className="flex flex-col gap-6 lg:col-span-8">

            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#2a1a4a] via-[#1a1f38] to-[#12182b] px-6 py-7 sm:px-8 sm:py-8"
            >
              <div
                className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-[#FF006E]/10 blur-3xl"
                aria-hidden
              />
              <div className="relative max-w-xl">
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#FF006E]/40 bg-[#FF006E]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FF006E]">
                  ✨ Fitur AI Terbaru
                </span>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                  Bingung Mau Masak Apa Hari Ini?
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-[15px]">
                  Tanya langsung ke{' '}
                  <span className="font-semibold text-white/85">Chef Virtual Hijrah</span> untuk
                  rekomendasi resep praktis, ide olahan frozen food, dan tips dapur.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startChefChat}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FF006E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e60063]"
                  >
                    Mulai Tanya Chef
                    <ArrowRight size={16} />
                  </button>
                  <Link
                    href="/#produk"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Lihat Bahan Frozen
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.section>

            {/* Produk */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold sm:text-xl">Bahan Frozen Terlaris</h2>
                <Link
                  href="/#produk"
                  className="flex items-center gap-1 text-sm font-semibold text-[#FF006E] hover:text-[#ff3388]"
                >
                  Semua Produk
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {loadingProducts &&
                  Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}

                {!loadingProducts && products.length === 0 && (
                  <p className="col-span-2 rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-white/40">
                    Belum ada produk frozen.
                  </p>
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
                        className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#161B22] transition hover:border-[#FF006E]/25"
                      >
                        <div className="relative h-[160px] overflow-hidden bg-[#1e2433]">
                          <ProductImage src={getProductImage(p)} alt={displayName} />
                          <span className="absolute left-2.5 top-2.5 rounded-md bg-[#FF006E] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                            Best Seller
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold leading-snug text-white sm:text-[15px]">
                              {displayName}
                            </h3>
                            {weight && (
                              <span className="shrink-0 rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/45">
                                {weight}
                              </span>
                            )}
                          </div>

                          <p className="line-clamp-2 text-xs leading-relaxed text-white/45">
                            {desc}
                          </p>

                          <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/[0.06] pt-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                                Harga
                              </p>
                              <p className="text-base font-extrabold text-white">
                                Rp {p.price.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => askRecipe(p.name)}
                                className="inline-flex items-center gap-1 rounded-xl bg-[#FF006E]/15 px-3 py-2 text-xs font-bold text-[#FF006E] transition hover:bg-[#FF006E]/25"
                              >
                                Resep
                                <Sparkles size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => addToCart(p)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0B0E14] transition hover:bg-[#FF006E] hover:text-white"
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

          {/* Kolom kanan — chat sidebar */}
          <aside
            id="chef-chat"
            className="lg:col-span-4 lg:sticky lg:top-[76px]"
          >
            <div className="h-[520px] lg:h-[calc(100vh-108px)] lg:min-h-[600px]">
              <ChefChatArea
                initialMessage={initialChefMessage}
                className="h-full"
              />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}

export default function ChefPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] text-sm text-white/50">
          Memuat...
        </div>
      }
    >
      <ChefContent />
    </Suspense>
  );
}

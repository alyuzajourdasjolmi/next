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
  Key,
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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900 text-white/30">
        <Package size={36} strokeWidth={1.5} />
        <span className="text-[10px] font-medium text-white/40 px-3 text-center line-clamp-2">
          {formatProductName(alt)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-[#131b2e] border border-white/[0.06] rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[5/4] bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/5 rounded w-2/3" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-9 bg-white/5 rounded-lg w-full mt-2" />
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
    <div className="min-h-screen bg-[#080d16] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080d16]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 hover:opacity-90">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500">
              <ChefHat className="text-white" size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight sm:text-base">Hijrah Toko</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                Chef Virtual
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() =>
                alert('Gunakan file .env.local untuk mengatur API Key Groq secara permanen.')
              }
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 xl:flex"
            >
              <Key size={13} className="text-rose-400" />
              API Key Groq
            </button>

            <Link
              href="/"
              className="relative rounded-lg p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
              aria-label="Keranjang"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
              aria-label="Ganti tema"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {user ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-xs font-bold">
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <Link
                href="/#login"
                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold transition hover:bg-rose-600"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
          {/* Hero + produk (urutan mobile: hero → chat → produk) */}
          <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-10">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="order-1 relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121a2b] p-5 sm:p-7"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl"
                aria-hidden
              />
              <div className="relative max-w-2xl">
                <span className="mb-3 inline-block rounded-md bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-300">
                  Fitur baru
                </span>
                <h1 className="text-xl font-bold leading-snug sm:text-2xl lg:text-[1.75rem]">
                  Bingung mau masak apa hari ini?
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55 sm:text-[15px]">
                  <span className="font-medium text-white/85">Chef Virtual Hijrah</span> siap bantu
                  resep praktis, ide olahan frozen food, dan tips dapur.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={startChefChat}
                    className="rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
                  >
                    Mulai tanya chef
                  </button>
                  <Link
                    href="/#produk"
                    className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                  >
                    Lihat bahan frozen
                  </Link>
                </div>
              </div>
            </motion.section>

            <section className="order-3 lg:order-2">
              <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div>
                  <h2 className="text-lg font-bold sm:text-xl">Bahan frozen terlaris</h2>
                  <p className="mt-0.5 text-sm text-white/45">
                    Pilih bahan, lalu tanya resep ke chef
                  </p>
                </div>
                <Link
                  href="/#produk"
                  className="flex shrink-0 items-center gap-1 text-sm font-semibold text-rose-400 hover:text-rose-300"
                >
                  Semua
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-2 xl:gap-5">
                {loadingProducts &&
                  Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}

                {!loadingProducts && products.length === 0 && (
                  <p className="col-span-2 rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-white/40">
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
                        transition={{ delay: idx * 0.04 }}
                        className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#131b2e] transition hover:border-rose-500/20"
                      >
                        <div className="relative aspect-[5/4] overflow-hidden bg-slate-800/50">
                          <ProductImage src={getProductImage(p)} alt={displayName} />
                          <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/90">
                            Frozen
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-[15px]">
                              {displayName}
                            </h3>
                            {weight && (
                              <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/45">
                                {weight}
                              </span>
                            )}
                          </div>

                          <p className="line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-white/45">
                            {desc}
                          </p>

                          <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                            <p className="text-sm font-bold text-rose-400">
                              Rp {p.price.toLocaleString('id-ID')}
                            </p>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => askRecipe(p.name)}
                                className="flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20 sm:px-3 sm:text-xs"
                              >
                                Resep
                                <Sparkles size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => addToCart(p)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 transition hover:bg-rose-500 hover:text-white sm:h-9 sm:w-9"
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

          <aside
            id="chef-chat"
            className="order-2 flex min-h-0 w-full shrink-0 flex-col lg:order-none lg:w-[min(100%,480px)] lg:max-w-[42%]"
          >
            <div className="h-[min(72vh,580px)] lg:sticky lg:top-[4.25rem] lg:flex lg:min-h-[calc(100vh-4.25rem)] lg:flex-1 lg:flex-col lg:h-auto">
              <ChefChatArea
                initialMessage={initialChefMessage}
                className="min-h-0 flex-1"
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
        <div className="flex min-h-screen items-center justify-center bg-[#080d16] text-sm text-white/50">
          Memuat...
        </div>
      }
    >
      <ChefContent />
    </Suspense>
  );
}

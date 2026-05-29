"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  ShoppingCart,
  Sparkles,
  Info,
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

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = src?.trim();

  if (!imageSrc || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900 text-white/30">
        <Package size={40} strokeWidth={1.5} />
        <span className="text-[10px] font-semibold uppercase tracking-wider px-3 text-center line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-white/5 rounded-lg w-2/3" />
        <div className="h-4 bg-white/5 rounded-lg w-full" />
        <div className="h-4 bg-white/5 rounded-lg w-4/5" />
        <div className="h-10 bg-white/5 rounded-xl w-full mt-4" />
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

  const askRecipe = (productName: string) => {
    setInitialChefMessage(`Tolong berikan resep kreatif menggunakan ${productName}`);
    document.getElementById('chef-chat')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  const getProductDesc = (p: Product) =>
    p.desc || p.description || 'Kualitas premium terbaik untuk keluarga Anda.';

  const extractWeight = (p: Product) => {
    const text = getProductDesc(p);
    const match = text.match(/\d+\s*(?:gr|g|kg|ml|l|pcs|butir)/i);
    return match ? match[0] : null;
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans selection:bg-rose-500/30">
      <nav className="sticky top-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
              <ChefHat className="text-white" size={22} />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none truncate">HIJRAH TOKO</h1>
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">
                Chef Virtual
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() =>
                alert('Gunakan file .env.local untuk mengatur API Key Groq secara permanen.')
              }
              className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
            >
              <Key size={14} className="text-rose-500" />
              Set API Key Groq
            </button>

            <Link
              href="/"
              className="p-2.5 hover:bg-white/5 rounded-xl transition-colors relative"
              aria-label="Keranjang belanja"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-rose-500 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#0a0f1a]">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"
              aria-label="Ganti tema"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <Link
                href="/#login"
                className="px-3 sm:px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold transition-all shrink-0"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8 sm:gap-10 min-w-0">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 sm:p-8 lg:p-10 shadow-xl"
            >
              <div className="relative z-10 max-w-lg">
                <span className="inline-flex items-center px-3 py-1 mb-4 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full">
                  Fitur Baru Toko Hijrah
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 sm:mb-4 leading-tight tracking-tight">
                  Bingung Mau Masak Apa Hari Ini?
                </h2>
                <p className="text-white/60 text-sm sm:text-base mb-6 leading-relaxed">
                  Tenang! <span className="text-rose-400 font-semibold">Chef Virtual Hijrah</span> siap
                  merekomendasikan resep praktis, ide olahan frozen food, dan tips dapur.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <button
                    onClick={() =>
                      setInitialChefMessage(
                        'Halo Chef! Aku bingung mau masak apa hari ini, bisa beri saran?'
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-500/20"
                  >
                    Mulai Tanya Chef
                  </button>
                  <Link
                    href="/#produk"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm border border-white/10 transition-all"
                  >
                    Lihat Bahan Frozen
                  </Link>
                </div>
              </div>
              <div className="hidden md:block absolute right-4 lg:right-8 bottom-4 text-white/[0.04] pointer-events-none select-none">
                <Info size={180} strokeWidth={1} />
              </div>
            </motion.section>

            <section className="min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black">Bahan Frozen Terlaris</h3>
                  <p className="text-white/40 text-sm mt-1">
                    Pilih bahan favoritmu & kreasikan resepnya
                  </p>
                </div>
                <Link
                  href="/#produk"
                  className="inline-flex items-center gap-1.5 text-rose-400 text-sm font-bold hover:text-rose-300 transition-colors shrink-0"
                >
                  Lihat Semua
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {loadingProducts &&
                  Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}

                {!loadingProducts && products.length === 0 && (
                  <p className="sm:col-span-2 text-center text-white/40 text-sm py-12 rounded-2xl border border-dashed border-white/10">
                    Belum ada produk frozen. Cek kembali nanti.
                  </p>
                )}

                {!loadingProducts &&
                  products.map((p, idx) => {
                    const weight = extractWeight(p);
                    return (
                      <motion.article
                        key={p.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group flex flex-col bg-[#111827] border border-white/5 rounded-2xl overflow-hidden hover:border-rose-500/25 transition-colors shadow-lg"
                      >
                        <div className="relative aspect-[4/3] bg-slate-800/80 overflow-hidden">
                          <ProductImage src={getProductImage(p)} alt={p.name} />
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wide text-white/90">
                            Frozen
                          </span>
                        </div>

                        <div className="flex flex-col flex-1 p-4 sm:p-5 gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-base leading-snug line-clamp-2">{p.name}</h4>
                            {weight && (
                              <span className="shrink-0 px-2 py-1 rounded-md bg-white/5 text-[10px] font-semibold text-white/50">
                                {weight}
                              </span>
                            )}
                          </div>

                          <p className="text-white/45 text-xs sm:text-sm leading-relaxed line-clamp-2 flex-1">
                            {getProductDesc(p)}
                          </p>

                          <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t border-white/5">
                            <div>
                              <p className="text-[10px] text-white/35 uppercase font-semibold tracking-wide">
                                Harga
                              </p>
                              <p className="text-rose-400 font-black text-base sm:text-lg">
                                Rp {p.price.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => askRecipe(p.name)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20 transition-colors"
                              >
                                <span className="hidden min-[400px]:inline">Tanya Resep</span>
                                <span className="min-[400px]:hidden">Resep</span>
                                <Sparkles size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => addToCart(p)}
                                className="w-10 h-10 bg-white hover:bg-rose-500 text-slate-900 hover:text-white rounded-xl flex items-center justify-center transition-colors"
                                aria-label={`Tambah ${p.name} ke keranjang`}
                              >
                                <ShoppingCart size={18} />
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
            className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 h-[min(70vh,640px)] sm:h-[min(75vh,700px)] lg:h-[calc(100vh-6rem)] min-h-[480px]"
          >
            <ChefChatArea initialMessage={initialChefMessage} />
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
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center text-white/60 text-sm">
          Memuat Chef...
        </div>
      }
    >
      <ChefContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  ShoppingCart, 
  ChevronLeft, 
  Sparkles, 
  Info, 
  ShoppingBag,
  ArrowRight,
  User as UserIcon,
  Moon,
  Sun,
  Key
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'next/navigation';
import ChefChatArea from '../../components/ChefChatArea';
import Image from 'next/image';

function ChefContent() {
  const searchParams = useSearchParams();
  const recipeParam = searchParams.get('recipe');
  
  const [products, setProducts] = useState<any[]>([]);
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
    // Auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Fetch frozen products
    fetchProducts();

    // Theme & Cart from localStorage
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
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'frozen')
      .limit(4);
    setProducts(data || []);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('hijrahTokoTheme', newTheme);
  };

  const askRecipe = (productName: string) => {
    setInitialChefMessage(`Tolong berikan resep kreatif menggunakan ${productName}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans selection:bg-rose-500/30 overflow-x-hidden">
      {/* Custom Navbar for Chef Page */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
                <ChefHat className="text-white" size={24} />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-lg font-black tracking-tighter leading-none">HIJRAH TOKO</h1>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">Frozen Food & Alat Tulis</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => alert("Gunakan file .env.local untuk mengatur API Key Groq secara permanen.")}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
            >
              <Key size={14} className="text-rose-500" />
              Set API Key Groq
            </button>
            
            <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-colors relative">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#0a0f1a]">
                  {cartCount}
                </span>
              )}
            </Link>

            <button onClick={toggleTheme} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-rose-500/20 text-sm">
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <Link href="/#login" className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20">
                Masuk
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
          
          {/* Left Column: Content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8 sm:space-y-12">
            
            {/* Hero Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-white/5 shadow-2xl"
            >
              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full mb-4 sm:mb-6">
                  <span className="text-rose-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Fitur Baru Toko Hijrah ✨</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 leading-[1.1] tracking-tight">
                  Bingung Mau Masak Apa Hari Ini?
                </h2>
                <p className="text-white/60 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
                  Tenang! Sekarang ada <span className="text-white font-bold text-rose-400">Chef Virtual Hijrah</span> yang siap merekomendasikan resep praktis, ide olahan frozen food, hingga tips dapur seru.
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <button 
                    onClick={() => setInitialChefMessage("Halo Chef! Aku bingung mau masak apa hari ini, bisa beri saran?")}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-rose-500/25 flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
                  >
                    Mulai Tanya Chef 🧑‍🍳
                  </button>
                  <Link 
                    href="/#produk"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 text-sm sm:text-base"
                  >
                    Lihat Bahan Frozen
                  </Link>
                </div>
              </div>

              {/* Decorative Background Icon */}
              <div className="absolute -right-10 sm:-right-20 -bottom-10 sm:-bottom-20 w-60 sm:w-80 h-60 sm:h-80 text-white/[0.03] rotate-12 pointer-events-none">
                <Info size={320} />
              </div>
            </motion.div>

            {/* Product Section */}
            <section>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                    Bahan Frozen Terlaris ❄️
                  </h3>
                  <p className="text-white/40 text-xs sm:text-sm mt-1">Pilih bahan favoritmu & kreasikan resepnya</p>
                </div>
                <Link href="/#produk" className="text-rose-500 text-xs sm:text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Lihat Semua <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {products.map((p, idx) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-[#111827] border border-white/5 rounded-3xl p-4 sm:p-5 hover:border-rose-500/30 transition-all shadow-lg"
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 sm:mb-5 bg-gray-800">
                      <img 
                        src={p.image_url || '/assets/images/placeholder.jpg'} 
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[9px] font-bold uppercase tracking-wider text-white">
                        {p.category.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h4 className="font-bold text-base sm:text-lg leading-tight truncate">{p.name}</h4>
                      <span className="px-2 py-1 bg-white/5 rounded-lg text-[9px] text-white/40 font-bold shrink-0">{p.weight || '500g'}</span>
                    </div>
                    <p className="text-white/40 text-xs line-clamp-2 mb-4 sm:mb-6 leading-relaxed min-h-[2.5rem]">
                      {p.description || 'Kualitas premium terbaik untuk keluarga Anda.'}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Harga</p>
                        <p className="text-rose-500 font-black text-sm sm:text-base">Rp {p.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => askRecipe(p.name)}
                          className="px-3 sm:px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border border-rose-500/20"
                        >
                          Tanya Resep <Sparkles size={12} className="sm:size-[14px]" />
                        </button>
                        <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white hover:bg-rose-500 text-black hover:text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0">
                          <ShoppingCart size={16} className="sm:size-[18px]" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Chat Area */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 h-[600px] sm:h-[700px] lg:h-[calc(100vh-120px)] mb-10 lg:mb-0">
            <ChefChatArea initialMessage={initialChefMessage} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default function ChefPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center text-white">Memuat Chef...</div>}>
      <ChefContent />
    </Suspense>
  );
}

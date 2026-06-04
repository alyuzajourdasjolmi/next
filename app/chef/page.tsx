"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, Star, Package, Plus,
  MessageCircle, Lightbulb, BookOpen, Clock, ChefHat as RecipeIcon,
  Heart, Zap, ChefHat as HatIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'next/navigation';
import SiteNavbar from '../../components/SiteNavbar';
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

const FEATURE_HIGHLIGHTS = [
  {
    icon: RecipeIcon,
    title: 'Resep Kreatif',
    desc: 'Dapatkan ide resep unik dari bahan frozen favorit Anda',
    gradient: 'chef-feature-icon-grad-rose',
  },
  {
    icon: Lightbulb,
    title: 'Tips Praktis',
    desc: 'Saran pengolahan, penyimpanan, dan pairing bahan',
    gradient: 'chef-feature-icon-grad-amber',
  },
  {
    icon: Package,
    title: 'Cek Stok',
    desc: 'Tanya ketersediaan produk kapan saja secara real-time',
    gradient: 'chef-feature-icon-grad-emerald',
  },
  {
    icon: BookOpen,
    title: 'Cara Pesan',
    desc: 'Panduan lengkap order, pembayaran, dan pengiriman',
    gradient: 'chef-feature-icon-grad-sky',
  },
];

const STATS = [
  { value: '24/7', label: 'Siap Melayani', icon: Clock },
  { value: '500+', label: 'Resep Tersedia', icon: RecipeIcon },
  { value: '4.9★', label: 'Rating Pengguna', icon: Star },
  { value: '< 3s', label: 'Waktu Respons', icon: Zap },
];

function ChefContent() {
  const searchParams = useSearchParams();
  const recipeParam = searchParams.get('recipe');

  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [initialChefMessage, setInitialChefMessage] = useState<string | undefined>(undefined);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (recipeParam) {
      setInitialChefMessage(`Tolong berikan resep kreatif menggunakan ${decodeURIComponent(recipeParam)}`);
    }
  }, [recipeParam]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data: frozenData } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'frozen')
      .limit(4);
    setProducts(frozenData || []);

    const { data: allData } = await supabase
      .from('products')
      .select('*');
    setAllProducts(allData || []);

    setLoadingProducts(false);
  };

  const scrollToChat = () => {
    setChatOpen(true);
    setTimeout(() => {
      document.getElementById('chef-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
    window.dispatchEvent(new Event('storage'));
  };

  const getProductImage = (p: Product) => p.img || p.image_url || '';
  const getProductDesc = (p: Product) => {
    const desc = (p.desc || p.description || '').trim();
    return desc || 'Produk frozen pilihan dari Toko Hijrah.';
  };

  return (
    <div className="chef-page">
      <SiteNavbar />

      <main className="chef-main">
        {/* ── Hero Section ── */}
        <motion.section
          className="chef-hero-v2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="chef-hero-v2-bg" aria-hidden>
            <div className="chef-hero-v2-blob chef-hero-v2-blob-1" />
            <div className="chef-hero-v2-blob chef-hero-v2-blob-2" />
            <div className="chef-hero-v2-grid" />
          </div>

          <div className="chef-hero-v2-content">
            <div className="chef-hero-v2-text">
              <motion.div
                className="chef-hero-v2-badge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="chef-hero-v2-badge-dot" />
                <span>AI Assistant · Powered by Llama 3.3</span>
              </motion.div>

              <motion.h1
                className="chef-hero-v2-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Bingung Masak Apa?<br />
                <span className="chef-hero-v2-title-gradient">Tanya Nura Aja.</span>
              </motion.h1>

              <motion.p
                className="chef-hero-v2-desc"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Asisten AI pintar yang siap kasih rekomendasi resep, cek stok produk,
                dan bantu kamu masak frozen food jadi hidangan kekinian.
              </motion.p>

              <motion.div
                className="chef-hero-v2-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <button type="button" onClick={startChefChat} className="chef-cta-primary">
                  <MessageCircle size={18} />
                  <span>Mulai Ngobrol</span>
                  <ArrowRight size={18} />
                </button>
                <Link href="/#produk" className="chef-cta-secondary">
                  <Package size={18} />
                  <span>Lihat Produk</span>
                </Link>
              </motion.div>

              <motion.div
                className="chef-hero-v2-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {STATS.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="chef-hero-v2-stat">
                      <Icon size={16} className="chef-hero-v2-stat-icon" />
                      <div>
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            <motion.div
              className="chef-hero-v2-visual"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            >
              <div className="chef-hero-v2-orb">
                <div className="chef-hero-v2-orb-ring" />
                <div className="chef-hero-v2-orb-ring chef-hero-v2-orb-ring-2" />
                <div className="chef-hero-v2-orb-core">
                  <div className="chef-hero-v2-orb-icon">
                    <HatIcon size={48} strokeWidth={1.5} />
                  </div>
                </div>
                <motion.div
                  className="chef-hero-v2-orb-float chef-hero-v2-orb-float-1"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles size={20} />
                </motion.div>
                <motion.div
                  className="chef-hero-v2-orb-float chef-hero-v2-orb-float-2"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <RecipeIcon size={18} />
                </motion.div>
                <motion.div
                  className="chef-hero-v2-orb-float chef-hero-v2-orb-float-3"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <Heart size={16} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ── Feature Highlights ── */}
        <section className="chef-features">
          <div className="chef-section-head-v2">
            <div>
              <span className="chef-eyebrow">Kemampuan Nura</span>
              <h2 className="chef-section-title-v2">Apa saja yang bisa Nura bantu?</h2>
            </div>
          </div>
          <div className="chef-features-grid">
            {FEATURE_HIGHLIGHTS.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  className="chef-feature-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className={`chef-feature-icon ${feature.gradient}`}>
                    <Icon size={22} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <div className="chef-layout">
          <div className="chef-content">
            {/* ── Products Section ── */}
            <section>
              <div className="chef-section-head-v2">
                <div>
                  <span className="chef-eyebrow">Frozen Food</span>
                  <h2 className="chef-section-title-v2">Bahan Frozen Terlaris</h2>
                  <p className="chef-section-subtitle-v2">
                    Pilih bahan frozen favorit, langsung tanya resep ke Nura
                  </p>
                </div>
                <Link href="/#produk" className="chef-section-link">
                  Lihat Semua
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="chef-product-grid">
                {loadingProducts &&
                  Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}

                {!loadingProducts && products.length === 0 && (
                  <div className="chef-empty">
                    <Package size={32} />
                    <p>Belum ada produk frozen.</p>
                  </div>
                )}

                {!loadingProducts &&
                  products.map((p, idx) => {
                    const displayName = formatProductName(p.name);
                    const desc = getProductDesc(p);
                    const imgSrc = getProductImage(p);

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.06 }}
                        className="product-card"
                      >
                        <span className="card-badge badge-frozen">Frozen</span>
                        <div className="chef-card-img-wrap">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={displayName}
                              fill
                              unoptimized={typeof imgSrc === 'string' && imgSrc.startsWith('/')}
                              sizes="(max-width: 768px) 50vw, 280px"
                              className="card-img"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="chef-card-img-placeholder">
                              <Package size={32} />
                            </div>
                          )}
                        </div>

                        <div className="card-body">
                          <div className="card-title-wrap">
                            <h3>{displayName}</h3>
                          </div>
                          <div className="card-meta-row">
                            <span className="sold-label">Frozen Food</span>
                            <div style={{ display: 'flex', color: '#FACC15' }}>
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} fill="currentColor" />
                              ))}
                            </div>
                          </div>
                          <p className="desc">{desc}</p>
                        </div>

                        <div className="card-footer">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="price">Rp {p.price.toLocaleString('id-ID')}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className="btn-icon-card"
                              onClick={() => askRecipe(p.name)}
                              title="Tanya Resep"
                              aria-label={`Tanya resep ${displayName}`}
                            >
                              <Sparkles size={15} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-card btn-icon-card-primary"
                              onClick={() => addToCart(p)}
                              title="Tambah ke Keranjang"
                              aria-label={`Tambah ${displayName}`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </section>
          </div>

          {/* ── Sticky Chat Sidebar ── */}
          <aside id="chef-chat" className="chef-sidebar">
            <div className="chef-sidebar-inner">
              <ChefChatArea
                initialMessage={initialChefMessage}
                allProducts={allProducts}
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
    <Suspense fallback={<div className="chef-loading-page">Memuat...</div>}>
      <ChefContent />
    </Suspense>
  );
}

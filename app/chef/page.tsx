"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ShoppingCart, Sparkles, ArrowRight, Star, Package, Plus } from 'lucide-react';
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

function ChefContent() {
  const searchParams = useSearchParams();
  const recipeParam = searchParams.get('recipe');

  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [initialChefMessage, setInitialChefMessage] = useState<string | undefined>(undefined);

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
    // Fetch top 4 frozen for display
    const { data: frozenData } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'frozen')
      .limit(4);
    setProducts(frozenData || []);

    // Fetch ALL products for AI context
    const { data: allData } = await supabase
      .from('products')
      .select('*');
    setAllProducts(allData || []);
    
    setLoadingProducts(false);
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
        <div className="section-header" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChefHat size={28} color="var(--primary)" />
            Chef Virtual
          </h2>
          <p style={{ margin: '0.5rem 0 0', maxWidth: '100%' }}>
            Asisten AI untuk resep masakan dan tips olahan frozen food Toko Hijrah.
          </p>
          <div className="underline" style={{ margin: '1rem 0 0' }} />
        </div>

        <div className="chef-layout">
          <div className="chef-content">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="chef-hero"
            >
              <div className="chef-hero-glow" aria-hidden />
              <div>
                <span className="chef-badge">✨ Fitur AI Terbaru</span>
                <h1 className="chef-hero-title">Bingung Mau Masak Apa Hari Ini?</h1>
                <p className="chef-hero-desc">
                  Tanya langsung ke <strong>Chef Virtual Hijrah</strong> untuk rekomendasi resep
                  praktis, ide olahan frozen food, dan tips dapur.
                </p>
                <div className="chef-hero-actions">
                  <button type="button" onClick={startChefChat} className="btn-primary">
                    Mulai Tanya Chef
                    <ArrowRight size={18} />
                  </button>
                  <Link href="/#produk" className="btn-secondary">
                    Lihat Bahan Frozen
                    <ArrowRight size={18} />
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
                    const desc = getProductDesc(p);
                    const imgSrc = getProductImage(p);

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
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

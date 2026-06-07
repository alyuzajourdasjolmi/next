"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  ShoppingCart,
  X,
  CheckCircle2,
  Plus,
  Minus,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  Tag,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/cart-context';
import ProductCard from '../../components/ProductCard';
import SiteNavbar from '../../components/SiteNavbar';
import { STORE_NAME } from '../../lib/store-constants';
import { fetchRealSoldCounts, mergeSoldCount } from '../../lib/product-stats';

const ITEMS_PER_PAGE = 12;

const CATEGORIES = [
  { id: 'all', label: 'Semua Produk', icon: Package },
  { id: 'frozen', label: 'Frozen Food', icon: Sparkles },
  { id: 'atk', label: 'Alat Tulis', icon: Tag },
  { id: 'other', label: 'Lainnya', icon: Package },
];

export default function ProductsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [{ data, error }, realSold] = await Promise.all([
          supabase.from('products').select('*').order('id', { ascending: true }),
          fetchRealSoldCounts(),
        ]);
        if (error) throw error;
        const enriched = (data || []).map((p: any) => ({
          ...p,
          sold_count: mergeSoldCount(p, realSold),
        }));
        setProducts(enriched);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => activeTab === 'all' || p.category === activeTab)
      .filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.desc?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'best') return (b.sold_count || 0) - (a.sold_count || 0);
        return b.id - a.id;
      });
  }, [products, activeTab, searchTerm, sortBy]);

  const paginatedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const openDetail = (product: any) => {
    setSelectedProduct(product);
    setQty(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    for (let i = 0; i < qty; i++) {
      addToCart(selectedProduct);
    }
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      <SiteNavbar />

      <main style={{ paddingTop: '6rem' }}>
        <div className="section-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          {/* ── HEADER ── */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
              <Package size={14} /> Katalog Lengkap
            </div>
            <h1 className="section-title" style={{ margin: '0 0 0.35rem', textAlign: 'left', fontSize: '1.75rem' }}>
              Produk {STORE_NAME}
            </h1>
            <p className="section-subtitle" style={{ textAlign: 'left', margin: '0 0 1rem' }}>
              Temukan Frozen Food & ATK berkualitas untuk kebutuhan sehari-hari
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.3rem 0.75rem', borderRadius: 10,
                    background: 'var(--bg-surface-soft)', border: '1px solid var(--border-main)',
                    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
                  }}>
                    <Icon size={14} />
                    <span>{cat.label}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{categoryCounts[cat.id] || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── FILTER & SEARCH ── */}
          <div className="product-filter-bar">
            <div className="filter-tabs-group">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveTab(cat.id); setVisibleCount(ITEMS_PER_PAGE); }}
                    className={`product-filter-tab ${activeTab === cat.id ? 'active' : ''}`}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
              <div className="product-search-mini" style={{ maxWidth: 240 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} className="search-clear">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="product-search-mini" style={{ minWidth: 150, maxWidth: 180 }}>
                <SlidersHorizontal size={14} style={{ color: '#94a3b8' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    flex: 1, appearance: 'none', background: 'transparent', border: 'none',
                    outline: 'none', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)',
                    cursor: 'pointer', fontFamily: 'inherit', minWidth: 0, paddingRight: 4,
                  }}
                >
                  <option value="newest">Terbaru</option>
                  <option value="best">Terlaris</option>
                  <option value="price-low">Harga Terendah</option>
                  <option value="price-high">Harga Tertinggi</option>
                  <option value="name">Nama A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── RESULTS INFO ── */}
          {!loading && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>{filteredProducts.length} produk ditemukan</span>
              {activeTab !== 'all' && (
                <button
                  onClick={() => setActiveTab('all')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'inherit' }}
                >
                  <X size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Hapus filter
                </button>
              )}
            </div>
          )}

          {/* ── PRODUCT GRID ── */}
          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card-skeleton" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: '5rem 1.5rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--bg-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Search size={36} strokeWidth={1.2} color="var(--text-muted)" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)', fontSize: '1.15rem' }}>Produk Tidak Ditemukan</h3>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
                Coba gunakan kata kunci lain atau atur ulang filter
              </p>
              <button
                onClick={() => { setSearchTerm(''); setActiveTab('all'); setSortBy('newest'); }}
                style={{
                  padding: '0.7rem 1.5rem', borderRadius: 12, background: 'var(--primary)',
                  color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.9rem',
                }}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenDetail={openDetail}
                  />
                ))}
              </div>

              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <button
                    onClick={() => setVisibleCount((p) => p + ITEMS_PER_PAGE)}
                    style={{
                      padding: '0.8rem 2rem', borderRadius: 14, background: 'var(--bg-surface-soft)',
                      border: '1px solid var(--border-main)', color: 'var(--text-main)',
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                  >
                    Tampilkan Lebih Banyak
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── PRODUCT DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(10px)',
              zIndex: 2000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="product-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedProduct(null)}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>

              <div className="modal-img-wrap">
                {selectedProduct.img ? (
                  <Image
                    src={selectedProduct.img}
                    alt={selectedProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="product-img-placeholder" style={{ height: '100%' }}>
                    <Package size={48} strokeWidth={1.4} />
                  </div>
                )}
                {(selectedProduct.sold_count || 0) >= 20 && (
                  <div style={{
                    position: 'absolute', top: '1rem', left: '1rem',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', padding: '0.3rem 0.75rem', borderRadius: 999,
                    fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem',
                    boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Best Seller
                  </div>
                )}
              </div>

              <div className="modal-body">
                <span className="product-category-pill">
                  {selectedProduct.category === 'frozen' ? '🧊 Frozen Food' : selectedProduct.category === 'atk' ? '📝 ATK' : '📦 Lainnya'}
                </span>
                <h2>{selectedProduct.name}</h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <p className="modal-price" style={{ margin: 0 }}>Rp {selectedProduct.price.toLocaleString('id-ID')}</p>
                  {selectedProduct.sold_count > 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
                      {selectedProduct.sold_count}+ terjual
                    </span>
                  )}
                </div>

                <p className="modal-desc">{selectedProduct.desc || 'Produk pilihan dari Hijrah Toko — kualitas terbaik dengan harga bersahabat.'}</p>

                {/* Stock info */}
                <div className="modal-stock">
                  {(selectedProduct.stock || 0) > 0 ? (
                    <span className="stock-available">
                      <CheckCircle2 size={14} /> Stok tersedia: {selectedProduct.stock}
                    </span>
                  ) : (
                    <span className="stock-out">
                      <X size={14} /> Stok habis
                    </span>
                  )}
                </div>

                {/* Quantity selector */}
                {(selectedProduct.stock || 0) > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                      Jumlah
                    </label>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, border: '1px solid var(--border-main)', borderRadius: 12, overflow: 'hidden' }}>
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        disabled={qty <= 1}
                        style={{
                          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: 'none', background: 'var(--bg-surface-soft)', cursor: 'pointer',
                          color: qty <= 1 ? '#cbd5e1' : 'var(--text-main)', transition: 'all 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={selectedProduct.stock}
                        value={qty}
                        onChange={(e) => setQty(Math.min(selectedProduct.stock, Math.max(1, Number(e.target.value) || 1)))}
                        style={{
                          width: 60, height: 40, textAlign: 'center', border: 'none', borderLeft: '1px solid var(--border-main)',
                          borderRight: '1px solid var(--border-main)', fontWeight: 700, fontSize: '0.95rem',
                          background: '#fff', outline: 'none', fontFamily: 'inherit',
                          color: 'var(--text-main)',
                        }}
                      />
                      <button
                        onClick={() => setQty(Math.min(selectedProduct.stock, qty + 1))}
                        disabled={qty >= selectedProduct.stock}
                        style={{
                          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: 'none', background: 'var(--bg-surface-soft)', cursor: 'pointer',
                          color: qty >= selectedProduct.stock ? '#cbd5e1' : 'var(--text-main)', transition: 'all 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  className="modal-add-btn"
                  disabled={(selectedProduct.stock || 0) <= 0}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart size={18} />
                  {(selectedProduct.stock || 0) > 0
                    ? `Tambah ke Keranjang • Rp ${(selectedProduct.price * qty).toLocaleString('id-ID')}`
                    : 'Stok Habis'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-main)', padding: '2rem 0', marginTop: '4rem', textAlign: 'center' }}>
        <div className="section-container">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
            &copy; {new Date().getFullYear()} {STORE_NAME}. Semua hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

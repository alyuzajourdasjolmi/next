"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  Filter,
  Package,
  ShoppingCart,
  ArrowLeft,
  X,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/cart-context';
import ProductCard from '../../components/ProductCard';
import SiteNavbar from '../../components/SiteNavbar';

export default function ProductsPage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products
    .filter((p) => activeTab === 'all' || p.category === activeTab)
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.desc?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.id - a.id; // newest
    });

  const categories = [
    { id: 'all', label: 'Semua Produk' },
    { id: 'frozen', label: 'Frozen Food' },
    { id: 'atk', label: 'Alat Tulis' },
    { id: 'other', label: 'Lainnya' },
  ];

  return (
    <div className="min-h-screen">
      <SiteNavbar />
      
      <main className="section" style={{ paddingTop: '8rem' }}>
        <div className="section-container">
          {/* Header */}
          <div className="section-header" style={{ textAlign: 'left', marginBottom: '3rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'flex-start' }}>
              <Package size={14} /> Katalog Lengkap
            </div>
            <h1 className="section-title" style={{ margin: '0.5rem 0' }}>Produk Kami</h1>
            <p className="section-subtitle" style={{ margin: '0' }}>
              Temukan berbagai pilihan Frozen Food berkualitas dan Alat Tulis Kantor terlengkap.
            </p>
          </div>

          {/* Filters & Search Bar */}
          <div className="product-filter-bar">
            <div className="filter-row">
              <div className="filter-tabs">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`product-filter-tab ${activeTab === cat.id ? 'active' : ''}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-actions-row">
              <div className="product-search-mini search-expand">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Cari produk dari semua kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="sort-group">
                <span className="sort-label">Urutkan:</span>
                <div className="product-search-mini sort-select-box">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Terbaru</option>
                    <option value="price-low">Harga Terendah</option>
                    <option value="price-high">Harga Tertinggi</option>
                    <option value="name">Nama A-Z</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card-skeleton" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: '5rem 0' }}>
              <Package size={64} strokeWidth={1} color="var(--border-main)" />
              <p style={{ marginTop: '1rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                Produk tidak ditemukan. Coba kata kunci lain.
              </p>
              <button 
                onClick={() => {setSearchTerm(''); setActiveTab('all');}}
                className="btn-hero-primary"
                style={{ marginTop: '1.5rem', padding: '12px 24px' }}
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onOpenDetail={setSelectedProduct} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
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
                  <div className="product-img-placeholder">
                    <Package size={48} strokeWidth={1.4} />
                  </div>
                )}
              </div>
              <div className="modal-body">
                <span className="product-category-pill">
                  {selectedProduct.category === 'frozen' ? '🧊 Frozen Food' : selectedProduct.category === 'atk' ? '📝 ATK' : '📦 Lainnya'}
                </span>
                <h2>{selectedProduct.name}</h2>
                <p className="modal-price">Rp {selectedProduct.price.toLocaleString('id-ID')}</p>
                <p className="modal-desc">{selectedProduct.desc}</p>
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
                <button
                  className="modal-add-btn"
                  disabled={(selectedProduct.stock || 0) <= 0}
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <ShoppingCart size={18} />
                  Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Hijrah Toko. Semua hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

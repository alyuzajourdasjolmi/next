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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <SiteNavbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl tracking-tight">
            Katalog Produk
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Temukan semua kebutuhan Frozen Food dan ATK Anda di sini.
          </p>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === cat.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-4 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium dark:text-white cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="price-low">Harga Terendah</option>
                <option value="price-high">Harga Tertinggi</option>
                <option value="name">Nama A-Z</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-[350px] animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <Package size={64} className="text-slate-300 mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Produk tidak ditemukan</h3>
            <p className="text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            <button 
              onClick={() => {setSearchTerm(''); setActiveTab('all');}}
              className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductCard product={product} onOpenDetail={setSelectedProduct} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
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

"use client";

import React, { useState } from 'react';
import {
  AlertCircle,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useDashboard } from '../../../lib/dashboard-context';
import { useFeedback } from '../../../lib/feedback-context';
import { ButtonSpinner } from '../../../components/Loading';

export default function ProductsPage() {
  const { products, fetchData } = useDashboard();
  const { success, error, showConfirm } = useFeedback();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    desc: '',
    price: 0,
    category: 'frozen',
    img: '',
    stock: 0,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      setUploadProgress(70);
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      setProductForm((prev) => ({ ...prev, img: publicUrl }));
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      error('Gagal Mengunggah Gambar', err.message || 'Terjadi kesalahan saat mengunggah gambar.');
      setIsUploading(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProductId) {
        const { error: supaError } = await supabase
          .from('products')
          .update(productForm)
          .eq('id', editingProductId);
        if (supaError) throw supaError;
        success('Produk Diperbarui', `${productForm.name} berhasil disimpan`);
      } else {
        const { error: supaError } = await supabase.from('products').insert(productForm);
        if (supaError) throw supaError;
        success('Produk Ditambahkan', `${productForm.name} berhasil ditambahkan ke katalog`);
      }
      setProductForm({ name: '', desc: '', price: 0, category: 'frozen', img: '', stock: 0 });
      setEditingProductId(null);
      setShowProductForm(false);
      fetchData();
    } catch (err: any) {
      error('Gagal Menyimpan Produk', err.message || "Pastikan kolom 'stock' sudah ada di database");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = (id: number, name: string) => {
    showConfirm({
      title: 'Hapus Produk?',
      description: `Produk "${name}" akan dihapus permanen dan tidak dapat dikembalikan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error: supaError } = await supabase.from('products').delete().eq('id', id);
          if (supaError) throw supaError;
          success('Produk Dihapus', `${name} telah dihapus dari katalog`);
          fetchData();
        } catch (err: any) {
          error('Gagal Menghapus Produk', err.message || 'Terjadi kesalahan saat menghapus produk.');
        }
      },
    });
  };

  const openAddForm = () => {
    setEditingProductId(null);
    setShowProductForm(true);
    setProductForm({ name: '', desc: '', price: 0, category: 'frozen', img: '', stock: 0 });
  };

  const openEditForm = (product: any) => {
    setEditingProductId(product.id);
    setProductForm({ ...product });
    setShowProductForm(true);
  };

  const filteredProducts = products.filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !categoryFilter || categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <section className="admin-products-page">
      {/* Stats */}
      <div className="prods-stats">
        <div className="prods-stat fb-stagger">
          <Package size={18} />
          <div>
            <strong>{products.length}</strong>
            <span>Total Produk</span>
          </div>
        </div>
        <div className="prods-stat warn fb-stagger">
          <AlertCircle size={18} />
          <div>
            <strong>{products.filter((p: any) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length}</strong>
            <span>Stok Menipis</span>
          </div>
        </div>
        <div className="prods-stat danger fb-stagger">
          <X size={18} />
          <div>
            <strong>{products.filter((p: any) => (p.stock || 0) <= 0).length}</strong>
            <span>Habis</span>
          </div>
        </div>
        <div className="prods-stat accent fb-stagger">
          <TrendingUp size={18} />
          <div>
            <strong>
              Rp {products
                .reduce((s: number, p: any) => s + p.price * (p.stock || 0), 0)
                .toLocaleString('id-ID')}
            </strong>
            <span>Nilai Stok</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="prods-toolbar">
        <div className="prods-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="prods-cats">
          {['all', 'frozen', 'atk', 'other'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`prods-cat ${(categoryFilter || 'all') === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? 'Semua' : cat === 'frozen' ? 'Frozen' : cat === 'atk' ? 'ATK' : 'Lainnya'}
            </button>
          ))}
        </div>
        <button type="button" className="prods-add-btn fb-pressable" onClick={openAddForm}>
          <Plus size={15} /> Tambah Produk
        </button>
      </div>

      {/* Product form modal */}
      {showProductForm && (
        <div className="prods-modal-overlay" onClick={() => setShowProductForm(false)}>
          <div className="prods-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prods-modal-header">
              <h3>{editingProductId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button type="button" onClick={() => setShowProductForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveProduct} className="prods-form">
              <div className="prods-form-grid">
                <label>
                  Nama Produk
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    placeholder="Nama produk"
                  />
                </label>
                <label>
                  Kategori
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="frozen">Frozen Food</option>
                    <option value="atk">ATK</option>
                    <option value="other">Lainnya</option>
                  </select>
                </label>
                <label>
                  Harga (Rp)
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    required
                    placeholder="0"
                  />
                </label>
                <label>
                  Stok
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                    required
                    placeholder="0"
                  />
                </label>
              </div>
              <label>
                URL Gambar
                <input
                  type="text"
                  value={productForm.img}
                  onChange={(e) => setProductForm((p) => ({ ...p, img: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </label>
              <label className="prods-upload">
                <Upload size={14} /> Upload dari file
                <input type="file" onChange={handleFileUpload} accept="image/*" hidden />
              </label>
              {isUploading && (
                <div className="prods-upload-bar">
                  <span style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <label>
                Deskripsi
                <textarea
                  rows={3}
                  value={productForm.desc}
                  onChange={(e) => setProductForm((p) => ({ ...p, desc: e.target.value }))}
                  required
                  placeholder="Deskripsi produk"
                />
              </label>
              <div className="prods-form-actions">
                <button
                  type="button"
                  className="prods-btn-cancel fb-pressable"
                  onClick={() => setShowProductForm(false)}
                >
                  Batal
                </button>
                <button type="submit" className="prods-btn-save fb-pressable" disabled={saving}>
                  {saving ? <ButtonSpinner /> : null}
                  {editingProductId ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product table */}
      <div className="prods-table-wrap">
        <table className="prods-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="prods-empty">
                  Tidak ada produk ditemukan
                </td>
              </tr>
            ) : (
              filteredProducts.map((product: any, i: number) => (
                <tr key={product.id} className="fb-row" style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}>
                  <td>
                    <div className="prods-cell-name">
                      <div className="prods-cell-img">
                        {product.img ? (
                          <img src={product.img} alt="" />
                        ) : (
                          <Package size={16} />
                        )}
                      </div>
                      <div>
                        <strong>{product.name}</strong>
                        <small>
                          {product.desc?.substring(0, 40)}
                          {product.desc?.length > 40 ? '...' : ''}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`prods-badge badge-${product.category}`}>
                      {product.category === 'frozen'
                        ? 'Frozen'
                        : product.category === 'atk'
                        ? 'ATK'
                        : 'Lainnya'}
                    </span>
                  </td>
                  <td className="prods-price">
                    Rp {product.price.toLocaleString('id-ID')}
                  </td>
                  <td>
                    <div className="prods-stock-cell">
                      <span
                        className={`prods-stock-val ${
                          (product.stock || 0) <= 0
                            ? 'out'
                            : (product.stock || 0) <= 5
                            ? 'low'
                            : ''
                        }`}
                      >
                        {product.stock || 0}
                      </span>
                      <div className="prods-stock-bar">
                        <span
                          className="prods-stock-fill"
                          style={{
                            width: `${Math.min(100, ((product.stock || 0) / 50) * 100)}%`,
                            background:
                              (product.stock || 0) <= 0
                                ? '#ef4444'
                                : (product.stock || 0) <= 5
                                ? '#f59e0b'
                                : '#22c55e',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="prods-actions">
                      <button
                        type="button"
                        className="prods-action edit fb-pressable"
                        title="Edit"
                        onClick={() => openEditForm(product)}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="prods-action delete fb-pressable"
                        title="Hapus"
                        onClick={() => deleteProduct(product.id, product.name)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

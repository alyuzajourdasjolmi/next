"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import '../style.css'; // Reuse existing styles

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    desc: '',
    price: 0,
    category: 'frozen',
    img: ''
  });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Check current session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      
      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Login gagal: ' + error.message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Gagal memperbarui status pesanan.');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Gagal menghapus produk.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setProductForm({ ...productForm, img: publicUrl });
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Gagal mengunggah gambar: ' + error.message);
      setIsUploading(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        const { error } = await supabase
          .from('products')
          .update(productForm)
          .eq('id', editingProductId);
        if (error) throw error;
        alert('Produk berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productForm);
        if (error) throw error;
        alert('Produk berhasil ditambahkan!');
      }
      setProductForm({ name: '', desc: '', price: 0, category: 'frozen', img: '' });
      setEditingProductId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Gagal menyimpan produk.');
    }
  };

  if (!user) {
    return (
      <div className="admin-login-wrapper">
        <div className="login-glass-card">
          <div className="login-header">
            <div className="login-logo-circle">
              <img src="/assets/images/logo-hijrah-toko.png" alt="Hijrah Toko" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h2>Admin Portal</h2>
            <p>Silakan login untuk mengelola toko Anda</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="modern-form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  className="modern-input"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="admin@hijrahtoko.com"
                  required 
                />
              </div>
            </div>

            <div className="modern-form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  className="modern-input"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={isLoginLoading}>
              {isLoginLoading ? (
                <>
                  <svg className="animate-spin" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>© {new Date().getFullYear()} Hijrah Toko Admin • Secure Access</p>
          </div>
        </div>
        
        {/* Animated Background Decoration */}
        <style jsx>{`
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .opacity-25 { opacity: 0.25; }
          .opacity-75 { opacity: 0.75; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Dashboard Admin Hijrah Toko</h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Logged in as: {user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>🏠 Kembali ke Toko</a>
          <button className="btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="filter-tabs" style={{ marginBottom: '2rem' }}>
        <button className={`filter-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📋 Pesanan</button>
        <button className={`filter-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>📦 Produk</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center' }}>Memuat data...</div>
      ) : (
        <>
          {activeTab === 'orders' && (
            <div className="orders-section">
              <div className="section-header">
                <h2>Kelola Pesanan</h2>
                <p>Konfirmasi dan pantau status pesanan pelanggan</p>
              </div>
              <div className="orders-list">
                {orders.length === 0 ? (
                  <p>Belum ada pesanan.</p>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="checkout-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>{order.customer_name}</h3>
                          <p style={{ margin: 0, color: 'var(--gray)', fontSize: '0.9rem' }}>{order.customer_phone} | {new Date(order.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`card-badge`} style={{ background: order.status === 'confirmed' ? '#22c55e' : '#eab308', color: 'white', display: 'inline-block' }}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="order-details">
                        <p><strong>Metode:</strong> {order.delivery_method === 'pickup' ? 'Ambil di Kedai' : 'Diantarkan'}</p>
                        <p><strong>Alamat:</strong> {order.customer_address || '-'}</p>
                        <p><strong>Pembayaran:</strong> {order.payment_method}</p>
                        
                        <div style={{ marginTop: '1rem' }}>
                          <strong>Item:</strong>
                          <ul style={{ paddingLeft: '1.5rem' }}>
                            {order.order_items?.map((item: any) => (
                              <li key={item.id}>{item.product_name} x {item.qty} (Rp {item.price.toLocaleString('id-ID')})</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Total: Rp {order.grand_total.toLocaleString('id-ID')}</strong>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {order.status === 'pending' && (
                              <button className="btn-primary btn-small" onClick={() => updateOrderStatus(order.id, 'confirmed')}>Konfirmasi</button>
                            )}
                            {order.status !== 'cancelled' && (
                              <button className="btn-secondary btn-small" onClick={() => updateOrderStatus(order.id, 'cancelled')}>Batalkan</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="products-section">
              <div className="section-header">
                <h2>Kelola Produk</h2>
                <p>Tambah, edit, atau hapus produk dari katalog</p>
              </div>

              <div className="checkout-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h3>{editingProductId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                <form onSubmit={saveProduct} className="order-form">
                  <div className="form-group">
                    <label>Nama Produk</label>
                    <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea value={productForm.desc} onChange={e => setProductForm({...productForm, desc: e.target.value})} rows={2} required />
                  </div>
                  <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Harga (Rp)</label>
                      <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: parseInt(e.target.value)})} required />
                    </div>
                    <div className="form-group">
                      <label>Kategori</label>
                      <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}>
                        <option value="frozen">Frozen Food</option>
                        <option value="atk">ATK</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Gambar Produk</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input 
                        type="text" 
                        value={productForm.img} 
                        onChange={e => setProductForm({...productForm, img: e.target.value})} 
                        placeholder="URL Gambar atau unggah file..." 
                        style={{ flex: 1 }}
                      />
                      <label className="btn-secondary btn-small" style={{ cursor: 'pointer', margin: 0 }}>
                        📁 Unggah File
                        <input type="file" onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
                      </label>
                    </div>
                    {isUploading && (
                      <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--mint)', transition: 'width 0.3s ease' }}></div>
                      </div>
                    )}
                    {productForm.img && (
                      <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>Pratinjau:</p>
                        <img src={productForm.img} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="btn-primary" type="submit" style={{ flex: 1, justifyContent: 'center' }}>
                      {editingProductId ? 'Perbarui Produk' : 'Tambah Produk'}
                    </button>
                    {editingProductId && (
                      <button className="btn-secondary" type="button" onClick={() => { setEditingProductId(null); setProductForm({ name: '', desc: '', price: 0, category: 'frozen', img: '' }); }}>Batal</button>
                    )}
                  </div>
                </form>
              </div>

              <div className="products-list">
                <h3>Daftar Produk ({products.length})</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '1rem' }}>Produk</th>
                        <th style={{ padding: '1rem' }}>Kategori</th>
                        <th style={{ padding: '1rem' }}>Harga</th>
                        <th style={{ padding: '1rem' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <img src={p.img} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                              <strong>{p.name}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>{p.category}</td>
                          <td style={{ padding: '1rem' }}>Rp {p.price.toLocaleString('id-ID')}</td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn-secondary btn-small" onClick={() => {
                                setEditingProductId(p.id);
                                setProductForm({ name: p.name, desc: p.desc, price: p.price, category: p.category, img: p.img });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}>Edit</button>
                              <button className="btn-secondary btn-small" style={{ color: '#ef4444' }} onClick={() => deleteProduct(p.id)}>Hapus</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

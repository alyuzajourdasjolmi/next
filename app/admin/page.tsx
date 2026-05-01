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
      // Optimistic update for UI feel
      const originalOrders = [...orders];
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) {
        // Rollback on error
        setOrders(originalOrders);
        throw error;
      }
      
      console.log('Status updated successfully:', orderId, status);
    } catch (error: any) {
      console.error('Error updating order:', error);
      alert('Gagal memperbarui status pesanan: ' + (error.message || 'Error tidak diketahui'));
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

  const totalRevenue = orders
    .filter(o => o.status === 'completed' || o.status === 'confirmed')
    .reduce((sum, o) => sum + o.grand_total, 0);
  
  // Calculate Monthly Revenue & Progress
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyRevenue = orders
    .filter(o => {
      const d = new Date(o.created_at);
      return (o.status === 'completed' || o.status === 'confirmed') && 
             d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear;
    })
    .reduce((sum, o) => sum + o.grand_total, 0);

  const getRevenueByMonth = () => {
    const last6Months: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('id-ID', { month: 'short' });
      last6Months.push({ key, name, total: 0 });
    }

    orders.forEach(o => {
      if (o.status !== 'completed' && o.status !== 'confirmed') return;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthObj = last6Months.find(m => m.key === key);
      if (monthObj) monthObj.total += o.grand_total;
    });

    return last6Months;
  };

  const revenueHistory = getRevenueByMonth();
  const maxRevenue = Math.max(...revenueHistory.map(m => m.total), 1);
  
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalProducts = products.length;

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
    <div className="admin-layout">
      {/* Sidebar Nav */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/assets/images/logo-hijrah-toko.png" alt="Logo" />
          <span>Hijrah Admin</span>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`} 
            onClick={() => setActiveTab('orders')}
          >
            <span>📋</span> <span>Pesanan</span>
          </div>
          <div 
            className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`} 
            onClick={() => setActiveTab('products')}
          >
            <span>📦</span> <span>Produk</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <a href="/" className="sidebar-link">
            <span>🏠</span> <span>Ke Toko</span>
          </a>
          <div className="sidebar-link" onClick={handleLogout} style={{ color: '#EF4444' }}>
            <span>🚪</span> <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Welcome back, <strong>{user.email}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={fetchData} disabled={loading}>
              {loading ? 'Refreshing...' : '🔄 Refresh Data'}
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="icon-box" style={{ background: '#DCFCE7', color: '#166534' }}>💰</div>
            <h3>Total Revenue</h3>
            <div className="value">Rp {totalRevenue.toLocaleString('id-ID')}</div>
          </div>
          <div className="stat-card">
            <div className="icon-box" style={{ background: '#FEF3C7', color: '#92400E' }}>⏳</div>
            <h3>Pending Orders</h3>
            <div className="value">{pendingOrders}</div>
          </div>
          <div className="stat-card">
            <div className="icon-box" style={{ background: '#DBEAFE', color: '#1E40AF' }}>📦</div>
            <h3>Total Products</h3>
            <div className="value">{totalProducts}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--mint)' }}>
            <div className="icon-box" style={{ background: '#FEE2E2', color: '#B91C1C' }}>📊</div>
            <h3>Revenue (Bulan Ini)</h3>
            <div className="value">Rp {monthlyRevenue.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Revenue Progress Chart */}
        <div className="admin-content-card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h2>Progress Pendapatan (6 Bulan Terakhir)</h2>
            <div className="badge-pill">Trend Bisnis</div>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {revenueHistory.map((data, idx) => (
                <div key={idx} className="bar-wrapper">
                  <div className="bar-value">Rp {(data.total / 1000).toFixed(0)}k</div>
                  <div 
                    className="bar" 
                    style={{ height: `${(data.total / maxRevenue) * 150}px` }}
                    title={`Rp ${data.total.toLocaleString('id-ID')}`}
                  >
                    <div className="bar-tooltip">Rp {data.total.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="bar-label">{data.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>
            <div className="animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}>⌛</div>
            Memuat data...
          </div>
        ) : (
          <>
            {activeTab === 'orders' && (
              <div className="admin-content-card">
                <div className="card-header">
                  <h2>Kelola Pesanan</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Details</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Belum ada pesanan.</td></tr>
                      ) : (
                        orders.map(order => (
                          <tr key={order.id}>
                            <td>
                              <div className="product-item-info">
                                <h4>{order.customer_name}</h4>
                                <p>{order.customer_phone}</p>
                                <p style={{ fontSize: '0.75rem' }}>{new Date(order.created_at).toLocaleString('id-ID')}</p>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem' }}>
                                <p><strong>Metode:</strong> {order.delivery_method === 'pickup' ? 'Ambil' : 'Antar'}</p>
                                <p><strong>Item:</strong> {order.order_items?.length} jenis produk</p>
                              </div>
                            </td>
                            <td>
                              <select 
                                className={`status-pill status-${order.status}`}
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                style={{ border: 'none', cursor: 'pointer', fontWeight: '700' }}
                              >
                                <option value="pending">PENDING</option>
                                <option value="confirmed">CONFIRMED</option>
                                <option value="processing">PROSES</option>
                                <option value="shipped">DIKIRIM</option>
                                <option value="completed">SELESAI</option>
                                <option value="cancelled">BATAL</option>
                              </select>
                            </td>
                            <td><strong>Rp {order.grand_total.toLocaleString('id-ID')}</strong></td>
                            <td>
                              <div className="action-btn-group">
                                {order.status === 'pending' && (
                                  <button className="icon-btn" title="Konfirmasi" onClick={() => updateOrderStatus(order.id, 'confirmed')}>✅</button>
                                )}
                                {order.status !== 'cancelled' && (
                                  <button className="icon-btn delete" title="Batalkan" onClick={() => updateOrderStatus(order.id, 'cancelled')}>❌</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="products-view">
                {/* Form Card */}
                <div className="admin-content-card" style={{ marginBottom: '2.5rem' }}>
                  <div className="card-header">
                    <h2>{editingProductId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                  </div>
                  <div style={{ padding: '2rem' }}>
                    <form onSubmit={saveProduct} className="order-form">
                      <div className="form-group">
                        <label>Nama Produk</label>
                        <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="Contoh: Bakso Sapi Super" required />
                      </div>
                      <div className="form-group">
                        <label>Deskripsi</label>
                        <textarea value={productForm.desc} onChange={e => setProductForm({...productForm, desc: e.target.value})} rows={2} placeholder="Detail produk..." required />
                      </div>
                      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                          <label>Harga (Rp)</label>
                          <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: parseInt(e.target.value)})} required />
                        </div>
                        <div className="form-group">
                          <label>Kategori</label>
                          <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="modern-input">
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
                            className="modern-input"
                            value={productForm.img} 
                            onChange={e => setProductForm({...productForm, img: e.target.value})} 
                            placeholder="URL Gambar atau unggah..." 
                            style={{ flex: 1 }}
                          />
                          <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                            📁 Upload
                            <input type="file" onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
                          </label>
                        </div>
                        {isUploading && (
                          <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--mint)', transition: 'width 0.3s ease' }}></div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn-primary" type="submit" style={{ flex: 1, justifyContent: 'center' }}>
                          {editingProductId ? 'Perbarui Produk' : 'Simpan Produk'}
                        </button>
                        {editingProductId && (
                          <button className="btn-secondary" type="button" onClick={() => { setEditingProductId(null); setProductForm({ name: '', desc: '', price: 0, category: 'frozen', img: '' }); }}>Batal</button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                {/* Table Card */}
                <div className="admin-content-card">
                  <div className="card-header">
                    <h2>Katalog Produk</h2>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Produk</th>
                          <th>Kategori</th>
                          <th>Harga</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id}>
                            <td>
                              <div className="product-item-meta">
                                <img src={p.img} alt={p.name} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/48')} />
                                <div className="product-item-info">
                                  <h4>{p.name}</h4>
                                  <p>{p.desc.substring(0, 50)}...</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`card-badge badge-${p.category}`}>{p.category.toUpperCase()}</span>
                            </td>
                            <td><strong>Rp {p.price.toLocaleString('id-ID')}</strong></td>
                            <td>
                              <div className="action-btn-group">
                                <button className="icon-btn" title="Edit" onClick={() => {
                                  setEditingProductId(p.id);
                                  setProductForm({ name: p.name, desc: p.desc, price: p.price, category: p.category, img: p.img });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}>✏️</button>
                                <button className="icon-btn delete" title="Hapus" onClick={() => deleteProduct(p.id)}>🗑️</button>
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
      </main>

      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .status-processing { background: #DBEAFE; color: #1E40AF; }
        .status-shipped { background: #E0E7FF; color: #3730A3; }
        .status-completed { background: #D1FAE5; color: #065F46; }

        .chart-container {
          padding: 2.5rem 2rem;
          background: var(--surface);
        }
        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 200px;
          gap: 1rem;
          border-bottom: 2px solid var(--border);
          padding-bottom: 0.5rem;
        }
        .bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(to top, var(--mint), #EF4444);
          border-radius: 8px 8px 0 0;
          transition: all 0.3s ease;
          position: relative;
          cursor: pointer;
        }
        .bar:hover {
          filter: brightness(1.1);
          transform: scaleX(1.05);
        }
        .bar-tooltip {
          position: absolute;
          top: -35px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--dark);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .bar:hover .bar-tooltip {
          opacity: 1;
        }
        .bar-value {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--gray);
        }
        .bar-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--dark);
          text-transform: uppercase;
        }
        .badge-pill {
          background: var(--mint-light);
          color: var(--mint-dark);
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

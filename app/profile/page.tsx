"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Package,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  Clock,
  Edit3,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddressManager from '../../components/AddressManager';

const statusLabel: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu Konfirmasi', color: '#F59E0B' },
  confirmed: { label: 'Dikonfirmasi', color: '#3B82F6' },
  processing: { label: 'Diproses', color: '#8B5CF6' },
  shipped: { label: 'Dikirim', color: '#6366F1' },
  completed: { label: 'Selesai', color: '#10B981' },
  cancelled: { label: 'Dibatalkan', color: '#EF4444' },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [changingPassword, setChangingPassword] = useState(false);
  const [passForm, setPassForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passSaving, setPassSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }
      const u = session.user;
      setUser(u);
      setForm({
        name: u.user_metadata?.full_name || '',
        phone: u.user_metadata?.phone || '',
        address: u.user_metadata?.address || '',
      });
      setLoading(false);
      fetchOrders(u.id);
    };
    init();
  }, [router]);

  const fetchOrders = async (userId: string) => {
    setOrdersLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      setOrders(data || []);
    } catch { /* ignore */ } finally {
      setOrdersLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: form.name, phone: form.phone, address: form.address },
      });
      if (error) throw error;
      setUser((prev: any) => ({
        ...prev,
        user_metadata: { ...prev.user_metadata, full_name: form.name, phone: form.phone, address: form.address },
      }));
      setSaveMsg({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setEditing(false);
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (passForm.newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password minimal 6 karakter.' });
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }
    setPassSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passForm.newPassword });
      if (error) throw error;
      setPassMsg({ type: 'success', text: 'Password berhasil diubah!' });
      setPassForm({ newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message });
    } finally {
      setPassSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatPrice = (v: number) => 'Rp ' + v.toLocaleString('id-ID');

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-spinner" />
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-sm font-medium font-sans transition-all duration-200 placeholder:text-[var(--text-light)] placeholder:opacity-60 focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(225,29,72,0.07)] focus:outline-none';

  return (
    <div className="profile-page">
      {/* Nav */}
      <nav className="profile-nav">
        <div className="profile-nav-inner">
          <Link href="/" className="profile-logo">
            <Store size={22} />
            <span>Hijrah<span>Toko</span></span>
          </Link>
          <Link href="/" className="profile-back-link">
            <ArrowLeft size={16} />
            Beranda
          </Link>
        </div>
      </nav>

      <div className="profile-container">
        {/* Header Card */}
        <motion.div
          className="profile-header-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="profile-avatar-large">
            {user.user_metadata?.full_name?.charAt(0).toUpperCase() || <User size={32} />}
          </div>
          <div className="profile-header-info">
            <h1>{user.user_metadata?.full_name || 'Pengguna'}</h1>
            <p>{user.email}</p>
          </div>
          <button
            className="profile-edit-trigger"
            onClick={() => { setEditing(!editing); setSaveMsg(null); }}
          >
            <Edit3 size={16} />
            {editing ? 'Batal' : 'Edit'}
          </button>
        </motion.div>

        <div className="profile-grid">
          {/* Left Column */}
          <div className="profile-col">
            {/* Info Pribadi */}
            <motion.div
              className="profile-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="profile-card-header">
                <User size={18} />
                <h2>Info Pribadi</h2>
              </div>

              <AnimatePresence>
                {saveMsg && (
                  <motion.div
                    className={`profile-toast profile-toast-${saveMsg.type}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {saveMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{saveMsg.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {editing ? (
                <form onSubmit={handleSaveProfile} className="profile-form">
                  <div className="profile-field">
                    <label><User size={13} /> Nama Lengkap</label>
                    <input className={inputCls} type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" />
                  </div>
                  <div className="profile-field">
                    <label><Mail size={13} /> Email</label>
                    <input className={inputCls} type="email" value={user.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                  <div className="profile-field">
                    <label><Phone size={13} /> Nomor WhatsApp</label>
                    <input className={inputCls} type="tel" required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="08xxxxxxxxxx" pattern="[0-9]{10,13}" />
                  </div>
                  <div className="profile-field">
                    <label><MapPin size={13} /> Alamat</label>
                    <textarea className={`${inputCls} resize-none min-h-[70px]`} required rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Alamat lengkap" />
                  </div>
                  <div className="profile-form-actions">
                    <button type="submit" className="profile-btn profile-btn-primary" disabled={saving}>
                      {saving ? <span className="profile-spinner-sm" /> : <Save size={16} />}
                      Simpan Perubahan
                    </button>
                    <button type="button" className="profile-btn profile-btn-ghost" onClick={() => { setEditing(false); setSaveMsg(null); }}>
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-info-display">
                  <div className="profile-info-row">
                    <span className="profile-info-label">Nama</span>
                    <span className="profile-info-value">{user.user_metadata?.full_name || '-'}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Email</span>
                    <span className="profile-info-value">{user.email}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">No. WA</span>
                    <span className="profile-info-value">{user.user_metadata?.phone || '-'}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Alamat</span>
                    <span className="profile-info-value">{user.user_metadata?.address || '-'}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Keamanan */}
            <motion.div
              className="profile-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="profile-card-header">
                <Lock size={18} />
                <h2>Keamanan</h2>
              </div>

              {changingPassword ? (
                <form onSubmit={handleChangePassword} className="profile-form">
                  <AnimatePresence>
                    {passMsg && (
                      <motion.div
                        className={`profile-toast profile-toast-${passMsg.type}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {passMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span>{passMsg.text}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="profile-field">
                    <label><Lock size={13} /> Password Baru</label>
                    <div className="profile-pass-wrap">
                      <input className={`${inputCls} pr-10`} type={showPass ? 'text' : 'password'} required value={passForm.newPassword} onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Minimal 6 karakter" minLength={6} />
                      <button type="button" className="profile-pass-toggle" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="profile-field">
                    <label><Lock size={13} /> Konfirmasi Password</label>
                    <input className={inputCls} type="password" required value={passForm.confirmPassword} onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Ulangi password baru" />
                  </div>
                  <div className="profile-form-actions">
                    <button type="submit" className="profile-btn profile-btn-primary" disabled={passSaving}>
                      {passSaving ? <span className="profile-spinner-sm" /> : <Lock size={16} />}
                      Ubah Password
                    </button>
                    <button type="button" className="profile-btn profile-btn-ghost" onClick={() => { setChangingPassword(false); setPassMsg(null); setPassForm({ newPassword: '', confirmPassword: '' }); }}>
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <button className="profile-action-row" onClick={() => setChangingPassword(true)}>
                  <Lock size={16} />
                  <span>Ubah Password</span>
                  <ChevronRight size={16} className="profile-chevron" />
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="profile-col">
            {/* Pesanan Terbaru */}
            <motion.div
              className="profile-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="profile-card-header">
                <Package size={18} />
                <h2>Pesanan Terbaru</h2>
              </div>

              {ordersLoading ? (
                <div className="profile-empty">Memuat pesanan...</div>
              ) : orders.length === 0 ? (
                <div className="profile-empty">
                  <Package size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p>Belum ada pesanan</p>
                </div>
              ) : (
                <div className="profile-order-list">
                  {orders.map(order => (
                    <div key={order.id} className="profile-order-item">
                      <div className="profile-order-top">
                        <span className="profile-order-id">
                          #{order.id.toString().slice(-6).toUpperCase()}
                        </span>
                        <span
                          className="profile-order-status"
                          style={{ background: statusLabel[order.status]?.color + '18', color: statusLabel[order.status]?.color }}
                        >
                          {statusLabel[order.status]?.label || order.status}
                        </span>
                      </div>
                      <div className="profile-order-mid">
                        <span>{order.order_items?.length || 0} item</span>
                        <span className="profile-order-price">{formatPrice(order.grand_total)}</span>
                      </div>
                      <div className="profile-order-bot">
                        <Clock size={12} />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Alamat */}
            <motion.div
              className="profile-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="profile-card-header">
                <MapPin size={18} />
                <h2>Alamat</h2>
              </div>

              {showAddressManager ? (
                <div className="profile-address-manager-wrap">
                  <AddressManager
                    userId={user.id}
                    userPhone={user.user_metadata?.phone || user.phone || ''}
                    mode="manage"
                  />
                  <button className="profile-btn profile-btn-ghost" style={{ marginTop: '1rem' }} onClick={() => setShowAddressManager(false)}>
                    Tutup
                  </button>
                </div>
              ) : (
                <button className="profile-action-row" onClick={() => setShowAddressManager(true)}>
                  <MapPin size={16} />
                  <span>Kelola Alamat</span>
                  <ChevronRight size={16} className="profile-chevron" />
                </button>
              )}
            </motion.div>
          </div>
        </div>

        {/* Tombol Akun */}
        <motion.div
          className="profile-account-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button className="profile-btn profile-btn-outline" onClick={handleSwitchAccount}>
            <LogOut size={16} />
            Ganti Akun
          </button>
          <button className="profile-btn profile-btn-danger" onClick={handleLogout}>
            <LogOut size={16} />
            Keluar
          </button>
        </motion.div>
      </div>
    </div>
  );
}

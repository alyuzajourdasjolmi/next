"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Lock, Package, LogOut,
  ArrowLeft, ChevronRight, Save, CheckCircle, AlertCircle,
  Eye, EyeOff, Store, Clock, Edit3, Shield, ShoppingBag,
  Settings, Info, CreditCard, Smartphone, Home,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddressManager from '../../components/AddressManager';

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Menunggu',    color: '#D97706', bg: '#FFFBEB' },
  confirmed:  { label: 'Dikonfirmasi', color: '#2563EB', bg: '#EFF6FF' },
  processing: { label: 'Diproses',    color: '#7C3AED', bg: '#F5F3FF' },
  shipped:    { label: 'Dikirim',     color: '#4F46E5', bg: '#EEF2FF' },
  completed:  { label: 'Selesai',     color: '#059669', bg: '#ECFDF5' },
  cancelled:  { label: 'Dibatalkan',  color: '#DC2626', bg: '#FEF2F2' },
};

const menuVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.35 } }),
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'settings'>('info');
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
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/auth'); return; }
      const u = session.user;
      setUser(u);
      setForm({
        name: u.user_metadata?.full_name || '',
        phone: u.user_metadata?.phone || '',
        address: u.user_metadata?.address || '',
      });
      setLoading(false);
      setOrdersLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setOrders(data || []);
      setOrdersLoading(false);
    })();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: form.name, phone: form.phone, address: form.address },
      });
      if (error) throw error;
      setUser((p: any) => ({ ...p, user_metadata: { ...p.user_metadata, full_name: form.name, phone: form.phone, address: form.address } }));
      setSaveMsg({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setEditing(false);
    } catch (err: any) { setSaveMsg({ type: 'error', text: err.message }); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (passForm.newPassword.length < 6) { setPassMsg({ type: 'error', text: 'Minimal 6 karakter.' }); return; }
    if (passForm.newPassword !== passForm.confirmPassword) { setPassMsg({ type: 'error', text: 'Konfirmasi tidak cocok.' }); return; }
    setPassSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passForm.newPassword });
      if (error) throw error;
      setPassMsg({ type: 'success', text: 'Password berhasil diubah!' });
      setPassForm({ newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
    } catch (err: any) { setPassMsg({ type: 'error', text: err.message }); }
    finally { setPassSaving(false); }
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtPrice = (v: number) => 'Rp ' + v.toLocaleString('id-ID');

  const initial = user?.user_metadata?.full_name?.charAt(0).toUpperCase() || '?';

  if (loading) {
    return (
      <div className="prof-page">
        <div className="prof-loader" />
      </div>
    );
  }

  const Section = ({ title, icon: Icon, children, delay = 0 }: any) => (
    <motion.div
      className="prof-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="prof-card-head">
        <Icon size={18} />
        <h2>{title}</h2>
      </div>
      {children}
    </motion.div>
  );

  const inputCls = 'prof-input';

  return (
    <div className="prof-page">
      {/* Nav */}
      <nav className="prof-nav">
        <div className="prof-nav-inner">
          <Link href="/" className="prof-logo">
            <Store size={22} />
            <span>Hijrah<span>Toko</span></span>
          </Link>
          <Link href="/" className="prof-back">
            <ArrowLeft size={16} />
            <span>Beranda</span>
          </Link>
        </div>
      </nav>

      <div className="prof-container">
        {/* Profile Hero */}
        <motion.div
          className="prof-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="prof-hero-bg" />
          <div className="prof-hero-content">
            <div className="prof-avatar">
              <div className="prof-avatar-ring" />
              <div className="prof-avatar-inner">{initial}</div>
            </div>
            <div className="prof-hero-info">
              <h1>{user.user_metadata?.full_name || 'Pengguna'}</h1>
              <p>{user.email}</p>
              <div className="prof-hero-badge">
                <Shield size={12} />
                Akun Terdaftar
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Tabs */}
        <div className="prof-mobile-tabs">
          <button
            className={`prof-mtab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <Info size={16} /> Data
          </button>
          <button
            className={`prof-mtab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={16} /> Pesanan
          </button>
          <button
            className={`prof-mtab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} /> Pengaturan
          </button>
        </div>

        {/* Desktop Grid / Mobile Tab Content */}
        <div className="prof-grid">
          {/* ── LEFT / TAB 1: INFO ── */}
          <div className={`prof-col ${activeTab !== 'info' ? 'prof-col-hidden' : ''}`}>
            {/* Info Pribadi */}
            <Section title="Info Pribadi" icon={User} delay={0.05}>
              <AnimatePresence>
                {saveMsg && (
                  <motion.div
                    className={`prof-toast ${saveMsg.type === 'success' ? 'prof-toast-ok' : 'prof-toast-err'}`}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  >
                    {saveMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{saveMsg.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {editing ? (
                <form onSubmit={handleSaveProfile} className="prof-form">
                  <div className="prof-fld">
                    <label><User size={13} /> Nama Lengkap</label>
                    <input className={inputCls} type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" />
                  </div>
                  <div className="prof-fld">
                    <label><Mail size={13} /> Email</label>
                    <input className={inputCls} type="email" value={user.email} disabled />
                  </div>
                  <div className="prof-fld">
                    <label><Smartphone size={13} /> WhatsApp</label>
                    <input className={inputCls} type="tel" required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="08xxxxxxxxxx" pattern="[0-9]{10,13}" />
                  </div>
                  <div className="prof-fld">
                    <label><Home size={13} /> Alamat</label>
                    <textarea className={`${inputCls} prof-textarea`} required rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Alamat lengkap" />
                  </div>
                  <div className="prof-fld-actions">
                    <button type="submit" className="prof-btn prof-btn-primary" disabled={saving}>
                      {saving ? <span className="prof-spin-sm" /> : <Save size={15} />}
                      Simpan
                    </button>
                    <button type="button" className="prof-btn prof-btn-ghost" onClick={() => { setEditing(false); setSaveMsg(null); }}>Batal</button>
                  </div>
                </form>
              ) : (
                <div className="prof-info">
                  <div className="prof-info-row">
                    <span className="prof-info-label">Nama</span>
                    <span className="prof-info-val">{user.user_metadata?.full_name || '-'}</span>
                  </div>
                  <div className="prof-info-row">
                    <span className="prof-info-label">Email</span>
                    <span className="prof-info-val">{user.email}</span>
                  </div>
                  <div className="prof-info-row">
                    <span className="prof-info-label">WhatsApp</span>
                    <span className="prof-info-val">{user.user_metadata?.phone || '-'}</span>
                  </div>
                  <div className="prof-info-row">
                    <span className="prof-info-label">Alamat</span>
                    <span className="prof-info-val">{user.user_metadata?.address || '-'}</span>
                  </div>
                  <button className="prof-edit-btn" onClick={() => { setEditing(true); setSaveMsg(null); }}>
                    <Edit3 size={14} /> Edit Profil
                  </button>
                </div>
              )}
            </Section>

            {/* Stats */}
            <Section title="Aktivitas" icon={Clock} delay={0.1}>
              <div className="prof-stats">
                <div className="prof-stat">
                  <span className="prof-stat-num">{orders.length}</span>
                  <span className="prof-stat-label">Pesanan</span>
                </div>
                <div className="prof-stat">
                  <span className="prof-stat-num">{orders.filter(o => o.status === 'completed').length}</span>
                  <span className="prof-stat-label">Selesai</span>
                </div>
                <div className="prof-stat">
                  <span className="prof-stat-num">{orders.filter(o => o.status === 'pending' || o.status === 'processing').length}</span>
                  <span className="prof-stat-label">Aktif</span>
                </div>
              </div>
            </Section>
          </div>

          {/* ── RIGHT / TAB 2: ORDERS ── */}
          <div className={`prof-col ${activeTab !== 'orders' ? 'prof-col-hidden' : ''}`}>
            <Section title="Pesanan Terbaru" icon={ShoppingBag} delay={0.05}>
              {ordersLoading ? (
                <div className="prof-empty">Memuat...</div>
              ) : orders.length === 0 ? (
                <div className="prof-empty">
                  <Package size={36} className="prof-empty-icon" />
                  <p>Belum ada pesanan</p>
                  <Link href="/#produk" className="prof-btn prof-btn-outline" style={{ marginTop: '0.75rem' }}>Mulai Belanja</Link>
                </div>
              ) : (
                <div className="prof-order-list">
                  {orders.map((o, i) => (
                    <motion.div
                      key={o.id}
                      className="prof-order"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <div className="prof-order-head">
                        <span className="prof-order-id">#{o.id.toString().slice(-6).toUpperCase()}</span>
                        <span
                          className="prof-order-badge"
                          style={{
                            background: statusCfg[o.status]?.bg || '#F1F5F9',
                            color: statusCfg[o.status]?.color || '#64748B',
                          }}
                        >
                          {statusCfg[o.status]?.label || o.status}
                        </span>
                      </div>
                      <div className="prof-order-body">
                        <span>{o.order_items?.length || 0} item</span>
                        <span className="prof-order-price">{fmtPrice(o.grand_total)}</span>
                      </div>
                      <div className="prof-order-foot">
                        <Clock size={11} />
                        <span>{fmtDate(o.created_at)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* ── TAB 3: SETTINGS ── */}
          <div className={`prof-col ${activeTab !== 'settings' ? 'prof-col-hidden' : ''}`}>
            <Section title="Keamanan" icon={Lock} delay={0.05}>
              {changingPassword ? (
                <form onSubmit={handleChangePassword} className="prof-form">
                  <AnimatePresence>
                    {passMsg && (
                      <motion.div
                        className={`prof-toast ${passMsg.type === 'success' ? 'prof-toast-ok' : 'prof-toast-err'}`}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      >
                        {passMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span>{passMsg.text}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="prof-fld">
                    <label><Lock size={13} /> Password Baru</label>
                    <div className="prof-pass-wrap">
                      <input className={`${inputCls} prof-pass-input`} type={showPass ? 'text' : 'password'} required value={passForm.newPassword} onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 karakter" minLength={6} />
                      <button type="button" className="prof-pass-toggle" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="prof-fld">
                    <label><Lock size={13} /> Konfirmasi</label>
                    <input className={inputCls} type="password" required value={passForm.confirmPassword} onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Ulangi password" />
                  </div>
                  <div className="prof-fld-actions">
                    <button type="submit" className="prof-btn prof-btn-primary" disabled={passSaving}>
                      {passSaving ? <span className="prof-spin-sm" /> : <Lock size={15} />}
                      Ubah
                    </button>
                    <button type="button" className="prof-btn prof-btn-ghost" onClick={() => { setChangingPassword(false); setPassMsg(null); setPassForm({ newPassword: '', confirmPassword: '' }); }}>Batal</button>
                  </div>
                </form>
              ) : (
                <button className="prof-action" onClick={() => setChangingPassword(true)}>
                  <Lock size={16} /> Ubah Password <ChevronRight size={15} className="prof-chev" />
                </button>
              )}
            </Section>

            <Section title="Alamat" icon={MapPin} delay={0.1}>
              {showAddressManager ? (
                <div className="prof-addr-wrap">
                  <AddressManager userId={user.id} userPhone={user.user_metadata?.phone || user.phone || ''} mode="manage" />
                  <button className="prof-btn prof-btn-ghost" style={{ marginTop: '0.75rem' }} onClick={() => setShowAddressManager(false)}>Tutup</button>
                </div>
              ) : (
                <button className="prof-action" onClick={() => setShowAddressManager(true)}>
                  <MapPin size={16} /> Kelola Alamat <ChevronRight size={15} className="prof-chev" />
                </button>
              )}
            </Section>

            <Section title="Akun" icon={Settings} delay={0.15}>
              <button className="prof-action" onClick={logout}>
                <LogOut size={16} /> Ganti Akun <ChevronRight size={15} className="prof-chev" />
              </button>
              <button className="prof-action prof-action-danger" onClick={logout} style={{ marginTop: '0.5rem' }}>
                <LogOut size={16} /> Keluar
              </button>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Image,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useFeedback } from '../../../lib/feedback-context';

type ButtonConfig = { label: string; url: string; style: 'primary' | 'outline' };

type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  bg_color: string;
  is_active: boolean;
  sort_order: number;
  buttons: ButtonConfig[];
  created_at: string;
};

const EMPTY_BANNER: Omit<Banner, 'id' | 'created_at'> = {
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  bg_color: '#111827',
  is_active: true,
  sort_order: 0,
  buttons: [],
};

const COLOR_PRESETS = [
  { label: 'Dark', value: '#111827' },
  { label: 'Rose', value: '#881337' },
  { label: 'Navy', value: '#172554' },
  { label: 'Emerald', value: '#064e3b' },
  { label: 'Amber', value: '#78350f' },
  { label: 'Purple', value: '#3b0764' },
];

export default function BannersPage() {
  const { success, error: showError, showConfirm } = useFeedback();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Banner, 'id' | 'created_at'>>(EMPTY_BANNER);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      setBanners((data || []) as Banner[]);
    } catch (err: any) {
      console.error('fetch banners error:', err);
      showError('Gagal Memuat Banner', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const openNew = () => {
    const maxOrder = banners.reduce((m, b) => Math.max(m, b.sort_order), -1);
    setForm({ ...EMPTY_BANNER, sort_order: maxOrder + 1 });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (banner: Banner) => {
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      image_url: banner.image_url,
      bg_color: banner.bg_color || '#111827',
      is_active: banner.is_active,
      sort_order: banner.sort_order,
      buttons: banner.buttons || [],
    });
    setEditing(banner);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_BANNER);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showError('Validasi', 'Judul banner wajib diisi'); return; }
    if (!form.image_url.trim()) { showError('Validasi', 'URL gambar banner wajib diisi'); return; }

    try {
      // Filter valid buttons (label + url must not be empty)
      const validButtons = form.buttons.filter((b) => b.label.trim() && b.url.trim());
      const payload = { ...form, buttons: validButtons, updated_at: new Date().toISOString() };

      if (editing) {
        const { error } = await supabase.from('banners').update(payload).eq('id', editing.id);
        if (error) throw error;
        success('Banner Diperbarui', `"${form.title}" berhasil disimpan`);
      } else {
        const { error } = await supabase.from('banners').insert(payload);
        if (error) throw error;
        success('Banner Ditambahkan', `"${form.title}" berhasil ditambahkan`);
      }
      closeForm();
      fetchBanners();
    } catch (err: any) {
      showError('Gagal Menyimpan', err.message);
    }
  };

  const handleDelete = (banner: Banner) => {
    showConfirm({
      title: 'Hapus Banner?',
      description: `Banner "${banner.title}" akan dihapus permanen.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('banners').delete().eq('id', banner.id);
          if (error) throw error;
          success('Banner Dihapus', `"${banner.title}" telah dihapus`);
          fetchBanners();
        } catch (err: any) {
          showError('Gagal Menghapus', err.message);
        }
      },
    });
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await supabase.from('banners').update({ is_active: !banner.is_active, updated_at: new Date().toISOString() }).eq('id', banner.id);
      fetchBanners();
    } catch (err: any) {
      console.error(err);
    }
  };

  const moveOrder = async (banner: Banner, dir: -1 | 1) => {
    const sorted = [...banners].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((b) => b.id === banner.id);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const swap = sorted[target];
    try {
      await supabase.from('banners').update({ sort_order: swap.sort_order, updated_at: new Date().toISOString() }).eq('id', banner.id);
      await supabase.from('banners').update({ sort_order: banner.sort_order, updated_at: new Date().toISOString() }).eq('id', swap.id);
      fetchBanners();
    } catch (err: any) {
      console.error(err);
    }
  };

  const addButton = () => {
    if (form.buttons.length >= 2) return;
    setForm({ ...form, buttons: [...form.buttons, { label: '', url: '', style: 'primary' }] });
  };

  const updateButton = (i: number, field: keyof ButtonConfig, value: string) => {
    const updated = [...form.buttons];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, buttons: updated });
  };

  const removeButton = (i: number) => {
    setForm({ ...form, buttons: form.buttons.filter((_, idx) => idx !== i) });
  };

  // Preview for the form
  const activeBanners = banners.filter((b) => b.is_active).length;

  return (
    <section className="admin-panel">
      <div className="admin-panel-header split">
        <h2>
          <Image size={18} />
          Kelola Banner Hero
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="panel-chip">{banners.length} banner ({activeBanners} aktif)</span>
          <button className="add-btn" onClick={openNew}>
            <Plus size={16} /> Tambah Banner
          </button>
        </div>
      </div>

      {/* ── BANNER LIST ── */}
      {loading ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>Memuat banner...</div>
      ) : banners.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>
          <Image size={48} strokeWidth={1.2} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, margin: '0 0 0.25rem', color: '#64748b' }}>Belum ada banner</p>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>Klik &quot;Tambah Banner&quot; untuk membuat banner hero pertama.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="card-item"
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.85rem 1.25rem',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
              }}
            >
              {/* Preview image */}
              <div style={{
                width: 120, height: 68, borderRadius: 10, overflow: 'hidden',
                background: '#f1f5f9', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {banner.image_url ? (
                  <img src={banner.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Image size={20} style={{ color: '#cbd5e1' }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{banner.title}</strong>
                  {banner.buttons?.length > 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: 6 }}>
                      {banner.buttons.length} tombol
                    </span>
                  )}
                </div>
                {banner.subtitle && (
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>{banner.subtitle}</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>Urutan: {banner.sort_order}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: banner.is_active ? '#22c55e' : '#cbd5e1', display: 'inline-block', alignSelf: 'center' }} />
                  <span>{banner.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                <button className="btn-icon-sm" onClick={() => moveOrder(banner, -1)} title="Naikkan urutan">
                  <ChevronUp size={16} />
                </button>
                <button className="btn-icon-sm" onClick={() => moveOrder(banner, 1)} title="Turunkan urutan">
                  <ChevronDown size={16} />
                </button>
                <button className="btn-icon-sm" onClick={() => toggleActive(banner)} title={banner.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                  {banner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button className="btn-icon-sm" onClick={() => openEdit(banner)} title="Edit">
                  <Edit3 size={16} />
                </button>
                <button className="btn-icon-sm danger" onClick={() => handleDelete(banner)} title="Hapus">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(10px)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, padding: '1.5rem',
              maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 30px 60px -10px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Image size={18} />
                {editing ? 'Edit Banner' : 'Tambah Banner Baru'}
              </h3>
              <button onClick={closeForm} className="btn-icon-sm" aria-label="Tutup">✕</button>
            </div>

            {/* Title */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Judul Banner *</label>
              <input className="form-input" type="text" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Promo Frozen Food Spesial" />
            </div>

            {/* Subtitle + Description */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Subtitle (opsional)</label>
                <input className="form-input" type="text" value={form.subtitle || ''}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Belanja Hemat 50%" />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi (opsional)</label>
                <input className="form-input" type="text" value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Promo berlaku hingga akhir bulan" />
              </div>
            </div>

            {/* Image URL */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">URL Gambar *</label>
              <input className="form-input" type="text" value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="/assets/images/hero-toko.jpeg atau https://..." />
              {form.image_url && (
                <div style={{ marginTop: '0.5rem', width: 160, height: 90, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9' }}>
                  <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* Background Color */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Warna Latar Gradient</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map((c) => (
                  <button key={c.value} type="button" onClick={() => setForm({ ...form, bg_color: c.value })}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: form.bg_color === c.value ? '3px solid #e11d48' : '2px solid #e2e8f0',
                      background: c.value, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    title={c.label}
                  />
                ))}
                <input type="color" value={form.bg_color}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  style={{ width: 36, height: 36, borderRadius: 10, border: '2px solid #e2e8f0', cursor: 'pointer', padding: 0 }} />
              </div>
            </div>

            {/* Buttons (max 2) */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Tombol (maks. 2)</label>
                {form.buttons.length < 2 && (
                  <button type="button" onClick={addButton} style={{
                    background: 'none', border: '1px dashed #cbd5e1', borderRadius: 8, padding: '0.3rem 0.6rem',
                    fontSize: '0.78rem', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                  }}>
                    + Tambah Tombol
                  </button>
                )}
              </div>
              {form.buttons.length === 0 && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Belum ada tombol. Banner akan tampil tanpa tombol aksi.</p>
              )}
              {form.buttons.map((btn, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  padding: '0.75rem', background: '#f8fafc', borderRadius: 10, marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', width: 16 }}>
                    {i + 1}
                  </span>
                  <input className="form-input" type="text" value={btn.label}
                    onChange={(e) => updateButton(i, 'label', e.target.value)}
                    placeholder="Label tombol" style={{ flex: 1, minWidth: 0 }} />
                  <input className="form-input" type="text" value={btn.url}
                    onChange={(e) => updateButton(i, 'url', e.target.value)}
                    placeholder="URL / tautan" style={{ flex: 1.5, minWidth: 0 }} />
                  <select className="form-input" value={btn.style}
                    onChange={(e) => updateButton(i, 'style', e.target.value as 'primary' | 'outline')}
                    style={{ width: 100, flexShrink: 0 }}>
                    <option value="primary">Primary</option>
                    <option value="outline">Outline</option>
                  </select>
                  <button type="button" onClick={() => removeButton(i)} className="btn-icon-sm danger" title="Hapus tombol">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Sort Order + Active toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Urutan</label>
                <input className="form-input" type="number" min={0} value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b' }}>
                  <input type="checkbox" checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#e11d48' }} />
                  Tampilkan banner ini
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button onClick={closeForm} style={{
                padding: '0.65rem 1.25rem', borderRadius: 12, border: '1px solid #e2e8f0',
                background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
              }}>Batal</button>
              <button onClick={handleSave} style={{
                padding: '0.65rem 1.5rem', borderRadius: 12, border: 'none',
                background: '#e11d48', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
              }}>
                {editing ? 'Simpan Perubahan' : 'Tambah Banner'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Sparkles,
  ExternalLink,
  Layers,
  ToggleLeft,
  ToggleRight,
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
  { label: 'Dark', value: '#111827', hex: '#111827' },
  { label: 'Rose', value: '#881337', hex: '#881337' },
  { label: 'Navy', value: '#172554', hex: '#172554' },
  { label: 'Emerald', value: '#064e3b', hex: '#064e3b' },
  { label: 'Amber', value: '#78350f', hex: '#78350f' },
  { label: 'Purple', value: '#3b0764', hex: '#3b0764' },
];

export default function BannersPage() {
  const { success, error: showError, showConfirm } = useFeedback();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Banner, 'id' | 'created_at'>>(EMPTY_BANNER);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

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

  const activeBanners = banners.filter((b) => b.is_active).length;
  const sortedBanners = [...banners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section style={{ padding: '1.5rem', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #e11d48, #be123c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Layers size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Banner Hero
                </h1>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Kelola slider banner utama di halaman depan
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => fetchBanners()} style={{
            padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid #e2e8f0',
            background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{
            flex: 1, padding: '0.85rem 1.1rem', background: '#fff', borderRadius: 14,
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ImageIcon size={18} color="#7c3aed" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{banners.length}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Total Banner</p>
            </div>
          </div>
          <div style={{
            flex: 1, padding: '0.85rem 1.1rem', background: '#fff', borderRadius: 14,
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Eye size={18} color="#16a34a" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{activeBanners}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Aktif</p>
            </div>
          </div>
          <div style={{
            flex: 1, padding: '0.85rem 1.1rem', background: '#fff', borderRadius: 14,
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ToggleLeft size={18} color="#d97706" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{banners.length - activeBanners}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Nonaktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button onClick={openNew} style={{
          padding: '0.7rem 1.25rem', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff',
          fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 4px 14px -3px rgba(225,29,72,0.5)',
          transition: 'all 0.2s',
        }}>
          <Plus size={18} strokeWidth={2.5} /> Tambah Banner Baru
        </button>
      </div>

      {/* Banner List */}
      {loading ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
          }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </motion.div>
          </div>
          <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Memuat banner...</p>
        </div>
      ) : sortedBanners.length === 0 ? (
        <div style={{
          padding: '4rem 2rem', textAlign: 'center', background: '#fff', borderRadius: 18,
          border: '2px dashed #e2e8f0',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
          }}>
            <ImageIcon size={28} strokeWidth={1.5} style={{ color: '#cbd5e1' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#334155', margin: '0 0 0.35rem' }}>
            Belum ada banner
          </p>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 1.25rem', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Buat banner hero pertama untuk ditampilkan di slider halaman depan.
          </p>
          <button onClick={openNew} style={{
            padding: '0.6rem 1.5rem', borderRadius: 12, border: 'none',
            background: '#e11d48', color: '#fff', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <Plus size={16} /> Buat Banner
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {sortedBanners.map((banner, idx) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              style={{
                display: 'flex', alignItems: 'stretch', gap: 0,
                background: '#fff', borderRadius: 16, overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                opacity: banner.is_active ? 1 : 0.65,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Preview */}
              <div style={{
                width: 180, minHeight: 110, flexShrink: 0, position: 'relative', overflow: 'hidden',
                background: '#f1f5f9',
              }}>
                {banner.image_url ? (
                  <>
                    <img src={banner.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: (() => {
                        const raw = banner.bg_color || '';
                        const isGradient = raw.startsWith('linear-gradient') || raw.startsWith('radial-gradient');
                        if (isGradient) return raw;
                        if (raw.startsWith('#') && raw.length >= 7) {
                          const r = parseInt(raw.slice(1, 3), 16);
                          const g = parseInt(raw.slice(3, 5), 16);
                          const b = parseInt(raw.slice(5, 7), 16);
                          return `linear-gradient(to right, rgba(${r},${g},${b},0.88) 0%, rgba(${r},${g},${b},0.65) 45%, rgba(${r},${g},${b},0.15) 100%)`;
                        }
                        return 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%)';
                      })(),
                    }} />
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={24} style={{ color: '#cbd5e1' }} />
                  </div>
                )}
                {/* Order badge */}
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                  borderRadius: 6, letterSpacing: '0.05em',
                }}>
                  #{banner.sort_order + 1}
                </div>
                {/* Status dot */}
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 10, height: 10, borderRadius: '50%',
                  background: banner.is_active ? '#22c55e' : '#94a3b8',
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '0.85rem 1rem', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {banner.title}
                  </h3>
                  {banner.is_active ? (
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      background: '#dcfce7', color: '#16a34a', padding: '0.15rem 0.45rem', borderRadius: 5,
                      flexShrink: 0,
                    }}>Aktif</span>
                  ) : (
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      background: '#f1f5f9', color: '#94a3b8', padding: '0.15rem 0.45rem', borderRadius: 5,
                      flexShrink: 0,
                    }}>Off</span>
                  )}
                </div>
                {banner.subtitle && (
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                    {banner.subtitle}
                  </p>
                )}
                {banner.description && (
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {banner.description}
                  </p>
                )}
                {banner.buttons && banner.buttons.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    {banner.buttons.map((btn, bi) => (
                      <span key={bi} style={{
                        fontSize: '0.62rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 5,
                        background: btn.style === 'primary' ? '#e11d48' : '#f1f5f9',
                        color: btn.style === 'primary' ? '#fff' : '#64748b',
                      }}>
                        {btn.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.2rem', padding: '0.5rem 0.6rem', borderLeft: '1px solid #f1f5f9',
                background: '#fafbfc', flexShrink: 0,
              }}>
                <button onClick={() => moveOrder(banner, -1)} disabled={idx === 0}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', cursor: idx === 0 ? 'default' : 'pointer',
                    background: idx === 0 ? '#f8fafc' : '#f1f5f9', color: idx === 0 ? '#cbd5e1' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}
                  title="Naikkan urutan"
                >
                  <ChevronUp size={15} />
                </button>
                <button onClick={() => moveOrder(banner, 1)} disabled={idx === sortedBanners.length - 1}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', cursor: idx === sortedBanners.length - 1 ? 'default' : 'pointer',
                    background: idx === sortedBanners.length - 1 ? '#f8fafc' : '#f1f5f9', color: idx === sortedBanners.length - 1 ? '#cbd5e1' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}
                  title="Turunkan urutan"
                >
                  <ChevronDown size={15} />
                </button>
                <div style={{ width: 20, height: 1, background: '#e2e8f0', margin: '0.1rem 0' }} />
                <button onClick={() => toggleActive(banner)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: banner.is_active ? '#dcfce7' : '#f1f5f9',
                    color: banner.is_active ? '#16a34a' : '#94a3b8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}
                  title={banner.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {banner.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => openEdit(banner)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: '#eff6ff', color: '#3b82f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}
                  title="Edit"
                >
                  <Edit3 size={15} />
                </button>
                <button onClick={() => handleDelete(banner)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: '#fef2f2', color: '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}
                  title="Hapus"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── FORM MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeForm}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)', zIndex: 2000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 20, padding: 0,
                maxWidth: 700, width: '100%', maxHeight: '90vh', overflow: 'hidden',
                boxShadow: '0 30px 60px -10px rgba(0,0,0,0.35)',
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#fafbfc',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #e11d48, #be123c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {editing ? <Edit3 size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      {editing ? 'Edit Banner' : 'Banner Baru'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                      {editing ? 'Ubah detail banner yang dipilih' : 'Isi detail untuk banner hero baru'}
                    </p>
                  </div>
                </div>
                <button onClick={closeForm} style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
                {/* Title */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Judul Banner <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input type="text" value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Promo Spesial Bulan Ini"
                    style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: 10, border: '1.5px solid #e2e8f0',
                      fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Subtitle + Description */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Subtitle
                    </label>
                    <input type="text" value={form.subtitle || ''}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="Belanja Hemat 50%"
                      style={{
                        width: '100%', padding: '0.65rem 0.85rem', borderRadius: 10, border: '1.5px solid #e2e8f0',
                        fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Deskripsi
                    </label>
                    <input type="text" value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Promo berlaku hingga akhir bulan"
                      style={{
                        width: '100%', padding: '0.65rem 0.85rem', borderRadius: 10, border: '1.5px solid #e2e8f0',
                        fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    URL Gambar <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="/assets/images/hero-toko.jpeg"
                      style={{
                        flex: 1, padding: '0.65rem 0.85rem', borderRadius: 10, border: '1.5px solid #e2e8f0',
                        fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    {form.image_url && (
                      <a href={form.image_url} target="_blank" rel="noopener noreferrer"
                        style={{
                          width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#64748b', textDecoration: 'none', flexShrink: 0,
                        }}>
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                  {form.image_url && (
                    <div style={{
                      marginTop: '0.6rem', width: '100%', height: 140, borderRadius: 12, overflow: 'hidden',
                      background: '#f1f5f9', border: '1px solid #e2e8f0', position: 'relative',
                    }}>
                      <img src={form.image_url} alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: (() => {
                          const raw = form.bg_color || '';
                          const isGradient = raw.startsWith('linear-gradient') || raw.startsWith('radial-gradient');
                          if (isGradient) return raw;
                          if (raw.startsWith('#') && raw.length >= 7) {
                            const r = parseInt(raw.slice(1, 3), 16);
                            const g = parseInt(raw.slice(3, 5), 16);
                            const b = parseInt(raw.slice(5, 7), 16);
                            return `linear-gradient(to right, rgba(${r},${g},${b},0.88) 0%, rgba(${r},${g},${b},0.65) 45%, rgba(${r},${g},${b},0.15) 100%)`;
                          }
                          return 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%)';
                        })(),
                      }} />
                    </div>
                  )}
                </div>

                {/* Background Color */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Warna Latar Overlay
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {COLOR_PRESETS.map((c) => (
                      <button key={c.value} type="button" onClick={() => setForm({ ...form, bg_color: c.value })}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: form.bg_color === c.value ? '3px solid #e11d48' : '2px solid #e2e8f0',
                          background: c.hex, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        title={c.label}
                      />
                    ))}
                    <input type="color" value={form.bg_color}
                      onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '2px solid #e2e8f0', cursor: 'pointer', padding: 0 }} />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '0.25rem' }}>atau custom</span>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                      Tombol Aksi <span style={{ color: '#94a3b8', fontWeight: 500 }}>(maks. 2)</span>
                    </label>
                    {form.buttons.length < 2 && (
                      <button type="button" onClick={addButton} style={{
                        background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: 8,
                        padding: '0.3rem 0.65rem', fontSize: '0.72rem', color: '#64748b',
                        cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
                      }}>
                        + Tambah
                      </button>
                    )}
                  </div>
                  {form.buttons.length === 0 && (
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Banner akan tampil tanpa tombol aksi.
                    </p>
                  )}
                  {form.buttons.map((btn, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '0.4rem', alignItems: 'center',
                      padding: '0.65rem', background: '#f8fafc', borderRadius: 10, marginBottom: '0.4rem',
                      border: '1px solid #f1f5f9',
                    }}>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', width: 18, textAlign: 'center',
                        background: '#e2e8f0', borderRadius: 5, padding: '0.15rem 0', flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <input type="text" value={btn.label}
                        onChange={(e) => updateButton(i, 'label', e.target.value)}
                        placeholder="Label tombol"
                        style={{
                          flex: 1, minWidth: 0, padding: '0.5rem 0.65rem', borderRadius: 8, border: '1.5px solid #e2e8f0',
                          fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <input type="text" value={btn.url}
                        onChange={(e) => updateButton(i, 'url', e.target.value)}
                        placeholder="URL"
                        style={{
                          flex: 1.5, minWidth: 0, padding: '0.5rem 0.65rem', borderRadius: 8, border: '1.5px solid #e2e8f0',
                          fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                      <select value={btn.style}
                        onChange={(e) => updateButton(i, 'style', e.target.value as 'primary' | 'outline')}
                        style={{
                          width: 90, flexShrink: 0, padding: '0.5rem', borderRadius: 8, border: '1.5px solid #e2e8f0',
                          fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none', background: '#fff',
                        }}>
                        <option value="primary">Primary</option>
                        <option value="outline">Outline</option>
                      </select>
                      <button type="button" onClick={() => removeButton(i)} style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }} title="Hapus tombol">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sort + Active */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Urutan Tampil
                    </label>
                    <input type="number" min={0} value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                      style={{
                        width: '100%', padding: '0.65rem 0.85rem', borderRadius: 10, border: '1.5px solid #e2e8f0',
                        fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Status
                    </label>
                    <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })}
                      style={{
                        width: '100%', padding: '0.65rem 0.85rem', borderRadius: 10,
                        border: '1.5px solid #e2e8f0', background: form.is_active ? '#dcfce7' : '#f1f5f9',
                        color: form.is_active ? '#16a34a' : '#94a3b8',
                        fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                      {form.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {form.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9',
                display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', background: '#fafbfc',
              }}>
                <button onClick={closeForm} style={{
                  padding: '0.6rem 1.25rem', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.82rem', transition: 'all 0.15s',
                }}>Batal</button>
                <button onClick={handleSave} style={{
                  padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff',
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
                  boxShadow: '0 4px 14px -3px rgba(225,29,72,0.5)', transition: 'all 0.15s',
                }}>
                  {editing ? 'Simpan Perubahan' : 'Tambah Banner'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

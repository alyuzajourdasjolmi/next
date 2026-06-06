"use client";

import React, { useState } from 'react';
import {
  Settings, Store, Clock, Truck, Palette,
  Save, RotateCcw, Sun, Moon, Image,
} from 'lucide-react';
import { useSettings } from '../../../lib/settings-context';
import { DaySchedule } from '../../../lib/store-settings';

type Tab = 'info' | 'schedule' | 'shipping' | 'appearance';

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'info', label: 'Info Toko', icon: Store },
  { key: 'schedule', label: 'Jam Operasional', icon: Clock },
  { key: 'shipping', label: 'Ongkir & Pesanan', icon: Truck },
  { key: 'appearance', label: 'Tampilan', icon: Palette },
];

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    updateSettings({ ...settings });
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 400);
  };

  const set = (field: string, value: any) => updateSettings({ [field]: value } as any);

  const setSchedule = (day: string, partial: Partial<DaySchedule>) =>
    updateSettings({
      schedule: { ...settings.schedule, [day]: { ...settings.schedule[day], ...partial } },
    });

  const addDiscount = () =>
    updateSettings({ shippingDiscounts: [...settings.shippingDiscounts, { min: 0, amount: 0 }] });

  const removeDiscount = (i: number) => {
    const list = [...settings.shippingDiscounts];
    list.splice(i, 1);
    updateSettings({ shippingDiscounts: list });
  };

  const setDiscount = (i: number, field: 'min' | 'amount', val: number) => {
    const list = [...settings.shippingDiscounts];
    list[i] = { ...list[i], [field]: val };
    updateSettings({ shippingDiscounts: list });
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-header split">
        <h2><Settings size={18} /> Pengaturan Toko</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-sidebar-link" onClick={resetSettings}
            style={{ width: 'auto', padding: '0.5rem 1rem', color: '#64748b' }}>
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={handleSave}
            style={{
              padding: '0.5rem 1rem', borderRadius: 10, border: 'none',
              background: saved ? '#16a34a' : 'var(--primary)', color: '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              transition: 'background 0.3s',
            }}>
            <Save size={14} /> {saving ? 'Menyimpan…' : saved ? 'Tersimpan!' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-toolbar" style={{ marginBottom: '1.5rem', background: '#f1f5f9', borderRadius: 10, padding: '0.25rem', gap: '0.25rem', flexWrap: 'nowrap' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '0.55rem 1rem', border: 'none', borderRadius: 8,
                background: active ? '#fff' : 'transparent',
                color: active ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer',
                fontSize: '0.82rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.35rem',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── INFO TOKO ── */}
      {activeTab === 'info' && (
        <div className="admin-form">
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label>Nama Toko
              <input value={settings.storeName} onChange={(e) => set('storeName', e.target.value)} />
            </label>
            <label>WhatsApp (angka saja)
              <input value={settings.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="6285263965031" />
            </label>
            <label>Telepon
              <input value={settings.phone} onChange={(e) => set('phone', e.target.value)} />
            </label>
            <label>Email Admin
              <input type="email" value={settings.email} onChange={(e) => set('email', e.target.value)} />
            </label>
          </div>
          <label>Deskripsi Toko
            <textarea rows={3} value={settings.storeDesc}
              onChange={(e) => set('storeDesc', e.target.value)} />
          </label>
          <label>Alamat
            <textarea rows={2} value={settings.address}
              onChange={(e) => set('address', e.target.value)} />
          </label>

          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label>Latitude
              <input type="number" step="any" value={settings.lat}
                onChange={(e) => set('lat', parseFloat(e.target.value) || 0)} />
            </label>
            <label>Longitude
              <input type="number" step="any" value={settings.lon}
                onChange={(e) => set('lon', parseFloat(e.target.value) || 0)} />
            </label>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '-0.5rem 0 0' }}>
            Koordinat untuk marker peta & perhitungan ongkir otomatis.
          </p>
        </div>
      )}

      {/* ── JAM OPERASIONAL ── */}
      {activeTab === 'schedule' && (
        <div className="admin-form">
          {DAYS.map((day) => {
            const s = settings.schedule[day] || { active: true, open: '08:00', close: '21:00' };
            return (
              <div key={day}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                  padding: '0.75rem', borderRadius: 10,
                  background: s.active ? '#fafafa' : '#f9fafb',
                  border: `1px solid ${s.active ? '#e2e8f0' : '#e5e7eb'}`,
                }}>
                <span style={{ minWidth: 65, fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                  {day}
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', marginLeft: 'auto' }}>
                  <input type="checkbox" checked={s.active}
                    onChange={(e) => setSchedule(day, { active: e.target.checked })} />
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{s.active ? 'Buka' : 'Libur'}</span>
                </label>
                {s.active && (
                  <>
                    <input type="time" value={s.open}
                      onChange={(e) => setSchedule(day, { open: e.target.value })}
                      style={{ width: 110, padding: '0.45rem 0.6rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }} />
                    <span style={{ color: '#9ca3af' }}>—</span>
                    <input type="time" value={s.close}
                      onChange={(e) => setSchedule(day, { close: e.target.value })}
                      style={{ width: 110, padding: '0.45rem 0.6rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ONGKIR & PESANAN ── */}
      {activeTab === 'shipping' && (
        <div className="admin-form">
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label>Radius Dekat (km)
              <input type="number" min={0} value={settings.shippingNearMaxKm}
                onChange={(e) => set('shippingNearMaxKm', parseInt(e.target.value) || 0)} />
            </label>
            <label>Radius Maksimal (km)
              <input type="number" min={0} value={settings.shippingMaxKm}
                onChange={(e) => set('shippingMaxKm', parseInt(e.target.value) || 0)} />
            </label>
            <label>Ongkir Radius Dekat (Rp)
              <input type="number" min={0} value={settings.shippingNearBase}
                onChange={(e) => set('shippingNearBase', parseInt(e.target.value) || 0)} />
            </label>
            <label>Ongkir Jauh — Dasar (Rp)
              <input type="number" min={0} value={settings.shippingFarBase}
                onChange={(e) => set('shippingFarBase', parseInt(e.target.value) || 0)} />
            </label>
          </div>
          <label>Ongkir per km tambahan (Rp)
            <input type="number" min={0} value={settings.shippingFarPerKm}
              onChange={(e) => set('shippingFarPerKm', parseInt(e.target.value) || 0)} />
          </label>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem' }}>
              Diskon Ongkir (berdasarkan subtotal)
            </h4>
            {settings.shippingDiscounts.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: '#374151' }}>Min. Rp</span>
                <input type="number" min={0} value={d.min}
                  onChange={(e) => setDiscount(i, 'min', parseInt(e.target.value) || 0)}
                  style={{ width: 110, padding: '0.45rem 0.6rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }} />
                <span style={{ fontSize: '0.82rem', color: '#374151' }}>diskon Rp</span>
                <input type="number" min={0} value={d.amount}
                  onChange={(e) => setDiscount(i, 'amount', parseInt(e.target.value) || 0)}
                  style={{ width: 110, padding: '0.45rem 0.6rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }} />
                <button onClick={() => removeDiscount(i)}
                  style={{ padding: '0.35rem 0.65rem', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem' }}>
                  Hapus
                </button>
              </div>
            ))}
            <button onClick={addDiscount}
              style={{ padding: '0.4rem 0.85rem', borderRadius: 8, border: '1px dashed #d1d5db', background: 'transparent', color: '#374151', cursor: 'pointer', fontSize: '0.82rem' }}>
              + Tambah Diskon
            </button>
          </div>

          <label style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
            Minimum Pesanan (Rp, 0 = tidak ada)
            <input type="number" min={0} value={settings.minOrder}
              onChange={(e) => set('minOrder', parseInt(e.target.value) || 0)} />
          </label>
        </div>
      )}

      {/* ── TAMPILAN ── */}
      {activeTab === 'appearance' && (
        <div className="admin-form">
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label>Warna Utama
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="color" value={settings.primaryColor}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  style={{ width: 48, height: 40, padding: 0, border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }} />
                <input value={settings.primaryColor}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  style={{ flex: 1 }} />
              </div>
            </label>
            <label>Tema Default
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                {(['dark', 'light'] as const).map((t) => (
                  <label key={t}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.35rem', padding: '0.5rem', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${settings.themeDefault === t ? 'var(--primary)' : '#e2e8f0'}`,
                      background: settings.themeDefault === t ? 'rgba(225,29,72,0.04)' : '#fff',
                      fontWeight: 600, fontSize: '0.82rem',
                      color: settings.themeDefault === t ? 'var(--primary)' : '#64748b',
                    }}>
                    <input type="radio" name="theme" checked={settings.themeDefault === t}
                      onChange={() => set('themeDefault', t)} style={{ display: 'none' }} />
                    {t === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
                    {t === 'dark' ? 'Dark' : 'Light'}
                  </label>
                ))}
              </div>
            </label>
          </div>

          <label>Logo Toko (path/URL)
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                border: '1.5px solid #e2e8f0', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fafafa',
              }}>
                {settings.logoUrl ? <img src={settings.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <Store size={18} color="#94a3b8" />}
              </div>
              <input value={settings.logoUrl}
                onChange={(e) => set('logoUrl', e.target.value)}
                placeholder="/assets/images/logo-hijrah-toko.png" />
            </div>
          </label>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem' }}>
              Gambar Hero Halaman Utama
            </h4>
            {(['hero1', 'hero2', 'hero3'] as const).map((key) => (
              <label key={key} style={{ marginBottom: '0.75rem', display: 'block' }}>
                Hero Slide {key.replace('hero', '')}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{
                    width: 72, height: 48, borderRadius: 6, overflow: 'hidden',
                    border: '1.5px solid #e2e8f0', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#fafafa',
                  }}>
                    {settings.heroUrls[key]
                      ? <img src={settings.heroUrls[key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Image size={16} color="#94a3b8" />}
                  </div>
                  <input value={settings.heroUrls[key]}
                    onChange={(e) => updateSettings({ heroUrls: { ...settings.heroUrls, [key]: e.target.value } })}
                    placeholder="/assets/images/hero-..." />
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

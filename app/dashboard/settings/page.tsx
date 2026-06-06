"use client";

import React, { useState } from 'react';
import {
  Settings, Store, Phone, MapPin, MessageSquare, Mail,
  Clock, Truck, Palette, Image, DollarSign, Package,
  Save, RotateCcw, Sun, Moon,
} from 'lucide-react';
import { useSettings } from '../../../lib/settings-context';
import { DEFAULT_SETTINGS, DaySchedule } from '../../../lib/store-settings';

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

  const set = (field: string, value: any) => {
    updateSettings({ [field]: value } as any);
  };

  const setSchedule = (day: string, partial: Partial<DaySchedule>) => {
    updateSettings({
      schedule: { ...settings.schedule, [day]: { ...settings.schedule[day], ...partial } },
    });
  };

  const addDiscount = () => {
    updateSettings({
      shippingDiscounts: [...settings.shippingDiscounts, { min: 0, amount: 0 }],
    });
  };

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

  const sectionCard = (children: React.ReactNode, title?: string) => (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '1.5rem',
      marginBottom: '1rem',
    }}>
      {title && (
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );

  const fieldRow = (label: string, input: React.ReactNode) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
        {label}
      </label>
      {input}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.9rem',
    color: '#0f172a',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-header split">
        <h2><Settings size={18} /> Pengaturan Toko</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={resetSettings}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #d1d5db',
              background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer',
              fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
              background: saved ? '#16a34a' : 'var(--primary)', color: '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              transition: 'background 0.3s',
            }}
          >
            <Save size={14} /> {saving ? 'Menyimpan…' : saved ? 'Tersimpan!' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
        background: '#f1f5f9', borderRadius: 10, padding: '0.25rem',
        flexWrap: 'wrap',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '0.55rem 1rem', border: 'none', borderRadius: 8,
                background: active ? '#fff' : 'transparent',
                color: active ? '#0f172a' : '#64748b', fontWeight: 600, cursor: 'pointer',
                fontSize: '0.82rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.35rem',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                minWidth: 0,
              }}
            >
              <Icon size={15} />
              <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── INFO TOKO ── */}
      {activeTab === 'info' && (
        <>
          {sectionCard(
            <>
              {fieldRow('Nama Toko', (
                <input style={inputStyle} value={settings.storeName}
                  onChange={(e) => set('storeName', e.target.value)} />
              ))}
              {fieldRow('Deskripsi Toko', (
                <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                  value={settings.storeDesc}
                  onChange={(e) => set('storeDesc', e.target.value)} />
              ))}
            </>,
            'Informasi Toko'
          )}

          {sectionCard(
            <>
              {fieldRow('WhatsApp (angka saja, tanpa +)', (
                <input style={inputStyle} value={settings.whatsapp}
                  onChange={(e) => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="6285263965031" />
              ))}
              {fieldRow('Telepon', (
                <input style={inputStyle} value={settings.phone}
                  onChange={(e) => set('phone', e.target.value)} />
              ))}
              {fieldRow('Email Admin', (
                <input style={inputStyle} type="email" value={settings.email}
                  onChange={(e) => set('email', e.target.value)} />
              ))}
              {fieldRow('Alamat', (
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                  value={settings.address}
                  onChange={(e) => set('address', e.target.value)} />
              ))}
            </>,
            'Kontak'
          )}

          {sectionCard(
            <>
              {fieldRow('Latitude', (
                <input style={inputStyle} type="number" step="any"
                  value={settings.lat}
                  onChange={(e) => set('lat', parseFloat(e.target.value) || 0)} />
              ))}
              {fieldRow('Longitude', (
                <input style={inputStyle} type="number" step="any"
                  value={settings.lon}
                  onChange={(e) => set('lon', parseFloat(e.target.value) || 0)} />
              ))}
              <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '-0.25rem' }}>
                Koordinat ini dipakai untuk marker peta di halaman utama dan perhitungan ongkir otomatis.
              </p>
            </>,
            'Lokasi Toko (Koordinat)'
          )}
        </>
      )}

      {/* ── JAM OPERASIONAL ── */}
      {activeTab === 'schedule' && (
        <>
          {sectionCard(
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {DAYS.map((day) => {
                const s = settings.schedule[day] || { active: true, open: '08:00', close: '21:00' };
                return (
                  <div key={day} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem', borderRadius: 8,
                    background: s.active ? 'rgba(225,29,72,0.04)' : '#f9fafb',
                    border: `1px solid ${s.active ? 'rgba(225,29,72,0.15)' : '#e5e7eb'}`,
                  }}>
                    <label style={{ minWidth: 70, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                      {day}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={s.active}
                        onChange={(e) => setSchedule(day, { active: e.target.checked })} />
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Buka</span>
                    </label>
                    {s.active && (
                      <>
                        <input type="time" value={s.open}
                          onChange={(e) => setSchedule(day, { open: e.target.value })}
                          style={{ ...inputStyle, width: 110 }} />
                        <span style={{ color: '#9ca3af' }}>—</span>
                        <input type="time" value={s.close}
                          onChange={(e) => setSchedule(day, { close: e.target.value })}
                          style={{ ...inputStyle, width: 110 }} />
                      </>
                    )}
                    {!s.active && (
                      <span style={{ fontSize: '0.82rem', color: '#9ca3af', fontStyle: 'italic' }}>Libur</span>
                    )}
                  </div>
                );
              })}
            </div>,
            'Atur Jam Operasional per Hari'
          )}
        </>
      )}

      {/* ── ONGKIR & PESANAN ── */}
      {activeTab === 'shipping' && (
        <>
          {sectionCard(
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {fieldRow('Radius Dekat (km)', (
                  <input style={inputStyle} type="number" min={0}
                    value={settings.shippingNearMaxKm}
                    onChange={(e) => set('shippingNearMaxKm', parseInt(e.target.value) || 0)} />
                ))}
                {fieldRow('Radius Maksimal (km)', (
                  <input style={inputStyle} type="number" min={0}
                    value={settings.shippingMaxKm}
                    onChange={(e) => set('shippingMaxKm', parseInt(e.target.value) || 0)} />
                ))}
                {fieldRow('Ongkir Radius Dekat (Rp)', (
                  <input style={inputStyle} type="number" min={0}
                    value={settings.shippingNearBase}
                    onChange={(e) => set('shippingNearBase', parseInt(e.target.value) || 0)} />
                ))}
                {fieldRow('Ongkir Radius Jauh — Dasar (Rp)', (
                  <input style={inputStyle} type="number" min={0}
                    value={settings.shippingFarBase}
                    onChange={(e) => set('shippingFarBase', parseInt(e.target.value) || 0)} />
                ))}
              </div>
              {fieldRow('Ongkir per km tambahan (Rp)', (
                <input style={inputStyle} type="number" min={0}
                  value={settings.shippingFarPerKm}
                  onChange={(e) => set('shippingFarPerKm', parseInt(e.target.value) || 0)} />
              ))}
            </>,
            'Biaya Pengiriman'
          )}

          {sectionCard(
            <>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Diskon ongkir otomatis berdasarkan subtotal belanja.
              </p>
              {settings.shippingDiscounts.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap' }}>Min. belanja Rp</span>
                  <input style={{ ...inputStyle, width: 130 }} type="number" min={0}
                    value={d.min}
                    onChange={(e) => setDiscount(i, 'min', parseInt(e.target.value) || 0)} />
                  <span style={{ fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap' }}>diskon ongkir Rp</span>
                  <input style={{ ...inputStyle, width: 130 }} type="number" min={0}
                    value={d.amount}
                    onChange={(e) => setDiscount(i, 'amount', parseInt(e.target.value) || 0)} />
                  <button onClick={() => removeDiscount(i)} style={{
                    padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid #fca5a5',
                    background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem',
                  }}>
                    Hapus
                  </button>
                </div>
              ))}
              <button onClick={addDiscount} style={{
                marginTop: '0.5rem', padding: '0.4rem 0.85rem', borderRadius: 8,
                border: '1px dashed #d1d5db', background: 'transparent', color: '#374151',
                cursor: 'pointer', fontSize: '0.82rem',
              }}>
                + Tambah Diskon
              </button>
            </>,
            'Diskon Ongkir'
          )}

          {sectionCard(
            fieldRow('Minimum Pesanan (Rp, 0 = tidak ada minimal)', (
              <input style={inputStyle} type="number" min={0}
                value={settings.minOrder}
                onChange={(e) => set('minOrder', parseInt(e.target.value) || 0)} />
            )),
            'Minimum Pesanan'
          )}
        </>
      )}

      {/* ── TAMPILAN ── */}
      {activeTab === 'appearance' && (
        <>
          {sectionCard(
            <>
              {fieldRow('Warna Utama (Primary)', (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" value={settings.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)}
                    style={{ width: 48, height: 40, padding: 0, border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }} />
                  <input style={{ ...inputStyle, width: 120 }} value={settings.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)} />
                </div>
              ))}
              {fieldRow('Tema Default', (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['dark', 'light'] as const).map((t) => (
                    <label key={t} style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.5rem 1rem', borderRadius: 8,
                      border: `2px solid ${settings.themeDefault === t ? 'var(--primary)' : '#d1d5db'}`,
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      color: settings.themeDefault === t ? 'var(--primary)' : '#374151',
                    }}>
                      <input type="radio" name="theme" checked={settings.themeDefault === t}
                        onChange={() => set('themeDefault', t)}
                        style={{ display: 'none' }} />
                      {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                      {t === 'dark' ? 'Dark' : 'Light'}
                    </label>
                  ))}
                </div>
              ))}
            </>,
            'Warna & Tema'
          )}

          {sectionCard(
            <>
              {fieldRow('Logo Toko (path/URL)', (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
                    border: '1px solid #e2e8f0', flexShrink: 0, background: '#f8fafc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : <Store size={20} color="#9ca3af" />}
                  </div>
                  <input style={inputStyle} value={settings.logoUrl}
                    onChange={(e) => set('logoUrl', e.target.value)}
                    placeholder="/assets/images/logo-hijrah-toko.png" />
                </div>
              ))}
            </>,
            'Logo'
          )}

          {sectionCard(
            <>
              {(['hero1', 'hero2', 'hero3'] as const).map((key) => (
                <div key={key} style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Hero Slide {key.replace('hero', '')}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{
                      width: 80, height: 52, borderRadius: 6, overflow: 'hidden',
                      border: '1px solid #e2e8f0', flexShrink: 0, background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {settings.heroUrls[key] ? (
                        <img src={settings.heroUrls[key]} alt={`hero ${key}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : <Image size={18} color="#9ca3af" />}
                    </div>
                    <input style={inputStyle} value={settings.heroUrls[key]}
                      onChange={(e) => updateSettings({
                        heroUrls: { ...settings.heroUrls, [key]: e.target.value },
                      })}
                      placeholder="/assets/images/hero-..." />
                  </div>
                </div>
              ))}
            </>,
            'Gambar Hero Halaman Utama'
          )}
        </>
      )}
    </section>
  );
}

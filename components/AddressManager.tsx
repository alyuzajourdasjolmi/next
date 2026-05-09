'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Check, X, Home, Briefcase, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Address {
  id: number;
  label: string;
  recipient_name: string;
  recipient_phone: string;
  full_address: string;
  detail_address?: string;
  latitude?: number;
  longitude?: number;
  maps_link?: string;
  is_primary: boolean;
}

interface AddressManagerProps {
  userPhone: string;
  onSelectAddress?: (address: Address) => void;
  mode?: 'manage' | 'select'; // manage = full CRUD, select = pilih alamat saat checkout
}

export default function AddressManager({ userPhone, onSelectAddress, mode = 'manage' }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Rumah',
    recipient_name: '',
    recipient_phone: userPhone,
    full_address: '',
    detail_address: '',
    latitude: '',
    longitude: '',
    maps_link: '',
    is_primary: false
  });

  // Load addresses
  useEffect(() => {
    loadAddresses();
  }, [userPhone]);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_phone', userPhone)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleUseLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        // Reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const address = data.display_name || `Koordinat: ${latitude}, ${longitude}`;
          
          setFormData(prev => ({
            ...prev,
            full_address: address,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            maps_link: link
          }));
        } catch (err) {
          setFormData(prev => ({
            ...prev,
            full_address: `Koordinat: ${latitude}, ${longitude}`,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            maps_link: link
          }));
        }
        setIsLocating(false);
      },
      (error) => {
        alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const addressData = {
        user_phone: userPhone,
        label: formData.label,
        recipient_name: formData.recipient_name,
        recipient_phone: formData.recipient_phone,
        full_address: formData.full_address,
        detail_address: formData.detail_address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        maps_link: formData.maps_link || null,
        is_primary: formData.is_primary
      };

      if (editingId) {
        // Update
        const { error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('user_addresses')
          .insert([addressData]);
        
        if (error) throw error;
      }

      // Reset form
      setFormData({
        label: 'Rumah',
        recipient_name: '',
        recipient_phone: userPhone,
        full_address: '',
        detail_address: '',
        latitude: '',
        longitude: '',
        maps_link: '',
        is_primary: false
      });
      setShowForm(false);
      setEditingId(null);
      loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Gagal menyimpan alamat');
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      recipient_name: address.recipient_name,
      recipient_phone: address.recipient_phone,
      full_address: address.full_address,
      detail_address: address.detail_address || '',
      latitude: address.latitude?.toString() || '',
      longitude: address.longitude?.toString() || '',
      maps_link: address.maps_link || '',
      is_primary: address.is_primary
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus alamat ini?')) return;
    
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Gagal menghapus alamat');
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_primary: true })
        .eq('id', id);
      
      if (error) throw error;
      loadAddresses();
    } catch (error) {
      console.error('Error setting primary:', error);
    }
  };

  const getLabelIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('rumah') || lower.includes('home')) return <Home size={18} />;
    if (lower.includes('kantor') || lower.includes('office')) return <Briefcase size={18} />;
    return <Building2 size={18} />;
  };

  return (
    <div className="address-manager">
      <style jsx>{`
        .address-manager {
          width: 100%;
        }
        .address-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .address-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .btn-add-address {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-add-address:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
        }
        .address-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .address-card {
          background: var(--bg-surface);
          border: 2px solid var(--border-main);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.3s;
          position: relative;
        }
        .address-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }
        .address-card.primary {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .address-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        .address-label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.85rem;
          background: var(--bg-surface-soft);
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .primary-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.65rem;
          background: var(--primary);
          color: white;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .address-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-main);
          background: var(--bg-surface);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-icon:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .btn-icon.delete:hover {
          background: #dc2626;
          border-color: #dc2626;
        }
        .address-content {
          margin-bottom: 0.75rem;
        }
        .address-content h4 {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .address-content p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 0.35rem;
        }
        .address-footer {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .btn-set-primary {
          padding: 0.5rem 1rem;
          background: var(--bg-surface-soft);
          border: 1px solid var(--border-main);
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-set-primary:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .btn-select {
          padding: 0.5rem 1.25rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-select:hover {
          background: var(--primary-dark);
        }
        .address-form {
          background: var(--bg-surface);
          border: 2px solid var(--border-main);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-main);
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.3s;
        }
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.1);
        }
        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .checkbox-group input[type="checkbox"] {
          width: auto;
          accent-color: var(--primary);
        }
        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        .btn-submit {
          flex: 1;
          padding: 0.85rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-submit:hover {
          background: var(--primary-dark);
        }
        .btn-cancel {
          flex: 1;
          padding: 0.85rem;
          background: var(--bg-surface-soft);
          border: 1px solid var(--border-main);
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-cancel:hover {
          background: var(--border-main);
        }
        .btn-location {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1rem;
          background: var(--bg-surface-soft);
          border: 1px solid var(--border-main);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 0.5rem;
        }
        .btn-location:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .empty-state {
          text-align: center;
          padding: 3rem 1.5rem;
          color: var(--text-muted);
        }
        .empty-state svg {
          margin: 0 auto 1rem;
          opacity: 0.5;
        }
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .address-card-header {
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>

      <div className="address-header">
        <h3>{mode === 'select' ? 'Pilih Alamat Pengiriman' : 'Alamat Saya'}</h3>
        {!showForm && (
          <button className="btn-add-address" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Tambah Alamat
          </button>
        )}
      </div>

      {showForm && (
        <form className="address-form" onSubmit={handleSubmit}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>
            {editingId ? 'Edit Alamat' : 'Tambah Alamat Baru'}
          </h4>

          <div className="form-group">
            <label>Label Alamat</label>
            <select
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            >
              <option value="Rumah">Rumah</option>
              <option value="Kantor">Kantor</option>
              <option value="Kos">Kos</option>
              <option value="Apartemen">Apartemen</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nama Penerima</label>
              <input
                type="text"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                placeholder="Nama lengkap penerima"
                required
              />
            </div>
            <div className="form-group">
              <label>No. HP Penerima</label>
              <input
                type="tel"
                value={formData.recipient_phone}
                onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Alamat Lengkap</label>
            <textarea
              value={formData.full_address}
              onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
              placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
              required
            />
            <button
              type="button"
              className="btn-location"
              onClick={handleUseLocation}
              disabled={isLocating}
            >
              <MapPin size={16} />
              {isLocating ? 'Mengambil Lokasi...' : 'Gunakan Lokasi Saya'}
            </button>
          </div>

          <div className="form-group">
            <label>Detail Alamat (Opsional)</label>
            <input
              type="text"
              value={formData.detail_address}
              onChange={(e) => setFormData({ ...formData, detail_address: e.target.value })}
              placeholder="Patokan, warna rumah, dll"
            />
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              />
              <label htmlFor="is_primary" style={{ marginBottom: 0 }}>
                Jadikan alamat utama
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {editingId ? 'Simpan Perubahan' : 'Tambah Alamat'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  label: 'Rumah',
                  recipient_name: '',
                  recipient_phone: userPhone,
                  full_address: '',
                  detail_address: '',
                  latitude: '',
                  longitude: '',
                  maps_link: '',
                  is_primary: false
                });
              }}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="address-list">
        {addresses.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} />
            <p>Belum ada alamat tersimpan</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Tambahkan alamat untuk mempermudah checkout
            </p>
          </div>
        ) : (
          addresses.map((address) => (
            <div key={address.id} className={`address-card ${address.is_primary ? 'primary' : ''}`}>
              <div className="address-card-header">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="address-label">
                    {getLabelIcon(address.label)}
                    {address.label}
                  </span>
                  {address.is_primary && (
                    <span className="primary-badge">
                      <Check size={12} />
                      Utama
                    </span>
                  )}
                </div>
                <div className="address-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(address)}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => handleDelete(address.id)}
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="address-content">
                <h4>{address.recipient_name}</h4>
                <p>{address.recipient_phone}</p>
                <p>{address.full_address}</p>
                {address.detail_address && (
                  <p style={{ fontStyle: 'italic' }}>📍 {address.detail_address}</p>
                )}
              </div>

              <div className="address-footer">
                {!address.is_primary && (
                  <button
                    className="btn-set-primary"
                    onClick={() => handleSetPrimary(address.id)}
                  >
                    Jadikan Utama
                  </button>
                )}
                {mode === 'select' && onSelectAddress && (
                  <button
                    className="btn-select"
                    onClick={() => onSelectAddress(address)}
                  >
                    Pilih Alamat Ini
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

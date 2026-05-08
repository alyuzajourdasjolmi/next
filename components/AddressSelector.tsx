'use client';

import { useState, useEffect } from 'react';
import { MapPin, X, Plus } from 'lucide-react';

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

interface AddressSelectorProps {
  userPhone: string;
  onSelect: (address: Address) => void;
  onClose: () => void;
  onAddNew: () => void;
}

export default function AddressSelector({ userPhone, onSelect, onClose, onAddNew }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-content {
          background: var(--bg-surface);
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-main);
        }
        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .btn-close {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: var(--bg-surface-soft);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-close:hover {
          background: var(--border-main);
        }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }
        .address-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .address-card {
          background: var(--bg-main);
          border: 2px solid var(--border-main);
          border-radius: 12px;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .address-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }
        .address-card.primary {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .address-label {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--bg-surface);
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        .primary-badge {
          display: inline-block;
          padding: 0.25rem 0.65rem;
          background: var(--primary);
          color: white;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-left: 0.5rem;
        }
        .address-card h4 {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 0.35rem;
        }
        .address-card p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 0.25rem;
        }
        .btn-add-new {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem;
          background: var(--bg-main);
          border: 2px dashed var(--border-main);
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          color: var(--text-muted);
        }
        .btn-add-new:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-light);
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
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Pilih Alamat Pengiriman</h3>
            <button className="btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Memuat alamat...</p>
              </div>
            ) : (
              <div className="address-list">
                {addresses.length === 0 ? (
                  <div className="empty-state">
                    <MapPin size={48} />
                    <p>Belum ada alamat tersimpan</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Tambahkan alamat terlebih dahulu
                    </p>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`address-card ${address.is_primary ? 'primary' : ''}`}
                      onClick={() => {
                        onSelect(address);
                        onClose();
                      }}
                    >
                      <div>
                        <span className="address-label">{address.label}</span>
                        {address.is_primary && (
                          <span className="primary-badge">UTAMA</span>
                        )}
                      </div>
                      <h4>{address.recipient_name}</h4>
                      <p>{address.recipient_phone}</p>
                      <p>{address.full_address}</p>
                      {address.detail_address && (
                        <p style={{ fontStyle: 'italic' }}>📍 {address.detail_address}</p>
                      )}
                    </div>
                  ))
                )}

                <button className="btn-add-new" onClick={onAddNew}>
                  <Plus size={20} />
                  Tambah Alamat Baru
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import React from 'react';
import { Trash2, UserCircle2, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useDashboard } from '../../../lib/dashboard-context';
import { useFeedback } from '../../../lib/feedback-context';

export default function CustomersPage() {
  const { users, fetchData } = useDashboard();
  const { success, error: showError, showConfirm } = useFeedback();

  const deleteUser = (userId: string, name: string) => {
    showConfirm({
      title: 'Hapus Pengguna Permanen?',
      description: `User "${name}" akan dihapus TOTAL dari sistem. Seluruh data profil, riwayat pesanan, dan akun login mereka akan hilang permanen dan tidak bisa dikembalikan.`,
      confirmText: 'Ya, Hapus Permanen',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        try {
          try {
            await supabase.from('orders').update({ user_id: null }).eq('user_id', userId);
          } catch (err) {
            console.log('Kolom user_id mungkin belum ada di tabel orders, melewati...');
          }

          const response = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || 'Gagal menghapus user dari server.');
          }

          fetchData();
          success('Pengguna Dihapus', `"${name}" telah dihapus dari sistem`);
        } catch (err: any) {
          console.error('Error deleting user:', err);
          showError('Gagal Menghapus Pengguna', err.message);
        }
      },
    });
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-header split">
        <h2>
          <Users size={18} />
          Manajemen Pengguna
        </h2>
        <span className="panel-chip">{users.length} terdaftar</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Kontak</th>
              <th>Alamat & Info</th>
              <th>Terdaftar Sejak</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((entry: any, i: number) => (
              <tr key={entry.id} className="fb-row" style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}>
                <td>
                  <div className="admin-user-cell">
                    <div className="avatar">
                      <UserCircle2 size={18} />
                    </div>
                    <div>
                      <strong>{entry.full_name || 'Tanpa Nama'}</strong>
                      <small>{entry.email}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <a
                      href={`https://wa.me/${entry.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wa-link"
                    >
                      {entry.phone || '-'}
                    </a>
                  </div>
                </td>
                <td>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#475569',
                      maxWidth: '200px',
                      lineHeight: 1.4,
                    }}
                  >
                    {entry.address || 'Belum ada alamat'}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {entry.created_at
                      ? new Date(entry.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </div>
                </td>
                <td>
                  <div className="admin-action-row">
                    <button
                      className="icon-action danger fb-pressable"
                      title="Hapus Pengguna"
                      onClick={() => deleteUser(entry.id, entry.full_name)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

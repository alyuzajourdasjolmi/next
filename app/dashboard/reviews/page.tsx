"use client";

import React from 'react';
import { Edit3 } from 'lucide-react';
import { useDashboard } from '../../../lib/dashboard-context';

export default function ReviewsPage() {
  const { reviews } = useDashboard();

  return (
    <section className="admin-panel">
      <div className="admin-panel-header split">
        <h2>
          <Edit3 size={18} />
          Ulasan & Rating
        </h2>
        <span className="panel-chip">{reviews.length} ulasan</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>Rating</th>
              <th>Ulasan</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={4} className="admin-empty-row">
                  Belum ada ulasan.
                </td>
              </tr>
            ) : (
              reviews.map((review: any) => (
                <tr key={review.id}>
                  <td>
                    <strong>{review.name}</strong>
                  </td>
                  <td style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                    {'⭐'.repeat(review.rating)}
                  </td>
                  <td style={{ fontSize: '0.9rem', color: '#475569' }}>{review.text}</td>
                  <td>{new Date(review.date).toLocaleDateString('id-ID')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

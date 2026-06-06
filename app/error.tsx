"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#fee2e2', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <span style={{ fontSize: 32 }}>⚠️</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
          Terjadi Kesalahan
        </h1>
        <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '0.625rem 1.5rem', borderRadius: 10, border: 'none',
              background: '#dc2626', color: 'white', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            style={{
              padding: '0.625rem 1.5rem', borderRadius: 10, border: '1px solid #d1d5db',
              background: 'white', color: '#374151', fontWeight: 600,
              textDecoration: 'none', fontSize: '0.9rem',
            }}
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

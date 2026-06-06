import Link from 'next/link';

export default function NotFoundPage() {
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
          background: '#fef3c7', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <span style={{ fontSize: 32 }}>🔍</span>
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>404</h1>
        <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block', padding: '0.625rem 1.5rem', borderRadius: 10,
            background: '#dc2626', color: 'white', fontWeight: 600,
            textDecoration: 'none', fontSize: '0.9rem',
          }}
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

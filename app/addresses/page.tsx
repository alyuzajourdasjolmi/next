'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddressManager from '@/components/AddressManager';

export default function AddressesPage() {
  const router = useRouter();
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    // Get user phone from localStorage or session
    const phone = localStorage.getItem('userPhone') || '';
    if (!phone) {
      // Redirect to home if no phone
      alert('Silakan login terlebih dahulu');
      router.push('/');
      return;
    }
    setUserPhone(phone);
  }, [router]);

  if (!userPhone) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingTop: '5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface-soft)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface)';
          }}
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

        <AddressManager userPhone={userPhone} mode="manage" />
      </div>
    </div>
  );
}

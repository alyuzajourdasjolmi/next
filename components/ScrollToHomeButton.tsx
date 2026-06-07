"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowUp } from 'lucide-react';

export default function ScrollToHomeButton() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isDashboard = pathname?.startsWith('/dashboard');

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reset on route change
    setVisible(false);

    const onScroll = () => {
      // Muncul setelah scroll 50% viewport height
      setVisible(window.scrollY > window.innerHeight * 0.5);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  const handleClick = () => {
    if (isHome) {
      // Homepage: scroll smooth ke paling atas
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (isDashboard) {
      // Dashboard: scroll ke atas (admin tidak butuh navigasi ke home)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Halaman lain (produk, lacak, chef, dll): kembali ke home
      window.location.href = '/';
    }
  };

  // Tentukan label & icon berdasarkan konteks
  let label: string;
  let Icon: typeof Home;

  if (isHome || isDashboard) {
    label = 'Ke Atas';
    Icon = ArrowUp;
  } else {
    label = 'Beranda';
    Icon = Home;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={handleClick}
          className="scroll-home-btn"
          aria-label={label}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          <Icon size={20} />
          <span className="scroll-home-label">{label}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

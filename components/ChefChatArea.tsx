"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, Sparkles, RotateCcw, ArrowUp, Lightbulb, BookOpen, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { chatWithChef, Message } from '../lib/groq';

interface ChefChatAreaProps {
  initialMessage?: string;
  allProducts?: any[];
}

const QUICK_SUGGESTIONS = [
  {
    label: 'Cek stok & harga produk',
    value: 'Tolong cek stok dan harga nugget ayam, sosis sapi, dan buku tulis saat ini',
    icon: ShoppingBag,
  },
  {
    label: 'Rekomendasi resep praktis',
    value: 'Berikan 3 resep masakan praktis menggunakan produk frozen food kami yang cocok untuk keluarga',
    icon: BookOpen,
  },
  {
    label: 'Cara pesan & pembayaran',
    value: 'Bagaimana cara pesan di Toko Hijrah, dan metode pembayaran apa saja yang tersedia?',
    icon: Lightbulb,
  },
];

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export default function ChefChatArea({ initialMessage, allProducts = [] }: ChefChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastInitialRef = useRef<string | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const productContext = allProducts.length > 0
    ? allProducts.map(p => `- Nama: ${p.name}, Harga: Rp ${p.price.toLocaleString('id-ID')}, Stok: ${p.stock || 0}, Kategori: ${p.category}`).join('\n')
    : "";

  useEffect(() => {
    if (initialMessage && initialMessage !== lastInitialRef.current) {
      lastInitialRef.current = initialMessage;
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const reply = await chatWithChef(newMessages, productContext);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    if (confirm('Hapus semua riwayat chat?')) {
      setMessages([]);
      setError(null);
      lastInitialRef.current = undefined;
    }
  };

  return (
    <div className="chef-chat">
      <div className="chef-chat-header">
        <div className="chef-chat-header-left">
          <div className="chef-chat-avatar">
            <Image
              src="/assets/images/icon-nura.png"
              alt="Nura AI"
              width={40}
              height={40}
              unoptimized
              style={{ objectFit: 'contain', borderRadius: '50%' }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="chef-chat-title">Nura — AI Assistant</div>
            <div className="chef-chat-status">
              <span className="chef-chat-dot" />
              <span className="chef-chat-status-text">Online & siap membantu</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="chef-chat-clear"
          title="Bersihkan chat"
          aria-label="Bersihkan chat"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="chef-chat-messages">
        {messages.length === 0 && !isLoading && (
          <motion.div
            className="chef-chat-welcome"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="chef-chat-welcome-icon">
              <Sparkles size={28} />
            </div>
            <h4>Halo, Sahabat Hijrah! 👋</h4>
            <p>
              Aku <span>Nura</span>, asisten AI Toko Hijrah. Tanyakan apa saja —
              mulai dari produk, resep, hingga cara pemesanan.
            </p>
            <div className="chef-chat-suggestions">
              {QUICK_SUGGESTIONS.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <motion.button
                    key={s.label}
                    type="button"
                    onClick={() => handleSend(s.value)}
                    className="chef-chat-suggestion"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.08, duration: 0.3 }}
                  >
                    <span className="chef-chat-suggestion-icon">
                      <Icon size={14} />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>{s.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`${i}-${msg.role}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`chef-msg-row ${msg.role}`}
            >
              <div className="chef-msg-bubble-wrap">
                <div className={`chef-msg-icon ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  {msg.role === 'user' ? (
                    <User size={14} />
                  ) : (
                    <Image
                      src="/assets/images/icon-nura.png"
                      alt="Nura"
                      width={28}
                      height={28}
                      unoptimized
                      style={{ objectFit: 'contain', borderRadius: '50%' }}
                    />
                  )}
                </div>
                <div>
                  <div className={`chef-msg-bubble ${msg.role}`}>
                    {msg.content.split('\n').map((line, idx, arr) => (
                      <React.Fragment key={idx}>
                        {line}
                        {idx < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="chef-msg-time">
                    {formatTime(new Date())}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="chef-msg-row assistant"
            >
              <div className="chef-msg-bubble-wrap">
                <div className="chef-msg-icon bot">
                  <Image
                    src="/assets/images/icon-nura.png"
                    alt="Nura"
                    width={28}
                    height={28}
                    unoptimized
                    style={{ objectFit: 'contain', borderRadius: '50%' }}
                  />
                </div>
                <div className="chef-msg-loading">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="chef-chat-error"
          >
            {error}
          </motion.div>
        )}
      </div>

      <div className="chef-chat-footer">
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="chef-chat-form"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya Nura soal produk, resep, atau pesanan..."
            className="chef-chat-input"
            rows={1}
            disabled={isLoading}
            aria-label="Ketik pesan"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="chef-chat-send"
            aria-label="Kirim pesan"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <ArrowUp size={20} strokeWidth={2.5} />
            )}
          </button>
        </form>

        <div className="chef-chat-meta">
          <span>Powered by Llama 3.3 · Tekan Enter untuk kirim</span>
          <span className="chef-chat-mode-badge">Nura AI</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Bot, Loader2, ChefHat, Sparkles, RotateCcw } from 'lucide-react';
import { chatWithChef, Message } from '../lib/groq';

interface ChefChatAreaProps {
  initialMessage?: string;
}

const QUICK_CHIPS = [
  { label: 'Resep nugget', value: 'Tolong berikan resep nugget yang praktis dan lezat' },
  { label: 'Tips frozen food', value: 'Bagaimana cara menyimpan frozen food agar awet dan tetap segar?' },
  { label: 'Saus kentang', value: 'Apa resep saus cocolan yang enak untuk kentang goreng?' },
];

export default function ChefChatArea({ initialMessage }: ChefChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastInitialRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (initialMessage && initialMessage !== lastInitialRef.current) {
      lastInitialRef.current = initialMessage;
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const reply = await chatWithChef(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
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
            <ChefHat color="#fff" size={22} />
          </div>
          <div>
            <div className="chef-chat-title">Chef Virtual Hijrah</div>
            <div className="chef-chat-status">
              <span className="chef-chat-dot" />
              <span className="chef-chat-status-text">Online & Siap Membantu</span>
            </div>
          </div>
        </div>
        <button type="button" onClick={clearChat} className="chef-chat-clear" title="Bersihkan chat">
          <RotateCcw size={17} />
        </button>
      </div>

      <div ref={scrollRef} className="chef-chat-messages">
        {messages.length === 0 && (
          <div className="chef-chat-welcome">
            <div className="chef-chat-welcome-icon">
              <Sparkles size={26} />
            </div>
            <h4>Halo, Sahabat Hijrah!</h4>
            <p>
              Tanyakan resep atau tips masak frozen food. Klik tombol <span>Resep</span> di kartu
              produk.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`chef-msg-row ${msg.role}`}
          >
            <div className="chef-msg-bubble-wrap">
              <div className={`chef-msg-icon ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`chef-msg-bubble ${msg.role}`}>
                {msg.content.split('\n').map((line, idx, arr) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="chef-msg-row assistant">
            <div className="chef-msg-bubble-wrap">
              <div className="chef-msg-icon bot">
                <Bot size={14} />
              </div>
              <div className="chef-msg-loading">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        {error && <div className="chef-chat-error">{error}</div>}
      </div>

      <div className="chef-chat-footer">
        {messages.length === 0 && (
          <>
            <div className="chef-chat-quick-label">Quick Action</div>
            <div className="chef-chat-chips">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleSend(chip.value)}
                  className="chef-chat-chip"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="chef-chat-form"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya resep cireng atau otak-otak..."
            className="chef-chat-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="chef-chat-send"
            aria-label="Kirim pesan"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </form>

        <div className="chef-chat-meta">
          <span>Powered by Llama 3.3 70B</span>
          <span className="chef-chat-mode-badge">Chef Mode</span>
        </div>
      </div>
    </div>
  );
}

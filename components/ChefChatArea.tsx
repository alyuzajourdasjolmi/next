"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Bot, Loader2, ChefHat, Sparkles, RotateCcw } from 'lucide-react';
import { chatWithChef, Message } from '../lib/groq';

interface ChefChatAreaProps {
  initialMessage?: string;
  className?: string;
}

const QUICK_CHIPS = [
  { label: 'Resep nugget', value: 'Tolong berikan resep nugget yang praktis dan lezat' },
  { label: 'Tips frozen food', value: 'Bagaimana cara menyimpan frozen food agar awet dan tetap segar?' },
  { label: 'Saus kentang', value: 'Apa resep saus cocolan yang enak untuk kentang goreng?' },
];

export default function ChefChatArea({ initialMessage, className = '' }: ChefChatAreaProps) {
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
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161B22] shadow-2xl ${className}`}
    >
      {/* Header pink — seperti mockup */}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#FF006E] to-[#d4005c] px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <ChefHat className="text-white" size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-white">Chef Virtual Hijrah</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="text-xs text-white/80">Online & Siap Membantu</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white/80 transition hover:bg-white/25 hover:text-white"
          title="Bersihkan chat"
        >
          <RotateCcw size={17} />
        </button>
      </div>

      {/* Chat body */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto bg-[#0B0E14] px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-3 py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05]">
              <Sparkles size={26} className="text-[#FF006E]/50" />
            </div>
            <h4 className="text-base font-bold text-white">Halo, Sahabat Hijrah!</h4>
            <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-white/45">
              Tanyakan resep atau tips masak frozen food. Klik tombol{' '}
              <span className="text-[#FF006E]">Resep</span> di kartu produk.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[90%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-[#FF006E] text-white'
                    : 'border border-white/[0.08] bg-[#161B22] text-white/50'
                }`}
              >
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-tr-sm bg-[#FF006E] text-white'
                    : 'rounded-tl-sm border border-white/[0.06] bg-[#161B22] text-white/85'
                }`}
              >
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
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#161B22] text-white/50">
                <Bot size={14} />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-[#161B22] px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF006E]/60" />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF006E]/60"
                  style={{ animationDelay: '120ms' }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#FF006E]/60"
                  style={{ animationDelay: '240ms' }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-[#FF006E]/30 bg-[#FF006E]/10 px-3 py-2 text-center text-sm text-[#ff6b9d]">
            {error}
          </p>
        )}
      </div>

      {/* Footer input */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#161B22] p-4">
        {messages.length === 0 && (
          <>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Quick Action
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleSend(chip.value)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/55 transition hover:border-[#FF006E]/30 hover:bg-[#FF006E]/10 hover:text-[#FF006E]"
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
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya resep cireng atau otak-otak..."
            className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#0B0E14] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#FF006E]/40 focus:outline-none focus:ring-1 focus:ring-[#FF006E]/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl transition ${
              !input.trim() || isLoading
                ? 'cursor-not-allowed bg-white/[0.06] text-white/20'
                : 'bg-[#FF006E] text-white hover:bg-[#e60063]'
            }`}
            aria-label="Kirim pesan"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-white/25">
          <span>Powered by Llama 3.3 70B</span>
          <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-bold uppercase tracking-wide text-amber-400/90">
            Chef Mode
          </span>
        </div>
      </div>
    </div>
  );
}

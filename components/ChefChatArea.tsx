"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Bot, Loader2, ChefHat, Sparkles, Trash2, ShieldCheck, Zap } from 'lucide-react';
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
      className={`flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] shadow-xl ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#1a2332] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700">
            <ChefHat className="text-white" size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white">Chef Virtual Hijrah</h3>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Aktif
              </span>
            </div>
            <p className="text-sm text-white/50">Asisten kuliner & resep</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
          title="Bersihkan chat"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="flex shrink-0 items-start gap-2.5 border-b border-white/[0.06] bg-[#151f2e] px-4 py-2.5 sm:px-5">
        <ShieldCheck className="mt-0.5 shrink-0 text-white/40" size={15} />
        <p className="text-[13px] leading-snug text-white/55">
          Asisten ini hanya membahas kuliner dan resep produk Toko Hijrah.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
      >
        {messages.length === 0 && (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-2 py-6 text-center">
            <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <Sparkles size={26} className="text-rose-400/50" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white">
                <Zap size={9} fill="currentColor" />
              </span>
            </div>
            <h4 className="text-base font-semibold text-white">Halo, Sahabat Hijrah!</h4>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">
              Tanyakan resep, cara masak, atau tips frozen food. Kamu juga bisa klik tombol{' '}
              <span className="text-white/70">Resep</span> di kartu produk.
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
              className={`flex max-w-[92%] gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-rose-500 text-white'
                    : 'border border-white/10 bg-[#1f2937] text-white/60'
                }`}
              >
                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-tr-md bg-rose-500 text-white'
                    : 'rounded-tl-md border border-white/[0.06] bg-[#1f2937] text-white/90'
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
            <div className="flex gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#1f2937] text-white/60">
                <Bot size={15} />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#1f2937] px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400/60" />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400/60"
                  style={{ animationDelay: '120ms' }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-400/60"
                  style={{ animationDelay: '240ms' }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-center text-sm text-rose-300">
            {error}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.06] bg-[#1a2332] p-4 sm:p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">
          Quick action
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSend(chip.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/65 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-200"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya resep atau tips masak..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-[5.5rem] text-sm text-white placeholder:text-white/30 focus:border-rose-500/40 focus:outline-none focus:ring-1 focus:ring-rose-500/25"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              !input.trim() || isLoading
                ? 'cursor-not-allowed bg-white/5 text-white/25'
                : 'bg-white text-slate-900 hover:bg-rose-500 hover:text-white'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={14} /> : 'Kirim'}
            {!isLoading && <Send size={13} />}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-white/30">
          <span>Powered by Llama 3.3 70B</span>
          <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-amber-400/90">
            Chef mode
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, X, ChefHat, Sparkles, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { chatWithChef, Message } from '../lib/groq';

interface ChefChatAreaProps {
  initialMessage?: string;
}

const QUICK_CHIPS = [
  { label: "💡 Resep Nugget", value: "Tolong berikan resep nugget yang praktis dan lezat" },
  { label: "❄️ Tips Frozen Food", value: "Bagaimana cara menyimpan frozen food agar awet dan tetap segar?" },
  { label: "🍟 Saus Kentang", value: "Apa resep saus cocolan yang enak untuk kentang goreng?" }
];

export default function ChefChatArea({ initialMessage }: ChefChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Hapus semua riwayat chat?")) {
      setMessages([]);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-3xl border border-white/5 shadow-2xl overflow-hidden min-h-[500px]">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-[#1f2937] border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#e11d48] to-[#be123c] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
            <ChefHat className="text-white" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm sm:text-lg truncate">Chef Virtual Hijrah</h3>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[9px] sm:text-[10px] font-bold rounded-full border border-green-500/20 tracking-wider shrink-0">AKTIF</span>
            </div>
            <p className="text-white/50 text-[10px] sm:text-xs truncate">Asisten Kuliner & Resep Makanan</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all shrink-0"
          title="Bersihkan Chat"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="px-4 py-2 bg-rose-500/5 border-b border-rose-500/10 flex items-center gap-2 shrink-0">
        <ShieldCheck className="text-rose-500 shrink-0" size={13} />
        <p className="text-[10px] text-rose-500/80 leading-snug font-medium">
          AI hanya merespons topik kuliner & resep Toko Hijrah.
        </p>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && (
          <div className="min-h-[200px] flex flex-col items-center justify-center text-center py-8 px-4 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 rounded-2xl flex items-center justify-center relative">
              <Sparkles size={28} className="text-rose-500/40" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white">
                <Zap size={9} fill="currentColor" />
              </div>
            </div>
            <div className="max-w-[260px]">
              <h4 className="text-white font-bold text-base sm:text-lg">Halo Sahabat Hijrah!</h4>
              <p className="text-white/45 text-xs sm:text-sm mt-2 leading-relaxed">
                Aku siap bantu resep masakan dan tips olahan frozen food di dapurmu.
              </p>
              <p className="text-rose-500/70 text-[11px] mt-4 font-medium">
                Tanyakan resep di sini, atau klik &quot;Tanya Resep&quot; di katalog produk.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 sm:gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === 'user' ? 'bg-[#e11d48] text-white' : 'bg-[#1f2937] text-white/70 border border-white/5'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                ? 'bg-[#e11d48] text-white rounded-tr-none' 
                : 'bg-[#1f2937] text-white/90 border border-white/5 rounded-tl-none'
              }`}>
                {msg.content.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < msg.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 sm:gap-3 max-w-[90%]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#1f2937] border border-white/5 flex items-center justify-center text-white/70">
                <Bot size={16} />
              </div>
              <div className="bg-[#1f2937] border border-white/5 p-3 sm:p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-rose-500/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-rose-500/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-rose-500/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] sm:text-xs text-center font-medium"
          >
            {error}
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-[#1f2937] border-t border-white/5 shrink-0">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
          Quick Action
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => handleSend(chip.value)}
              className="px-3 py-1.5 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 rounded-lg text-[11px] text-white/60 hover:text-rose-400 transition-all font-medium"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya resep..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-4 pl-4 sm:pl-5 pr-16 sm:pr-20 text-xs sm:text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all ${
              !input.trim() || isLoading 
              ? 'bg-white/5 text-white/20' 
              : 'bg-white text-black hover:bg-rose-500 hover:text-white'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={14} /> : 'Kirim'}
            {!isLoading && <Send size={12} />}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-white/25">
          <span className="truncate">Powered by Llama-3.3-70b</span>
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500/90 font-bold uppercase tracking-wide border border-amber-500/20 text-[9px]">
            Chef Mode
          </span>
        </div>
      </div>
    </div>
  );
}

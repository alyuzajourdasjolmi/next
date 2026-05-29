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
    <div className="flex flex-col h-full bg-[#111827] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-[#1f2937] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#e11d48] to-[#be123c] rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ChefHat className="text-white" size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-lg">Chef Virtual Hijrah</h3>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20 tracking-wider">AKTIF</span>
            </div>
            <p className="text-white/50 text-xs">Asisten Kuliner & Resep Makanan</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
          title="Bersihkan Chat"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Security Guardrail Info */}
      <div className="px-6 py-3 bg-rose-500/5 border-b border-rose-500/10 flex items-center gap-3">
        <ShieldCheck className="text-rose-500 shrink-0" size={16} />
        <p className="text-[11px] text-rose-500/80 leading-tight font-medium">
          Fitur Pengaman Aktif: AI hanya bisa menjawab pertanyaan yang berfokus pada Kuliner, Makanan, & Resep Toko Hijrah.
        </p>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-rose-500/20 relative">
              <Sparkles size={40} className="text-rose-500/30" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white animate-bounce">
                <Zap size={12} fill="currentColor" />
              </div>
            </div>
            <div className="max-w-[280px]">
              <h4 className="text-white font-bold text-xl">Halo Sahabat Hijrah! 👋</h4>
              <p className="text-white/40 text-sm mt-3 leading-relaxed">
                Aku adalah **Chef Virtual Hijrah**. Aku siap bantu merekomendasikan resep masakan, tips menyimpan bahan *frozen*, maupun cara mengolah sajian spesial di dapurmu!
              </p>
              <p className="text-rose-500/60 text-xs mt-6 italic font-medium">
                Yuk, tanyakan resep makanan kesukaanmu, atau klik "Tanya Resep Q" pada katalog produk di samping!
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
            <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === 'user' ? 'bg-[#e11d48] text-white' : 'bg-[#1f2937] text-white/70 border border-white/5'
              }`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
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
            <div className="flex gap-3 max-w-[90%]">
              <div className="w-9 h-9 rounded-xl bg-[#1f2937] border border-white/5 flex items-center justify-center text-white/70">
                <Bot size={18} />
              </div>
              <div className="bg-[#1f2937] border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <div className="w-2 h-2 bg-rose-500/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-rose-500/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-rose-500/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs text-center font-medium"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Quick Chips & Input */}
      <div className="p-6 bg-[#1f2937] border-t border-white/5">
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 no-scrollbar">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => handleSend(chip.value)}
              className="whitespace-nowrap px-4 py-2.5 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 rounded-xl text-xs text-white/60 hover:text-rose-400 transition-all font-medium"
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
            placeholder="Tanya resep sosis, cara masak kentang..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-20 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              !input.trim() || isLoading 
              ? 'bg-white/5 text-white/20' 
              : 'bg-white text-black hover:bg-rose-500 hover:text-white'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Kirim'}
            <Send size={14} />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10px] text-white/20 font-medium tracking-tight">Didukung oleh model Llama-3.3-70b-versatile</p>
          <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded uppercase tracking-widest border border-amber-500/20">Mode Simulasi Chef</div>
        </div>
      </div>
    </div>
  );
}

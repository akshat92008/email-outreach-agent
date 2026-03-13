import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Mic, Image as ImageIcon, ArrowUp } from "lucide-react";

export default function HeroSearch({ onSearch, isMinimized }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: isMinimized ? -100 : 0,
        scale: isMinimized ? 0.9 : 1,
      }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-4xl mx-auto px-4 z-10 ${
        isMinimized ? "fixed top-12 left-1/2 -translate-x-1/2" : ""
      }`}
    >
      {!isMinimized && (
        <h1 className="text-4xl md:text-5xl font-semibold text-white text-center mb-10 tracking-tight">
          What can I do for you?
        </h1>
      )}

      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex flex-col bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#9D4EDD]/40 transition-all duration-500 shadow-2xl">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Assign a task or ask anything"
            className="w-full bg-transparent text-white px-6 pt-6 pb-20 outline-none placeholder:text-slate-500 transition-all text-xl font-light border-none focus:ring-0 resize-none min-h-[160px]"
            disabled={isMinimized}
          />
          
          <div className="absolute bottom-4 left-4 flex items-center gap-1">
            <button type="button" className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
              <Plus size={20} />
            </button>
            <button type="button" className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
              <Mic size={20} />
            </button>
            <button type="button" className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
              <ImageIcon size={20} />
            </button>
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#9D4EDD] uppercase tracking-widest bg-[#9D4EDD]/10 px-2.5 py-1 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-[#9D4EDD] animate-pulse" />
              Connected
            </div>
            <button
              type="submit"
              className={`p-2 bg-white/10 text-white rounded-full hover:bg-[#9D4EDD] transition-all duration-300 ${
                query.trim() ? "opacity-100 scale-100" : "opacity-30 scale-95 pointer-events-none"
              }`}
            >
              <ArrowUp size={22} />
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

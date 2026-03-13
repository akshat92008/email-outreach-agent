import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight, Zap } from "lucide-react";

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
        y: isMinimized ? -140 : 0,
        scale: isMinimized ? 0.85 : 1,
      }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-4xl mx-auto px-4 z-10 ${
        isMinimized ? "fixed top-12 left-1/2 -translate-x-1/2" : ""
      }`}
    >
      {!isMinimized && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9D4EDD]/10 border border-[#9D4EDD]/20 mb-6 group cursor-default">
            <Sparkles size={12} className="text-[#9D4EDD] group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-bold text-[#9D4EDD] uppercase tracking-[0.2em]">Next-Gen Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-tight">
            Discover high-intent leads.
          </h1>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="relative group">
        <div className={`relative flex items-center bg-[#1A1A1A] border rounded-2xl transition-all duration-500 shadow-2xl overflow-hidden ${
          isMinimized ? "py-3 px-4 border-white/5" : "py-4 px-5 border-white/10 group-focus-within:border-[#9D4EDD]/50 group-focus-within:ring-4 group-focus-within:ring-[#9D4EDD]/10 group-hover:border-white/20"
        }`}>
          <div className="flex items-center justify-center p-2 text-slate-500">
            <Zap size={18} className={query.trim() ? "text-[#9D4EDD]" : ""} />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Find 50 plumbers in Seattle with outdated websites..."
            className="w-full bg-transparent text-white px-4 outline-none placeholder:text-slate-600 transition-all text-lg font-light border-none focus:ring-0"
            disabled={isMinimized}
          />

          <div className="flex items-center gap-3">
             <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9D4EDD] animate-pulse" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Connected</span>
             </div>
             <button
                type="submit"
                className={`p-2.5 rounded-xl transition-all duration-500 ${
                  query.trim() 
                    ? "bg-[#9D4EDD] text-white shadow-[0_0_15px_rgba(157,78,221,0.4)]" 
                    : "bg-white/5 text-slate-600 pointer-events-none"
                }`}
              >
                <ArrowRight size={20} />
              </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

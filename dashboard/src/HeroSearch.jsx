import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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
        y: isMinimized ? -200 : 0,
        scale: isMinimized ? 0.8 : 1,
      }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-3xl mx-auto px-4 z-10 transition-all duration-700 ${
        isMinimized ? "absolute top-20 left-1/2 -translate-x-1/2" : ""
      }`}
    >
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9D4EDD] to-[#9D4EDD] rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-[#121212] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#9D4EDD]/50 transition-all duration-500">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find me roofing contractors in Seattle with slow websites..."
            className="w-full bg-transparent text-white px-6 py-5 outline-none placeholder:text-slate-500 transition-all text-lg font-light border-none focus:ring-0"
            disabled={isMinimized}
          />
          <button
            type="submit"
            className={`p-4 mr-2 text-slate-400 hover:text-[#9D4EDD] transition-colors duration-300 ${
              isMinimized ? "opacity-0" : "opacity-100"
            }`}
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </form>
      {!isMinimized && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center text-slate-500 text-sm font-light tracking-wide"
        >
          Try natural language: <span className="text-white/40 italic">"Find high-intent leads in the SaaS sector..."</span>
        </motion.p>
      )}
    </motion.div>
  );
}

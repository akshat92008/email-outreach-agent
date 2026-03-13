import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroSearch from "./HeroSearch";
import TerminalLoader from "./TerminalLoader";
import ResultsLedger from "./ResultsLedger";

export default function LeadGenSearch() {
  const [state, setState] = useState("idle");

  const handleSearch = (query) => {
    setState("loading");
    
    // Simulate loading time for the terminal aesthetic
    setTimeout(() => {
      setState("results");
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#9D4EDD]/30 selection:text-white relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(157,78,221,0.03)_0%,_transparent_50%)] pointer-events-none" />

      {/* Nav Placeholder */}
      <nav className="fixed top-0 w-full z-50 p-8 flex justify-between items-center bg-gradient-to-b from-[#121212] to-transparent">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setState("idle")}>
          <div className="w-8 h-8 rounded bg-[#9D4EDD] flex items-center justify-center font-bold text-black text-xs group-hover:rotate-12 transition-transform duration-300">LP</div>
          <span className="font-light tracking-[0.2em] text-sm group-hover:tracking-[0.3em] transition-all">LEAD GEN PRO</span>
        </div>
        <div className="flex gap-8 text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => window.location.href = '/'}>Back to Dashboard</span>
          <span className="hover:text-white cursor-pointer transition-colors">Engine</span>
          <span className="hover:text-white cursor-pointer transition-colors">Docs</span>
        </div>
      </nav>

      <div className="relative pt-40 pb-20 flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div className="text-center mb-12">
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-7xl font-light tracking-tight mb-4"
                >
                  Find any lead. <span className="text-slate-600">Instantly.</span>
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-500 font-light tracking-wide max-w-xl mx-auto"
                >
                   The first natural language lead search engine designed for high-ticket B2B growth.
                </motion.p>
              </div>
              <HeroSearch onSearch={handleSearch} isMinimized={false} />
            </motion.div>
          )}

          {state === "loading" && (
            <motion.div
              key="loading-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full"
            >
              <HeroSearch onSearch={() => {}} isMinimized={true} />
              <TerminalLoader />
            </motion.div>
          )}

          {state === "results" && (
            <motion.div
              key="results-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center"
            >
              <HeroSearch onSearch={() => {}} isMinimized={true} />
              <ResultsLedger />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Minimalist */}
      <footer className="fixed bottom-0 w-full p-8 flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-700 pointer-events-none">
        <span>LeadGenPro V1.0 - Local Engine</span>
        <span>AMAURA STUDIO DESIGN</span>
      </footer>
    </div>
  );
}

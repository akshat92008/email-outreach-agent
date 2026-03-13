import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import HeroSearch from "./HeroSearch";
import TerminalLoader from "./TerminalLoader";
import ResultsLedger from "./ResultsLedger";
import Sidebar from "./Sidebar";
import ActionGrid from "./ActionGrid";

const mockResults = [
  { id: 1, name: "Skyline Ventures", city: "Seattle", score: 98, intent: "High", gap: "No Website" },
  { id: 2, name: "Peak Performers", city: "Portland", score: 85, intent: "Medium", gap: "Slow Mobile" },
  { id: 3, name: "Azure Solutions", city: "Bellevue", score: 92, intent: "High", gap: "SEO Issues" },
];

export default function LeadGenSearch() {
  const [state, setState] = useState("idle"); // idle | loading | results
  const [query, setQuery] = useState("");

  const handleSearch = (q) => {
    setQuery(q);
    setState("loading");
    // Simulate API delay
    setTimeout(() => {
      setState("results");
    }, 4500);
  };

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden font-sans text-slate-200 antialiased selection:bg-[#9D4EDD]/30 selection:text-white">
      {/* Sidebar Shell */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col items-center p-8 overflow-y-auto bg-[#121212]">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <div key="hero" className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <HeroSearch onSearch={handleSearch} isMinimized={false} />
              <ActionGrid />
              
              <div className="mt-20 text-center">
                <div className="inline-flex items-center gap-4 px-6 py-3 bg-[#1A1A1A] rounded-2xl border border-[#9D4EDD]/20 group hover:border-[#9D4EDD]/50 transition-all cursor-pointer shadow-2xl">
                   <div className="w-10 h-10 rounded-full bg-[#121212] flex items-center justify-center border border-[#9D4EDD]/20 group-hover:border-[#9D4EDD]/50 transition-all">
                     <span className="text-sm">🤖</span>
                   </div>
                   <div className="text-left">
                     <p className="text-[10px] font-bold text-[#9D4EDD] uppercase tracking-[0.2em] leading-tight mb-0.5">Scraping Engine v4.0</p>
                     <p className="text-sm font-medium text-white group-hover:text-[#9D4EDD] transition-colors leading-tight">B2B Lead Discovery Active</p>
                   </div>
                </div>
              </div>
            </div>
          )}

          {state === "loading" && (
            <div key="loading" className="w-full flex-1 flex flex-col pt-32">
               <HeroSearch isMinimized={true} />
               <div className="flex-1 flex items-center justify-center">
                 <TerminalLoader onComplete={() => {}} />
               </div>
            </div>
          )}

          {state === "results" && (
            <div key="results" className="w-full flex-1 flex flex-col pt-32 max-w-5xl mx-auto">
              <HeroSearch isMinimized={true} />
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full px-4 mt-12 pb-20"
              >
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-white text-2xl font-bold tracking-tight flex items-center gap-3">
                      <Sparkles size={20} className="text-[#9D4EDD]" />
                      Intelligence Brief
                    </h2>
                    <p className="text-slate-500 text-sm font-light">
                      AI identified {mockResults.length} high-intent matches based on your criteria.
                    </p>
                  </div>
                  <button onClick={() => setState('idle')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-all">
                    New Intelligence Task
                  </button>
                </div>

                <div className="space-y-4">
                  <ResultsLedger results={mockResults} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Footer Elements */}
        {!state === "idle" && (
            <div className="absolute bottom-8 right-8 text-[10px] font-bold text-white/20 uppercase tracking-widest select-none">
                AMAURA STUDIO DESIGN
            </div>
        )}
      </main>
    </div>
  );
}

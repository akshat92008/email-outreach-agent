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
      <main className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <div key="hero" className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <HeroSearch onSearch={handleSearch} isMinimized={false} />
              <ActionGrid />
              
              <div className="mt-16 text-center">
                <div className="inline-flex items-center gap-4 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 group hover:border-[#9D4EDD]/30 transition-all cursor-pointer">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 group-hover:bg-[#9D4EDD]/20 group-hover:border-[#9D4EDD]/40 transition-all">
                     <span className="text-sm">🤖</span>
                   </div>
                   <div className="text-left">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Featured Agent</p>
                     <p className="text-sm font-medium text-white group-hover:text-[#9D4EDD] transition-colors">B2B Lead Discovery Agent v4</p>
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
            <div key="results" className="w-full flex-1 flex flex-col pt-32">
              <HeroSearch isMinimized={true} />
              <div className="w-full max-w-5xl mx-auto px-4 mt-8 pb-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-white text-xl font-bold flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#9D4EDD] rounded-full shadow-[0_0_10px_#9D4EDD]"></div>
                    Market Intent Analysis
                  </h2>
                  <button onClick={() => setState('idle')} className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                    Reset View
                  </button>
                </div>
                <ResultsLedger results={mockResults} />
              </div>
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

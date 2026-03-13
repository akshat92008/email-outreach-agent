import React from "react";
import { motion } from "framer-motion";

const mockResults = [
  { name: "Blue Ridge Roofing", score: 98, intent: "high" },
  { name: "Summit View Contractors", score: 94, intent: "high" },
  { name: "Emerald City Exteriors", score: 89, intent: "high" },
  { name: "Rainier Rain Gutters", score: 87, intent: "high" },
  { name: "Olympic Siding & Roof", score: 85, intent: "high" },
  { name: "Cascade Construction", score: 82, intent: "high" },
];

export default function ResultsLedger() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto mt-32 px-4"
    >
      <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <h2 className="text-xl font-light tracking-widest text-[#9D4EDD]">INTENT LEDGER</h2>
        <span className="text-xs text-slate-500 uppercase tracking-widest">{mockResults.length} High Intent Signals Found</span>
      </div>

      <div className="space-y-1">
        {mockResults.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group flex items-center justify-between py-4 px-6 bg-[#121212] hover:bg-white/[0.02] border-b border-white/[0.02] transition-all cursor-pointer rounded-lg"
          >
            <div className="flex items-center gap-6">
              <span className="text-white/10 font-mono text-xs">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-white group-hover:text-[#9D4EDD] transition-colors duration-300 tracking-wide font-light">
                {result.name}
              </span>
            </div>
            
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Intent Signal</span>
              </div>

              <div className="px-3 py-1 bg-[#1a1a1a] border border-white/5 rounded-full group-hover:border-[#9D4EDD]/30 transition-all">
                <span className="text-xs font-mono text-white/50 group-hover:text-white transition-colors">
                  {result.score}% <span className="text-[10px] ml-1 opacity-50">CONFIDENCE</span>
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 block mx-auto text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
      >
        Export Raw Schema (CSV/JSON)
      </motion.button>
    </motion.div>
  );
}

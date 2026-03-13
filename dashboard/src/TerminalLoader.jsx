import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const logs = [
  "> Booting local engine...",
  "> Establishing secure connection to LeadEngine-V1...",
  "> Scanning 12.4M business records...",
  "> Filtering for intent signals: 'High'",
  "> Parsing NLP intent from query...",
  "> Analyzing website health signals...",
  "> Cross-referencing LinkedIn datasets...",
  "> Validating lead contact sequences...",
  "> Compiling final results ledger...",
];

export default function TerminalLoader() {
  const [visibleLogs, setVisibleLogs] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLogs((prev) => {
        if (prev.length < logs.length) {
          return [...prev, logs[prev.length]];
        }
        return prev;
      });
    }, 400);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mt-20 font-mono text-sm">
      <div className="bg-[#121212]/50 border border-white/5 rounded-lg p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex gap-2 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {visibleLogs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[#9D4EDD] opacity-80"
              >
                <span className="text-white/20 mr-2">[{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-4 bg-[#9D4EDD]/40 align-middle ml-1"
          />
        </div>
      </div>
      <p className="mt-6 text-center text-slate-500 font-light animate-pulse">
        Our AI is processing thousands of signals for your search...
      </p>
    </div>
  );
}

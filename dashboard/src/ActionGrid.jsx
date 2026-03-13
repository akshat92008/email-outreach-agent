import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function ActionGrid() {
  const templates = [
    { label: 'HVAC with no websites' },
    { label: 'Recently funded SaaS' },
    { label: 'Local bakeries over 5 years old' },
    { label: 'Real estate agents in Dubai' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-10 max-w-4xl mx-auto">
      {templates.map((template, i) => (
        <button
          key={i}
          className="group flex items-center gap-3 px-5 py-2.5 bg-[#1A1A1A] border border-white/5 rounded-2xl text-slate-300 text-sm hover:bg-[#242424] hover:border-[#9D4EDD]/30 transition-all duration-500 shadow-xl"
        >
          <Sparkles size={14} className="text-[#9D4EDD] group-hover:scale-125 transition-transform" />
          <span className="font-medium group-hover:text-white transition-colors">{template.label}</span>
          <ArrowRight size={12} className="text-slate-600 group-hover:translate-x-1 group-hover:text-[#9D4EDD] transition-all" />
        </button>
      ))}
    </div>
  );
}

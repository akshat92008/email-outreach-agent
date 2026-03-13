import React from 'react';
import { PencilLine, Globe, Monitor, Palette, MoreHorizontal } from 'lucide-react';

export default function ActionGrid() {
  const actions = [
    { icon: <PencilLine size={16} />, label: 'Create slides' },
    { icon: <Globe size={16} />, label: 'Build website' },
    { icon: <Monitor size={16} />, label: 'Develop apps' },
    { icon: <Palette size={16} />, label: 'Design' },
    { icon: <MoreHorizontal size={16} />, label: 'More' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-8 max-w-2xl mx-auto">
      {actions.map((action, i) => (
        <button
          key={i}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-slate-300 text-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <span className="text-[#9D4EDD] opacity-80">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}

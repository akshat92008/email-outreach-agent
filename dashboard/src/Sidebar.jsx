import React from 'react';
import { Search, BarChart3, Bookmark, Settings, Plus, User } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { icon: <Search size={18} />, label: 'Search', active: true },
    { icon: <BarChart3 size={18} />, label: 'Campaigns' },
    { icon: <Bookmark size={18} />, label: 'Saved Leads' },
    { icon: <Settings size={18} />, label: 'Agent Settings' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0D0D0D] border-r border-white/5 flex flex-col p-4 z-20">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-9 h-9 bg-gradient-to-br from-[#9D4EDD] to-[#7B2CBF] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#9D4EDD]/20">
          LP
        </div>
        <div className="flex flex-col">
          <span className="text-white font-semibold tracking-tight text-sm">Lead Gen Pro</span>
          <span className="text-[#9D4EDD] text-[10px] font-bold uppercase tracking-widest leading-none">Intelligence</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item, i) => (
          <button
            key={i}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
              item.active 
                ? 'bg-[#9D4EDD]/10 text-white border border-[#9D4EDD]/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <span className={item.active ? 'text-[#9D4EDD]' : ''}>{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 group-hover:border-[#9D4EDD]/50 transition-all">
            <User size={16} className="text-slate-400 group-hover:text-white" />
          </div>
          <div className="flex flex-col items-start truncate text-left overflow-hidden">
            <span className="text-xs font-semibold text-white truncate w-full">Akshat Singh</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Free Plan</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

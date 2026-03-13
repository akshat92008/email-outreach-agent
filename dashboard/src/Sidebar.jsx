import React from 'react';
import { Plus, LayoutGrid, Search, Library, Users, User } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { icon: <Plus size={18} />, label: 'New task', active: true },
    { icon: <Users size={18} />, label: 'Agents', badge: 'New' },
    { icon: <Search size={18} />, label: 'Search' },
    { icon: <Library size={18} />, label: 'Library' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0A0A0A] border-r border-white/5 flex flex-col p-4 z-20">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 bg-[#9D4EDD] rounded flex items-center justify-center text-white font-bold text-xs">
          LP
        </div>
        <span className="text-white font-medium tracking-tight">Lead Gen Pro</span>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item, i) => (
          <button
            key={i}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              item.active 
                ? 'bg-white/5 text-white' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 text-sm">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-[#9D4EDD]/20 text-[#9D4EDD] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4 px-2">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Projects</div>
        <button className="flex items-center gap-3 text-slate-400 text-sm hover:text-white transition-colors">
          <Plus size={16} />
          <span>New project</span>
        </button>
        
        <div className="pt-4 border-t border-white/5">
          <button className="flex items-center gap-3 text-slate-300 text-sm hover:text-white transition-colors">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
              <User size={14} />
            </div>
            <span>Akshat Singh</span>
          </button>
        </div>
      </div>
    </aside>
  );
}


import React from 'react';
import { LayoutDashboard, Wallet, Umbrella, TrendingUp, Building2, Menu, X, Target, Briefcase, ArrowRight } from 'lucide-react';
import { TabId } from '../types';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  isBusinessView?: boolean; // Are we viewing a client?
  onBackToBusiness?: () => void; // Function to go back
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, toggleSidebar, isBusinessView, onBackToBusiness }) => {
  const menuItems = [
    { id: 'dashboard' as TabId, label: 'סיכום פיננסי', icon: LayoutDashboard },
    { id: 'goals' as TabId, label: 'מטרות ויעדים', icon: Target },
    { id: 'accounts' as TabId, label: 'עו"ש וביטחון', icon: Wallet },
    { id: 'pension' as TabId, label: 'פנסיה וגמל', icon: Umbrella },
    { id: 'investments' as TabId, label: 'השקעות', icon: TrendingUp },
    { id: 'realestate' as TabId, label: 'נדל"ן', icon: Building2 },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Content */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:shadow-none border-l border-slate-800 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">WealthFlow IL</h1>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white transition">
             <X size={24} />
          </button>
        </div>

        {/* Business Back Button */}
        {isBusinessView && onBackToBusiness && (
            <div className="px-4 mt-6">
                <button 
                    onClick={onBackToBusiness}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-900/20"
                >
                    <ArrowRight size={18} />
                    <span>חזרה ללקוחות</span>
                </button>
                <div className="flex items-center gap-2 px-2 mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Briefcase size={12}/>
                    מצב צפייה בלקוח
                </div>
            </div>
        )}

        <nav className="mt-6 px-4 space-y-3 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-slate-800 text-white font-medium shadow-lg shadow-black/20 ring-1 ring-slate-700' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-r-full" />}
                <Icon size={22} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-slate-800/50">
           <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">IL</div>
              <div className="text-xs text-slate-400">
                 <div>Israel Mode</div>
                 <div className="text-slate-500">v2.3 Pro</div>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  FileText, 
  FolderKanban, 
  CheckCheck, 
  FileSpreadsheet, 
  X,
  TrendingUp,
  Percent,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen
}) => {
  const { t, bankers, agents, loanFiles, role, language } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: t.dashboard,
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'bankerDirectory',
      label: t.bankerDirectory,
      icon: Users,
      badge: bankers.length,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    },
    {
      id: 'bankPayoutCashflow',
      label: t.bankPayoutCashflow,
      icon: ArrowLeftRight,
      badge: '₹ In/Out',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    },
    {
      id: 'agentStatements',
      label: t.agentStatements,
      icon: FileText,
      badge: agents.length,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    },
    {
      id: 'loanFiles',
      label: t.loanFiles,
      icon: FolderKanban,
      badge: loanFiles.length,
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    },
    {
      id: 'reconciliation',
      label: t.reconciliation,
      icon: CheckCheck,
      badge: 'Auto',
      badgeColor: 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
    },
    {
      id: 'bankPortals',
      label: language === 'hi' ? 'बैंक लॉगिन पोर्टल' : 'Bank Login Portals',
      icon: ExternalLink,
      badge: 'SSO',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
    },
    {
      id: 'excelImporter',
      label: t.excelImporter,
      icon: FileSpreadsheet,
      badge: 'Paste',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
    }
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      
      {/* Mobile Header in Drawer */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800 md:hidden">
        <div className="font-bold text-white text-base">Navigation Menu</div>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-slate-500">
          Core Modules
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                  : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Information Card */}
      <div className="p-3 border-t border-slate-800">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>DSA Channel Status</span>
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
            Multi-Bank Sync & Excel Paste Enabled. Ready for bulk import.
          </p>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 shadow-xl">
        {navContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-50 shadow-2xl animate-in slide-in-from-left">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Languages, 
  Bell, 
  UserCheck, 
  ShieldAlert, 
  FileSpreadsheet, 
  RotateCcw,
  Menu,
  ChevronDown,
  Sparkles,
  Trash2,
  Download,
  Smartphone
} from 'lucide-react';
import { UserRole } from '../types';
import { GlobalSearchBar } from './GlobalSearchBar';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNotifications: () => void;
  onOpenLogin: () => void;
  onOpenDataManagement: () => void;
  onOpenOfflineGuide?: () => void;
  onNavigateToTab: (tabId: string, searchQuery?: string, agentId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenMobileMenu, 
  onOpenNotifications,
  onOpenLogin,
  onOpenDataManagement,
  onOpenOfflineGuide,
  onNavigateToTab 
}) => {
  const { language, setLanguage, t, role, setRole, notifications, exportBackupJson } = useApp();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, { en: string; hi: string; color: string }> = {
    Administrator: { en: 'Administrator (Full)', hi: 'एडमिनिस्ट्रेटर (पूर्ण)', color: 'bg-emerald-600 text-white' },
    Manager: { en: 'Manager (Reports)', hi: 'मैनेजर (रिपोर्ट्स)', color: 'bg-blue-600 text-white' },
    Agent: { en: 'DSA Agent (Self)', hi: 'DSA एजेंट (व्यक्तिगत)', color: 'bg-amber-600 text-white' }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Brand & Mobile Hamburger */}
          <div className="flex items-center space-x-3 shrink-0">
            <button 
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div 
              className="flex items-center space-x-2.5 cursor-pointer group"
              onClick={() => onNavigateToTab('dashboard')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                    {t.appName}
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    PRO
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Global Search Bar (Client Names, Loan Application IDs, Banks) */}
          <GlobalSearchBar onNavigateToTab={onNavigateToTab} />

          {/* Center Quick Shortcut Buttons (Extra-Large Screens) */}
          <div className="hidden xl:flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => onNavigateToTab('bankPortals')}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'hi' ? 'पोर्टल' : 'Portals'}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('excelImporter')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{t.pasteExcel}</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </button>
            <button
              onClick={() => onNavigateToTab('bankerDirectory')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
            >
              <span>{t.searchBankers}</span>
            </button>
            <button
              onClick={exportBackupJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold transition-all shadow-sm"
              title={language === 'hi' ? '1-क्लिक पूरा डेटा बैकअप डाउनलोड करें' : 'Download 1-Click Full Backup'}
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>{language === 'hi' ? 'बैकअप डाउनलोड' : 'Backup'}</span>
            </button>
            {onOpenOfflineGuide && (
              <button
                onClick={onOpenOfflineGuide}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all shadow-sm"
                title={language === 'hi' ? 'ऑफलाइन कैसे चलाएं एवं ऐप इंस्टॉल गाइड' : 'How to Run Offline & Install PWA'}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'ऑफलाइन चलाएं' : 'Offline / App'}</span>
              </button>
            )}
            <button
              onClick={onOpenDataManagement}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all shadow-sm"
              title={language === 'hi' ? 'डेटा प्रबंधन, बैकअप और सैंपल हटाएं' : 'Data Manager & Clear Demo'}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'hi' ? 'डेटा मैनेजर' : 'Data Manager'}</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Multilingual Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'hi' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'en' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
              title={t.notifications}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline text-slate-200">
                  {roleLabels[role][language]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {t.activeRole}
                    </p>
                  </div>
                  {(['Administrator', 'Manager', 'Agent'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        role === r ? 'text-emerald-400 bg-slate-800/60 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>{roleLabels[r]?.[language] || r}</span>
                      {role === r && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                  
                  <div className="border-t border-slate-800 mt-1 pt-1 px-1">
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        onOpenLogin();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded flex items-center space-x-1.5 transition-colors font-semibold"
                    >
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span>Switch / Login Credentials</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        onOpenDataManagement();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 rounded flex items-center space-x-1.5 transition-colors font-medium"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>{language === 'hi' ? 'डेटा प्रबंधन / सैंपल हटाएं' : 'Data Manager / Clear Demo'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

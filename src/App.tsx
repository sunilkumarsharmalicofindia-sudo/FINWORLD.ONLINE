import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { BankerDirectory } from './components/BankerDirectory';
import { BankPayoutCashFlow } from './components/BankPayoutCashFlow';
import { AgentStatements } from './components/AgentStatements';
import { LoanFilesManager } from './components/LoanFilesManager';
import { ReconciliationEngine } from './components/ReconciliationEngine';
import { ExcelPasteImporter } from './components/ExcelPasteImporter';
import { BankPortalVault } from './components/BankPortalVault';
import { NotificationModal } from './components/NotificationModal';
import { LoginModal } from './components/LoginModal';
import { DataManagementModal } from './components/DataManagementModal';
import { OfflineGuideModal } from './components/OfflineGuideModal';
import { ShieldCheck, UserCheck, Lock } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { role, selectedAgentId, agents, language } = useApp();
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showDataManagementModal, setShowDataManagementModal] = useState<boolean>(false);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [statementAgentId, setStatementAgentId] = useState<string | null>(null);
  const [tabSearchQueries, setTabSearchQueries] = useState<{ [tabId: string]: string }>({});

  // If role is Agent, restrict certain master company screens
  const isAgent = role === 'Agent';
  const currentAgentObj = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleNavigateToTab = (tabId: string, searchQuery?: string, agentId?: string) => {
    if (searchQuery !== undefined) {
      setTabSearchQueries(prev => ({ ...prev, [tabId]: searchQuery }));
    }
    if (agentId) {
      setStatementAgentId(agentId);
    }
    setActiveTab(tabId);
  };

  const handleOpenStatementForAgent = (agentId: string) => {
    setStatementAgentId(agentId);
    setActiveTab('agentStatements');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Sticky Header */}
      <Header
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenDataManagement={() => setShowDataManagementModal(true)}
        onOpenOfflineGuide={() => setShowOfflineModal(true)}
        onNavigateToTab={handleNavigateToTab}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
          
          {/* Agent Privacy & Access Notice */}
          {isAgent && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong className="font-bold">Role: DSA Agent ({currentAgentObj?.name} - {currentAgentObj?.code})</strong> — Private session active. Displaying personal loan files, bank login portal, and commission ledger.
                </span>
              </div>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 font-bold text-amber-900 text-[11px] shrink-0 ml-2"
              >
                Switch Role
              </button>
            </div>
          )}

          {/* Tab Views */}
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateToTab={handleNavigateToTab}
              onOpenStatementForAgent={handleOpenStatementForAgent}
            />
          )}

          {activeTab === 'bankerDirectory' && (
            <BankerDirectory
              initialSearchQuery={tabSearchQueries['bankerDirectory']}
              onOpenPasteImporter={() => setActiveTab('excelImporter')}
            />
          )}

          {activeTab === 'bankPayoutCashflow' && (
            <BankPayoutCashFlow
              initialSearchQuery={tabSearchQueries['bankPayoutCashflow']}
            />
          )}

          {activeTab === 'agentStatements' && (
            <AgentStatements
              initialSelectedAgentId={statementAgentId || (isAgent ? selectedAgentId : undefined)}
            />
          )}

          {activeTab === 'loanFiles' && (
            <LoanFilesManager
              initialSearchQuery={tabSearchQueries['loanFiles']}
            />
          )}

          {activeTab === 'reconciliation' && (
            <ReconciliationEngine />
          )}

          {activeTab === 'bankPortals' && (
            <BankPortalVault />
          )}

          {activeTab === 'excelImporter' && (
            <ExcelPasteImporter
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
            />
          )}

        </main>
      </div>

      {/* Notifications Drawer Modal */}
      {showNotifications && (
        <NotificationModal
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Multi-User Login & Auth Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Data Management & Clear Example Modal */}
      {showDataManagementModal && (
        <DataManagementModal
          onClose={() => setShowDataManagementModal(false)}
          onOpenPasteImporter={() => setActiveTab('excelImporter')}
        />
      )}

      {/* Offline PWA Setup & Installation Guide */}
      {showOfflineModal && (
        <OfflineGuideModal
          onClose={() => setShowOfflineModal(false)}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

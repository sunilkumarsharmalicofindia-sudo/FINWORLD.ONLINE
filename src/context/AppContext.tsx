import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Banker, 
  Agent, 
  LoanFile, 
  FinancialTransaction, 
  MonthlyReconciliation, 
  AppNotification, 
  UserRole, 
  Language 
} from '../types';
import { 
  INITIAL_BANKERS, 
  INITIAL_AGENTS, 
  INITIAL_LOAN_FILES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_RECONCILIATIONS, 
  INITIAL_NOTIFICATIONS 
} from '../data/seedData';
import { translations } from '../translations';

interface AppContextType {
  // Multilingual & User Role
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;

  // Data Collections
  bankers: Banker[];
  agents: Agent[];
  loanFiles: LoanFile[];
  transactions: FinancialTransaction[];
  reconciliations: MonthlyReconciliation[];
  notifications: AppNotification[];

  // Banker CRUD & Bulk
  addBanker: (banker: Omit<Banker, 'id' | 'updatedAt'>) => void;
  updateBanker: (id: string, banker: Partial<Banker>) => void;
  deleteBanker: (id: string) => void;
  bulkAddBankers: (newBankers: Omit<Banker, 'id' | 'updatedAt'>[]) => number;

  // Agent CRUD & Bulk
  addAgent: (agent: Omit<Agent, 'id' | 'joinedDate'>) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  bulkAddAgents: (newAgents: Omit<Agent, 'id' | 'joinedDate'>[]) => number;

  // Loan Files CRUD & Bulk
  addLoanFile: (file: Omit<LoanFile, 'id'>) => void;
  updateLoanFile: (id: string, file: Partial<LoanFile>) => void;
  deleteLoanFile: (id: string) => void;
  bulkAddLoanFiles: (newFiles: Omit<LoanFile, 'id'>[]) => number;

  // Financial Transactions
  recordInflow: (tx: Omit<FinancialTransaction, 'id' | 'type'>) => void;
  recordOutflow: (tx: Omit<FinancialTransaction, 'id' | 'type'>) => void;
  deleteTransaction: (id: string) => void;

  // Reconciliation Engine
  runMonthlyReconciliation: (monthYear: string, bankName?: string) => MonthlyReconciliation[];

  // Notifications
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Reset to initial demo data
  resetToDemoData: () => void;

  // Clear demo / example data
  clearAllExampleData: () => void;
  clearBankersData: () => void;
  clearLoanFilesData: () => void;
  clearTransactionsData: () => void;
  clearAgentsData: () => void;

  // Backup & Recovery
  exportBackupJson: () => void;
  importBackupJson: (jsonString: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use seed data
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('dsa_lang') as Language) || 'hi';
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('dsa_role') as UserRole;
    if (saved && (saved === 'Administrator' || saved === 'Manager' || saved === 'Agent')) {
      return saved;
    }
    return 'Administrator';
  });

  // Helper to identify demo / sample records
  const isDemoRecord = (id: string | undefined): boolean => {
    if (!id) return false;
    return (
      id.startsWith('bnk-') ||
      id.startsWith('agt-') ||
      id.startsWith('file-') ||
      id.startsWith('tx-') ||
      id.startsWith('rec-') ||
      id.startsWith('notif-')
    );
  };

  const getCleanStorageArray = <T extends { id?: string }>(key: string): T[] => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Strip any demo records permanently
      return parsed.filter((item: T) => !isDemoRecord(item?.id));
    } catch {
      return [];
    }
  };

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() => {
    const saved = localStorage.getItem('dsa_selected_agent');
    return saved && !isDemoRecord(saved) ? saved : null;
  });

  const [bankers, setBankers] = useState<Banker[]>(() => getCleanStorageArray<Banker>('dsa_bankers'));
  const [agents, setAgents] = useState<Agent[]>(() => getCleanStorageArray<Agent>('dsa_agents'));
  const [loanFiles, setLoanFiles] = useState<LoanFile[]>(() => getCleanStorageArray<LoanFile>('dsa_loan_files'));
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => getCleanStorageArray<FinancialTransaction>('dsa_transactions'));
  const [reconciliations, setReconciliations] = useState<MonthlyReconciliation[]>(() => getCleanStorageArray<MonthlyReconciliation>('dsa_reconciliations'));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getCleanStorageArray<AppNotification>('dsa_notifications'));

  // Auto-purge all demo data permanently from client storage on startup
  useEffect(() => {
    ['dsa_bankers', 'dsa_agents', 'dsa_loan_files', 'dsa_transactions', 'dsa_reconciliations', 'dsa_notifications'].forEach(key => {
      try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const parsed = JSON.parse(itemStr);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((item: any) => !isDemoRecord(item?.id));
            localStorage.setItem(key, JSON.stringify(cleaned));
          }
        } else {
          localStorage.setItem(key, '[]');
        }
      } catch {
        localStorage.setItem(key, '[]');
      }
    });

    const selAgent = localStorage.getItem('dsa_selected_agent');
    if (selAgent && isDemoRecord(selAgent)) {
      localStorage.removeItem('dsa_selected_agent');
      setSelectedAgentId(null);
    }
    localStorage.setItem('dsa_demo_purged_v4', 'true');
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('dsa_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('dsa_role', role);
  }, [role]);

  useEffect(() => {
    if (selectedAgentId) {
      localStorage.setItem('dsa_selected_agent', selectedAgentId);
    } else {
      localStorage.removeItem('dsa_selected_agent');
    }
  }, [selectedAgentId]);

  useEffect(() => {
    localStorage.setItem('dsa_bankers', JSON.stringify(bankers));
  }, [bankers]);

  useEffect(() => {
    localStorage.setItem('dsa_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('dsa_loan_files', JSON.stringify(loanFiles));
  }, [loanFiles]);

  useEffect(() => {
    localStorage.setItem('dsa_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('dsa_reconciliations', JSON.stringify(reconciliations));
  }, [reconciliations]);

  useEffect(() => {
    localStorage.setItem('dsa_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const t = translations[language];

  // Helper notification adder
  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Banker Actions
  const addBanker = (bankerData: Omit<Banker, 'id' | 'updatedAt'>) => {
    const newBanker: Banker = {
      ...bankerData,
      id: `bnk-${Date.now()}`,
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    setBankers(prev => [newBanker, ...prev]);
    addNotification('Banker Added', `${newBanker.name} (${newBanker.bankName}, ${newBanker.city}) registered successfully.`, 'success');
  };

  const updateBanker = (id: string, updated: Partial<Banker>) => {
    setBankers(prev => prev.map(b => b.id === id ? { ...b, ...updated, updatedAt: new Date().toISOString().slice(0, 10) } : b));
  };

  const deleteBanker = (id: string) => {
    setBankers(prev => prev.filter(b => b.id !== id));
  };

  const bulkAddBankers = (newBankers: Omit<Banker, 'id' | 'updatedAt'>[]): number => {
    const formatted: Banker[] = newBankers.map((b, idx) => ({
      ...b,
      id: `bnk-bulk-${Date.now()}-${idx}`,
      updatedAt: new Date().toISOString().slice(0, 10)
    }));
    setBankers(prev => [...formatted, ...prev]);
    addNotification('Excel Import Completed', `${formatted.length} bankers imported and saved to directory.`, 'success');
    return formatted.length;
  };

  // Agent Actions
  const addAgent = (agentData: Omit<Agent, 'id' | 'joinedDate'>) => {
    const newAgent: Agent = {
      ...agentData,
      id: `agt-${Date.now()}`,
      joinedDate: new Date().toISOString().slice(0, 10)
    };
    setAgents(prev => [newAgent, ...prev]);
    addNotification('Agent Added', `${newAgent.name} (${newAgent.code}) onboarded.`, 'success');
  };

  const updateAgent = (id: string, updated: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  };

  const deleteAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  const bulkAddAgents = (newAgents: Omit<Agent, 'id' | 'joinedDate'>[]): number => {
    const formatted: Agent[] = newAgents.map((a, idx) => ({
      ...a,
      id: `agt-bulk-${Date.now()}-${idx}`,
      joinedDate: new Date().toISOString().slice(0, 10)
    }));
    setAgents(prev => [...formatted, ...prev]);
    addNotification('Agent Import Completed', `${formatted.length} DSA agents imported successfully.`, 'success');
    return formatted.length;
  };

  // Loan Files Actions
  const addLoanFile = (fileData: Omit<LoanFile, 'id'>) => {
    const newFile: LoanFile = {
      ...fileData,
      id: `ln-${Date.now()}`
    };
    setLoanFiles(prev => [newFile, ...prev]);
    addNotification('Loan File Logged', `File #${newFile.fileNo} for ${newFile.borrowerName} (${newFile.bankName}) recorded.`, 'info');
  };

  const updateLoanFile = (id: string, updated: Partial<LoanFile>) => {
    setLoanFiles(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
  };

  const deleteLoanFile = (id: string) => {
    setLoanFiles(prev => prev.filter(f => f.id !== id));
  };

  const bulkAddLoanFiles = (newFiles: Omit<LoanFile, 'id'>[]): number => {
    const formatted: LoanFile[] = newFiles.map((f, idx) => ({
      ...f,
      id: `ln-bulk-${Date.now()}-${idx}`
    }));
    setLoanFiles(prev => [...formatted, ...prev]);
    addNotification('Loan Disbursal Import', `${formatted.length} loan files imported successfully.`, 'success');
    return formatted.length;
  };

  // Transaction Ledger (Inflow / Outflow)
  const recordInflow = (txData: Omit<FinancialTransaction, 'id' | 'type'>) => {
    const newTx: FinancialTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      type: 'Inflow'
    };
    setTransactions(prev => [newTx, ...prev]);

    // If linked to a file, also update file's received amount & status
    if (txData.fileNo) {
      setLoanFiles(prev => prev.map(f => {
        if (f.fileNo.toLowerCase() === txData.fileNo?.toLowerCase()) {
          const totalRecv = (f.bankPayoutReceived || 0) + txData.amount;
          const status = totalRecv >= f.bankPayoutAmount ? 'Received' : 'Partially Received';
          return {
            ...f,
            bankPayoutReceived: totalRecv,
            bankPayoutStatus: status,
            bankPayoutReceivedDate: txData.date,
            bankRefNo: txData.referenceNo
          };
        }
        return f;
      }));
    }

    addNotification('Bank Inflow Recorded', `Received ₹${txData.amount.toLocaleString('en-IN')} from ${txData.bankName}. Ref: ${txData.referenceNo}`, 'success');
  };

  const recordOutflow = (txData: Omit<FinancialTransaction, 'id' | 'type'>) => {
    const newTx: FinancialTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      type: 'Outflow'
    };
    setTransactions(prev => [newTx, ...prev]);

    // If linked to file & agent, update agent payout status
    if (txData.fileNo && txData.agentId) {
      setLoanFiles(prev => prev.map(f => {
        if (f.fileNo.toLowerCase() === txData.fileNo?.toLowerCase()) {
          const totalPaid = (f.agentPayoutPaid || 0) + txData.amount;
          const status = totalPaid >= f.agentPayoutAmount ? 'Paid' : 'Partially Paid';
          return {
            ...f,
            agentPayoutPaid: totalPaid,
            agentPayoutStatus: status,
            agentPayoutPaidDate: txData.date,
            agentPaymentRef: txData.referenceNo
          };
        }
        return f;
      }));
    }

    addNotification('Agent Outflow Recorded', `Disbursed ₹${txData.amount.toLocaleString('en-IN')} to ${txData.agentName || 'Agent'}. Ref: ${txData.referenceNo}`, 'info');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Automated Monthly Reconciliation
  const runMonthlyReconciliation = (monthYear: string, bankFilter?: string): MonthlyReconciliation[] => {
    // Group files by bank in given month
    const banks = bankFilter && bankFilter !== 'all' 
      ? [bankFilter] 
      : Array.from(new Set(loanFiles.map(f => f.bankName)));

    const newRecs: MonthlyReconciliation[] = [];

    banks.forEach(bName => {
      const bankFiles = loanFiles.filter(f => {
        const fileMonth = f.disbursedDate ? f.disbursedDate.slice(0, 7) : f.sanctionDate.slice(0, 7);
        return f.bankName === bName && fileMonth === monthYear;
      });

      if (bankFiles.length === 0) return;

      const totalDisbursedVolume = bankFiles.reduce((sum, f) => sum + (f.loanAmount || 0), 0);
      const expectedBankPayout = bankFiles.reduce((sum, f) => sum + (f.bankPayoutAmount || 0), 0);
      const receivedBankPayout = bankFiles.reduce((sum, f) => sum + (f.bankPayoutReceived || 0), 0);
      const variance = receivedBankPayout - expectedBankPayout;

      const agentCommissionCalculated = bankFiles.reduce((sum, f) => sum + (f.agentPayoutAmount || 0), 0);
      const agentCommissionPaid = bankFiles.reduce((sum, f) => sum + (f.agentPayoutPaid || 0), 0);

      const reconciledFilesCount = bankFiles.filter(f => f.isReconciled || (f.bankPayoutStatus === 'Received' && f.agentPayoutStatus === 'Paid')).length;
      const unreconciledFilesCount = bankFiles.length - reconciledFilesCount;

      let status: 'Fully Reconciled' | 'Discrepancy Detected' | 'Under Review' = 'Fully Reconciled';
      if (Math.abs(variance) > 500 || unreconciledFilesCount > 0) {
        status = 'Discrepancy Detected';
      }

      const recRecord: MonthlyReconciliation = {
        id: `rec-${monthYear}-${bName.replace(/\s+/g, '')}`,
        monthYear,
        bankName: bName,
        totalDisbursedVolume,
        expectedBankPayout,
        receivedBankPayout,
        variance,
        agentCommissionCalculated,
        agentCommissionPaid,
        reconciledFilesCount,
        unreconciledFilesCount,
        status,
        lastReconciledAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      newRecs.push(recRecord);
    });

    setReconciliations(prev => {
      const filtered = prev.filter(r => r.monthYear !== monthYear || (bankFilter && bankFilter !== 'all' && r.bankName !== bankFilter));
      return [...newRecs, ...filtered];
    });

    addNotification(
      'Reconciliation Executed',
      `Auto-reconciliation computed for ${monthYear} across ${newRecs.length} bank channels.`,
      newRecs.some(r => r.status === 'Discrepancy Detected') ? 'warning' : 'success'
    );

    return newRecs;
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const resetToDemoData = () => {
    setBankers([]);
    setAgents([]);
    setLoanFiles([]);
    setTransactions([]);
    setReconciliations([]);
    setNotifications([]);
    localStorage.setItem('dsa_bankers', '[]');
    localStorage.setItem('dsa_agents', '[]');
    localStorage.setItem('dsa_loan_files', '[]');
    localStorage.setItem('dsa_transactions', '[]');
    localStorage.setItem('dsa_reconciliations', '[]');
    localStorage.removeItem('dsa_selected_agent');
    localStorage.setItem('dsa_demo_purged_v4', 'true');
    addNotification('System Cleaned', 'All demo data permanently removed. Clean slate active.', 'success');
  };

  const clearAllExampleData = () => {
    setBankers([]);
    setAgents([]);
    setLoanFiles([]);
    setTransactions([]);
    setReconciliations([]);
    setSelectedAgentId(null);

    localStorage.setItem('dsa_bankers', '[]');
    localStorage.setItem('dsa_agents', '[]');
    localStorage.setItem('dsa_loan_files', '[]');
    localStorage.setItem('dsa_transactions', '[]');
    localStorage.setItem('dsa_reconciliations', '[]');
    localStorage.removeItem('dsa_selected_agent');
    localStorage.setItem('dsa_demo_cleared_v3', 'true');

    addNotification(
      'Demo Data Cleared', 
      'All sample bankers, agents, loan files, and transactions have been completely cleared! System is 100% clean and ready for your real data.', 
      'success'
    );
  };

  const clearBankersData = () => {
    setBankers([]);
    localStorage.setItem('dsa_bankers', '[]');
    addNotification('Bankers Cleared', 'All sample bankers removed. Paste your own Excel bankers now.', 'info');
  };

  const clearLoanFilesData = () => {
    setLoanFiles([]);
    setReconciliations([]);
    localStorage.setItem('dsa_loan_files', '[]');
    localStorage.setItem('dsa_reconciliations', '[]');
    addNotification('Files Cleared', 'Sample loan files and reconciliations cleared.', 'info');
  };

  const clearTransactionsData = () => {
    setTransactions([]);
    localStorage.setItem('dsa_transactions', '[]');
    addNotification('Transactions Cleared', 'Cash flow ledger cleared.', 'info');
  };

  const clearAgentsData = () => {
    setAgents([]);
    setSelectedAgentId(null);
    localStorage.setItem('dsa_agents', '[]');
    localStorage.removeItem('dsa_selected_agent');
    addNotification('Agents Cleared', 'All agents cleared. Paste your own agent list or add new agents.', 'info');
  };

  const exportBackupJson = () => {
    try {
      const backupPayload = {
        app: 'DSA Mitra Pro',
        version: '2.0',
        timestamp: new Date().toISOString(),
        backupDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        stats: {
          bankersCount: bankers.length,
          agentsCount: agents.length,
          loanFilesCount: loanFiles.length,
          transactionsCount: transactions.length,
          reconciliationsCount: reconciliations.length
        },
        data: {
          bankers,
          agents,
          loanFiles,
          transactions,
          reconciliations
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const dateSlug = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `DSA_Mitra_Full_Backup_${dateSlug}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addNotification(
        'Backup Downloaded',
        `Complete backup file downloaded successfully with ${bankers.length} bankers and ${loanFiles.length} loan files. Keep it safe!`,
        'success'
      );
    } catch (err: any) {
      addNotification('Backup Failed', err?.message || 'Could not export backup file.', 'error');
    }
  };

  const importBackupJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      const payload = parsed.data || parsed; // support both wrapped and raw

      let restoredBankers = 0;
      let restoredAgents = 0;
      let restoredFiles = 0;
      let restoredTx = 0;

      if (Array.isArray(payload.bankers)) {
        setBankers(payload.bankers);
        localStorage.setItem('dsa_bankers', JSON.stringify(payload.bankers));
        restoredBankers = payload.bankers.length;
      }
      if (Array.isArray(payload.agents)) {
        setAgents(payload.agents);
        localStorage.setItem('dsa_agents', JSON.stringify(payload.agents));
        restoredAgents = payload.agents.length;
      }
      if (Array.isArray(payload.loanFiles)) {
        setLoanFiles(payload.loanFiles);
        localStorage.setItem('dsa_loan_files', JSON.stringify(payload.loanFiles));
        restoredFiles = payload.loanFiles.length;
      }
      if (Array.isArray(payload.transactions)) {
        setTransactions(payload.transactions);
        localStorage.setItem('dsa_transactions', JSON.stringify(payload.transactions));
        restoredTx = payload.transactions.length;
      }
      if (Array.isArray(payload.reconciliations)) {
        setReconciliations(payload.reconciliations);
        localStorage.setItem('dsa_reconciliations', JSON.stringify(payload.reconciliations));
      }

      addNotification(
        'Backup Restored Successfully',
        `Restored ${restoredBankers} bankers, ${restoredAgents} agents, ${restoredFiles} loan files, and ${restoredTx} ledger transactions!`,
        'success'
      );
      return true;
    } catch (err: any) {
      addNotification('Import Error', 'Invalid backup JSON file. Please select a valid DSA Mitra backup.', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        role,
        setRole,
        selectedAgentId,
        setSelectedAgentId,
        bankers,
        agents,
        loanFiles,
        transactions,
        reconciliations,
        notifications,
        addBanker,
        updateBanker,
        deleteBanker,
        bulkAddBankers,
        addAgent,
        updateAgent,
        deleteAgent,
        bulkAddAgents,
        addLoanFile,
        updateLoanFile,
        deleteLoanFile,
        bulkAddLoanFiles,
        recordInflow,
        recordOutflow,
        deleteTransaction,
        runMonthlyReconciliation,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        resetToDemoData,
        clearAllExampleData,
        clearBankersData,
        clearLoanFilesData,
        clearTransactionsData,
        clearAgentsData,
        exportBackupJson,
        importBackupJson
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

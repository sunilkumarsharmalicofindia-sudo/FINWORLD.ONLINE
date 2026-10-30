import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LoanProduct, FileStatus, FinancialTransaction } from '../types';
import { formatINR, exportToExcel, exportToCSV } from '../utils/formatters';
import { generateMonthlyReconciliationPDF, generateAgentStatementPDF } from '../utils/pdfGenerator';
import { 
  Zap, 
  X, 
  FolderPlus, 
  CreditCard, 
  FileSpreadsheet, 
  Building2, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Download, 
  FileText, 
  Printer, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface QuickActionFabProps {
  onNavigateToTab: (tabId: string) => void;
  onOpenStatementForAgent?: (agentId: string) => void;
}

export const QuickActionFab: React.FC<QuickActionFabProps> = ({
  onNavigateToTab,
  onOpenStatementForAgent
}) => {
  const { 
    bankers, 
    agents, 
    loanFiles, 
    transactions, 
    reconciliations,
    addLoanFile, 
    recordInflow, 
    recordOutflow, 
    addNotification, 
    language 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'loanFile' | 'payment' | 'report' | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeModal]);

  // Unique bank names from directory + defaults
  const partnerBanks = Array.from(new Set([
    'HDFC Bank',
    'ICICI Bank',
    'State Bank of India (SBI)',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Bank of Baroda',
    'Punjab National Bank',
    'Bajaj Finance',
    'Tata Capital',
    'IDFC FIRST Bank',
    ...bankers.map(b => b.bankName),
    ...loanFiles.map(f => f.bankName)
  ])).sort();

  // -------------------------------------------------------------
  // TASK 1: NEW LOAN FILE FORM STATE & SUBMIT
  // -------------------------------------------------------------
  const [loanForm, setLoanForm] = useState({
    fileNo: `LN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    borrowerName: '',
    agentId: agents[0]?.id || '',
    bankName: partnerBanks[0] || 'HDFC Bank',
    product: 'Home Loan' as LoanProduct,
    loanAmount: 3500000,
    sanctionDate: new Date().toISOString().slice(0, 10),
    disbursedDate: new Date().toISOString().slice(0, 10),
    status: 'Disbursed' as FileStatus,
    bankOfficerName: '',
    city: 'Mumbai',
    bankPayoutRate: 1.25,
    agentPayoutRate: 0.65,
    notes: ''
  });

  const handleCreateLoanFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.borrowerName.trim()) {
      addNotification('Validation Error', 'Please enter Borrower Name.', 'warning');
      return;
    }

    const selectedAgent = agents.find(a => a.id === loanForm.agentId);
    const agentName = selectedAgent ? selectedAgent.name : 'Direct Sourcing';

    const bankPayoutAmt = (loanForm.loanAmount * loanForm.bankPayoutRate) / 100;
    const agentPayoutAmt = (loanForm.loanAmount * loanForm.agentPayoutRate) / 100;

    addLoanFile({
      fileNo: loanForm.fileNo,
      borrowerName: loanForm.borrowerName.trim(),
      agentId: loanForm.agentId,
      agentName,
      bankName: loanForm.bankName,
      product: loanForm.product,
      loanAmount: Number(loanForm.loanAmount),
      sanctionDate: loanForm.sanctionDate,
      disbursedDate: loanForm.disbursedDate,
      status: loanForm.status,
      bankOfficerName: loanForm.bankOfficerName.trim() || 'Bank Branch Manager',
      city: loanForm.city,
      bankPayoutRate: Number(loanForm.bankPayoutRate),
      bankPayoutAmount: bankPayoutAmt,
      bankPayoutReceived: 0,
      bankPayoutStatus: 'Pending',
      agentPayoutRate: Number(loanForm.agentPayoutRate),
      agentPayoutAmount: agentPayoutAmt,
      agentPayoutPaid: 0,
      agentPayoutStatus: 'Unpaid',
      isReconciled: false,
      reconciliationNotes: loanForm.notes
    });

    addNotification(
      'New File Added', 
      `File #${loanForm.fileNo} for ${loanForm.borrowerName} (${formatINR(loanForm.loanAmount)}) added to ledger!`,
      'success'
    );

    setActiveModal(null);
    setIsOpen(false);
    // Reset form for next entry
    setLoanForm({
      fileNo: `LN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      borrowerName: '',
      agentId: agents[0]?.id || '',
      bankName: partnerBanks[0] || 'HDFC Bank',
      product: 'Home Loan',
      loanAmount: 3500000,
      sanctionDate: new Date().toISOString().slice(0, 10),
      disbursedDate: new Date().toISOString().slice(0, 10),
      status: 'Disbursed',
      bankOfficerName: '',
      city: 'Mumbai',
      bankPayoutRate: 1.25,
      agentPayoutRate: 0.65,
      notes: ''
    });
  };

  // -------------------------------------------------------------
  // TASK 2: LOG PAYMENT FORM STATE & SUBMIT
  // -------------------------------------------------------------
  const [paymentTab, setPaymentTab] = useState<'inflow' | 'outflow'>('inflow');
  const [inflowForm, setInflowForm] = useState({
    bankName: partnerBanks[0] || 'HDFC Bank',
    fileNo: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMode: 'NEFT/RTGS' as 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'IMPS' | 'Direct Transfer',
    referenceNo: `UTR-${Math.floor(100000 + Math.random() * 900000)}`,
    description: 'Bank commission payout received'
  });

  const [outflowForm, setOutflowForm] = useState({
    agentId: agents[0]?.id || '',
    bankName: partnerBanks[0] || 'HDFC Bank',
    fileNo: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMode: 'IMPS' as 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'IMPS' | 'Direct Transfer',
    referenceNo: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
    description: 'Sub-agent commission disbursement'
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentTab === 'inflow') {
      const amt = Number(inflowForm.amount);
      if (!amt || amt <= 0) {
        addNotification('Error', 'Please enter a valid amount.', 'warning');
        return;
      }
      recordInflow({
        date: inflowForm.date,
        category: 'Bank Commission Received',
        bankName: inflowForm.bankName,
        fileNo: inflowForm.fileNo.trim() || undefined,
        amount: amt,
        paymentMode: inflowForm.paymentMode,
        referenceNo: inflowForm.referenceNo.trim(),
        description: inflowForm.description.trim() || 'Bank Commission',
        reconciledStatus: 'Matched'
      });
      addNotification('Payment Logged', `Bank Inflow of ${formatINR(amt)} logged successfully!`, 'success');
    } else {
      const amt = Number(outflowForm.amount);
      if (!amt || amt <= 0) {
        addNotification('Error', 'Please enter a valid amount.', 'warning');
        return;
      }
      const agentObj = agents.find(a => a.id === outflowForm.agentId);
      recordOutflow({
        date: outflowForm.date,
        category: 'Agent Commission Paid',
        bankName: outflowForm.bankName,
        agentId: outflowForm.agentId,
        agentName: agentObj ? agentObj.name : 'Sub-Agent',
        fileNo: outflowForm.fileNo.trim() || undefined,
        amount: amt,
        paymentMode: outflowForm.paymentMode,
        referenceNo: outflowForm.referenceNo.trim(),
        description: outflowForm.description.trim() || 'Agent Payout',
        reconciledStatus: 'Matched'
      });
      addNotification('Payment Logged', `Agent Outflow of ${formatINR(amt)} to ${agentObj?.name || 'Agent'} logged!`, 'success');
    }

    setActiveModal(null);
    setIsOpen(false);
  };

  // -------------------------------------------------------------
  // TASK 3: GENERATE REPORT STATE & HANDLERS
  // -------------------------------------------------------------
  const [reportAgentId, setReportAgentId] = useState<string>(agents[0]?.id || '');
  const [reportMonth, setReportMonth] = useState<string>('2026-10');

  const handleDownloadExcelReport = () => {
    const reportData = loanFiles.map(f => ({
      'File No': f.fileNo,
      'Borrower': f.borrowerName,
      'Bank': f.bankName,
      'Product': f.product,
      'Loan Amount (INR)': f.loanAmount,
      'Status': f.status,
      'Disbursal Date': f.disbursedDate,
      'Sourcing Agent': f.agentName,
      'Bank Payout %': f.bankPayoutRate,
      'Bank Payout Expected': f.bankPayoutAmount,
      'Bank Payout Received': f.bankPayoutReceived || 0,
      'Bank Payout Status': f.bankPayoutStatus,
      'Agent Payout %': f.agentPayoutRate,
      'Agent Payout Expected': f.agentPayoutAmount,
      'Agent Payout Paid': f.agentPayoutPaid || 0,
      'Net Retained Margin': (f.bankPayoutReceived || 0) - (f.agentPayoutPaid || 0)
    }));

    exportToExcel(reportData, 'DSA_Master_Performance_Report');
    addNotification('Report Downloaded', 'Master Excel Performance Report generated successfully!', 'success');
  };

  const handleGenerateAuditPDF = () => {
    const currentMonthFiles = loanFiles.filter(f => f.disbursedDate.startsWith(reportMonth));
    generateMonthlyReconciliationPDF(
      reportMonth,
      'all',
      reconciliations,
      currentMonthFiles.length > 0 ? currentMonthFiles : loanFiles
    );
    addNotification('PDF Generated', `Monthly Reconciliation Audit for ${reportMonth} downloaded.`, 'success');
  };

  const handleGenerateAgentPDF = () => {
    const targetAgent = agents.find(a => a.id === reportAgentId) || agents[0];
    if (!targetAgent) {
      addNotification('Notice', 'No agent selected.', 'warning');
      return;
    }
    generateAgentStatementPDF(targetAgent, loanFiles, transactions);
    addNotification('PDF Generated', `Commission Statement for ${targetAgent.name} downloaded.`, 'success');
  };

  return (
    <>
      {/* Backdrop for expanded FAB speed dial */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 transition-opacity animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Speed Dial Container */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-auto">
        
        {/* Expanded Speed-Dial Action Buttons */}
        {isOpen && (
          <div className="mb-3 flex flex-col items-end space-y-2.5 animate-in slide-in-from-bottom-3 duration-200">
            
            {/* Action 1: New Loan File */}
            <div className="flex items-center space-x-2 group">
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/95 text-white text-xs font-bold shadow-lg border border-slate-700 pointer-events-none select-none">
                {language === 'hi' ? 'नई लोन फ़ाइल (New Loan File)' : 'New Loan File'}
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('loanFile');
                }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-950/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                title={language === 'hi' ? 'नई लोन फ़ाइल दर्ज करें' : 'Create New Loan File'}
              >
                <FolderPlus className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Action 2: Log Payment */}
            <div className="flex items-center space-x-2 group">
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/95 text-white text-xs font-bold shadow-lg border border-slate-700 pointer-events-none select-none">
                {language === 'hi' ? 'पेमेंट दर्ज करें (Log Payment)' : 'Log Payment'}
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('payment');
                }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-950/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                title={language === 'hi' ? 'कैश फ्लो लेनदेन दर्ज करें' : 'Log Cash Flow Payment'}
              >
                <CreditCard className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Action 3: Generate Report */}
            <div className="flex items-center space-x-2 group">
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/95 text-white text-xs font-bold shadow-lg border border-slate-700 pointer-events-none select-none">
                {language === 'hi' ? 'रिपोर्ट बनाएं (Generate Report)' : 'Generate Report'}
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('report');
                }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white shadow-xl shadow-purple-950/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                title={language === 'hi' ? 'कार्यकारी रिपोर्ट और ऑडिट जनरेट करें' : 'Generate Executive Report'}
              >
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </button>
            </div>

          </div>
        )}

        {/* Primary Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 border active:scale-95 ${
            isOpen
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 rotate-0 shadow-rose-950/40'
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 hover:from-slate-800 hover:to-emerald-800 text-white border-emerald-500/30 shadow-emerald-950/40 hover:shadow-emerald-500/20'
          }`}
          aria-label="Quick Action Speed Dial"
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5 text-white" />
              <span className="text-xs font-black tracking-wide uppercase">
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
              </div>
              <span className="text-xs font-black tracking-wide">
                {language === 'hi' ? 'त्वरित कार्य' : 'Quick Actions'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </>
          )}
        </button>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: NEW LOAN FILE                                        */}
      {/* ------------------------------------------------------------- */}
      {activeModal === 'loanFile' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {language === 'hi' ? 'नई लोन फ़ाइल दर्ज करें' : 'Log New Loan File'}
                  </h3>
                  <p className="text-xs text-emerald-200/80">
                    {language === 'hi' 
                      ? 'लोन राशि, बैंक और एजेंट कमीशन की तुरंत प्रविष्टि' 
                      : 'Record loan disbursal, borrower info, and expected payouts'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLoanFile} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* File No */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    File No / Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={loanForm.fileNo}
                    onChange={(e) => setLoanForm({ ...loanForm, fileNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Borrower Name */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Borrower Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={loanForm.borrowerName}
                    onChange={(e) => setLoanForm({ ...loanForm, borrowerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Sourcing Agent */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Sourcing Agent / Sub-DSA
                  </label>
                  <select
                    value={loanForm.agentId}
                    onChange={(e) => setLoanForm({ ...loanForm, agentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {agents.length === 0 ? (
                      <option value="">Direct Office Sourcing</option>
                    ) : (
                      agents.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.agencyName || a.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Partner Bank */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Partner Bank / NBFC
                  </label>
                  <select
                    value={loanForm.bankName}
                    onChange={(e) => setLoanForm({ ...loanForm, bankName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {partnerBanks.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Product */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Loan Product
                  </label>
                  <select
                    value={loanForm.product}
                    onChange={(e) => setLoanForm({ ...loanForm, product: e.target.value as LoanProduct })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Home Loan">Home Loan</option>
                    <option value="Loan Against Property (LAP)">Loan Against Property (LAP)</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Car Loan">Car Loan</option>
                    <option value="Education Loan">Education Loan</option>
                    <option value="MSME / CC-OD">MSME / CC-OD</option>
                    <option value="Doctor / Professional Loan">Doctor / Professional Loan</option>
                  </select>
                </div>

                {/* Loan Amount */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Disbursed Loan Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={loanForm.loanAmount}
                    onChange={(e) => setLoanForm({ ...loanForm, loanAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Bank Payout Rate % */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Bank Commission Rate %
                    </label>
                    <span className="text-[11px] font-bold text-emerald-600">
                      {formatINR((loanForm.loanAmount * loanForm.bankPayoutRate) / 100)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={loanForm.bankPayoutRate}
                    onChange={(e) => setLoanForm({ ...loanForm, bankPayoutRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Agent Payout Rate % */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Agent Commission Rate %
                    </label>
                    <span className="text-[11px] font-bold text-amber-600">
                      {formatINR((loanForm.loanAmount * loanForm.agentPayoutRate) / 100)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={loanForm.agentPayoutRate}
                    onChange={(e) => setLoanForm({ ...loanForm, agentPayoutRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    File Status
                  </label>
                  <select
                    value={loanForm.status}
                    onChange={(e) => setLoanForm({ ...loanForm, status: e.target.value as FileStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Disbursed">Disbursed (वितरित)</option>
                    <option value="Sanctioned">Sanctioned (स्वीकृत)</option>
                    <option value="Underwriting">Underwriting (क्रेडिट जांच)</option>
                    <option value="Logged In">Logged In (लॉग इन)</option>
                  </select>
                </div>

                {/* Disbursal Date */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Disbursal Date
                  </label>
                  <input
                    type="date"
                    value={loanForm.disbursedDate}
                    onChange={(e) => setLoanForm({ ...loanForm, disbursedDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

              </div>

              {/* Economic Summary Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Expected Gross Bank Commission:</span>
                  <span className="font-bold text-emerald-700">
                    {formatINR((loanForm.loanAmount * loanForm.bankPayoutRate) / 100)} ({loanForm.bankPayoutRate}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Expected Net Retained DSA Margin:</span>
                  <span className="font-black text-slate-900">
                    {formatINR(
                      ((loanForm.loanAmount * loanForm.bankPayoutRate) / 100) - 
                      ((loanForm.loanAmount * loanForm.agentPayoutRate) / 100)
                    )}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>{language === 'hi' ? 'फ़ाइल सेव करें' : 'Save Loan File'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: LOG PAYMENT (INFLOW / OUTFLOW)                       */}
      {/* ------------------------------------------------------------- */}
      {activeModal === 'payment' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {language === 'hi' ? 'पेमेंट / लेनदेन दर्ज करें' : 'Log Financial Payment'}
                  </h3>
                  <p className="text-xs text-blue-200/80">
                    {language === 'hi' 
                      ? 'बैंक से प्राप्त कमीशन या एजेंट को किया गया भुगतान' 
                      : 'Record bank payout received or agent commission disbursed'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inflow vs Outflow Tabs */}
            <div className="px-6 pt-5">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentTab('inflow')}
                  className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-2 ${
                    paymentTab === 'inflow'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>{language === 'hi' ? 'बैंक से प्राप्त (Inflow)' : 'Bank Inflow (Received)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab('outflow')}
                  className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-2 ${
                    paymentTab === 'outflow'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{language === 'hi' ? 'एजेंट को भुगतान (Outflow)' : 'Agent Outflow (Paid)'}</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              
              {paymentTab === 'inflow' ? (
                /* INFLOW FIELDS */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Bank / Institution
                      </label>
                      <select
                        value={inflowForm.bankName}
                        onChange={(e) => setInflowForm({ ...inflowForm, bankName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {partnerBanks.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Amount Received (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 45000"
                        value={inflowForm.amount}
                        onChange={(e) => setInflowForm({ ...inflowForm, amount: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Linked File No (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. LN-2026-101"
                        value={inflowForm.fileNo}
                        onChange={(e) => setInflowForm({ ...inflowForm, fileNo: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={inflowForm.paymentMode}
                        onChange={(e) => setInflowForm({ ...inflowForm, paymentMode: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="NEFT/RTGS">NEFT / RTGS</option>
                        <option value="Direct Transfer">Direct Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="Cheque">Cheque</option>
                        <option value="IMPS">IMPS</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        UTR / Transaction Ref
                      </label>
                      <input
                        type="text"
                        value={inflowForm.referenceNo}
                        onChange={(e) => setInflowForm({ ...inflowForm, referenceNo: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Date Received
                      </label>
                      <input
                        type="date"
                        value={inflowForm.date}
                        onChange={(e) => setInflowForm({ ...inflowForm, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      Notes / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. October batch payout from HDFC main branch"
                      value={inflowForm.description}
                      onChange={(e) => setInflowForm({ ...inflowForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                /* OUTFLOW FIELDS */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Select Sub-Agent *
                      </label>
                      <select
                        value={outflowForm.agentId}
                        onChange={(e) => setOutflowForm({ ...outflowForm, agentId: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.agencyName || a.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Amount Paid (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 22500"
                        value={outflowForm.amount}
                        onChange={(e) => setOutflowForm({ ...outflowForm, amount: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Associated Bank
                      </label>
                      <select
                        value={outflowForm.bankName}
                        onChange={(e) => setOutflowForm({ ...outflowForm, bankName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {partnerBanks.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={outflowForm.paymentMode}
                        onChange={(e) => setOutflowForm({ ...outflowForm, paymentMode: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="IMPS">IMPS Instant</option>
                        <option value="NEFT/RTGS">NEFT / RTGS</option>
                        <option value="UPI">UPI</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        UTR / Payment Ref
                      </label>
                      <input
                        type="text"
                        value={outflowForm.referenceNo}
                        onChange={(e) => setOutflowForm({ ...outflowForm, referenceNo: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Disbursement Date
                      </label>
                      <input
                        type="date"
                        value={outflowForm.date}
                        onChange={(e) => setOutflowForm({ ...outflowForm, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      Notes / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Commission settlement for home loan cases"
                      value={outflowForm.description}
                      onChange={(e) => setOutflowForm({ ...outflowForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1.5 ${
                    paymentTab === 'inflow' 
                      ? 'bg-emerald-600 hover:bg-emerald-500' 
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {paymentTab === 'inflow' 
                      ? (language === 'hi' ? 'इनफ्लो दर्ज करें' : 'Record Inflow') 
                      : (language === 'hi' ? 'आउटफ्लो दर्ज करें' : 'Record Outflow')}
                  </span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: GENERATE REPORT                                      */}
      {/* ------------------------------------------------------------- */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {language === 'hi' ? 'कार्यकारी रिपोर्ट और ऑडिट जनरेट करें' : 'Generate Executive Reports'}
                  </h3>
                  <p className="text-xs text-purple-200/80">
                    {language === 'hi' 
                      ? '1-क्लिक में एक्सेल मास्टर लेजर, बैंक ऑडिट या एजेंट स्टेटमेंट बनाएं' 
                      : 'Instant 1-click download of Excel ledgers, audit statements, and PDFs'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Option 1: Master Performance Excel Report */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                      XLSX
                    </span>
                    <h4 className="text-sm font-black text-slate-900">
                      {language === 'hi' ? 'मास्टर लोन परफॉर्मेंस रिपोर्ट (Excel)' : 'Master Performance Report (Excel)'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    {language === 'hi'
                      ? 'सभी लोन फाइलें, बैंक इनफ्लो, एजेंट कमीशन और ग्रॉस मार्जिन की पूरी स्प्रेडशीट।'
                      : 'Complete workbook containing all files, bank payouts, agent cuts, and retained margin.'}
                  </p>
                </div>
                <button
                  onClick={handleDownloadExcelReport}
                  className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              {/* Option 2: Monthly Reconciliation Audit PDF */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs">
                      PDF
                    </span>
                    <h4 className="text-sm font-black text-slate-900">
                      {language === 'hi' ? 'मासिक बैंक रिकॉन्सिलिएशन ऑडिट (PDF)' : 'Monthly Bank Reconciliation Audit (PDF)'}
                    </h4>
                  </div>
                  <button
                    onClick={handleGenerateAuditPDF}
                    className="shrink-0 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>Audit Month:</span>
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Option 3: Agent Commission Statement PDF */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs">
                      PDF
                    </span>
                    <h4 className="text-sm font-black text-slate-900">
                      {language === 'hi' ? 'एजेंट कमीशन स्टेटमेंट (PDF)' : 'Agent Commission Statement (PDF)'}
                    </h4>
                  </div>
                  <button
                    onClick={handleGenerateAgentPDF}
                    disabled={agents.length === 0}
                    className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Generate PDF</span>
                  </button>
                </div>
                {agents.length > 0 ? (
                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Select Agent:</span>
                    <select
                      value={reportAgentId}
                      onChange={(e) => setReportAgentId(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.agencyName || a.code})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No agents registered yet. Add agents to print statements.</p>
                )}
              </div>

              {/* Quick Navigation Links */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{language === 'hi' ? 'विस्तृत रिपोर्ट मॉड्यूल खोलें:' : 'Explore detailed modules:'}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      onNavigateToTab('loanFiles');
                    }}
                    className="font-bold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Loan Files →
                  </button>
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      onNavigateToTab('reconciliation');
                    }}
                    className="font-bold text-teal-600 hover:text-teal-700 underline"
                  >
                    Reconciliation →
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};

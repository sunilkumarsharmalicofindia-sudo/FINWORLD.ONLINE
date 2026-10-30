import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MonthlyReconciliation, LoanFile } from '../types';
import { formatINR, formatDate, exportToExcel, exportToCSV } from '../utils/formatters';
import { 
  CheckCheck, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Download, 
  Calendar, 
  Building2, 
  FileText, 
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mail,
  ShieldCheck,
  FileDown
} from 'lucide-react';
import { generateMonthlyReconciliationPDF } from '../utils/pdfGenerator';
import { EmailDispatchModal } from './EmailDispatchModal';

export const ReconciliationEngine: React.FC = () => {
  const { 
    loanFiles, 
    transactions, 
    reconciliations, 
    runMonthlyReconciliation, 
    updateLoanFile,
    addNotification,
    language, 
    t 
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'discrepancies' | 'files'>('matrix');
  const [resolvingFile, setResolvingFile] = useState<LoanFile | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Unique bank names
  const bankNames = useMemo(() => {
    return Array.from(new Set(loanFiles.map(f => f.bankName))).sort();
  }, [loanFiles]);

  // Current month's reconciliation items
  const currentMonthRecs = useMemo(() => {
    return reconciliations.filter(r => {
      const matchMonth = r.monthYear === selectedMonth;
      const matchBank = selectedBank === 'all' || r.bankName === selectedBank;
      return matchMonth && matchBank;
    });
  }, [reconciliations, selectedMonth, selectedBank]);

  // Files for selected month & bank
  const monthFiles = useMemo(() => {
    return loanFiles.filter(f => {
      const fMonth = f.disbursedDate ? f.disbursedDate.slice(0, 7) : f.sanctionDate.slice(0, 7);
      const matchMonth = fMonth === selectedMonth;
      const matchBank = selectedBank === 'all' || f.bankName === selectedBank;
      return matchMonth && matchBank;
    });
  }, [loanFiles, selectedMonth, selectedBank]);

  // Discrepancy files
  const discrepancyFiles = useMemo(() => {
    return monthFiles.filter(f => {
      if (f.status !== 'Disbursed') return false;
      const bankPending = (f.bankPayoutAmount || 0) - (f.bankPayoutReceived || 0);
      const isShortPaid = f.bankPayoutReceived > 0 && f.bankPayoutReceived < f.bankPayoutAmount;
      return isShortPaid || bankPending > 0 || f.bankPayoutStatus === 'Disputed';
    });
  }, [monthFiles]);

  // Aggregates for current month
  const totalVolume = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.loanAmount || 0), 0);
  const expectedBankPayout = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.bankPayoutAmount || 0), 0);
  const actualBankReceived = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.bankPayoutReceived || 0), 0);
  const netVariance = actualBankReceived - expectedBankPayout;
  const agentCommissionDue = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.agentPayoutAmount || 0), 0);
  const agentCommissionPaid = monthFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.agentPayoutPaid || 0), 0);

  // Trigger Automated Reconciliation
  const handleRunReconciliation = () => {
    setIsProcessing(true);
    setTimeout(() => {
      runMonthlyReconciliation(selectedMonth, selectedBank);
      setIsProcessing(false);
    }, 600);
  };

  // Resolve Discrepancy
  const handleSaveResolution = () => {
    if (!resolvingFile) return;
    updateLoanFile(resolvingFile.id, {
      isReconciled: true,
      bankPayoutStatus: 'Received',
      reconciliationNotes: resolutionNote || 'Discrepancy reconciled & adjusted for TDS.'
    });
    addNotification(
      'Discrepancy Resolved',
      `File #${resolvingFile.fileNo} marked as reconciled. Note: ${resolutionNote || 'Adjusted'}`,
      'success'
    );
    setResolvingFile(null);
    setResolutionNote('');
  };

  // Export Reconciliation Audit Sheet
  const handleExportReconciliation = (format: 'excel' | 'csv') => {
    const data = monthFiles.map(f => ({
      'File No': f.fileNo,
      'Borrower': f.borrowerName,
      'Bank': f.bankName,
      'Product': f.product,
      'Disbursal Date': f.disbursedDate,
      'Loan Amount (₹)': f.loanAmount,
      'Bank Payout %': f.bankPayoutRate,
      'Expected Bank Payout (₹)': f.bankPayoutAmount,
      'Actual Bank Received (₹)': f.bankPayoutReceived,
      'Variance (₹)': (f.bankPayoutReceived || 0) - f.bankPayoutAmount,
      'Bank Payout Status': f.bankPayoutStatus,
      'Agent Name': f.agentName,
      'Agent Commission (₹)': f.agentPayoutAmount,
      'Agent Commission Paid (₹)': f.agentPayoutPaid,
      'Reconciled': f.isReconciled ? 'YES' : 'NO',
      'Notes': f.reconciliationNotes || ''
    }));

    const title = `Reconciliation_Audit_${selectedMonth}_${selectedBank}`;
    if (format === 'excel') {
      exportToExcel(data, title);
    } else {
      exportToCSV(data, title);
    }
  };

  // Export Certified Reconciliation Audit Report in PDF format
  const handleDownloadPDFReport = () => {
    generateMonthlyReconciliationPDF(selectedMonth, selectedBank, currentMonthRecs, monthFiles);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'स्वचालित मासिक हिसाब मिलान (Automated Reconciliation)' : 'Automated Monthly Reconciliation'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-teal-500 text-slate-950 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Auto Audit</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'hi'
                ? 'बैंक डिस्बर्सल रिकॉर्ड, प्राप्त कमीशन (Inflow) और एजेंट पेआउट (Outflow) का सटीक मिलान करें। टीडीएस कटौती और अंतर की तुरंत पहचान करें।'
                : '3-way automated matching between bank disbursal sheets, incoming commission credits, and outgoing sub-agent shares. Flag TDS cuts & variance.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunReconciliation}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all hover:scale-102"
            >
              <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Computing Audit...' : 'Run Auto-Reconciliation'}</span>
            </button>
            <button
              onClick={handleDownloadPDFReport}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Audit PDF</span>
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Email Report</span>
            </button>
            <button
              onClick={() => handleExportReconciliation('excel')}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Month & Bank Selector Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Month Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <label className="text-xs font-bold text-slate-700">Audit Period:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="2026-10">October 2026 (Current)</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
            </select>
          </div>

          {/* Bank Channel Selector */}
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-bold text-slate-700">Bank Channel:</label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
            >
              <option value="all">All Partner Banks</option>
              {bankNames.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bank Summary Matrix
          </button>
          <button
            onClick={() => setActiveTab('discrepancies')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              activeTab === 'discrepancies' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Discrepancies</span>
            {discrepancyFiles.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {discrepancyFiles.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'files' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Files Audit
          </button>
        </div>
      </div>

      {/* 4 Reconciliation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Disbursed Volume */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Disbursed Volume</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(totalVolume)}</div>
          <p className="text-[11px] text-slate-400 mt-1">{monthFiles.length} loan files logged</p>
        </div>

        {/* Expected Bank Payout */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Expected Bank Commission</span>
          <div className="text-xl font-extrabold text-blue-700 mt-1">{formatINR(expectedBankPayout)}</div>
          <p className="text-[11px] text-blue-600 mt-1">Calculated as per bank slab %</p>
        </div>

        {/* Actual Received */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Actual Bank Remittance</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">{formatINR(actualBankReceived)}</div>
          <p className="text-[11px] text-emerald-600 mt-1">Bank credit verified</p>
        </div>

        {/* Net Variance / Discrepancy */}
        <div className={`bg-white p-4 rounded-2xl border shadow-sm ${
          netVariance < 0 ? 'border-rose-300 bg-rose-50/20' : 'border-emerald-300 bg-emerald-50/20'
        }`}>
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Reconciliation Variance</span>
          <div className={`text-xl font-extrabold mt-1 ${netVariance < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {netVariance === 0 ? '₹0 (Perfect Match)' : formatINR(netVariance)}
          </div>
          <p className={`text-[11px] font-semibold mt-1 ${netVariance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {netVariance < 0 ? 'Variance / Shortfall detected' : 'Fully balanced'}
          </p>
        </div>

      </div>

      {/* Tab 1: Bank Channel Summary Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <CheckCheck className="w-4 h-4 text-teal-600" />
              <span>Channel Reconciliation Statements for {selectedMonth}</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Automated Algorithm Engine
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Bank / Channel</th>
                  <th className="py-3 px-4">Disbursed Volume (₹)</th>
                  <th className="py-3 px-4">Expected Payout</th>
                  <th className="py-3 px-4">Actual Received</th>
                  <th className="py-3 px-4">Variance (₹)</th>
                  <th className="py-3 px-4">Sub-DSA Paid</th>
                  <th className="py-3 px-4">Reconciled Files</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {currentMonthRecs.length > 0 ? (
                  currentMonthRecs.map((rec) => {
                    const isPerfect = rec.status === 'Fully Reconciled';
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {rec.bankName}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {formatINR(rec.totalDisbursedVolume)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-blue-700">
                          {formatINR(rec.expectedBankPayout)}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">
                          {formatINR(rec.receivedBankPayout)}
                        </td>
                        <td className="py-3 px-4">
                          {rec.variance !== 0 ? (
                            <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                              {formatINR(rec.variance)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px]">₹0 (Matched)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-amber-700">
                          {formatINR(rec.agentCommissionPaid)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-bold">
                            {rec.reconciledFilesCount} / {rec.reconciledFilesCount + rec.unreconciledFilesCount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPerfect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isPerfect ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            <span>{rec.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No reconciliation run yet for {selectedMonth}. Click "Run Auto-Reconciliation" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Discrepancy Alerts & File Resolution */}
      {activeTab === 'discrepancies' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">What is a Reconciliation Discrepancy?</p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                A discrepancy occurs when partner banks remit less commission than agreed slab %, deduct 5% TDS under 194H without prior advice, or when disbursal payments are pending beyond 30 days. You can review, adjust, or mark files as reconciled below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discrepancyFiles.map((file) => {
              const diff = file.bankPayoutAmount - (file.bankPayoutReceived || 0);
              return (
                <div key={file.id} className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{file.borrowerName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {file.fileNo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {file.bankName} • {file.product} • Disbursed: {formatDate(file.disbursedDate)}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      Shortfall: {formatINR(diff)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Loan Amount</span>
                      <span className="font-bold text-slate-800">{formatINR(file.loanAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Expected Payout</span>
                      <span className="font-bold text-blue-700">{formatINR(file.bankPayoutAmount)} ({file.bankPayoutRate}%)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Actual Credit</span>
                      <span className="font-bold text-emerald-700">{formatINR(file.bankPayoutReceived || 0)}</span>
                    </div>
                  </div>

                  {file.reconciliationNotes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                      Note: "{file.reconciliationNotes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">Agent: {file.agentName}</span>
                    <button
                      onClick={() => {
                        setResolvingFile(file);
                        setResolutionNote(file.reconciliationNotes || `Verified: 5% TDS deducted by ${file.bankName} under Section 194H.`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      Resolve & Reconcile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {discrepancyFiles.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-emerald-300 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Zero Discrepancies!</h3>
              <p className="text-xs text-slate-500">All bank payouts for {selectedMonth} match expectations.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: All Files Detailed Audit */}
      {activeTab === 'files' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">File No & Borrower</th>
                  <th className="py-3 px-4">Bank</th>
                  <th className="py-3 px-4">Loan Amount</th>
                  <th className="py-3 px-4">Expected Payout</th>
                  <th className="py-3 px-4">Actual Credit</th>
                  <th className="py-3 px-4">Agent Share</th>
                  <th className="py-3 px-4">Reconciled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {monthFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{file.borrowerName}</div>
                      <div className="font-mono text-[11px] text-teal-600">{file.fileNo}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{file.bankName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{formatINR(file.loanAmount)}</td>
                    <td className="py-3 px-4 font-bold text-blue-700">{formatINR(file.bankPayoutAmount)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatINR(file.bankPayoutReceived || 0)}</td>
                    <td className="py-3 px-4 font-semibold text-amber-700">{formatINR(file.agentPayoutAmount)}</td>
                    <td className="py-3 px-4">
                      {file.isReconciled ? (
                        <span className="text-emerald-600 font-bold text-[11px]">✓ Matched</span>
                      ) : (
                        <span className="text-rose-600 font-bold text-[11px]">Pending Audit</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discrepancy Resolution Modal */}
      {resolvingFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>Reconcile Discrepancy</span>
              </h3>
              <button onClick={() => setResolvingFile(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><span className="font-semibold">File:</span> {resolvingFile.fileNo} - {resolvingFile.borrowerName}</p>
                <p><span className="font-semibold">Bank:</span> {resolvingFile.bankName} | Loan: {formatINR(resolvingFile.loanAmount)}</p>
                <p><span className="font-semibold">Variance:</span> <span className="font-bold text-rose-700">{formatINR(resolvingFile.bankPayoutAmount - (resolvingFile.bankPayoutReceived || 0))}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reconciliation Audit Note / Resolution Reason:
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. 5% TDS deducted under Section 194H, Form 16A requested from bank..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingFile(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveResolution}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20"
                >
                  Confirm Reconciled
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Dispatch Modal */}
      {showEmailModal && (
        <EmailDispatchModal
          defaultTemplate="reconciliation"
          reconciliationMonth={selectedMonth}
          onClose={() => setShowEmailModal(false)}
        />
      )}

    </div>
  );
};

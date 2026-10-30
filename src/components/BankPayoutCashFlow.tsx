import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FinancialTransaction } from '../types';
import { formatINR, formatDate, exportToExcel, exportToCSV } from '../utils/formatters';
import { 
  Building2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter, 
  Plus, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  Calendar,
  Layers,
  Trash2
} from 'lucide-react';

interface BankPayoutCashFlowProps {
  initialSearchQuery?: string;
}

export const BankPayoutCashFlow: React.FC<BankPayoutCashFlowProps> = ({ initialSearchQuery = '' }) => {
  const { 
    transactions, 
    loanFiles, 
    agents, 
    recordInflow, 
    recordOutflow, 
    deleteTransaction,
    clearTransactionsData,
    t, 
    language 
  } = useApp();

  // Filters
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'Inflow' | 'Outflow'>('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Modals
  const [showInflowModal, setShowInflowModal] = useState(false);
  const [showOutflowModal, setShowOutflowModal] = useState(false);

  // Inflow Form State
  const [inflowForm, setInflowForm] = useState({
    bankName: 'HDFC Bank',
    fileNo: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMode: 'NEFT/RTGS' as 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'IMPS' | 'Direct Transfer',
    referenceNo: '',
    description: '',
    category: 'Bank Commission Received' as FinancialTransaction['category']
  });

  // Outflow Form State
  const [outflowForm, setOutflowForm] = useState({
    bankName: 'HDFC Bank',
    agentId: '',
    fileNo: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMode: 'IMPS' as 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'IMPS' | 'Direct Transfer',
    referenceNo: '',
    description: '',
    category: 'Agent Commission Paid' as FinancialTransaction['category']
  });

  // Unique Banks list from transactions and loan files
  const bankList = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => list.add(t.bankName));
    loanFiles.forEach(f => list.add(f.bankName));
    return Array.from(list).filter(Boolean).sort();
  }, [transactions, loanFiles]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesBank = selectedBank === 'all' || tx.bankName === selectedBank;
      const matchesType = filterType === 'all' || tx.type === filterType;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        tx.bankName.toLowerCase().includes(q) ||
        (tx.agentName && tx.agentName.toLowerCase().includes(q)) ||
        (tx.fileNo && tx.fileNo.toLowerCase().includes(q)) ||
        tx.referenceNo.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q);

      return matchesBank && matchesType && matchesSearch;
    });
  }, [transactions, selectedBank, filterType, searchQuery]);

  // Aggregate Metrics for Selected Bank View
  const selectedBankMetrics = useMemo(() => {
    const scopedFiles = selectedBank === 'all' 
      ? loanFiles.filter(f => f.status === 'Disbursed') 
      : loanFiles.filter(f => f.bankName === selectedBank && f.status === 'Disbursed');

    const totalDisbursed = scopedFiles.reduce((s, f) => s + (f.loanAmount || 0), 0);
    const expectedBankPayout = scopedFiles.reduce((s, f) => s + (f.bankPayoutAmount || 0), 0);
    const actualBankReceived = scopedFiles.reduce((s, f) => s + (f.bankPayoutReceived || 0), 0);
    const pendingFromBank = Math.max(0, expectedBankPayout - actualBankReceived);

    const scopedTx = selectedBank === 'all'
      ? transactions
      : transactions.filter(t => t.bankName === selectedBank);

    const totalInflow = scopedTx.filter(t => t.type === 'Inflow').reduce((s, t) => s + t.amount, 0);
    const totalOutflow = scopedTx.filter(t => t.type === 'Outflow').reduce((s, t) => s + t.amount, 0);
    const netProfit = totalInflow - totalOutflow;

    return {
      totalDisbursed,
      expectedBankPayout,
      actualBankReceived,
      pendingFromBank,
      totalInflow,
      totalOutflow,
      netProfit,
      fileCount: scopedFiles.length
    };
  }, [transactions, loanFiles, selectedBank]);

  // Handle Inflow Submit
  const handleInflowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(inflowForm.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    recordInflow({
      date: inflowForm.date,
      category: inflowForm.category,
      bankName: inflowForm.bankName,
      fileNo: inflowForm.fileNo || undefined,
      amount: amountNum,
      paymentMode: inflowForm.paymentMode,
      referenceNo: inflowForm.referenceNo || `UTR-${Date.now().toString().slice(-6)}`,
      description: inflowForm.description || `Commission credit from ${inflowForm.bankName}`,
      reconciledStatus: 'Matched'
    });

    setShowInflowModal(false);
    setInflowForm({
      bankName: 'HDFC Bank',
      fileNo: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMode: 'NEFT/RTGS',
      referenceNo: '',
      description: '',
      category: 'Bank Commission Received'
    });
  };

  // Handle Outflow Submit
  const handleOutflowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(outflowForm.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const agentObj = agents.find(a => a.id === outflowForm.agentId);

    recordOutflow({
      date: outflowForm.date,
      category: outflowForm.category,
      bankName: outflowForm.bankName,
      agentId: outflowForm.agentId || undefined,
      agentName: agentObj ? agentObj.name : undefined,
      fileNo: outflowForm.fileNo || undefined,
      amount: amountNum,
      paymentMode: outflowForm.paymentMode,
      referenceNo: outflowForm.referenceNo || `IMPS-${Date.now().toString().slice(-6)}`,
      description: outflowForm.description || `Agent commission paid to ${agentObj?.name || 'Agent'}`,
      reconciledStatus: 'Matched'
    });

    setShowOutflowModal(false);
    setOutflowForm({
      bankName: 'HDFC Bank',
      agentId: '',
      fileNo: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMode: 'IMPS',
      referenceNo: '',
      description: '',
      category: 'Agent Commission Paid'
    });
  };

  // Export
  const handleExport = (format: 'excel' | 'csv') => {
    const data = filteredTransactions.map(tx => ({
      'Date': tx.date,
      'Type': tx.type,
      'Category': tx.category,
      'Bank Name': tx.bankName,
      'Agent Name': tx.agentName || '-',
      'File No': tx.fileNo || '-',
      'Amount (INR)': tx.amount,
      'Payment Mode': tx.paymentMode,
      'Reference / UTR': tx.referenceNo,
      'Description': tx.description,
      'Reconciliation Status': tx.reconciledStatus
    }));

    const title = selectedBank === 'all' ? 'All_Banks_Cashflow_Report' : `${selectedBank.replace(/\s+/g, '_')}_Cashflow_Report`;
    if (format === 'excel') {
      exportToExcel(data, title);
    } else {
      exportToCSV(data, title);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'बैंक से कितना आया / कितना गया (Cash Flow & Payouts)' : 'Bank Cash Flow & Commission Ledger'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">
                {selectedBank === 'all' ? 'All Bank Accounts' : selectedBank}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'hi'
                ? 'बैंक वार विस्तृत इनफ्लो व आउटफ्लो लेजर। जाने किस बैंक से कितना पैसा आया, कितना एजेंटों को गया और कितना शुद्ध मुनाफा बचा।'
                : 'Bank-name filtered reporting of commission inflows from partner banks, payouts to DSA agents, and real-time net profit margins.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowInflowModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ {language === 'hi' ? 'बैंक से आया (Inflow)' : 'Record Bank Inflow'}</span>
            </button>
            <button
              onClick={() => setShowOutflowModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>- {language === 'hi' ? 'एजेंट को गया (Outflow)' : 'Pay Agent Outflow'}</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Excel</span>
            </button>
            {transactions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(language === 'hi' ? 'क्या आप सभी सैंपल लेन-देन हटाना चाहते हैं?' : 'Clear all sample cash flow transactions?')) {
                    clearTransactionsData();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-colors"
                title="सैंपल लेन-देन हटाएं"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{language === 'hi' ? 'सैंपल हटाएं' : 'Clear Ledger'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bank Name Wise Quick Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{language === 'hi' ? 'बैंक चुनें (Bank-Name Wise Filtering):' : 'Select Bank Channel:'}</span>
          </div>
          {selectedBank !== 'all' && (
            <button
              onClick={() => setSelectedBank('all')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View All Banks
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBank('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBank === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Partner Banks ({bankList.length})
          </button>
          {bankList.map((bName) => (
            <button
              key={bName}
              onClick={() => setSelectedBank(bName)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedBank === bName
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {bName}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Bank Real-time Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Inflow */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              {language === 'hi' ? 'कुल बैंक इनफ्लो (कमीशन आया)' : 'Total Bank Inflow'}
            </span>
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-700">
            {formatINR(selectedBankMetrics.totalInflow)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            From {selectedBank === 'all' ? 'all banks' : selectedBank}
          </p>
        </div>

        {/* Total Outflow */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              {language === 'hi' ? 'कुल एजेंट आउटफ्लो (भुगतान)' : 'Total Agent Outflow'}
            </span>
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-700">
            {formatINR(selectedBankMetrics.totalOutflow)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Paid to sub-agents / DSAs
          </p>
        </div>

        {/* Net Profit Margin */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              {language === 'hi' ? 'शुद्ध बचत (Net Margin)' : 'Net Retained Margin'}
            </span>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700">
            {formatINR(selectedBankMetrics.netProfit)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-bold">
            Gross profit retained
          </p>
        </div>

        {/* Pending From Bank */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-white to-rose-50/30 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
              {language === 'hi' ? 'बैंक से बकाया (Pending)' : 'Pending from Bank'}
            </span>
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-700">
            {formatINR(selectedBankMetrics.pendingFromBank)}
          </div>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">
            Expected commission balance
          </p>
        </div>

      </div>

      {/* Transaction Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Transactions ({filteredTransactions.length})
            </button>
            <button
              onClick={() => setFilterType('Inflow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'Inflow'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              ↓ Inflow Only
            </button>
            <button
              onClick={() => setFilterType('Outflow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'Outflow'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              ↑ Outflow Only
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, bank, agent..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Date & Ref</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">{t.bank}</th>
                <th className="py-3 px-4">Agent / Borrower File</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTransactions.map((tx) => {
                const isInflow = tx.type === 'Inflow';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Date & Ref */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{formatDate(tx.date)}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tx.referenceNo}</div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isInflow ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isInflow ? <ArrowDownLeft className="w-3 h-3 text-blue-600" /> : <ArrowUpRight className="w-3 h-3 text-amber-600" />}
                        <span>{isInflow ? 'Bank Inflow' : 'Agent Outflow'}</span>
                      </span>
                    </td>

                    {/* Bank */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {tx.bankName}
                    </td>

                    {/* Agent / File */}
                    <td className="py-3 px-4">
                      {tx.agentName && <div className="font-bold text-slate-800">{tx.agentName}</div>}
                      {tx.fileNo && <div className="text-[11px] text-indigo-600 font-mono">{tx.fileNo}</div>}
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{tx.description}</div>
                    </td>

                    {/* Mode */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {tx.paymentMode}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <span className={`text-sm font-extrabold ${
                        isInflow ? 'text-blue-700' : 'text-amber-700'
                      }`}>
                        {isInflow ? '+' : '-'}{formatINR(tx.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        tx.reconciledStatus === 'Matched' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : tx.reconciledStatus === 'Mismatch' 
                          ? 'bg-rose-50 text-rose-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{tx.reconciledStatus}</span>
                      </span>
                    </td>

                    {/* Delete */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm('Delete this transaction?')) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete record"
                      >
                        ✕
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inflow Modal */}
      {showInflowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-600" />
                <span>{language === 'hi' ? 'बैंक से आया कमीशन दर्ज करें' : 'Record Bank Commission Inflow'}</span>
              </h3>
              <button onClick={() => setShowInflowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleInflowSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Partner Bank *</label>
                <select
                  value={inflowForm.bankName}
                  onChange={(e) => setInflowForm({ ...inflowForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {bankList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Linked Loan File (Optional)</label>
                <select
                  value={inflowForm.fileNo}
                  onChange={(e) => {
                    const fNo = e.target.value;
                    const match = loanFiles.find(f => f.fileNo === fNo);
                    setInflowForm({
                      ...inflowForm,
                      fileNo: fNo,
                      amount: match ? (match.bankPayoutAmount - (match.bankPayoutReceived || 0)).toString() : inflowForm.amount,
                      bankName: match ? match.bankName : inflowForm.bankName
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="">-- General Batch Credit / Not Linked --</option>
                  {loanFiles.map(f => (
                    <option key={f.id} value={f.fileNo}>
                      {f.fileNo} - {f.borrowerName} ({f.bankName} - Exp: ₹{f.bankPayoutAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
                  <input
                    type="number"
                    required
                    value={inflowForm.amount}
                    onChange={(e) => setInflowForm({ ...inflowForm, amount: e.target.value })}
                    placeholder="e.g. 81250"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credit Date *</label>
                  <input
                    type="date"
                    required
                    value={inflowForm.date}
                    onChange={(e) => setInflowForm({ ...inflowForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={inflowForm.paymentMode}
                    onChange={(e) => setInflowForm({ ...inflowForm, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="NEFT/RTGS">NEFT / RTGS</option>
                    <option value="Direct Transfer">Direct Transfer / CMS</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UTR / Bank Ref No</label>
                  <input
                    type="text"
                    value={inflowForm.referenceNo}
                    onChange={(e) => setInflowForm({ ...inflowForm, referenceNo: e.target.value })}
                    placeholder="e.g. CMS/HDFC/2026/89410"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={inflowForm.description}
                  onChange={(e) => setInflowForm({ ...inflowForm, description: e.target.value })}
                  placeholder="e.g. October monthly payout credit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInflowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Save Inflow Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Outflow (Agent Payout) Modal */}
      {showOutflowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                <span>{language === 'hi' ? 'एजेंट कमीशन भुगतान (Outflow) दर्ज करें' : 'Record Agent Payout Outflow'}</span>
              </h3>
              <button onClick={() => setShowOutflowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleOutflowSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select DSA Agent *</label>
                <select
                  required
                  value={outflowForm.agentId}
                  onChange={(e) => setOutflowForm({ ...outflowForm, agentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">-- Choose Agent --</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.agencyName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Partner Bank *</label>
                <select
                  value={outflowForm.bankName}
                  onChange={(e) => setOutflowForm({ ...outflowForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  {bankList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Linked Loan File (Optional)</label>
                <select
                  value={outflowForm.fileNo}
                  onChange={(e) => {
                    const fNo = e.target.value;
                    const match = loanFiles.find(f => f.fileNo === fNo);
                    setOutflowForm({
                      ...outflowForm,
                      fileNo: fNo,
                      amount: match ? (match.agentPayoutAmount - (match.agentPayoutPaid || 0)).toString() : outflowForm.amount,
                      agentId: match ? match.agentId : outflowForm.agentId,
                      bankName: match ? match.bankName : outflowForm.bankName
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="">-- Direct Payment / Batch --</option>
                  {loanFiles.map(f => (
                    <option key={f.id} value={f.fileNo}>
                      {f.fileNo} - {f.borrowerName} (Agent Due: ₹{f.agentPayoutAmount - (f.agentPayoutPaid || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    value={outflowForm.amount}
                    onChange={(e) => setOutflowForm({ ...outflowForm, amount: e.target.value })}
                    placeholder="e.g. 42250"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={outflowForm.date}
                    onChange={(e) => setOutflowForm({ ...outflowForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={outflowForm.paymentMode}
                    onChange={(e) => setOutflowForm({ ...outflowForm, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="IMPS">IMPS Instant</option>
                    <option value="NEFT/RTGS">NEFT / RTGS</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UTR / IMPS Ref No</label>
                  <input
                    type="text"
                    value={outflowForm.referenceNo}
                    onChange={(e) => setOutflowForm({ ...outflowForm, referenceNo: e.target.value })}
                    placeholder="e.g. IMPS/261020/VYAS01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOutflowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  Record Outflow Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

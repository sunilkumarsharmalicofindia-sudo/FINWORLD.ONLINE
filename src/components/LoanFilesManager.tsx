import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LoanFile, LoanProduct, FileStatus } from '../types';
import { formatINR, formatDate, exportToExcel, exportToCSV } from '../utils/formatters';
import { 
  FolderKanban, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Users, 
  FileText,
  DollarSign,
  Briefcase,
  Trash2
} from 'lucide-react';

interface LoanFilesManagerProps {
  initialSearchQuery?: string;
}

export const LoanFilesManager: React.FC<LoanFilesManagerProps> = ({ initialSearchQuery = '' }) => {
  const { 
    loanFiles, 
    agents, 
    bankers, 
    addLoanFile, 
    updateLoanFile, 
    deleteLoanFile,
    clearLoanFilesData,
    t, 
    language 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fileNo: `LN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    borrowerName: '',
    agentId: agents[0]?.id || '',
    bankName: 'HDFC Bank',
    product: 'Home Loan' as LoanProduct,
    loanAmount: 5000000,
    sanctionDate: new Date().toISOString().slice(0, 10),
    disbursedDate: new Date().toISOString().slice(0, 10),
    status: 'Disbursed' as FileStatus,
    bankOfficerName: '',
    city: 'Mumbai',
    bankPayoutRate: 1.25,
    agentPayoutRate: 0.65,
    notes: ''
  });

  // Filtered files
  const filteredFiles = useMemo(() => {
    return loanFiles.filter(f => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q || 
        f.fileNo.toLowerCase().includes(q) ||
        f.borrowerName.toLowerCase().includes(q) ||
        f.bankName.toLowerCase().includes(q) ||
        f.agentName.toLowerCase().includes(q) ||
        f.product.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchBank = bankFilter === 'all' || f.bankName === bankFilter;

      return matchQ && matchStatus && matchBank;
    });
  }, [loanFiles, searchQuery, statusFilter, bankFilter]);

  // Unique bank names
  const banks = useMemo(() => {
    return Array.from(new Set(loanFiles.map(f => f.bankName))).sort();
  }, [loanFiles]);

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.borrowerName || !formData.fileNo) {
      alert('Please fill in Borrower Name and File Number');
      return;
    }

    const selectedAgent = agents.find(a => a.id === formData.agentId);
    const bankPayoutAmt = (formData.loanAmount * formData.bankPayoutRate) / 100;
    const agentPayoutAmt = (formData.loanAmount * formData.agentPayoutRate) / 100;

    addLoanFile({
      fileNo: formData.fileNo,
      borrowerName: formData.borrowerName,
      agentId: formData.agentId || 'agt-1',
      agentName: selectedAgent ? `${selectedAgent.name} (${selectedAgent.code})` : 'Direct Channel',
      bankName: formData.bankName,
      product: formData.product,
      loanAmount: formData.loanAmount,
      sanctionDate: formData.sanctionDate,
      disbursedDate: formData.status === 'Disbursed' ? formData.disbursedDate : '',
      status: formData.status,
      bankOfficerName: formData.bankOfficerName || 'Branch RM',
      city: formData.city,
      bankPayoutRate: formData.bankPayoutRate,
      bankPayoutAmount: bankPayoutAmt,
      bankPayoutReceived: 0,
      bankPayoutStatus: 'Pending',
      agentPayoutRate: formData.agentPayoutRate,
      agentPayoutAmount: agentPayoutAmt,
      agentPayoutPaid: 0,
      agentPayoutStatus: 'Unpaid',
      isReconciled: false,
      reconciliationNotes: formData.notes
    });

    setShowAddModal(false);
  };

  // Export
  const handleExport = (type: 'excel' | 'csv') => {
    const data = filteredFiles.map(f => ({
      'File No': f.fileNo,
      'Borrower': f.borrowerName,
      'Bank': f.bankName,
      'Product': f.product,
      'Loan Amount': f.loanAmount,
      'Status': f.status,
      'Disbursed Date': f.disbursedDate,
      'Agent Name': f.agentName,
      'Bank Payout %': f.bankPayoutRate,
      'Bank Payout Amount': f.bankPayoutAmount,
      'Bank Received': f.bankPayoutReceived,
      'Agent Payout %': f.agentPayoutRate,
      'Agent Commission': f.agentPayoutAmount,
      'Agent Paid': f.agentPayoutPaid,
      'Reconciled': f.isReconciled ? 'YES' : 'NO'
    }));

    if (type === 'excel') {
      exportToExcel(data, 'Loan_Files_Disbursals_Report');
    } else {
      exportToCSV(data, 'Loan_Files_Disbursals_Report');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'लोन फाइल्स एवं डिस्बर्समेंट ट्रैकर' : 'Loan Files & Disbursal Pipeline'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-500 text-white rounded-full">
                {loanFiles.length} Total Files
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'hi'
                ? 'लॉग-इन से लेकर डिस्बर्सल तक हर फाइल की ट्रैकिंग। बैंक कमीशन और एजेंट शेयर की ऑटोमैटिक गणना।'
                : 'Track loan applications from login to disbursal. Calculate bank commission and agent payouts automatically.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setFormData({
                  fileNo: `LN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                  borrowerName: '',
                  agentId: agents[0]?.id || '',
                  bankName: 'HDFC Bank',
                  product: 'Home Loan',
                  loanAmount: 5000000,
                  sanctionDate: new Date().toISOString().slice(0, 10),
                  disbursedDate: new Date().toISOString().slice(0, 10),
                  status: 'Disbursed',
                  bankOfficerName: '',
                  city: 'Mumbai',
                  bankPayoutRate: 1.25,
                  agentPayoutRate: 0.65,
                  notes: ''
                });
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ {t.logNewFile}</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Excel</span>
            </button>
            {loanFiles.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(language === 'hi' ? 'क्या आप सभी सैंपल लोन फाइलें हटाना चाहते हैं?' : 'Remove all sample loan files?')) {
                    clearLoanFilesData();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-colors"
                title="सैंपल फाइलें हटाएं"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{language === 'hi' ? 'सैंपल हटाएं' : 'Clear Files'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search borrower, file no, bank..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="all">All File Statuses</option>
            <option value="Disbursed">Disbursed</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="Underwriting">Underwriting</option>
            <option value="Logged In">Logged In</option>
          </select>

          {/* Bank Filter */}
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="all">All Partner Banks</option>
            {banks.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">File No & Borrower</th>
                <th className="py-3 px-4">Bank & Product</th>
                <th className="py-3 px-4">Loan Amount</th>
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Bank Commission (₹)</th>
                <th className="py-3 px-4">Agent Share (₹)</th>
                <th className="py-3 px-4">File Status</th>
                <th className="py-3 px-4 text-center">Reconciled</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{file.borrowerName}</div>
                    <div className="font-mono text-[11px] text-purple-600 font-semibold">{file.fileNo}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{file.bankName}</div>
                    <div className="text-[10px] text-slate-500">{file.product}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {formatINR(file.loanAmount)}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {file.agentName}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-blue-700">{formatINR(file.bankPayoutAmount)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Rate: {file.bankPayoutRate}%</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-amber-700">{formatINR(file.agentPayoutAmount)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Rate: {file.agentPayoutRate}%</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      file.status === 'Disbursed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : file.status === 'Sanctioned'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {file.isReconciled ? (
                      <span className="text-emerald-600 font-bold text-sm">✓</span>
                    ) : (
                      <span className="text-slate-300 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete file #${file.fileNo} for ${file.borrowerName}?`)) {
                          deleteLoanFile(file.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete loan file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Loan File Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-purple-600" />
                <span>Log New Loan Disbursal File</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">File Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.fileNo}
                    onChange={(e) => setFormData({ ...formData, fileNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Borrower Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.borrowerName}
                    onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                    placeholder="e.g. Anand Mahindra"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Partner Bank *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loan Product</label>
                  <select
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="Home Loan">Home Loan</option>
                    <option value="Loan Against Property (LAP)">Loan Against Property (LAP)</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="MSME / CC-OD">MSME / CC-OD</option>
                    <option value="Car Loan">Car Loan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loan Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.loanAmount}
                    onChange={(e) => setFormData({ ...formData, loanAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sourcing DSA Agent</label>
                  <select
                    value={formData.agentId}
                    onChange={(e) => {
                      const selAgt = agents.find(a => a.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        agentId: e.target.value,
                        agentPayoutRate: selAgt ? selAgt.defaultCommissionRate : formData.agentPayoutRate 
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Payout Slab (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.bankPayoutRate}
                    onChange={(e) => setFormData({ ...formData, bankPayoutRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agent Payout Slab (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.agentPayoutRate}
                    onChange={(e) => setFormData({ ...formData, agentPayoutRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                >
                  Save Loan File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

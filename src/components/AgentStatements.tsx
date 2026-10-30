import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Agent, LoanFile } from '../types';
import { formatINR, formatDate, exportToExcel, exportToCSV } from '../utils/formatters';
import { PrintableStatementModal } from './PrintableStatementModal';
import { AgentCommissionCalculator } from './AgentCommissionCalculator';
import { EmailDispatchModal } from './EmailDispatchModal';
import { 
  Users, 
  Search, 
  Plus, 
  Printer, 
  Download, 
  ArrowUpRight, 
  FileText, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  CreditCard,
  Calculator,
  FileDown,
  Send
} from 'lucide-react';
import { generateAgentStatementPDF } from '../utils/pdfGenerator';

interface AgentStatementsProps {
  initialSelectedAgentId?: string | null;
}

export const AgentStatements: React.FC<AgentStatementsProps> = ({ initialSelectedAgentId }) => {
  const { 
    agents, 
    loanFiles, 
    transactions, 
    addAgent, 
    updateAgent, 
    addLoanFile,
    updateLoanFile,
    recordOutflow,
    selectedAgentId,
    setSelectedAgentId,
    t, 
    language,
    role
  } = useApp();

  const [activeAgentId, setActiveAgentId] = useState<string>(
    initialSelectedAgentId || selectedAgentId || (agents[0]?.id || '')
  );

  const [searchAgentQuery, setSearchAgentQuery] = useState('');
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Quick Pay Modal Form
  const [payFormData, setPayFormData] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    fileNo: '',
    paymentMode: 'IMPS' as 'IMPS' | 'NEFT/RTGS' | 'UPI' | 'Cheque',
    referenceNo: '',
    notes: ''
  });

  // Add Agent Form
  const [agentFormData, setAgentFormData] = useState({
    code: `DSA-${100 + agents.length + 1}`,
    name: '',
    agencyName: '',
    mobile: '',
    email: '',
    city: 'Jaipur',
    defaultCommissionRate: 0.65,
    bankAccountNo: '',
    ifsc: '',
    panNumber: '',
    status: 'Active' as 'Active' | 'Suspended'
  });

  // Current selected agent object
  const currentAgent = useMemo(() => {
    return agents.find(a => a.id === activeAgentId) || agents[0];
  }, [agents, activeAgentId]);

  // Current agent's loan files
  const agentFiles = useMemo(() => {
    if (!currentAgent) return [];
    return loanFiles.filter(f => f.agentId === currentAgent.id);
  }, [loanFiles, currentAgent]);

  // Current agent's metrics
  const agentMetrics = useMemo(() => {
    const totalFiles = agentFiles.length;
    const disbursedFiles = agentFiles.filter(f => f.status === 'Disbursed');
    const totalVolume = disbursedFiles.reduce((s, f) => s + (f.loanAmount || 0), 0);
    const commissionEarned = disbursedFiles.reduce((s, f) => s + (f.agentPayoutAmount || 0), 0);
    const commissionPaid = disbursedFiles.reduce((s, f) => s + (f.agentPayoutPaid || 0), 0);
    const balanceDue = Math.max(0, commissionEarned - commissionPaid);

    return {
      totalFiles,
      disbursedCount: disbursedFiles.length,
      totalVolume,
      commissionEarned,
      commissionPaid,
      balanceDue
    };
  }, [agentFiles]);

  // Filtered Agent List for Left Nav
  const filteredAgentList = useMemo(() => {
    const q = searchAgentQuery.toLowerCase().trim();
    if (!q) return agents;
    return agents.filter(a => 
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.agencyName.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.mobile.includes(q)
    );
  }, [agents, searchAgentQuery]);

  // Handle Pay Submit
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payFormData.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    recordOutflow({
      date: payFormData.date,
      category: 'Agent Commission Paid',
      bankName: 'HDFC Bank', // primary clearing account
      agentId: currentAgent.id,
      agentName: currentAgent.name,
      fileNo: payFormData.fileNo || undefined,
      amount: amountNum,
      paymentMode: payFormData.paymentMode as any,
      referenceNo: payFormData.referenceNo || `IMPS-${Date.now().toString().slice(-6)}`,
      description: payFormData.notes || `Commission settlement for ${currentAgent.name} (${currentAgent.code})`,
      reconciledStatus: 'Matched'
    });

    setShowPayModal(false);
    setPayFormData({
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      fileNo: '',
      paymentMode: 'IMPS',
      referenceNo: '',
      notes: ''
    });
  };

  // Handle Add Agent Submit
  const handleAddAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentFormData.name || !agentFormData.mobile) {
      alert('Please fill Name and Mobile');
      return;
    }

    addAgent(agentFormData);
    setShowAddAgentModal(false);
  };

  // Export current agent statement
  const handleExportStatement = (type: 'excel' | 'csv') => {
    if (!currentAgent) return;
    const data = agentFiles.map(f => ({
      'File No': f.fileNo,
      'Borrower': f.borrowerName,
      'Bank': f.bankName,
      'Product': f.product,
      'Loan Amount': f.loanAmount,
      'Disbursal Date': f.disbursedDate,
      'Commission Rate %': f.agentPayoutRate,
      'Commission Amount (₹)': f.agentPayoutAmount,
      'Commission Paid (₹)': f.agentPayoutPaid || 0,
      'Balance Due (₹)': Math.max(0, f.agentPayoutAmount - (f.agentPayoutPaid || 0)),
      'Payout Status': f.agentPayoutStatus,
      'Reference': f.agentPaymentRef || ''
    }));

    const title = `${currentAgent.code}_${currentAgent.name.replace(/\s+/g, '_')}_Statement`;
    if (type === 'excel') {
      exportToExcel(data, title);
    } else {
      exportToCSV(data, title);
    }
  };

  // Automated Commission Calculator Handlers
  const handleBatchRecalculateFiles = (updatedFiles: { fileId: string; newRate: number; newAmount: number }[]) => {
    updatedFiles.forEach(item => {
      updateLoanFile(item.fileId, {
        agentPayoutRate: item.newRate,
        agentPayoutAmount: item.newAmount
      });
    });
  };

  const handleLogCalculatedFile = (newFileData: {
    product: any;
    loanAmount: number;
    agentPayoutRate: number;
    agentPayoutAmount: number;
  }) => {
    if (!currentAgent) return;
    const newFileNo = `LN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const bankPayoutRate = Number((newFileData.agentPayoutRate + 0.55).toFixed(2));
    const bankPayoutAmt = Math.round((newFileData.loanAmount * bankPayoutRate) / 100);

    addLoanFile({
      fileNo: newFileNo,
      borrowerName: `Client (${newFileData.product})`,
      agentId: currentAgent.id,
      agentName: `${currentAgent.name} (${currentAgent.code})`,
      bankName: 'HDFC Bank',
      product: newFileData.product,
      loanAmount: newFileData.loanAmount,
      sanctionDate: new Date().toISOString().slice(0, 10),
      disbursedDate: new Date().toISOString().slice(0, 10),
      status: 'Disbursed',
      bankOfficerName: 'Branch RM',
      city: currentAgent.city,
      bankPayoutRate: bankPayoutRate,
      bankPayoutAmount: bankPayoutAmt,
      bankPayoutReceived: 0,
      bankPayoutStatus: 'Pending',
      agentPayoutRate: newFileData.agentPayoutRate,
      agentPayoutAmount: newFileData.agentPayoutAmount,
      agentPayoutPaid: 0,
      agentPayoutStatus: 'Unpaid',
      isReconciled: false,
      reconciliationNotes: `Logged via Automated Commission Calculator using ${newFileData.agentPayoutRate}% slab.`
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'DSA एजेंट अकाउंट स्टेटमेंट एवं सेल्स रिपोर्ट' : 'DSA Agent Statements & Sales Performance'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500 text-white rounded-full">
                {agents.length} Active Agents
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'hi'
                ? 'एजेंट वार विस्तृत खाता विवरण। कितनी फाइलें लॉग इन हुईं, कितना डिस्बर्स हुआ, कितना कमीशन बना और कितना भुगतान बाकी है।'
                : 'Detailed ledger statements for each DSA agent. Track sales volume, commission calculations, payouts made, and pending balance.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (currentAgent) {
                  generateAgentStatementPDF(currentAgent, loanFiles, transactions);
                }
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Statement PDF</span>
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-102"
              title="Send Statement via Email"
            >
              <Mail className="w-4 h-4" />
              <span>{language === 'hi' ? 'मेल भेजें' : 'Email Statement'}</span>
            </button>
            <button
              onClick={() => setShowAddAgentModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Onboard Agent</span>
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printStatement}</span>
            </button>
            <button
              onClick={() => handleExportStatement('excel')}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Agent Selector + Right Detailed Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): Agent Selection List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Select DSA Agent</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              {filteredAgentList.length} DSAs
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchAgentQuery}
              onChange={(e) => setSearchAgentQuery(e.target.value)}
              placeholder="Search agent name or code..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Agent Items List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredAgentList.map((agent) => {
              const isSelected = agent.id === currentAgent?.id;
              const files = loanFiles.filter(f => f.agentId === agent.id && f.status === 'Disbursed');
              const vol = files.reduce((s, f) => s + (f.loanAmount || 0), 0);
              const earned = files.reduce((s, f) => s + (f.agentPayoutAmount || 0), 0);
              const paid = files.reduce((s, f) => s + (f.agentPayoutPaid || 0), 0);
              const due = Math.max(0, earned - paid);

              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    setActiveAgentId(agent.id);
                    setSelectedAgentId(agent.id);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{agent.name}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {agent.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{agent.agencyName}</p>
                      <p className="text-[10px] text-slate-400">{agent.city} • Rate: {agent.defaultCommissionRate}%</p>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-bold text-slate-900">{formatINR(vol)}</div>
                      {due > 0 ? (
                        <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-1">
                          Due: {formatINR(due)}
                        </div>
                      ) : (
                        <div className="text-[10px] font-semibold text-emerald-600 mt-1">
                          Settled
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Selected Agent Statement */}
        {currentAgent ? (
          <div className="lg:col-span-8 space-y-5">
            
            {/* Agent Profile & Action Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20">
                    {currentAgent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-black text-slate-900">{currentAgent.name}</h2>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {currentAgent.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">{currentAgent.agencyName} • {currentAgent.city}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setPayFormData({
                        ...payFormData,
                        amount: agentMetrics.balanceDue > 0 ? agentMetrics.balanceDue.toString() : ''
                      });
                      setShowPayModal(true);
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Pay Commission</span>
                  </button>

                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Print Statement"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Agent KYC & Bank Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank Account</span>
                  <span className="font-mono font-semibold text-slate-800">{currentAgent.bankAccountNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">IFSC Code</span>
                  <span className="font-mono font-semibold text-slate-800">{currentAgent.ifsc || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">PAN Number</span>
                  <span className="font-mono font-semibold text-slate-800 uppercase">{currentAgent.panNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Default Slab %</span>
                  <span className="font-bold text-emerald-700">{currentAgent.defaultCommissionRate}% Payout</span>
                </div>
              </div>
            </div>

            {/* 4 Performance Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Disbursed Volume</span>
                <span className="text-base font-extrabold text-slate-900 block mt-1">{formatINR(agentMetrics.totalVolume)}</span>
                <span className="text-[10px] text-slate-400 font-medium">{agentMetrics.disbursedCount} files disbursed</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Commission Earned</span>
                <span className="text-base font-extrabold text-blue-700 block mt-1">{formatINR(agentMetrics.commissionEarned)}</span>
                <span className="text-[10px] text-blue-600 font-medium">Gross calculated</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Commission Paid</span>
                <span className="text-base font-extrabold text-emerald-700 block mt-1">{formatINR(agentMetrics.commissionPaid)}</span>
                <span className="text-[10px] text-emerald-600 font-medium">Settled to bank</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
                <span className="text-[11px] font-semibold text-amber-800 uppercase block">Balance Due</span>
                <span className="text-base font-extrabold text-amber-700 block mt-1">{formatINR(agentMetrics.balanceDue)}</span>
                <span className="text-[10px] text-amber-600 font-bold">Outstanding payout</span>
              </div>
            </div>

            {/* Automated Commission Calculator with Configurable Product Slabs */}
            <AgentCommissionCalculator
              currentAgent={currentAgent}
              agentFiles={agentFiles}
              onBatchRecalculateFiles={handleBatchRecalculateFiles}
              onLogCalculatedFile={handleLogCalculatedFile}
              language={language}
            />

            {/* Loan Sourcing Ledger Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Sourced Loan Files Ledger</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {agentFiles.length} Total Files
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">File No & Borrower</th>
                      <th className="py-2.5 px-3">Bank & Product</th>
                      <th className="py-2.5 px-3">Loan Amount (₹)</th>
                      <th className="py-2.5 px-3">Rate %</th>
                      <th className="py-2.5 px-3">Commission (₹)</th>
                      <th className="py-2.5 px-3">Paid (₹)</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {agentFiles.map((file) => {
                      const balance = Math.max(0, file.agentPayoutAmount - (file.agentPayoutPaid || 0));
                      return (
                        <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{file.borrowerName}</div>
                            <div className="font-mono text-[11px] text-indigo-600">{file.fileNo}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{file.bankName}</div>
                            <div className="text-[10px] text-slate-500">{file.product}</div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {formatINR(file.loanAmount)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            {file.agentPayoutRate}%
                          </td>
                          <td className="py-3 px-3 font-extrabold text-blue-700">
                            {formatINR(file.agentPayoutAmount)}
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-700">
                            {formatINR(file.agentPayoutPaid || 0)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              file.agentPayoutStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : file.agentPayoutStatus === 'Partially Paid'
                                ? 'bg-blue-50 text-blue-700'
                                : file.agentPayoutStatus === 'On Hold'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {file.agentPayoutStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            Select an agent from the left to view statement.
          </div>
        )}

      </div>

      {/* Pay Commission Modal */}
      {showPayModal && currentAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                <span>Pay Commission to {currentAgent.name}</span>
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <p><span className="font-semibold">Beneficiary:</span> {currentAgent.name} ({currentAgent.agencyName})</p>
                <p><span className="font-semibold">Bank A/C:</span> {currentAgent.bankAccountNo} | IFSC: {currentAgent.ifsc}</p>
                <p><span className="font-semibold">Current Balance Due:</span> <span className="font-bold text-amber-700">{formatINR(agentMetrics.balanceDue)}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Transfer (₹) *</label>
                <input
                  type="number"
                  required
                  value={payFormData.amount}
                  onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
                  placeholder="e.g. 26000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specific Loan File (Optional)</label>
                <select
                  value={payFormData.fileNo}
                  onChange={(e) => setPayFormData({ ...payFormData, fileNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="">-- Settle Across All Files / Lump-sum --</option>
                  {agentFiles.map(f => (
                    <option key={f.id} value={f.fileNo}>
                      {f.fileNo} - {f.borrowerName} (Pending: ₹{f.agentPayoutAmount - (f.agentPayoutPaid || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={payFormData.paymentMode}
                    onChange={(e) => setPayFormData({ ...payFormData, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    <option value="IMPS">IMPS Instant</option>
                    <option value="NEFT/RTGS">NEFT / RTGS</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Reference / UTR *</label>
                  <input
                    type="text"
                    required
                    value={payFormData.referenceNo}
                    onChange={(e) => setPayFormData({ ...payFormData, referenceNo: e.target.value })}
                    placeholder="e.g. IMPS/261025/9981"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  Confirm Payout Remittance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Onboard New Sub-DSA / Agent</span>
              </h3>
              <button onClick={() => setShowAddAgentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddAgentSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agent Code</label>
                  <input
                    type="text"
                    value={agentFormData.code}
                    onChange={(e) => setAgentFormData({ ...agentFormData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={agentFormData.name}
                    onChange={(e) => setAgentFormData({ ...agentFormData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agency / Firm Name</label>
                  <input
                    type="text"
                    value={agentFormData.agencyName}
                    onChange={(e) => setAgentFormData({ ...agentFormData, agencyName: e.target.value })}
                    placeholder="e.g. Sharma Finance Solutions"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={agentFormData.city}
                    onChange={(e) => setAgentFormData({ ...agentFormData, city: e.target.value })}
                    placeholder="e.g. Jaipur"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={agentFormData.mobile}
                    onChange={(e) => setAgentFormData({ ...agentFormData, mobile: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Payout Slab (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={agentFormData.defaultCommissionRate}
                    onChange={(e) => setAgentFormData({ ...agentFormData, defaultCommissionRate: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 0.65"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account</label>
                  <input
                    type="text"
                    value={agentFormData.bankAccountNo}
                    onChange={(e) => setAgentFormData({ ...agentFormData, bankAccountNo: e.target.value })}
                    placeholder="Account number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC</label>
                  <input
                    type="text"
                    value={agentFormData.ifsc}
                    onChange={(e) => setAgentFormData({ ...agentFormData, ifsc: e.target.value.toUpperCase() })}
                    placeholder="HDFC0000054"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PAN</label>
                  <input
                    type="text"
                    value={agentFormData.panNumber}
                    onChange={(e) => setAgentFormData({ ...agentFormData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAgentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Statement Voucher Modal */}
      {showPrintModal && currentAgent && (
        <PrintableStatementModal
          agent={currentAgent}
          loanFiles={loanFiles}
          transactions={transactions}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Email Dispatch Modal */}
      {showEmailModal && currentAgent && (
        <EmailDispatchModal
          agent={currentAgent}
          agentFiles={agentFiles}
          onClose={() => setShowEmailModal(false)}
        />
      )}

    </div>
  );
};

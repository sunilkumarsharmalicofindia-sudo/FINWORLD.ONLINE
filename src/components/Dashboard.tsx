import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatShortINR, formatDate } from '../utils/formatters';
import { 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PiggyBank, 
  Clock, 
  AlertCircle, 
  Building2, 
  FileSpreadsheet, 
  Users, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Search,
  ExternalLink,
  Flame,
  Award,
  MapPin,
  BarChart3,
  Filter,
  Layers,
  Grid,
  Target,
  Info,
  Percent,
  TrendingDown
} from 'lucide-react';
import { QuickActionFab } from './QuickActionFab';

interface DashboardProps {
  onNavigateToTab: (tabId: string) => void;
  onOpenStatementForAgent?: (agentId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigateToTab,
  onOpenStatementForAgent 
}) => {
  const { t, bankers, agents, loanFiles, transactions, language } = useApp();

  // Calculations
  const totalDisbursedVolume = loanFiles
    .filter(f => f.status === 'Disbursed')
    .reduce((sum, f) => sum + (f.loanAmount || 0), 0);

  const totalBankInflow = transactions
    .filter(t => t.type === 'Inflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAgentOutflow = transactions
    .filter(t => t.type === 'Outflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const netRetainedMargin = totalBankInflow - totalAgentOutflow;
  const marginPercentage = totalBankInflow > 0 ? ((netRetainedMargin / totalBankInflow) * 100).toFixed(1) : '0';

  const pendingBankReceivables = loanFiles
    .filter(f => f.status === 'Disbursed')
    .reduce((sum, f) => {
      const pending = (f.bankPayoutAmount || 0) - (f.bankPayoutReceived || 0);
      return sum + (pending > 0 ? pending : 0);
    }, 0);

  const pendingAgentPayables = loanFiles
    .filter(f => f.status === 'Disbursed')
    .reduce((sum, f) => {
      const pending = (f.agentPayoutAmount || 0) - (f.agentPayoutPaid || 0);
      return sum + (pending > 0 ? pending : 0);
    }, 0);

  // Bank-wise Breakdown
  const bankNames = Array.from(new Set(loanFiles.map(f => f.bankName)));
  const bankBreakdowns = bankNames.map(bName => {
    const files = loanFiles.filter(f => f.bankName === bName && f.status === 'Disbursed');
    const disbursed = files.reduce((sum, f) => sum + (f.loanAmount || 0), 0);
    const bankReceived = files.reduce((sum, f) => sum + (f.bankPayoutReceived || 0), 0);
    const agentPaid = files.reduce((sum, f) => sum + (f.agentPayoutPaid || 0), 0);
    const pendingFromBank = files.reduce((sum, f) => {
      const diff = (f.bankPayoutAmount || 0) - (f.bankPayoutReceived || 0);
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    const margin = bankReceived - agentPaid;

    return {
      bankName: bName,
      fileCount: files.length,
      disbursed,
      bankReceived,
      agentPaid,
      pendingFromBank,
      margin
    };
  }).sort((a, b) => b.disbursed - a.disbursed);

  // Heatmap View Controls
  const [heatmapView, setHeatmapView] = useState<'branch' | 'agent' | 'quadrant' | 'table'>('branch');
  const [heatmapMetric, setHeatmapMetric] = useState<'combined' | 'payout' | 'conversion'>('combined');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'payout' | 'conversion' | 'volume' | 'name'>('payout');

  // Agent Performance Breakdown with Heatmap & Conversion Metrics
  const agentPerformance = useMemo(() => {
    return agents.map(agent => {
      const files = loanFiles.filter(f => f.agentId === agent.id);
      const disbursedFiles = files.filter(f => f.status === 'Disbursed');
      const rejectedFiles = files.filter(f => f.status === 'Rejected');
      const inPipelineFiles = files.filter(f => ['Logged In', 'Underwriting', 'Sanctioned'].includes(f.status));
      const totalVolume = disbursedFiles.reduce((sum, f) => sum + (f.loanAmount || 0), 0);
      const commissionEarned = disbursedFiles.reduce((sum, f) => sum + (f.agentPayoutAmount || 0), 0);
      const commissionPaid = disbursedFiles.reduce((sum, f) => sum + (f.agentPayoutPaid || 0), 0);
      const balanceDue = commissionEarned - commissionPaid;
      const totalFilesCount = files.length;
      const disbursedCount = disbursedFiles.length;
      const conversionRate = totalFilesCount > 0 ? Math.round((disbursedCount / totalFilesCount) * 100) : 0;

      // Tier 1 (Elite): High Payout (>= ₹50,000) AND High Conversion (>= 55%), or exceptional volume (>= ₹80,000)
      // Tier 2 (Strong): Payout >= ₹30,000 OR Conversion >= 55%
      // Tier 3 (Steady): Payout >= ₹10,000 OR Conversion >= 30%
      // Tier 4 (Needs Focus): Below thresholds
      let combinedTier: 1 | 2 | 3 | 4 = 4;
      if ((commissionEarned >= 50000 && conversionRate >= 55) || commissionEarned >= 80000) {
        combinedTier = 1;
      } else if ((commissionEarned >= 30000 && conversionRate >= 40) || conversionRate >= 60 || commissionEarned >= 45000) {
        combinedTier = 2;
      } else if (commissionEarned >= 10000 || conversionRate >= 30) {
        combinedTier = 3;
      } else {
        combinedTier = 4;
      }

      // Payout Volume Tier
      let payoutTier: 1 | 2 | 3 | 4 = 4;
      if (commissionEarned >= 60000) payoutTier = 1;
      else if (commissionEarned >= 30000) payoutTier = 2;
      else if (commissionEarned >= 10000) payoutTier = 3;
      else payoutTier = 4;

      // Conversion Rate Tier
      let conversionTier: 1 | 2 | 3 | 4 = 4;
      if (conversionRate >= 65) conversionTier = 1;
      else if (conversionRate >= 50) conversionTier = 2;
      else if (conversionRate >= 30) conversionTier = 3;
      else conversionTier = 4;

      return {
        ...agent,
        branch: agent.city || 'Central Hub',
        totalFiles: totalFilesCount,
        disbursedCount,
        rejectedCount: rejectedFiles.length,
        inPipelineCount: inPipelineFiles.length,
        conversionRate,
        totalVolume,
        commissionEarned, // Monthly payout volume
        commissionPaid,
        balanceDue: balanceDue > 0 ? balanceDue : 0,
        combinedTier,
        payoutTier,
        conversionTier
      };
    });
  }, [agents, loanFiles]);

  // Branch Summaries (Grouped by agent.city / branch location)
  const branchSummaries = useMemo(() => {
    const branchMap = new Map<string, typeof agentPerformance>();
    
    agentPerformance.forEach(agent => {
      const branchName = agent.branch;
      if (!branchMap.has(branchName)) {
        branchMap.set(branchName, []);
      }
      branchMap.get(branchName)!.push(agent);
    });

    const summaries = Array.from(branchMap.entries()).map(([branchName, branchAgents]) => {
      const totalAgents = branchAgents.length;
      const totalBranchPayout = branchAgents.reduce((sum, a) => sum + a.commissionEarned, 0);
      const totalBranchVolume = branchAgents.reduce((sum, a) => sum + a.totalVolume, 0);
      const totalBranchFiles = branchAgents.reduce((sum, a) => sum + a.totalFiles, 0);
      const totalDisbursedFiles = branchAgents.reduce((sum, a) => sum + a.disbursedCount, 0);
      const branchConversionRate = totalBranchFiles > 0 
        ? Math.round((totalDisbursedFiles / totalBranchFiles) * 100) 
        : 0;

      // Find top agent in branch
      const sortedBranchAgents = [...branchAgents].sort((a, b) => b.commissionEarned - a.commissionEarned);
      const topAgent = sortedBranchAgents[0];

      // Branch Tier
      let branchTier: 1 | 2 | 3 | 4 = 4;
      if ((totalBranchPayout >= 80000 && branchConversionRate >= 50) || totalBranchPayout >= 120000) {
        branchTier = 1;
      } else if (totalBranchPayout >= 40000 || branchConversionRate >= 50) {
        branchTier = 2;
      } else if (totalBranchPayout >= 15000 || branchConversionRate >= 30) {
        branchTier = 3;
      } else {
        branchTier = 4;
      }

      return {
        branchName,
        agents: sortedBranchAgents,
        totalAgents,
        totalBranchPayout,
        totalBranchVolume,
        totalBranchFiles,
        totalDisbursedFiles,
        branchConversionRate,
        topAgent,
        branchTier
      };
    });

    // Rank branches by total payout volume
    return summaries.sort((a, b) => b.totalBranchPayout - a.totalBranchPayout);
  }, [agentPerformance]);

  // Filtered and sorted agents
  const filteredAgents = useMemo(() => {
    let list = [...agentPerformance];
    if (selectedBranch !== 'All') {
      list = list.filter(a => a.branch === selectedBranch);
    }
    return list.sort((a, b) => {
      if (sortBy === 'payout') return b.commissionEarned - a.commissionEarned;
      if (sortBy === 'conversion') return b.conversionRate - a.conversionRate;
      if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
      return a.name.localeCompare(b.name);
    });
  }, [agentPerformance, selectedBranch, sortBy]);

  // Unique branch list for filtering
  const allBranches = useMemo(() => {
    return Array.from(new Set(agentPerformance.map(a => a.branch))).sort();
  }, [agentPerformance]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome & Quick Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl border border-slate-700/60 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'वित्तीय डैशबोर्ड एवं चैनल ओवरव्यू' : 'Financial Dashboard & Channel Overview'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Live Sync
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'hi' 
                ? 'बैंक से आए कमीशन, एजेंट पेआउट, ऑल इंडिया बैंकर संपर्क एवं ऑटोमैटिक हिसाब मिलान की रीयल-टाइम रिपोर्ट।' 
                : 'Real-time reporting of bank commission inflows, agent payouts, All-India loan officers directory, and automated monthly reconciliation.'}
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateToTab('excelImporter')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t.pasteExcel}</span>
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            </button>
            <button
              onClick={() => onNavigateToTab('bankerDirectory')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>{t.searchBankers}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('reconciliation')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>{t.reconciliation}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Disbursed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.totalDisbursed}</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{formatINR(totalDisbursedVolume)}</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {loanFiles.filter(f => f.status === 'Disbursed').length} files successfully disbursed
          </p>
        </div>

        {/* Bank Inflow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.bankInflow}</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-700">{formatINR(totalBankInflow)}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Bank commission credited
          </p>
        </div>

        {/* Agent Outflow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.agentOutflow}</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-700">{formatINR(totalAgentOutflow)}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Disbursed to Sub-DSAs / Agents
          </p>
        </div>

        {/* Net Retained Profit */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/40 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.netMargin}</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700">{formatINR(netRetainedMargin)}</div>
          <div className="flex items-center space-x-1 mt-1 text-[11px] font-bold text-emerald-600">
            <span>{marginPercentage}% retained margin</span>
          </div>
        </div>

        {/* Pending Bank Receivables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.pendingBankReceivable}</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-700">{formatINR(pendingBankReceivables)}</div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">
            Awaiting bank remittance
          </p>
        </div>

        {/* Pending Agent Payables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.pendingAgentPayable}</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-orange-700">{formatINR(pendingAgentPayables)}</div>
          <p className="text-[11px] text-orange-600 font-medium mt-1">
            Payable to active agents
          </p>
        </div>

      </div>

      {/* Main Grid: Bank Breakdown + Cash Flow Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Bank-Wise Payout & Disbursal Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>
                  {language === 'hi' ? 'बैंक अनुसार हिसाब-किताब (Disbursals & Bank Payouts)' : 'Bank-Wise Performance & Payout Ledger'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'hi' 
                  ? 'किस बैंक से कितना लोन हुआ, कितना कमीशन आया और कितना एजेंट को गया' 
                  : 'Breakdown of loan disbursed, gross bank commission received, and agent payout per bank channel'}
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('bankPayoutCashflow')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>{language === 'hi' ? 'विस्तृत रिपोर्ट देखें' : 'View Full Ledger'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">{t.bank}</th>
                  <th className="py-2.5 px-3">{t.disbursed} (₹)</th>
                  <th className="py-2.5 px-3 text-blue-700">{language === 'hi' ? 'बैंक से आया' : 'Bank Received'}</th>
                  <th className="py-2.5 px-3 text-amber-700">{language === 'hi' ? 'एजेंट को गया' : 'Agent Paid'}</th>
                  <th className="py-2.5 px-3 text-emerald-700">{language === 'hi' ? 'शुद्ध बचत' : 'Net Margin'}</th>
                  <th className="py-2.5 px-3 text-rose-700 rounded-r-lg">{language === 'hi' ? 'बैंक से बाकी' : 'Pending'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bankBreakdowns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <div className="font-semibold text-slate-600 text-xs">
                        {language === 'hi' ? 'कोई लोन फाइल रिकॉर्ड नहीं है (डेमो डेटा साफ है)' : 'No loan files recorded yet (Clean Slate)'}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {language === 'hi' 
                          ? 'एक्सेल से सीधे डेटा पेस्ट करें या नई लोन फाइल जोड़ें।' 
                          : 'Paste data directly from Excel or add a new loan file to track bank payouts.'}
                      </p>
                      <button
                        onClick={() => onNavigateToTab('excelImporter')}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs inline-flex items-center space-x-1"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>{t.pasteExcel}</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  bankBreakdowns.map((b) => (
                    <tr key={b.bankName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{b.bankName}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{formatINR(b.disbursed)}</td>
                      <td className="py-3 px-3 font-bold text-blue-700">{formatINR(b.bankReceived)}</td>
                      <td className="py-3 px-3 font-semibold text-amber-700">{formatINR(b.agentPaid)}</td>
                      <td className="py-3 px-3 font-bold text-emerald-700 bg-emerald-50/50">{formatINR(b.margin)}</td>
                      <td className="py-3 px-3">
                        {b.pendingFromBank > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                            {formatINR(b.pendingFromBank)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">✓ Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Recent Cash Flow Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'hi' ? 'हालिया लेनदेन (Cash Flow)' : 'Recent Transactions'}
              </h2>
              <p className="text-xs text-slate-500">Live Inflow & Outflow</p>
            </div>
            <button
              onClick={() => onNavigateToTab('bankPayoutCashflow')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              {t.all}
            </button>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <div className="font-semibold text-xs text-slate-600">
                  {language === 'hi' ? 'कोई लेन-देन नहीं है' : 'No transactions recorded yet'}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'hi' ? 'बैंक क्रेडिट या एजेंट पेआउट दर्ज करें।' : 'Record bank credits or agent payouts.'}
                </p>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => {
                const isInflow = tx.type === 'Inflow';
                return (
                  <div 
                    key={tx.id} 
                    className={`p-3 rounded-xl border transition-all ${
                      isInflow ? 'bg-blue-50/40 border-blue-200/60' : 'bg-amber-50/40 border-amber-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${isInflow ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'}`}>
                          {isInflow ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                            {isInflow ? tx.bankName : (tx.agentName || 'Agent Payout')}
                          </div>
                          <div className="text-[10px] text-slate-500">{formatDate(tx.date)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-extrabold ${isInflow ? 'text-blue-700' : 'text-amber-700'}`}>
                          {isInflow ? '+' : '-'}{formatINR(tx.amount)}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 truncate max-w-[110px]">
                          Ref: {tx.referenceNo}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateToTab('bankPayoutCashflow')}
              className="w-full py-2 px-3 text-center text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              + {t.recordBankCredit} / {t.payAgent}
            </button>
          </div>
        </div>

      </div>

      {/* Agent & Branch Performance Heatmap Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-xl shadow-sm">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>
                    {language === 'hi' 
                      ? 'DSA एजेंट व ब्रांच परफॉरमेंस हीटमैप' 
                      : 'DSA Agent & Branch Performance Heatmap'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Heatmap
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi' 
                    ? 'महीने के पेआउट वॉल्यूम और लोन कन्वर्शन दर के आधार पर कलर-कोडेड विश्लेषण — उच्च प्रदर्शन ब्रांचों की तुरंत पहचान' 
                    : 'Color-coded visual matrix by monthly payout volume and file conversion rates for instant branch benchmarking'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateToTab('agentStatements')}
              className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <Users className="w-4 h-4" />
              <span>{language === 'hi' ? 'सभी एजेंट स्टेटमेंट' : 'View All Agent Statements'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. Instant Identification: High-Performing Branches Showcase */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {language === 'hi' ? 'ब्रांच रैंकिंग एवं तुलना (Branch Benchmarking)' : 'Branch Ranking & Performance Rollup'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {branchSummaries.length} {language === 'hi' ? 'सक्रिय ब्रांच' : 'Active Branches'}
            </span>
          </div>

          {branchSummaries.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <h4 className="font-bold text-slate-800 text-sm">
                {language === 'hi' ? 'कोई सक्रिय एजेंट या ब्रांच डेटा नहीं है (डेमो डेटा साफ है)' : 'No Agent or Branch Records (Clean Slate)'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                {language === 'hi'
                  ? 'डेमो डेटा पूरी तरह हटा दिया गया है। अपनी एक्सेल शीट से सीधे एजेंट और लोन फाइल्स पेस्ट करें या नया एजेंट जोड़ें।'
                  : 'All demo records have been cleared! Import your real DSA agents and loan files from Excel, or add them manually.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => onNavigateToTab('excelImporter')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{t.pasteExcel}</span>
                </button>
                <button
                  onClick={() => onNavigateToTab('agentStatements')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'नया एजेंट जोड़ें' : 'Add New Agent'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {branchSummaries.map((branch, idx) => {
                const isSelected = selectedBranch === branch.branchName;
                const isTop = idx === 0;
                const isSecond = idx === 1;

                // Color style according to tier
                let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                let borderAccent = 'border-slate-200 hover:border-slate-300';
                let heatColor = 'text-slate-800';
                let gaugeColor = 'bg-slate-400';

                if (branch.branchTier === 1) {
                  badgeBg = 'bg-emerald-500 text-white border-emerald-600';
                  borderAccent = isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400';
                  heatColor = 'text-emerald-700';
                  gaugeColor = 'bg-emerald-500';
                } else if (branch.branchTier === 2) {
                  badgeBg = 'bg-teal-100 text-teal-800 border-teal-200';
                  borderAccent = isSelected ? 'border-teal-600 ring-2 ring-teal-500/30' : 'border-teal-200 hover:border-teal-400';
                  heatColor = 'text-teal-700';
                  gaugeColor = 'bg-teal-500';
                } else if (branch.branchTier === 3) {
                  badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
                  borderAccent = isSelected ? 'border-amber-600 ring-2 ring-amber-500/30' : 'border-amber-200 hover:border-amber-400';
                  heatColor = 'text-amber-700';
                  gaugeColor = 'bg-amber-500';
                } else {
                  badgeBg = 'bg-rose-100 text-rose-800 border-rose-200';
                  borderAccent = isSelected ? 'border-rose-600 ring-2 ring-rose-500/30' : 'border-rose-200 hover:border-rose-400';
                  heatColor = 'text-rose-700';
                  gaugeColor = 'bg-rose-500';
                }

                return (
                  <div
                    key={branch.branchName}
                    onClick={() => setSelectedBranch(isSelected ? 'All' : branch.branchName)}
                    className={`p-4 rounded-xl border bg-white transition-all cursor-pointer relative shadow-sm hover:shadow-md ${borderAccent}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-extrabold text-sm text-slate-900">{branch.branchName}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {isTop ? '🏆 #1 Top Branch' : isSecond ? '🥈 #2 Branch' : `#${idx + 1}`}
                      </span>
                    </div>

                    {/* Main Metric: Payout Volume */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Payout</span>
                        <span className={`text-base font-black ${heatColor}`}>
                          {formatINR(branch.totalBranchPayout)}
                        </span>
                      </div>

                      {/* Conversion Rate Gauge */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Conversion Rate</span>
                          <span className="font-bold text-slate-900">{branch.branchConversionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${gaugeColor}`} 
                            style={{ width: `${Math.min(branch.branchConversionRate, 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Micro stats footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{branch.totalAgents} Agents • {branch.totalDisbursedFiles}/{branch.totalBranchFiles} Files</span>
                      <span className={`font-semibold text-xs ${isSelected ? 'text-indigo-600 font-bold underline' : 'text-slate-400'}`}>
                        {isSelected ? 'Filtered ✓' : 'Click to filter'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Heatmap Controls Bar: View Mode, Metric Toggle, Branch Filter & Sorting */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* View Mode Segmented Switch */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setHeatmapView('branch')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                heatmapView === 'branch' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ब्रांच समूह (Branch Heatmap)' : 'Branch Heatmap'}</span>
            </button>
            <button
              onClick={() => setHeatmapView('agent')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                heatmapView === 'agent' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'एजेंट ग्रिड (Agent Grid)' : 'Agent Matrix'}</span>
            </button>
            <button
              onClick={() => setHeatmapView('quadrant')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                heatmapView === 'quadrant' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? '2×2 क्वाड्रेंट (Quadrant)' : '2×2 Quadrant'}</span>
            </button>
            <button
              onClick={() => setHeatmapView('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                heatmapView === 'table' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'तालिका (Table View)' : 'Data Table'}</span>
            </button>
          </div>

          {/* Metric Selector & Branch Filter */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Metric Mode Toggle */}
            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                {language === 'hi' ? 'कलर मीट्रिक:' : 'Color By:'}
              </span>
              <button
                onClick={() => setHeatmapMetric('combined')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  heatmapMetric === 'combined' 
                    ? 'bg-emerald-500 text-white font-bold' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {language === 'hi' ? 'समग्र टीयर' : 'Combined Tier'}
              </button>
              <button
                onClick={() => setHeatmapMetric('payout')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  heatmapMetric === 'payout' 
                    ? 'bg-emerald-500 text-white font-bold' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {language === 'hi' ? 'पेआउट राशि' : 'Payout (₹)'}
              </button>
              <button
                onClick={() => setHeatmapMetric('conversion')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                  heatmapMetric === 'conversion' 
                    ? 'bg-emerald-500 text-white font-bold' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {language === 'hi' ? 'कन्वर्शन दर' : 'Conversion (%)'}
              </button>
            </div>

            {/* Branch Filter Dropdown */}
            <div className="flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                aria-label="Filter agents by branch location"
                className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="All">All Branches ({agents.length} Agents)</option>
                {allBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort agents by metric"
                className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="payout">Sort: Monthly Payout (High to Low)</option>
                <option value="conversion">Sort: Conversion Rate (High to Low)</option>
                <option value="volume">Sort: Disbursed Loan Book</option>
                <option value="name">Sort: Agent Name (A-Z)</option>
              </select>
            </div>

          </div>
        </div>

        {/* 3. Heatmap Legend & Tier Thresholds Bar */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              {language === 'hi' ? 'हीटमैप स्केल (Performance Legend):' : 'Heatmap Scale & Thresholds:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-600 shadow-xs" />
              <span className="font-bold text-emerald-800 text-[11px]">
                Tier 1 Elite (≥₹60k / ≥65% Conv)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-teal-500 shadow-xs" />
              <span className="font-bold text-teal-800 text-[11px]">
                Tier 2 Strong (₹30k–₹60k / 50–64%)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500 shadow-xs" />
              <span className="font-bold text-amber-800 text-[11px]">
                Tier 3 Steady (₹10k–₹30k / 30–49%)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500 shadow-xs" />
              <span className="font-bold text-rose-800 text-[11px]">
                Tier 4 Needs Focus (&lt;₹10k / &lt;30%)
              </span>
            </div>
          </div>
        </div>

        {/* 4. Active Heatmap View Content */}
        {filteredAgents.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <div className="font-semibold text-slate-700 text-xs">
              {language === 'hi' ? 'कोई एजेंट उपलब्ध नहीं है (डेमो डेटा साफ है)' : 'No agent records found (Clean Slate)'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {language === 'hi' ? 'एक्सेल से नए एजेंट इंपोर्ट करें या सीधे जोड़ें।' : 'Import new agents from Excel or add them in the Agent Statements tab.'}
            </p>
          </div>
        ) : (
          <>
            {/* View Mode 1: Branch Grouped Heatmap */}
            {heatmapView === 'branch' && (
          <div className="space-y-6">
            {branchSummaries
              .filter(b => selectedBranch === 'All' || b.branchName === selectedBranch)
              .map((b) => (
                <div key={b.branchName} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                  {/* Branch Group Header */}
                  <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-extrabold text-white">{b.branchName} Branch Hub</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.branchTier === 1 
                              ? 'bg-emerald-500 text-slate-950 font-black' 
                              : b.branchTier === 2 
                              ? 'bg-teal-500/30 text-teal-300 border border-teal-500/40' 
                              : b.branchTier === 3 
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' 
                              : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                          }`}>
                            Tier {b.branchTier} Hub
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {b.totalAgents} DSA Agents Operating • {b.totalDisbursedFiles} of {b.totalBranchFiles} files disbursed successfully
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Branch Payout</div>
                        <div className="text-base font-black text-emerald-400">{formatINR(b.totalBranchPayout)}</div>
                      </div>
                      <div className="h-7 w-[1px] bg-slate-700" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Avg. Conversion</div>
                        <div className="text-base font-black text-white">{b.branchConversionRate}%</div>
                      </div>
                      <div className="h-7 w-[1px] bg-slate-700" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Book</div>
                        <div className="text-base font-bold text-slate-200">{formatShortINR(b.totalBranchVolume)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-grid of Agents in this Branch */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {b.agents.map((agent) => {
                      const tier = heatmapMetric === 'combined' 
                        ? agent.combinedTier 
                        : heatmapMetric === 'payout' 
                        ? agent.payoutTier 
                        : agent.conversionTier;

                      let cardStyle = 'border-slate-200 bg-white hover:border-slate-300';
                      let tierBadge = 'bg-slate-100 text-slate-700';
                      let payoutColor = 'text-slate-900';

                      if (tier === 1) {
                        cardStyle = 'border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-white hover:border-emerald-500 ring-1 ring-emerald-500/20';
                        tierBadge = 'bg-emerald-600 text-white font-bold';
                        payoutColor = 'text-emerald-700';
                      } else if (tier === 2) {
                        cardStyle = 'border-teal-300 bg-gradient-to-br from-teal-50/30 to-white hover:border-teal-400';
                        tierBadge = 'bg-teal-100 text-teal-800 font-bold';
                        payoutColor = 'text-teal-700';
                      } else if (tier === 3) {
                        cardStyle = 'border-amber-200 bg-gradient-to-br from-amber-50/20 to-white hover:border-amber-400';
                        tierBadge = 'bg-amber-100 text-amber-900 font-bold';
                        payoutColor = 'text-amber-700';
                      } else {
                        cardStyle = 'border-rose-200 bg-gradient-to-br from-rose-50/20 to-white hover:border-rose-400';
                        tierBadge = 'bg-rose-100 text-rose-800 font-bold';
                        payoutColor = 'text-rose-700';
                      }

                      return (
                        <div 
                          key={agent.id} 
                          className={`p-3.5 rounded-xl border transition-all shadow-xs ${cardStyle}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="font-black text-sm text-slate-900">{agent.name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                                <span className="font-mono text-indigo-600 font-semibold">{agent.code}</span>
                                <span>•</span>
                                <span className="truncate max-w-[130px]">{agent.agencyName}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${tierBadge}`}>
                              Tier {tier}
                            </span>
                          </div>

                          {/* Payout & Conversion stats */}
                          <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-lg bg-slate-50/90 border border-slate-100">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Payout Volume</div>
                              <div className={`text-sm font-black ${payoutColor}`}>
                                {formatINR(agent.commissionEarned)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Conversion</div>
                              <div className="text-sm font-black text-slate-800">
                                {agent.conversionRate}%
                              </div>
                            </div>
                          </div>

                          {/* Progress Meter */}
                          <div className="space-y-1 mb-2.5">
                            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                              <span>Disbursed: {agent.disbursedCount} / {agent.totalFiles} Files</span>
                              <span>Book: {formatShortINR(agent.totalVolume)}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  agent.conversionRate >= 60 ? 'bg-emerald-500' :
                                  agent.conversionRate >= 45 ? 'bg-teal-500' :
                                  agent.conversionRate >= 30 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(agent.conversionRate, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => {
                              if (onOpenStatementForAgent) onOpenStatementForAgent(agent.id);
                              else onNavigateToTab('agentStatements');
                            }}
                            className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center space-x-1"
                          >
                            <span>{language === 'hi' ? 'स्टेटमेंट व लेजर देखें' : 'View Statement Ledger'}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* View Mode 2: Agent Heatmap Matrix Grid */}
        {heatmapView === 'agent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredAgents.map((agent) => {
              const tier = heatmapMetric === 'combined' 
                ? agent.combinedTier 
                : heatmapMetric === 'payout' 
                ? agent.payoutTier 
                : agent.conversionTier;

              let cardBg = 'bg-white border-slate-200';
              let badgeColor = 'bg-slate-100 text-slate-700';
              let payoutColor = 'text-slate-900';
              let barColor = 'bg-slate-400';

              if (tier === 1) {
                cardBg = 'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 border-emerald-300 ring-1 ring-emerald-500/20';
                badgeColor = 'bg-emerald-600 text-white font-bold';
                payoutColor = 'text-emerald-700 font-black';
                barColor = 'bg-emerald-500';
              } else if (tier === 2) {
                cardBg = 'bg-gradient-to-br from-teal-50/40 via-white to-teal-50/20 border-teal-300';
                badgeColor = 'bg-teal-100 text-teal-800 font-bold';
                payoutColor = 'text-teal-700 font-black';
                barColor = 'bg-teal-500';
              } else if (tier === 3) {
                cardBg = 'bg-gradient-to-br from-amber-50/30 via-white to-amber-50/10 border-amber-300';
                badgeColor = 'bg-amber-100 text-amber-900 font-bold';
                payoutColor = 'text-amber-700 font-black';
                barColor = 'bg-amber-500';
              } else {
                cardBg = 'bg-gradient-to-br from-rose-50/30 via-white to-rose-50/10 border-rose-200';
                badgeColor = 'bg-rose-100 text-rose-800 font-bold';
                payoutColor = 'text-rose-700 font-black';
                barColor = 'bg-rose-500';
              }

              return (
                <div 
                  key={agent.id}
                  className={`p-4 rounded-xl border transition-all shadow-xs hover:shadow-md ${cardBg}`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-2">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{agent.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                        <span className="font-mono text-indigo-600 font-semibold">{agent.code}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700 flex items-center">
                          <MapPin className="w-3 h-3 text-slate-400 mr-0.5 inline" />
                          {agent.branch}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeColor}`}>
                      Tier {tier}
                    </span>
                  </div>

                  {/* Primary Heat Metrics */}
                  <div className="my-3 p-3 rounded-xl bg-slate-50/90 border border-slate-100 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Payout</span>
                      <span className={`text-base ${payoutColor}`}>{formatINR(agent.commissionEarned)}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Conversion Rate</span>
                        <span className="font-black text-slate-800">{agent.conversionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
                          style={{ width: `${Math.min(agent.conversionRate, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Operational breakdown */}
                  <div className="space-y-1 text-[11px] text-slate-600 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Disbursed Files:</span>
                      <span className="font-semibold text-slate-800">{agent.disbursedCount} / {agent.totalFiles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Disbursed Volume:</span>
                      <span className="font-semibold text-slate-800">{formatINR(agent.totalVolume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Outstanding Due:</span>
                      <span className={`font-semibold ${agent.balanceDue > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {agent.balanceDue > 0 ? formatINR(agent.balanceDue) : '✓ Settled'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onOpenStatementForAgent) onOpenStatementForAgent(agent.id);
                      else onNavigateToTab('agentStatements');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>{language === 'hi' ? 'स्टेटमेंट लेजर' : 'Statement Ledger'}</span>
                    <ExternalLink className="w-3 h-3 text-indigo-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode 3: 2x2 Performance Quadrant Matrix */}
        {heatmapView === 'quadrant' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Q1: High Payout + High Conversion (Stars / All-Stars) */}
              <div className="p-4 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50/70 to-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        {language === 'hi' ? 'Q1: स्टार चैंपियंस (High Volume & High Conversion)' : 'Q1: Star Champions (High Payout + High Conv)'}
                      </h4>
                      <p className="text-[10px] text-emerald-700">Monthly Payout ≥ ₹30k &amp; Conversion ≥ 50%</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {filteredAgents.filter(a => a.commissionEarned >= 30000 && a.conversionRate >= 50).length} Agents
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredAgents.filter(a => a.commissionEarned >= 30000 && a.conversionRate >= 50).map(agent => (
                    <div key={agent.id} className="p-2.5 rounded-lg bg-white border border-emerald-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{agent.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-2.5 h-2.5 text-emerald-600 inline" />
                          <span>{agent.branch}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700">{agent.conversionRate}% Conv</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-700">{formatINR(agent.commissionEarned)}</div>
                        <button
                          onClick={() => onOpenStatementForAgent ? onOpenStatementForAgent(agent.id) : onNavigateToTab('agentStatements')}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          Statement
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredAgents.filter(a => a.commissionEarned >= 30000 && a.conversionRate >= 50).length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">No agents in this quadrant yet.</div>
                  )}
                </div>
              </div>

              {/* Q2: High Conversion, Emerging Volume (Efficiency Specialists) */}
              <div className="p-4 rounded-xl border border-teal-300 bg-gradient-to-br from-teal-50/70 to-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-teal-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-teal-600 text-white rounded-lg">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-teal-950">
                        {language === 'hi' ? 'Q2: उच्च दक्षता विशेषज्ञ (High Conv, Emerging Volume)' : 'Q2: Efficiency Specialists (High Conv, Low Volume)'}
                      </h4>
                      <p className="text-[10px] text-teal-700">Conversion ≥ 50% &amp; Monthly Payout &lt; ₹30k</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    {filteredAgents.filter(a => a.commissionEarned < 30000 && a.conversionRate >= 50).length} Agents
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredAgents.filter(a => a.commissionEarned < 30000 && a.conversionRate >= 50).map(agent => (
                    <div key={agent.id} className="p-2.5 rounded-lg bg-white border border-teal-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{agent.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-2.5 h-2.5 text-teal-600 inline" />
                          <span>{agent.branch}</span>
                          <span>•</span>
                          <span className="font-semibold text-teal-700">{agent.conversionRate}% Conv</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-teal-700">{formatINR(agent.commissionEarned)}</div>
                        <button
                          onClick={() => onOpenStatementForAgent ? onOpenStatementForAgent(agent.id) : onNavigateToTab('agentStatements')}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          Statement
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredAgents.filter(a => a.commissionEarned < 30000 && a.conversionRate >= 50).length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">No agents in this quadrant yet.</div>
                  )}
                </div>
              </div>

              {/* Q3: High Payout + Lower Conversion (Scale Drivers / Pipeline Leaks) */}
              <div className="p-4 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/70 to-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-950">
                        {language === 'hi' ? 'Q3: वॉल्यूम ड्राइवर्स (High Payout, Conv Optimization Needed)' : 'Q3: Volume Drivers (High Payout, Conv Leaks)'}
                      </h4>
                      <p className="text-[10px] text-amber-700">Monthly Payout ≥ ₹30k &amp; Conversion &lt; 50%</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {filteredAgents.filter(a => a.commissionEarned >= 30000 && a.conversionRate < 50).length} Agents
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredAgents.filter(a => a.commissionEarned >= 30000 && a.conversionRate < 50).map(agent => (
                    <div key={agent.id} className="p-2.5 rounded-lg bg-white border border-amber-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{agent.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-2.5 h-2.5 text-amber-600 inline" />
                          <span>{agent.branch}</span>
                          <span>•</span>
                          <span className="font-semibold text-amber-700">{agent.conversionRate}% Conv</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-amber-700">{formatINR(agent.commissionEarned)}</div>
                        <button
                          onClick={() => onOpenStatementForAgent ? onOpenStatementForAgent(agent.id) : onNavigateToTab('agentStatements')}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          Statement
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredAgents.filter(a => a.commissionEarned >= 30000 && a.conversionRate < 50).length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">No agents in this quadrant yet.</div>
                  )}
                </div>
              </div>

              {/* Q4: Lower Payout + Lower Conversion (Coaching Needed) */}
              <div className="p-4 rounded-xl border border-rose-300 bg-gradient-to-br from-rose-50/70 to-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-rose-600 text-white rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-rose-950">
                        {language === 'hi' ? 'Q4: सुधार एवं कोचिंग अपेक्षित (Support Required)' : 'Q4: Developing & Coaching Required'}
                      </h4>
                      <p className="text-[10px] text-rose-700">Monthly Payout &lt; ₹30k &amp; Conversion &lt; 50%</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                    {filteredAgents.filter(a => a.commissionEarned < 30000 && a.conversionRate < 50).length} Agents
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredAgents.filter(a => a.commissionEarned < 30000 && a.conversionRate < 50).map(agent => (
                    <div key={agent.id} className="p-2.5 rounded-lg bg-white border border-rose-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{agent.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-2.5 h-2.5 text-rose-600 inline" />
                          <span>{agent.branch}</span>
                          <span>•</span>
                          <span className="font-semibold text-rose-700">{agent.conversionRate}% Conv</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-rose-700">{formatINR(agent.commissionEarned)}</div>
                        <button
                          onClick={() => onOpenStatementForAgent ? onOpenStatementForAgent(agent.id) : onNavigateToTab('agentStatements')}
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          Statement
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredAgents.filter(a => a.commissionEarned < 30000 && a.conversionRate < 50).length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">No agents in this quadrant yet.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* View Mode 4: Detailed Table View with Heatmap Tags */}
        {heatmapView === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Agent &amp; Code</th>
                  <th className="py-2.5 px-3">Branch &amp; Agency</th>
                  <th className="py-2.5 px-3">Conversion Rate (%)</th>
                  <th className="py-2.5 px-3">Monthly Payout (₹)</th>
                  <th className="py-2.5 px-3">Disbursed Book (₹)</th>
                  <th className="py-2.5 px-3">Performance Tier</th>
                  <th className="py-2.5 px-3 text-orange-700">Balance Due (₹)</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{agent.name}</div>
                      <div className="text-[11px] text-indigo-600 font-mono font-semibold">{agent.code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{agent.branch}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{agent.agencyName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-md font-black text-xs ${
                          agent.conversionRate >= 65 ? 'bg-emerald-100 text-emerald-800' :
                          agent.conversionRate >= 50 ? 'bg-teal-100 text-teal-800' :
                          agent.conversionRate >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {agent.conversionRate}%
                        </span>
                        <span className="text-[10px] text-slate-400">({agent.disbursedCount}/{agent.totalFiles})</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                        agent.commissionEarned >= 60000 ? 'bg-emerald-600 text-white' :
                        agent.commissionEarned >= 30000 ? 'bg-teal-100 text-teal-800' :
                        agent.commissionEarned >= 10000 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {formatINR(agent.commissionEarned)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{formatINR(agent.totalVolume)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        agent.combinedTier === 1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        agent.combinedTier === 2 ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                        agent.combinedTier === 3 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        Tier {agent.combinedTier} {agent.combinedTier === 1 ? 'Elite' : agent.combinedTier === 2 ? 'Strong' : agent.combinedTier === 3 ? 'Steady' : 'Focus'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {agent.balanceDue > 0 ? (
                        <span className="font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full text-[11px]">
                          {formatINR(agent.balanceDue)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">✓ Settled</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          if (onOpenStatementForAgent) onOpenStatementForAgent(agent.id);
                          else onNavigateToTab('agentStatements');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors inline-flex items-center space-x-1"
                      >
                        <span>{language === 'hi' ? 'स्टेटमेंट' : 'Statement'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}

      </div>

      {/* Floating Speed-Dial Quick Action Group */}
      <QuickActionFab 
        onNavigateToTab={onNavigateToTab}
        onOpenStatementForAgent={onOpenStatementForAgent}
      />

    </div>
  );
};

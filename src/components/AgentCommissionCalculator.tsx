import React, { useState, useEffect } from 'react';
import { Agent, LoanProduct, ProductSlabConfig, LoanFile } from '../types';
import { formatINR } from '../utils/formatters';
import { 
  Calculator, 
  Settings2, 
  Sparkles, 
  TrendingUp, 
  Percent, 
  Layers, 
  RefreshCw, 
  Check, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sliders,
  FileCheck
} from 'lucide-react';

export const DEFAULT_PRODUCT_SLABS: ProductSlabConfig[] = [
  { product: 'Home Loan', baseRate: 0.60, tierBonusRate: 0.10, tierThreshold: 5000000, notes: 'Prime mortgages' },
  { product: 'Loan Against Property (LAP)', baseRate: 0.70, tierBonusRate: 0.15, tierThreshold: 7500000, notes: 'Commercial/Residential LAP' },
  { product: 'Business Loan', baseRate: 0.85, tierBonusRate: 0.20, tierThreshold: 3000000, notes: 'Unsecured BL' },
  { product: 'Personal Loan', baseRate: 1.25, tierBonusRate: 0.25, tierThreshold: 1500000, notes: 'Salaried personal loans' },
  { product: 'MSME / CC-OD', baseRate: 0.65, tierBonusRate: 0.10, tierThreshold: 10000000, notes: 'Working capital limits' },
  { product: 'Car Loan', baseRate: 0.75, tierBonusRate: 0.10, tierThreshold: 2000000, notes: 'New & used vehicle loans' },
  { product: 'Doctor / Professional Loan', baseRate: 1.00, tierBonusRate: 0.15, tierThreshold: 2500000, notes: 'Medical professionals' },
  { product: 'Education Loan', baseRate: 0.50, tierBonusRate: 0.10, tierThreshold: 4000000, notes: 'Global & domestic study loans' }
];

interface AgentCommissionCalculatorProps {
  currentAgent: Agent;
  agentFiles: LoanFile[];
  onBatchRecalculateFiles: (updatedFiles: { fileId: string; newRate: number; newAmount: number }[]) => void;
  onLogCalculatedFile?: (newFileData: {
    product: LoanProduct;
    loanAmount: number;
    agentPayoutRate: number;
    agentPayoutAmount: number;
  }) => void;
  language: 'en' | 'hi';
}

export const AgentCommissionCalculator: React.FC<AgentCommissionCalculatorProps> = ({
  currentAgent,
  agentFiles,
  onBatchRecalculateFiles,
  onLogCalculatedFile,
  language
}) => {
  // Stored Slabs configuration
  const [slabs, setSlabs] = useState<ProductSlabConfig[]>(() => {
    const saved = localStorage.getItem('dsa_product_slabs');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCT_SLABS;
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculator Form State
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct>('Home Loan');
  const [calcAmount, setCalcAmount] = useState<number>(5000000); // 50 Lakhs default
  const [customBaseRate, setCustomBaseRate] = useState<number>(0.60);
  const [applyTDS, setApplyTDS] = useState<boolean>(true);
  const [tdsPercentage, setTdsPercentage] = useState<number>(5);
  const [estimatedBankPayoutRate, setEstimatedBankPayoutRate] = useState<number>(1.25);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync custom base rate when product changes
  useEffect(() => {
    const match = slabs.find(s => s.product === selectedProduct);
    if (match) {
      setCustomBaseRate(match.baseRate);
    }
  }, [selectedProduct, slabs]);

  const currentSlab = slabs.find(s => s.product === selectedProduct) || slabs[0];

  // Calculation logic
  const isEligibleForBonus = calcAmount >= (currentSlab?.tierThreshold || 5000000);
  const tierBonus = isEligibleForBonus ? (currentSlab?.tierBonusRate || 0) : 0;
  const effectiveAgentRate = Number((customBaseRate + tierBonus).toFixed(3));

  const grossAgentCommission = Math.round((calcAmount * effectiveAgentRate) / 100);
  const tdsDeductionAmount = applyTDS ? Math.round((grossAgentCommission * tdsPercentage) / 100) : 0;
  const netPayableCommission = grossAgentCommission - tdsDeductionAmount;

  // Comparison with Bank Inflow
  const estimatedBankCommission = Math.round((calcAmount * estimatedBankPayoutRate) / 100);
  const estimatedCompanyMargin = Math.max(0, estimatedBankCommission - grossAgentCommission);
  const marginPercentage = estimatedBankCommission > 0 
    ? ((estimatedCompanyMargin / estimatedBankCommission) * 100).toFixed(1) 
    : '0';

  // Save Configured Slabs
  const handleSaveSlabs = (updatedSlabs: ProductSlabConfig[]) => {
    setSlabs(updatedSlabs);
    localStorage.setItem('dsa_product_slabs', JSON.stringify(updatedSlabs));
    setShowConfigModal(false);
    setSuccessMsg('Product commission slabs updated and saved to system!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Batch Recalculate unpaid files for this agent
  const handleBatchRecalculate = () => {
    const unpaidFiles = agentFiles.filter(f => f.agentPayoutStatus === 'Unpaid' || f.agentPayoutStatus === 'Partially Paid');
    if (unpaidFiles.length === 0) {
      alert('No unpaid files available to recalculate for this agent.');
      return;
    }

    const updates = unpaidFiles.map(file => {
      const slabConfig = slabs.find(s => s.product === file.product) || { baseRate: currentAgent.defaultCommissionRate, tierBonusRate: 0, tierThreshold: 5000000 };
      const hasBonus = file.loanAmount >= slabConfig.tierThreshold;
      const rate = Number((slabConfig.baseRate + (hasBonus ? slabConfig.tierBonusRate : 0)).toFixed(3));
      const amount = Math.round((file.loanAmount * rate) / 100);

      return {
        fileId: file.id,
        newRate: rate,
        newAmount: amount
      };
    });

    onBatchRecalculateFiles(updates);
    setSuccessMsg(`Automated recalculation applied to ${updates.length} unpaid files!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md">
            <Calculator className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                {language === 'hi' ? 'ऑटोमेटेड कमीशन कैलकुलेटर एवं स्लैब मैनेजर' : 'Automated Agent Commission Calculator'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                Multi-Product Slabs
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {language === 'hi' 
                ? 'लोन प्रोडक्ट और राशि के अनुसार एजेंट कमीशन, टीडीएस और शुद्ध पेआउट की त्वरित गणना'
                : `Configurable percentage slabs for ${currentAgent.name} (${currentAgent.code})`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{language === 'hi' ? 'स्लैब बदलें' : 'Configure Slabs'}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            title={isExpanded ? 'Collapse calculator' : 'Expand calculator'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {/* Calculator Body */}
      {isExpanded && (
        <div className="p-5 space-y-5">
          
          {/* Main 2 Column Grid: Inputs + Real-time Calculation Result */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left 7 Columns: Product & Amount Controls */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Product Selector Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>1. Select Loan Product:</span>
                  <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                    Configured Base: {currentSlab?.baseRate}%
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {slabs.map((s) => {
                    const isSelected = selectedProduct === s.product;
                    return (
                      <button
                        type="button"
                        key={s.product}
                        onClick={() => setSelectedProduct(s.product)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 text-xs'
                        }`}
                      >
                        <div className="truncate text-xs">{s.product}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {s.baseRate}% {s.tierBonusRate > 0 ? `(+${s.tierBonusRate}%)` : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loan Amount Input & Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    2. Loan Disbursal Amount (₹):
                  </label>
                  <span className="text-xs font-extrabold text-slate-900 font-mono">
                    {formatINR(calcAmount)}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="50000"
                    min="50000"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[1000000, 2500000, 5000000, 7500000, 10000000, 20000000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setCalcAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        calcAmount === amt
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {amt >= 10000000 ? `₹${amt / 10000000} Cr` : `₹${amt / 100000} Lakh`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slab Fine-Tuning & TDS Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                
                {/* Base Rate */}
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Base Slab %</span>
                  <input
                    type="number"
                    step="0.05"
                    value={customBaseRate}
                    onChange={(e) => setCustomBaseRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 font-mono"
                  />
                </div>

                {/* Bank Inflow Comparison Rate */}
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Bank Payout Slab %</span>
                  <input
                    type="number"
                    step="0.05"
                    value={estimatedBankPayoutRate}
                    onChange={(e) => setEstimatedBankPayoutRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 font-mono"
                  />
                </div>

                {/* TDS Toggle */}
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">TDS Sec 194H</span>
                  <div className="flex items-center space-x-1.5 pt-1">
                    <input
                      type="checkbox"
                      id="tds-check"
                      checked={applyTDS}
                      onChange={(e) => setApplyTDS(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="tds-check" className="text-slate-700 font-semibold cursor-pointer">
                      Deduct 5% TDS
                    </label>
                  </div>
                </div>

              </div>

            </div>

            {/* Right 5 Columns: Real-Time Results & Actions Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/60 via-white to-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 shadow-sm flex flex-col justify-between space-y-4">
              
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Calculated Commission Voucher</span>
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                    {selectedProduct}
                  </span>
                </div>

                {/* Rate breakdown */}
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Base Commission Slab:</span>
                    <span className="font-mono font-bold text-slate-900">{customBaseRate}%</span>
                  </div>

                  {currentSlab?.tierBonusRate > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 flex items-center space-x-1">
                        <span>High Volume Tier Bonus:</span>
                        {isEligibleForBonus ? (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 rounded">Unlocked</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded">Min ₹{currentSlab.tierThreshold / 100000}L</span>
                        )}
                      </span>
                      <span className={`font-mono font-bold ${isEligibleForBonus ? 'text-emerald-700' : 'text-slate-400'}`}>
                        +{tierBonus}%
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-bold text-slate-900 pt-1 border-t border-slate-200/70">
                    <span>Effective Agent Rate:</span>
                    <span className="font-mono text-indigo-700 font-extrabold text-sm">{effectiveAgentRate}%</span>
                  </div>
                </div>

                {/* Big Highlight Figures */}
                <div className="mt-4 p-3.5 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-600 font-medium">Gross Commission:</span>
                    <span className="text-lg font-extrabold text-blue-700 font-mono">
                      {formatINR(grossAgentCommission)}
                    </span>
                  </div>

                  {applyTDS && (
                    <div className="flex justify-between items-baseline text-xs text-rose-700">
                      <span>Less TDS (5% Sec 194H):</span>
                      <span className="font-mono font-bold">-{formatINR(tdsDeductionAmount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-900">Net Payable to Agent:</span>
                    <span className="text-xl font-black text-emerald-700 font-mono">
                      {formatINR(netPayableCommission)}
                    </span>
                  </div>
                </div>

                {/* Margin Context Box */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200/70 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Bank Payout (@{estimatedBankPayoutRate}%):</span>
                    <span className="font-semibold text-slate-900">{formatINR(estimatedBankCommission)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Retained Company Profit:</span>
                    <span>{formatINR(estimatedCompanyMargin)} ({marginPercentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleBatchRecalculate}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{language === 'hi' ? 'एजेंट की बकाया फाइलों पर लागू करें' : 'Apply Slabs to Unpaid Files'}</span>
                </button>

                {onLogCalculatedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogCalculatedFile({
                        product: selectedProduct,
                        loanAmount: calcAmount,
                        agentPayoutRate: effectiveAgentRate,
                        agentPayoutAmount: grossAgentCommission
                      });
                      setSuccessMsg(`Logged new ${selectedProduct} file for ${currentAgent.name}!`);
                      setTimeout(() => setSuccessMsg(null), 3500);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'स्टेटमेंट में नई फाइल जोड़ें' : 'Log as Loan File to Statement'}</span>
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* Quick Active Slabs Table Overview */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Configured Slab Matrix ({slabs.length} Products):
              </span>
              <button
                onClick={() => setShowConfigModal(true)}
                className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center space-x-1"
              >
                <span>Edit All Slabs</span>
                <Sliders className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {slabs.map((s) => (
                <div 
                  key={s.product}
                  onClick={() => setSelectedProduct(s.product)}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    selectedProduct === s.product 
                      ? 'bg-indigo-50/80 border-indigo-300 font-bold' 
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-800">
                    <span className="truncate">{s.product}</span>
                    <span className="font-mono text-indigo-700 font-extrabold">{s.baseRate}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Tier Bonus: +{s.tierBonusRate}% (&gt;₹{s.tierThreshold / 100000}L)
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Configure Slabs Modal */}
      {showConfigModal && (
        <ConfigSlabsModal
          initialSlabs={slabs}
          onSave={handleSaveSlabs}
          onClose={() => setShowConfigModal(false)}
        />
      )}

    </div>
  );
};

// Modal for configuring percentage slabs for all loan products
interface ConfigSlabsModalProps {
  initialSlabs: ProductSlabConfig[];
  onSave: (updated: ProductSlabConfig[]) => void;
  onClose: () => void;
}

const ConfigSlabsModal: React.FC<ConfigSlabsModalProps> = ({ initialSlabs, onSave, onClose }) => {
  const [editingSlabs, setEditingSlabs] = useState<ProductSlabConfig[]>(initialSlabs);

  const handleRateChange = (index: number, field: keyof ProductSlabConfig, value: any) => {
    const updated = [...editingSlabs];
    updated[index] = { ...updated[index], [field]: value };
    setEditingSlabs(updated);
  };

  const handleResetToDefault = () => {
    setEditingSlabs(DEFAULT_PRODUCT_SLABS);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-6">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Configure Loan Product Percentage Slabs
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Define default commission sharing slabs (%) and volume tier bonuses for each loan product. These slabs are used by the automated calculator and can be applied across agent files.
        </p>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {editingSlabs.map((s, idx) => (
            <div key={s.product} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">{s.product}</span>
                <span className="text-[10px] text-slate-500 font-mono">{s.notes}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Base Commission Slab (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={s.baseRate}
                    onChange={(e) => handleRateChange(idx, 'baseRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Volume Tier Bonus (+%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={s.tierBonusRate}
                    onChange={(e) => handleRateChange(idx, 'tierBonusRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold font-mono text-emerald-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Tier Threshold (₹ Amount)</label>
                  <input
                    type="number"
                    step="500000"
                    value={s.tierThreshold}
                    onChange={(e) => handleRateChange(idx, 'tierThreshold', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold font-mono text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-bold text-slate-500 hover:text-rose-600"
          >
            Reset to Standard Defaults
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(editingSlabs)}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
            >
              Save Slabs Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

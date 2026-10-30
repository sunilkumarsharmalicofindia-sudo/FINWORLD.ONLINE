import React, { useState } from 'react';
import { Agent, LoanFile, FinancialTransaction, ProductSlabConfig } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { Printer, Download, X, Building2, CheckCircle2, FileDown, Settings2, Sliders, Check } from 'lucide-react';
import { generateAgentStatementPDF, generateProductSlabsRateCardPDF } from '../utils/pdfGenerator';
import { DEFAULT_PRODUCT_SLABS } from './AgentCommissionCalculator';

interface PrintableStatementModalProps {
  agent: Agent;
  loanFiles: LoanFile[];
  transactions: FinancialTransaction[];
  onClose: () => void;
}

export const PrintableStatementModal: React.FC<PrintableStatementModalProps> = ({
  agent,
  loanFiles,
  transactions,
  onClose
}) => {
  const [slabs, setSlabs] = useState<ProductSlabConfig[]>(() => {
    const saved = localStorage.getItem('dsa_product_slabs');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCT_SLABS;
  });

  const [showEditSlabsModal, setShowEditSlabsModal] = useState(false);
  const [editingSlabs, setEditingSlabs] = useState<ProductSlabConfig[]>(slabs);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const agentFiles = loanFiles.filter(f => f.agentId === agent.id && f.status === 'Disbursed');
  const agentTx = transactions.filter(t => t.agentId === agent.id && t.type === 'Outflow');

  const totalVolume = agentFiles.reduce((s, f) => s + (f.loanAmount || 0), 0);
  const totalCommissionEarned = agentFiles.reduce((s, f) => s + (f.agentPayoutAmount || 0), 0);
  const totalCommissionPaid = agentFiles.reduce((s, f) => s + (f.agentPayoutPaid || 0), 0);
  const balanceDue = totalCommissionEarned - totalCommissionPaid;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateAgentStatementPDF(agent, loanFiles, transactions, slabs);
  };

  const handleDownloadRateCard = () => {
    generateProductSlabsRateCardPDF(slabs, agent);
  };

  const handleSaveSlabs = () => {
    setSlabs(editingSlabs);
    localStorage.setItem('dsa_product_slabs', JSON.stringify(editingSlabs));
    setShowEditSlabsModal(false);
    setSaveSuccessMsg('Multi-product slabs updated! Reflected in statement & PDF.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl my-6 print:shadow-none print:m-0 print:p-6 print:w-full">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-800">DSA Commission Account Statement</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Official Voucher
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Edit Slabs Button */}
            <button
              onClick={() => {
                setEditingSlabs(slabs);
                setShowEditSlabsModal(true);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Edit multi-product slabs"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit Slabs</span>
            </button>

            {/* Download Statement PDF */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Statement PDF</span>
            </button>

            {/* Download Rate Card PDF */}
            <button
              onClick={handleDownloadRateCard}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              title="Export Multi-Product Slabs Rate Card PDF"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rate Card PDF</span>
            </button>

            {/* Print Document */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save Banner */}
        {saveSuccessMsg && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between print:hidden">
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </span>
            <button onClick={() => setSaveSuccessMsg(null)}>✕</button>
          </div>
        )}

        {/* Printable Statement Document Content */}
        <div className="space-y-6 text-slate-900 font-sans" id="printable-statement">
          
          {/* Header & Logo */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                  DM
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">DSA MITRA FINANCIAL NETWORK</h1>
                  <p className="text-[11px] text-slate-500 font-medium">Pan-India Channel Partner & Loan Distribution Desk</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <p>Tax / GSTIN: 27AABCS1429K1ZX | CIN: U67190MH2024PTC11234</p>
                <p>Central Operations: Corporate Hub, Financial District, Mumbai / Jaipur</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded uppercase tracking-wider">
                COMMISSION STATEMENT
              </span>
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <p><span className="font-semibold">Statement Date:</span> {formatDate(new Date().toISOString())}</p>
                <p><span className="font-semibold">Period:</span> Financial Year 2026-27</p>
                <p className="font-mono text-[11px] text-slate-400">DOC-REF: STM-{agent.code}-{Date.now().toString().slice(-4)}</p>
              </div>
            </div>
          </div>

          {/* Agent Beneficiary Profile */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Beneficiary DSA Agent</p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">{agent.name}</p>
              <p className="text-xs font-semibold text-slate-700">{agent.agencyName}</p>
              <p className="text-slate-600 mt-1">Mobile: {agent.mobile} | Email: {agent.email}</p>
              <p className="text-slate-600">Location: {agent.city}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bank & Tax Account Details</p>
              <p className="mt-0.5"><span className="font-semibold">DSA Code:</span> <span className="font-mono font-bold text-indigo-700">{agent.code}</span></p>
              <p><span className="font-semibold">Bank A/C No:</span> <span className="font-mono">{agent.bankAccountNo}</span></p>
              <p><span className="font-semibold">IFSC Code:</span> <span className="font-mono">{agent.ifsc}</span></p>
              <p><span className="font-semibold">PAN Number:</span> <span className="font-mono uppercase">{agent.panNumber}</span></p>
            </div>
          </div>

          {/* Metric Summary Ribbon */}
          <div className="grid grid-cols-4 gap-3 text-center border border-slate-200 rounded-xl p-3 bg-white">
            <div className="border-r border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Disbursed Volume</p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatINR(totalVolume)}</p>
            </div>
            <div className="border-r border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Gross Commission</p>
              <p className="text-sm font-extrabold text-blue-700 mt-0.5">{formatINR(totalCommissionEarned)}</p>
            </div>
            <div className="border-r border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Commission Paid</p>
              <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{formatINR(totalCommissionPaid)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Net Balance Due</p>
              <p className={`text-sm font-extrabold mt-0.5 ${balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {formatINR(balanceDue)}
              </p>
            </div>
          </div>

          {/* 1. Loan Disbursals Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              1. Loan Sourcing & Commission Breakdown
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">File No</th>
                  <th className="py-2 px-3">Borrower Name</th>
                  <th className="py-2 px-3">Bank</th>
                  <th className="py-2 px-3">Disbursed Date</th>
                  <th className="py-2 px-3 text-right">Loan Amount</th>
                  <th className="py-2 px-3 text-right">Rate %</th>
                  <th className="py-2 px-3 text-right">Commission (₹)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-[11px]">
                {agentFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="py-2 px-3 font-mono font-semibold">{file.fileNo}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{file.borrowerName}</td>
                    <td className="py-2 px-3">{file.bankName}</td>
                    <td className="py-2 px-3">{formatDate(file.disbursedDate)}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatINR(file.loanAmount)}</td>
                    <td className="py-2 px-3 text-right font-mono">{file.agentPayoutRate}%</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(file.agentPayoutAmount)}</td>
                    <td className="py-2 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        file.agentPayoutStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {file.agentPayoutStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. Payments & Remittances History */}
          {agentTx.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                2. Remittance & Bank Settlement History
              </h3>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Transaction Mode</th>
                    <th className="py-2 px-3">Bank UTR / Reference No</th>
                    <th className="py-2 px-3">Particulars</th>
                    <th className="py-2 px-3 text-right">Amount Paid (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 text-[11px]">
                  {agentTx.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-2 px-3">{formatDate(tx.date)}</td>
                      <td className="py-2 px-3 font-semibold">{tx.paymentMode}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{tx.referenceNo}</td>
                      <td className="py-2 px-3">{tx.description}</td>
                      <td className="py-2 px-3 text-right font-extrabold text-emerald-700">{formatINR(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Approved Multi-Product Commission Slab Schedule (Requested Feature!) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                <span>3. Approved Multi-Product Commission Slab Schedule</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                  Configured Matrix
                </span>
              </h3>
            </div>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-800 text-white font-bold text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Loan Product</th>
                  <th className="py-2 px-3 text-center">Base Slab (%)</th>
                  <th className="py-2 px-3 text-center">Volume Tier Bonus</th>
                  <th className="py-2 px-3 text-right">Bonus Threshold</th>
                  <th className="py-2 px-3">Category Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-[11px]">
                {slabs.map((s) => (
                  <tr key={s.product}>
                    <td className="py-2 px-3 font-bold text-slate-900">{s.product}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">{s.baseRate}%</td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-emerald-700">
                      {s.tierBonusRate > 0 ? `+${s.tierBonusRate}%` : 'Standard'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium">
                      {s.tierThreshold > 0 ? formatINR(s.tierThreshold) : 'Base Slab'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 italic text-[10px]">{s.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures & Certification */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="text-[11px] text-slate-500">
                This is a certified financial document generated by DSA Mitra Channel Network. Applicable TDS is deducted in compliance with Section 194H of the Income Tax Act 1961. The multi-product commission schedule above forms part of the active DSA engagement agreement.
              </p>
            </div>
            <div className="text-right space-y-8">
              <div>
                <p className="font-bold text-slate-900">For DSA Mitra Channel Network</p>
                <p className="text-[11px] text-slate-500">Authorized Finance Signatory</p>
              </div>
              <div className="pt-4 border-t border-slate-300 inline-block w-48 text-center text-[10px] text-slate-400">
                (Digital Authentication Verified)
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Edit Slabs Modal */}
      {showEditSlabsModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Multi-Product Commission Slabs
                </h3>
              </div>
              <button onClick={() => setShowEditSlabsModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Edit base percentages and volume tier bonus rates for each loan product. Updated values will immediately appear on the printable statement and in all exported PDFs.
            </p>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {editingSlabs.map((s, idx) => (
                <div key={s.product} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">{s.product}</span>
                    <input
                      type="text"
                      value={s.notes || ''}
                      onChange={(e) => {
                        const copy = [...editingSlabs];
                        copy[idx] = { ...copy[idx], notes: e.target.value };
                        setEditingSlabs(copy);
                      }}
                      placeholder="Notes / Category criteria..."
                      className="text-[11px] px-2 py-0.5 rounded border border-slate-300 bg-white w-48"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Base Slab (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={s.baseRate}
                        onChange={(e) => {
                          const copy = [...editingSlabs];
                          copy[idx] = { ...copy[idx], baseRate: parseFloat(e.target.value) || 0 };
                          setEditingSlabs(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold font-mono text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Tier Bonus (+%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={s.tierBonusRate}
                        onChange={(e) => {
                          const copy = [...editingSlabs];
                          copy[idx] = { ...copy[idx], tierBonusRate: parseFloat(e.target.value) || 0 };
                          setEditingSlabs(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold font-mono text-emerald-700 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Threshold (₹)</label>
                      <input
                        type="number"
                        step="500000"
                        value={s.tierThreshold}
                        onChange={(e) => {
                          const copy = [...editingSlabs];
                          copy[idx] = { ...copy[idx], tierThreshold: parseFloat(e.target.value) || 0 };
                          setEditingSlabs(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-slate-300 font-bold font-mono text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowEditSlabsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlabs}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                Save Slabs & Update PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

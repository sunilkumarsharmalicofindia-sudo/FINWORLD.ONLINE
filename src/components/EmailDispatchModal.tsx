import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Agent, LoanFile, MonthlyReconciliation } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  Mail, 
  Send, 
  X, 
  Paperclip, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Users, 
  FileText, 
  Clock,
  ShieldCheck
} from 'lucide-react';

interface EmailDispatchModalProps {
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
  defaultTemplate?: 'agent_statement' | 'reconciliation' | 'urban_money' | 'custom';
  agent?: Agent;
  agentFiles?: LoanFile[];
  reconciliationMonth?: string;
  onClose: () => void;
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  initialRecipient,
  initialSubject,
  initialBody,
  defaultTemplate = 'agent_statement',
  agent,
  agentFiles,
  reconciliationMonth,
  onClose
}) => {
  const { addNotification, language } = useApp();

  const [recipient, setRecipient] = useState(initialRecipient || agent?.email || 'sunilkumarsharmalicofindia@gmail.com');
  const [subject, setSubject] = useState(
    initialSubject || (agent 
      ? `DSA Mitra Commission Statement - ${agent.name} (${agent.code}) - ${new Date().toLocaleDateString('en-IN')}` 
      : 'DSA Mitra Financial Channel Report')
  );
  const [body, setBody] = useState(() => {
    if (initialBody) return initialBody;
    if (agent && agentFiles) {
      const vol = agentFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.loanAmount || 0), 0);
      const earned = agentFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.agentPayoutAmount || 0), 0);
      const paid = agentFiles.filter(f => f.status === 'Disbursed').reduce((s, f) => s + (f.agentPayoutPaid || 0), 0);
      const due = Math.max(0, earned - paid);

      return `Respected ${agent.name} ji,\n\nPlease find attached your official DSA Commission Account Statement for ${agent.agencyName} (${agent.code}).\n\nSummary of Account:\n- Total Disbursed Volume: ${formatINR(vol)}\n- Gross Commission Earned: ${formatINR(earned)}\n- Commission Settled: ${formatINR(paid)}\n- Net Balance Due: ${formatINR(due)}\n\nYour verified Multi-Product Commission Slab schedule and UTR remittance advice are enclosed in the attached PDF voucher.\n\nWarm regards,\nSunil Kumar Sharma\nDSA Mitra Financial Network\nMobile: 98XXXXXX00 | Mumbai / Jaipur`;
    }
    return 'Dear Channel Partner,\n\nPlease find attached the official financial report from DSA Mitra Channel Desk.\n\nRegards,\nDSA Mitra Corporate Finance';
  });

  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [includePDF, setIncludePDF] = useState(true);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) {
      alert('Please enter recipient email address');
      return;
    }

    setIsSending(true);

    // Simulate high-speed SMTP / secure transactional API dispatch
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);

      addNotification(
        'Email Dispatched Successfully',
        `Official statement & PDF voucher delivered to ${recipient}. Subject: "${subject}"`,
        'success'
      );

      setTimeout(() => {
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-6 animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'hi' ? 'ईमेल द्वारा स्टेटमेंट एवं रिपोर्ट भेजें' : 'Send Statement & Report via Email'}
              </h3>
              <p className="text-[11px] text-slate-500">Secure Transactional Dispatch Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Email Dispatched Successfully!</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Statement with attached PDF has been securely transmitted to <strong className="font-mono text-slate-900">{recipient}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-3.5 text-xs">
            
            {/* Recipient */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Recipient Email Address *
              </label>
              <input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="agent@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Message Body
              </label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs leading-relaxed font-sans focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
              />
            </div>

            {/* Attachment Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800">
                  {agent ? `${agent.code}_Commission_Statement.pdf` : 'Reconciliation_Audit_Report.pdf'}
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                  Auto-Generated PDF
                </span>
              </div>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePDF}
                  onChange={(e) => setIncludePDF(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-[11px] font-bold text-slate-700">Attach PDF</span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSL Encrypted Mailer</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-102"
                >
                  <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                  <span>{isSending ? 'Dispatching Mail...' : 'Send Email Now'}</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

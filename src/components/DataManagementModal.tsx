import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  FileText, 
  CreditCard, 
  Users, 
  X, 
  ShieldAlert,
  Sparkles,
  FileSpreadsheet,
  Download,
  Upload,
  ShieldCheck,
  HardDrive,
  Globe,
  WifiOff
} from 'lucide-react';

interface DataManagementModalProps {
  onClose: () => void;
  onOpenPasteImporter?: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ 
  onClose,
  onOpenPasteImporter 
}) => {
  const { 
    bankers, 
    loanFiles, 
    transactions, 
    agents,
    clearAllExampleData,
    clearBankersData,
    clearLoanFilesData,
    clearTransactionsData,
    clearAgentsData,
    exportBackupJson,
    importBackupJson,
    language 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmAction, setConfirmAction] = useState<
    'all' | 'bankers' | 'files' | 'transactions' | 'agents' | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleExecute = () => {
    if (confirmAction === 'all') {
      clearAllExampleData();
      setSuccessMessage(
        language === 'hi' 
          ? 'सारा सैंपल डेटा सफलतापूर्वक हटा दिया गया है! आपका सिस्टम अब पूरी तरह खाली और नए डेटा के लिए तैयार है।'
          : 'All example records removed! The software is now 100% clean and ready for your real data.'
      );
    } else if (confirmAction === 'bankers') {
      clearBankersData();
      setSuccessMessage(
        language === 'hi' 
          ? 'सभी सैंपल बैंकर हटा दिए गए हैं! अब आप अपनी एक्सेल शीट से असली बैंकर पेस्ट कर सकते हैं।'
          : 'All sample bankers cleared! You can now paste your own Excel banker sheets.'
      );
    } else if (confirmAction === 'files') {
      clearLoanFilesData();
      setSuccessMessage(
        language === 'hi' 
          ? 'सैंपल लोन फाइल्स हटा दी गई हैं।'
          : 'Sample loan files cleared.'
      );
    } else if (confirmAction === 'transactions') {
      clearTransactionsData();
      setSuccessMessage(
        language === 'hi' 
          ? 'कैश फ्लो लेनदेन हटा दिए गए हैं।'
          : 'Cash flow transactions cleared.'
      );
    } else if (confirmAction === 'agents') {
      clearAgentsData();
      setSuccessMessage(
        language === 'hi' 
          ? 'सभी एजेंट हटा दिए गए हैं।'
          : 'All agents cleared.'
      );
    }
    setConfirmAction(null);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJson(content);
        if (success) {
          setSuccessMessage(
            language === 'hi'
              ? 'बैकअप सफलतापूर्वक रीस्टोर कर लिया गया है! आपके सभी बैंकर, फाइलें और लेन-देन लोड हो गए हैं।'
              : 'Backup successfully restored! All bankers, loan files, and transactions are restored.'
          );
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {language === 'hi' ? 'डेटा प्रबंधन, सुरक्षा एवं बैकअप' : 'Data Manager & Backup Safety'}
              </h2>
              <p className="text-xs text-rose-200/80 mt-0.5">
                {language === 'hi' 
                  ? 'सैंपल डेटा हटाएं, 100% सुरक्षित 1-क्लिक बैकअप डाउनलोड करें या रीस्टोर करें'
                  : 'Clear demo records, download 1-click JSON backups, or restore past records'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-900">{successMessage}</p>
                {onOpenPasteImporter && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPasteImporter();
                    }}
                    className="mt-2 text-xs font-bold text-emerald-700 underline flex items-center space-x-1 hover:text-emerald-800"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>
                      {language === 'hi' ? 'अपनी एक्सेल शीट से डेटा पेस्ट करें →' : 'Paste your Excel data now →'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Data Safety & Deployment Information Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  {language === 'hi' ? 'डेटा सुरक्षा एवं रनिंग स्टेटस (Data Safety & Runtime)' : 'Data Safety & Runtime'}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{language === 'hi' ? 'सुरक्षित (Auto-Saved)' : 'Safe & Auto-Saved'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
              <div className="flex items-start space-x-2 p-2 rounded-xl bg-white/80 border border-emerald-100">
                <Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    {language === 'hi' ? 'ऑनलाइन (Online Live)' : 'Online Live'}
                  </span>
                  <span>
                    {language === 'hi' 
                      ? 'Google Cloud Run पर 24/7 लाइव उपलब्ध है। किसी भी मोबाइल या लैपटॉप में चलेगा।'
                      : 'Runs 24/7 on Google Cloud Run. Accessible on any phone or laptop.'}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2 rounded-xl bg-white/80 border border-emerald-100">
                <WifiOff className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    {language === 'hi' ? 'ऑफलाइन (Offline Ready)' : 'Offline Ready'}
                  </span>
                  <span>
                    {language === 'hi' 
                      ? 'बिना इंटरनेट के भी ब्राउज़र में चलेगा। फोन की होम स्क्रीन पर "Add to Home Screen" कर सकते हैं।'
                      : 'Works offline in your browser. Can be added to your mobile home screen.'}
                  </span>
                </div>
              </div>
            </div>

            {/* 1-Click Backup & Restore Action Bar */}
            <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row gap-2">
              <button
                onClick={exportBackupJson}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>
                  {language === 'hi' ? '1-क्लिक पूरा बैकअप डाउनलोड करें (JSON)' : 'Download 1-Click Backup (JSON)'}
                </span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'hi' ? 'पुराना बैकअप रीस्टोर करें (Upload)' : 'Restore from Backup (Upload)'}
                </span>
              </button>

              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json"
                onChange={handleFileRestore}
                className="hidden" 
              />
            </div>
            
            <p className="text-[10px] text-slate-500 italic">
              {language === 'hi' 
                ? '★ टिप: बैकअप फाइल को अपने Google Drive या WhatsApp में सुरक्षित रख लें ताकि फोन या कंप्यूटर बदलने पर 1 सेकंड में सारा डेटा वापस मिल सके।'
                : '★ Tip: Keep your downloaded backup file in Google Drive or WhatsApp to instantly restore anytime on any new phone or computer.'}
            </p>
          </div>

          {/* Current Live Records Count */}
          <div>
            <label className="text-[11px] font-black tracking-wider uppercase text-slate-500 block mb-2">
              {language === 'hi' ? 'सिस्टम में वर्तमान रिकॉर्ड्स (Current Records in System):' : 'Current Records in System:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] font-bold">Bankers</span>
                </div>
                <div className="text-lg font-black text-slate-900">{bankers.length}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-[11px] font-bold">Loan Files</span>
                </div>
                <div className="text-lg font-black text-slate-900">{loanFiles.length}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-bold">Transactions</span>
                </div>
                <div className="text-lg font-black text-slate-900">{transactions.length}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px] font-bold">Agents</span>
                </div>
                <div className="text-lg font-black text-slate-900">{agents.length}</div>
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-3">
            <label className="text-[11px] font-black tracking-wider uppercase text-slate-500 block">
              {language === 'hi' ? 'डेटा हटाने के विकल्प (Choose Clear Action):' : 'Choose Data Clear Action:'}
            </label>

            {/* Option 1: Clear All Example Data */}
            <div className="p-4 rounded-2xl border-2 border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded-lg bg-rose-500 text-white">
                    <Trash2 className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-black text-rose-950">
                    {language === 'hi' ? 'सारा सैंपल डेटा एक साथ हटाएं (Clear All Example Data)' : 'Clear ALL Example Data'}
                  </h4>
                </div>
                <p className="text-xs text-rose-900/80">
                  {language === 'hi' 
                    ? 'सभी 12 सैंपल बैंकर, डमी लोन फाइलें, और लेन-देन साफ़ कर देगा ताकि आप शून्य से शुरू कर सकें।'
                    : 'Removes all demo bankers, loan files, and transactions to give you a clean slate.'}
                </p>
              </div>
              <button
                onClick={() => setConfirmAction('all')}
                className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
              >
                {language === 'hi' ? 'सारा डेटा हटाएं' : 'Clear Everything'}
              </button>
            </div>

            {/* Option 2: Clear Only Bankers */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'hi' ? 'केवल सैंपल बैंकर लिस्ट हटाएं' : 'Clear Example Bankers Only'}
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'hi' 
                    ? 'वर्तमान 12 सैंपल बैंकर्स हटा देगा ताकि आप अपनी एक्सेल फ़ाइल पेस्ट कर सकें।'
                    : 'Removes sample bankers so you can paste your own All-India loan officers list.'}
                </p>
              </div>
              <button
                onClick={() => setConfirmAction('bankers')}
                disabled={bankers.length === 0}
                className="shrink-0 px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs disabled:opacity-40 self-start sm:self-auto"
              >
                {language === 'hi' ? 'बैंकर हटाएं' : 'Clear Bankers'}
              </button>
            </div>

            {/* Option 3: Clear Only Loan Files & Transactions */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'hi' ? 'केवल सैंपल फाइलें व हिसाब हटाएं' : 'Clear Files & Cash Flow Only'}
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'hi' 
                    ? 'सैंपल लोन फाइल्स और कैश फ्लो बहीखाता खाली करेगा।'
                    : 'Clears sample loan cases, payouts, and financial transactions.'}
                </p>
              </div>
              <button
                onClick={() => setConfirmAction('files')}
                disabled={loanFiles.length === 0}
                className="shrink-0 px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs disabled:opacity-40 self-start sm:self-auto"
              >
                {language === 'hi' ? 'फाइलें हटाएं' : 'Clear Files'}
              </button>
            </div>

            {/* Option 4: Clear Only Agents */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'hi' ? 'केवल एजेंट सूची हटाएं' : 'Clear Agents List Only'}
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'hi' 
                    ? 'सभी एजेंट / सब-डीएसए रिकॉर्ड्स हटा देगा।'
                    : 'Removes all DSA agents so you can register your real team.'}
                </p>
              </div>
              <button
                onClick={() => setConfirmAction('agents')}
                disabled={agents.length === 0}
                className="shrink-0 px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs disabled:opacity-40 self-start sm:self-auto"
              >
                {language === 'hi' ? 'एजेंट हटाएं' : 'Clear Agents'}
              </button>
            </div>

          </div>

          {/* Footer note */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center space-x-2 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              {language === 'hi'
                ? 'नोट: डेटा हटाने के बाद आप ऊपर दिए गए "एक्सेल से पेस्ट करें" बटन से अपना पूरा डेटा तुरंत अपलोड कर सकते हैं।'
                : 'Note: After clearing, you can immediately paste your own Excel data via the "Paste Excel" feature.'}
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>

      </div>

      {/* Confirmation Sub-Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                {language === 'hi' ? 'क्या आप वाकई हटाना चाहते हैं?' : 'Are you sure?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {confirmAction === 'all' && (
                  language === 'hi'
                    ? 'सभी सैंपल बैंकर, लोन फाइल्स और कैश फ्लो रिकॉर्ड्स साफ़ हो जाएंगे। (यह क्रिया पूर्ववत नहीं की जा सकती)'
                    : 'All sample bankers, loan files, and transaction records will be wiped out.'
                )}
                {confirmAction === 'bankers' && (
                  language === 'hi'
                    ? 'सभी सैंपल बैंकर रिकॉर्ड्स साफ़ हो जाएंगे।'
                    : 'All sample loan officers will be removed from the directory.'
                )}
                {confirmAction === 'files' && (
                  language === 'hi'
                    ? 'सभी सैंपल लोन फाइलें हटा दी जाएंगी।'
                    : 'All sample loan files will be removed.'
                )}
                {confirmAction === 'agents' && (
                  language === 'hi'
                    ? 'सभी एजेंट रिकॉर्ड्स हटा दिए जाएंगे।'
                    : 'All agent records will be removed.'
                )}
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                {language === 'hi' ? 'नहीं, रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={handleExecute}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                {language === 'hi' ? 'हाँ, हटाएं' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

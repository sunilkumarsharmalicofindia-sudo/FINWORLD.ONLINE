import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Banker, Agent, LoanFile, LoanProduct } from '../types';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  ClipboardPaste, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Sparkles, 
  ArrowRight,
  Database,
  Building2,
  Users,
  FolderKanban
} from 'lucide-react';

type ImportCategory = 'bankers' | 'agents' | 'loans';

interface ParsedTable {
  headers: string[];
  rows: Record<string, string>[];
}

export const ExcelPasteImporter: React.FC<{ onNavigateToTab: (tabId: string) => void }> = ({ onNavigateToTab }) => {
  const { bulkAddBankers, bulkAddAgents, bulkAddLoanFiles, agents, language, t } = useApp();

  const [category, setCategory] = useState<ImportCategory>('bankers');
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTable | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Target schema definitions for each category
  const targetFields: Record<ImportCategory, { key: string; label: string; required?: boolean; synonyms: string[] }[]> = {
    bankers: [
      { key: 'name', label: 'Officer Name', required: true, synonyms: ['name', 'officer', 'banker', 'contact person', 'rm name', 'officer name'] },
      { key: 'bankName', label: 'Bank Name', required: true, synonyms: ['bank', 'bank name', 'nbfc', 'institution', 'banker bank'] },
      { key: 'mobile', label: 'Mobile Number', required: true, synonyms: ['mobile', 'phone', 'contact', 'cell', 'whatsapp', 'mobile no'] },
      { key: 'city', label: 'City', required: true, synonyms: ['city', 'location', 'place', 'district', 'town'] },
      { key: 'branch', label: 'Branch', required: false, synonyms: ['branch', 'branch name', 'hub', 'office'] },
      { key: 'designation', label: 'Designation', required: false, synonyms: ['designation', 'role', 'post', 'title', 'position'] },
      { key: 'products', label: 'Loan Products', required: false, synonyms: ['products', 'product', 'loan type', 'product handled', 'vertical'] },
      { key: 'payoutSharingRate', label: 'Payout Slab (%)', required: false, synonyms: ['payout', 'payout %', 'slab', 'rate', 'commission', 'sharing rate'] },
      { key: 'email', label: 'Email', required: false, synonyms: ['email', 'mail', 'email id'] },
      { key: 'remarks', label: 'Remarks / Notes', required: false, synonyms: ['remarks', 'notes', 'comments', 'criteria'] }
    ],
    agents: [
      { key: 'name', label: 'Agent Name', required: true, synonyms: ['name', 'agent name', 'dsa name', 'partner'] },
      { key: 'mobile', label: 'Mobile Number', required: true, synonyms: ['mobile', 'phone', 'contact', 'mobile no'] },
      { key: 'agencyName', label: 'Agency / Firm', required: false, synonyms: ['agency', 'firm', 'agency name', 'company', 'firm name'] },
      { key: 'city', label: 'City', required: false, synonyms: ['city', 'location'] },
      { key: 'code', label: 'Agent Code', required: false, synonyms: ['code', 'agent code', 'dsa code', 'id'] },
      { key: 'defaultCommissionRate', label: 'Default Commission (%)', required: false, synonyms: ['commission', 'rate', 'payout %', 'slab'] },
      { key: 'bankAccountNo', label: 'Bank Account No', required: false, synonyms: ['account', 'account no', 'bank account', 'a/c'] },
      { key: 'ifsc', label: 'IFSC Code', required: false, synonyms: ['ifsc', 'ifsc code'] },
      { key: 'panNumber', label: 'PAN Number', required: false, synonyms: ['pan', 'pan number', 'pan no'] }
    ],
    loans: [
      { key: 'fileNo', label: 'File No', required: true, synonyms: ['file no', 'file number', 'application no', 'lan', 'loan no', 'ref no'] },
      { key: 'borrowerName', label: 'Borrower Name', required: true, synonyms: ['borrower', 'customer', 'client', 'applicant', 'borrower name'] },
      { key: 'bankName', label: 'Bank Name', required: true, synonyms: ['bank', 'bank name', 'lender'] },
      { key: 'loanAmount', label: 'Loan Amount (₹)', required: true, synonyms: ['amount', 'loan amount', 'disbursed amount', 'sanction amount', 'disbursal'] },
      { key: 'product', label: 'Product', required: false, synonyms: ['product', 'loan product', 'type'] },
      { key: 'disbursedDate', label: 'Disbursal Date', required: false, synonyms: ['disbursal date', 'date', 'disbursed on'] },
      { key: 'agentName', label: 'DSA Agent Name', required: false, synonyms: ['agent', 'dsa', 'agent name', 'sourced by'] },
      { key: 'bankPayoutRate', label: 'Bank Payout %', required: false, synonyms: ['bank payout %', 'bank rate', 'bank commission %'] },
      { key: 'agentPayoutRate', label: 'Agent Payout %', required: false, synonyms: ['agent payout %', 'agent rate', 'agent commission %'] }
    ]
  };

  // Helper to guess best matching target field for a given column header
  const guessMapping = (header: string, cat: ImportCategory): string => {
    const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fields = targetFields[cat];

    for (const f of fields) {
      if (f.key.toLowerCase() === norm) return f.key;
      for (const syn of f.synonyms) {
        const normSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (norm === normSyn || norm.includes(normSyn) || normSyn.includes(norm)) {
          return f.key;
        }
      }
    }
    return '';
  };

  // Parse raw tab-delimited or comma-delimited clipboard text
  const parseRawText = (text: string) => {
    setErrorMsg(null);
    setImportSuccessCount(null);
    if (!text.trim()) {
      setParsedData(null);
      return;
    }

    try {
      const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setErrorMsg('Please paste at least one header row and one data row.');
        return;
      }

      // Check delimiter: tab (\t) or comma (,) or semicolon (;)
      const firstLine = lines[0];
      const isTab = firstLine.includes('\t');
      const delimiter = isTab ? '\t' : (firstLine.includes(',') ? ',' : ';');

      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
        });
        rows.push(rowObj);
      }

      setParsedData({ headers, rows });

      // Automatically map columns
      const initialMap: Record<string, string> = {};
      headers.forEach(h => {
        initialMap[h] = guessMapping(h, category);
      });
      setColumnMapping(initialMap);

    } catch (err) {
      setErrorMsg('Failed to parse text. Please ensure valid tabular data.');
    }
  };

  // Handle actual Excel file upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setImportSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { header: 1 });

        if (json.length < 2) {
          setErrorMsg('The selected spreadsheet does not contain any data rows.');
          return;
        }

        const headers = (json[0] as string[]).map(h => String(h || '').trim()).filter(Boolean);
        const rows: Record<string, string>[] = [];

        for (let i = 1; i < json.length; i++) {
          const rowVals = json[i] as any[];
          if (!rowVals || rowVals.length === 0) continue;
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = rowVals[idx] !== undefined ? String(rowVals[idx]).trim() : '';
          });
          rows.push(rowObj);
        }

        setParsedData({ headers, rows });

        // Auto map
        const initialMap: Record<string, string> = {};
        headers.forEach(h => {
          initialMap[h] = guessMapping(h, category);
        });
        setColumnMapping(initialMap);

      } catch (err) {
        setErrorMsg('Error reading Excel file. Please try pasting raw text or check format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Perform the import into system state
  const handleExecuteImport = () => {
    if (!parsedData || parsedData.rows.length === 0) return;

    // Invert mapping: targetKey -> originalHeader
    const invertedMap: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([origHeader, targetKey]) => {
      if (targetKey) {
        invertedMap[targetKey] = origHeader;
      }
    });

    let count = 0;

    if (category === 'bankers') {
      const formattedBankers: Omit<Banker, 'id' | 'updatedAt'>[] = parsedData.rows.map(r => {
        const name = r[invertedMap['name']] || 'Banker Officer';
        const bankName = r[invertedMap['bankName']] || 'Partner Bank';
        const mobile = (r[invertedMap['mobile']] || '').replace(/\D/g, '').slice(-10) || '9800000000';
        const city = r[invertedMap['city']] || 'Mumbai';
        const branch = r[invertedMap['branch']] || 'Main Branch';
        const designation = r[invertedMap['designation']] || 'Loan Officer';
        const prodStr = r[invertedMap['products']] || 'Home Loan';
        const products = prodStr.split(/[,/|]/).map(p => p.trim() as LoanProduct).filter(Boolean);
        const rate = parseFloat(r[invertedMap['payoutSharingRate']]) || 1.20;
        const email = r[invertedMap['email']] || '';
        const remarks = r[invertedMap['remarks']] || 'Imported via Excel paste';

        return {
          name,
          bankName,
          branch,
          city,
          state: 'India',
          products: products.length > 0 ? products : ['Home Loan'],
          designation,
          mobile,
          email,
          payoutSharingRate: rate,
          activeStatus: 'Active',
          remarks
        };
      });

      count = bulkAddBankers(formattedBankers);
    } 
    else if (category === 'agents') {
      const formattedAgents: Omit<Agent, 'id' | 'joinedDate'>[] = parsedData.rows.map((r, i) => {
        const name = r[invertedMap['name']] || `Agent ${i + 1}`;
        const mobile = (r[invertedMap['mobile']] || '').replace(/\D/g, '').slice(-10) || '9900000000';
        const agencyName = r[invertedMap['agencyName']] || `${name} Associates`;
        const city = r[invertedMap['city']] || 'Jaipur';
        const code = r[invertedMap['code']] || `DSA-${Date.now().toString().slice(-3)}${i}`;
        const rate = parseFloat(r[invertedMap['defaultCommissionRate']]) || 0.65;
        const bankAccountNo = r[invertedMap['bankAccountNo']] || '';
        const ifsc = r[invertedMap['ifsc']] || '';
        const panNumber = r[invertedMap['panNumber']] || '';

        return {
          code,
          name,
          agencyName,
          mobile,
          email: `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          city,
          defaultCommissionRate: rate,
          bankAccountNo,
          ifsc,
          panNumber,
          status: 'Active'
        };
      });

      count = bulkAddAgents(formattedAgents);
    } 
    else if (category === 'loans') {
      const defaultAgent = agents[0];
      const formattedLoans: Omit<LoanFile, 'id'>[] = parsedData.rows.map((r, i) => {
        const fileNo = r[invertedMap['fileNo']] || `IMP-LN-${Date.now().toString().slice(-4)}-${i}`;
        const borrowerName = r[invertedMap['borrowerName']] || 'Borrower Applicant';
        const bankName = r[invertedMap['bankName']] || 'HDFC Bank';
        const amount = parseFloat(r[invertedMap['loanAmount']]) || 2500000;
        const product = (r[invertedMap['product']] as LoanProduct) || 'Home Loan';
        const date = r[invertedMap['disbursedDate']] || new Date().toISOString().slice(0, 10);
        const bankRate = parseFloat(r[invertedMap['bankPayoutRate']]) || 1.25;
        const agentRate = parseFloat(r[invertedMap['agentPayoutRate']]) || 0.65;
        const bankPayoutAmt = (amount * bankRate) / 100;
        const agentPayoutAmt = (amount * agentRate) / 100;

        return {
          fileNo,
          borrowerName,
          agentId: defaultAgent?.id || 'agt-1',
          agentName: defaultAgent?.name || 'Primary DSA',
          bankName,
          product,
          loanAmount: amount,
          sanctionDate: date,
          disbursedDate: date,
          status: 'Disbursed',
          bankOfficerName: 'Branch Manager',
          city: 'Mumbai',
          bankPayoutRate: bankRate,
          bankPayoutAmount: bankPayoutAmt,
          bankPayoutReceived: 0,
          bankPayoutStatus: 'Pending',
          agentPayoutRate: agentRate,
          agentPayoutAmount: agentPayoutAmt,
          agentPayoutPaid: 0,
          agentPayoutStatus: 'Unpaid',
          isReconciled: false
        };
      });

      count = bulkAddLoanFiles(formattedLoans);
    }

    setImportSuccessCount(count);
  };

  // Download Sample Template for Current Category
  const handleDownloadTemplate = () => {
    let sampleData: Record<string, any>[] = [];

    if (category === 'bankers') {
      sampleData = [
        {
          'Officer Name': 'Sanjay Singhania',
          'Bank Name': 'HDFC Bank',
          'Branch': 'Nariman Point',
          'City': 'Mumbai',
          'Mobile Number': '9820011223',
          'Designation': 'Cluster Sales Manager',
          'Loan Products': 'Home Loan, Loan Against Property (LAP)',
          'Payout Slab (%)': '1.30',
          'Email': 'sanjay.s@hdfcbank.com',
          'Remarks': 'Direct approval power'
        },
        {
          'Officer Name': 'Ritu Malhotra',
          'Bank Name': 'ICICI Bank',
          'Branch': 'South Extension',
          'City': 'Delhi NCR',
          'Mobile Number': '9811099887',
          'Designation': 'Area Sales Manager',
          'Loan Products': 'Business Loan, Personal Loan',
          'Payout Slab (%)': '1.50',
          'Email': 'ritu.m@icicibank.com',
          'Remarks': 'Fast 48h disbursal'
        }
      ];
    } else if (category === 'agents') {
      sampleData = [
        {
          'Agent Code': 'DSA-201',
          'Agent Name': 'Mukesh Khandelwal',
          'Agency / Firm': 'Khandelwal Financial',
          'City': 'Jaipur',
          'Mobile Number': '9829055443',
          'Default Commission (%)': '0.70',
          'Bank Account No': '5010049210293',
          'IFSC Code': 'HDFC0000054',
          'PAN Number': 'ABCDE1234F'
        }
      ];
    } else {
      sampleData = [
        {
          'File No': 'HDFC-HL-2026-901',
          'Borrower Name': 'Vijay Kumar Bansal',
          'Bank Name': 'HDFC Bank',
          'Loan Amount (₹)': '7500000',
          'Product': 'Home Loan',
          'Disbursal Date': '2026-10-20',
          'Bank Payout %': '1.25',
          'Agent Payout %': '0.70'
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `Sample_${category.toUpperCase()}_Template.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 rounded-2xl border border-slate-700/60 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'स्मार्ट एक्सेल एवं क्लिपबोर्ड पेस्ट इंपोर्टर' : 'Smart Excel & Clipboard Paste Importer'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500 text-slate-950 rounded-full flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto Column Sync</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'hi'
                ? 'अपने अलग-अलग एक्सेल या स्प्रेडशीट फाइलों से डेटा कॉपी करें और यहाँ सीधे पेस्ट (Ctrl+V) करें। सॉफ्टवेयर सभी रिकॉर्ड्स को स्वचालित रूप से पहचान कर सेव कर लेगा।'
                : 'Copy data from your separate Excel sheets and paste directly below (Ctrl+V). Automatic column mapping detects officers, cities, banks, and commission numbers instantly.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{t.downloadTemplate}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Select Target Category */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Step 1: Choose Dataset to Import</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            onClick={() => {
              setCategory('bankers');
              setParsedData(null);
              setImportSuccessCount(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all flex items-start space-x-3 ${
              category === 'bankers'
                ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${category === 'bankers' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">All-India Bankers Directory</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Officers, Cities, Banks, Mobile & Products</p>
            </div>
          </button>

          <button
            onClick={() => {
              setCategory('agents');
              setParsedData(null);
              setImportSuccessCount(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all flex items-start space-x-3 ${
              category === 'agents'
                ? 'bg-indigo-50/70 border-indigo-500 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${category === 'agents' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">DSA Agents & Sub-DSAs</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Agent names, slabs, contact, bank details</p>
            </div>
          </button>

          <button
            onClick={() => {
              setCategory('loans');
              setParsedData(null);
              setImportSuccessCount(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all flex items-start space-x-3 ${
              category === 'loans'
                ? 'bg-purple-50/70 border-purple-500 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${category === 'loans' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900">Loan Disbursals & Files</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Disbursal sheets, bank payouts & agent share</p>
            </div>
          </button>

        </div>
      </div>

      {/* Step 2: Paste or Upload Input */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <ClipboardPaste className="w-4 h-4 text-emerald-600" />
            <span>Step 2: Paste Data Rows or Upload File</span>
          </div>

          <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors">
            <UploadCloud className="w-4 h-4 text-slate-600" />
            <span>Upload .xlsx / .xls / .csv</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Big Paste Area */}
        <div className="space-y-2">
          <textarea
            rows={5}
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              parseRawText(e.target.value);
            }}
            placeholder={
              category === 'bankers'
                ? "Paste Excel rows here...\nExample:\nOfficer Name\tBank Name\tCity\tMobile\tProducts\nRajesh Kumar\tHDFC Bank\tMumbai\t9820145890\tHome Loan\nSunita Meena\tSBI\tJaipur\t9414088921\tHome Loan, LAP"
                : "Paste your spreadsheet rows here directly (Ctrl + V)..."
            }
            className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Supports direct copy from MS Excel, Google Sheets, or CSV tables.</span>
            {pastedText && (
              <button
                onClick={() => {
                  setPastedText('');
                  setParsedData(null);
                }}
                className="text-rose-600 font-semibold hover:underline"
              >
                Clear text
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Step 3: Column Mapping & Live Preview */}
      {parsedData && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Step 3: Column Auto-Mapping & Preview</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Parsed <span className="font-bold text-slate-900">{parsedData.rows.length} rows</span> with {parsedData.headers.length} columns.
              </p>
            </div>

            <button
              onClick={handleExecuteImport}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-102"
            >
              <span>{t.saveToSystem}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Column Match Selectors */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs font-bold text-slate-700">Column Mapping (Excel Column → Target Field):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {parsedData.headers.map((hdr) => (
                <div key={hdr} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="block text-[11px] font-mono font-bold text-slate-600 truncate mb-1">
                    "{hdr}"
                  </span>
                  <select
                    value={columnMapping[hdr] || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [hdr]: e.target.value })}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-slate-50 font-semibold"
                  >
                    <option value="">-- Ignore Column --</option>
                    {targetFields[category].map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label} {f.required ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700">First 5 Rows Preview:</p>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                  <tr>
                    {parsedData.headers.map((h) => (
                      <th key={h} className="py-2.5 px-3">
                        <div>{h}</div>
                        {columnMapping[h] ? (
                          <div className="text-[9px] text-emerald-700 font-bold lowercase">
                            → {columnMapping[h]}
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400 font-normal">
                            (ignored)
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                  {parsedData.rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {parsedData.headers.map((h) => (
                        <td key={h} className="py-2.5 px-3 max-w-[200px] truncate">
                          {row[h] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Success Notification Banner */}
      {importSuccessCount !== null && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              ✓
            </div>
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                {importSuccessCount} Records Successfully Imported!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                All records have been parsed, validated, and saved to your persistent storage.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (category === 'bankers') onNavigateToTab('bankerDirectory');
                else if (category === 'agents') onNavigateToTab('agentStatements');
                else onNavigateToTab('loanFiles');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-colors"
            >
              View Updated Records →
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

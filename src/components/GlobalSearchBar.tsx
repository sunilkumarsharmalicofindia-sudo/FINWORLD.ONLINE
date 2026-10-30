import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatShortINR } from '../utils/formatters';
import { 
  Search, 
  X, 
  FileText, 
  Building2, 
  CreditCard, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Command,
  ExternalLink
} from 'lucide-react';
import { LoanFile, Banker, FinancialTransaction, Agent } from '../types';

interface GlobalSearchBarProps {
  onNavigateToTab: (tabId: string, searchQuery?: string, agentId?: string) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ onNavigateToTab }) => {
  const { loanFiles, bankers, transactions, agents, language } = useApp();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        if (window.innerWidth < 1024) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Results across All Modules
  const searchResults = useMemo(() => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) {
      return {
        matchedFiles: [],
        matchedBankers: [],
        matchedTransactions: [],
        matchedAgents: [],
        totalCount: 0
      };
    }

    // 1. Match Loan Files (Client Name, File Application ID, Bank Name, Product, Officer)
    const matchedFiles = loanFiles.filter(f => 
      f.borrowerName.toLowerCase().includes(cleanQ) ||
      f.fileNo.toLowerCase().includes(cleanQ) ||
      f.bankName.toLowerCase().includes(cleanQ) ||
      f.product.toLowerCase().includes(cleanQ) ||
      (f.agentName && f.agentName.toLowerCase().includes(cleanQ)) ||
      (f.city && f.city.toLowerCase().includes(cleanQ))
    ).slice(0, 5);

    // 2. Match Bankers & Bank Branches (Bank Name, Officer Name, Branch, City, Products)
    const matchedBankers = bankers.filter(b => 
      b.bankName.toLowerCase().includes(cleanQ) ||
      b.name.toLowerCase().includes(cleanQ) ||
      b.branch.toLowerCase().includes(cleanQ) ||
      b.city.toLowerCase().includes(cleanQ) ||
      b.products.some(p => p.toLowerCase().includes(cleanQ))
    ).slice(0, 5);

    // 3. Match Transactions & Ledgers (Bank Name, Reference/UTR No, File No, Agent)
    const matchedTransactions = transactions.filter(t => 
      t.bankName.toLowerCase().includes(cleanQ) ||
      t.referenceNo.toLowerCase().includes(cleanQ) ||
      (t.fileNo && t.fileNo.toLowerCase().includes(cleanQ)) ||
      (t.agentName && t.agentName.toLowerCase().includes(cleanQ)) ||
      t.description.toLowerCase().includes(cleanQ)
    ).slice(0, 4);

    // 4. Match Agents / Sub-DSAs (Agent Name, Code, Agency Name, City)
    const matchedAgents = agents.filter(a => 
      a.name.toLowerCase().includes(cleanQ) ||
      a.code.toLowerCase().includes(cleanQ) ||
      a.agencyName.toLowerCase().includes(cleanQ) ||
      a.city.toLowerCase().includes(cleanQ)
    ).slice(0, 4);

    const totalCount = matchedFiles.length + matchedBankers.length + matchedTransactions.length + matchedAgents.length;

    return {
      matchedFiles,
      matchedBankers,
      matchedTransactions,
      matchedAgents,
      totalCount
    };
  }, [query, loanFiles, bankers, transactions, agents]);

  // Flattened array for keyboard arrow navigation
  const flatResultItems = useMemo(() => {
    const items: Array<{
      type: 'file' | 'banker' | 'transaction' | 'agent';
      id: string;
      title: string;
      subtitle: string;
      badge?: string;
      data: any;
    }> = [];

    searchResults.matchedFiles.forEach(f => {
      items.push({
        type: 'file',
        id: f.id,
        title: f.borrowerName,
        subtitle: `${f.fileNo} • ${f.bankName} • ${f.product}`,
        badge: formatINR(f.loanAmount),
        data: f
      });
    });

    searchResults.matchedBankers.forEach(b => {
      items.push({
        type: 'banker',
        id: b.id,
        title: `${b.bankName} - ${b.branch}`,
        subtitle: `${b.name} (${b.designation}) • ${b.city}`,
        badge: `${b.payoutSharingRate || 0}%`,
        data: b
      });
    });

    searchResults.matchedTransactions.forEach(t => {
      items.push({
        type: 'transaction',
        id: t.id,
        title: `${t.bankName} (${t.type})`,
        subtitle: `${t.referenceNo} • ${t.date} ${t.fileNo ? `• File ${t.fileNo}` : ''}`,
        badge: formatINR(t.amount),
        data: t
      });
    });

    searchResults.matchedAgents.forEach(a => {
      items.push({
        type: 'agent',
        id: a.id,
        title: `${a.name} (${a.agencyName})`,
        subtitle: `${a.code} • ${a.city} • Rate: ${a.defaultCommissionRate}%`,
        data: a
      });
    });

    return items;
  }, [searchResults]);

  // Handle item selection
  const handleSelectResult = (item: typeof flatResultItems[0]) => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);

    if (item.type === 'file') {
      const file: LoanFile = item.data;
      onNavigateToTab('loanFiles', file.fileNo || file.borrowerName);
    } else if (item.type === 'banker') {
      const banker: Banker = item.data;
      onNavigateToTab('bankerDirectory', banker.bankName || banker.name);
    } else if (item.type === 'transaction') {
      const tx: FinancialTransaction = item.data;
      onNavigateToTab('bankPayoutCashflow', tx.referenceNo || tx.bankName);
    } else if (item.type === 'agent') {
      const agent: Agent = item.data;
      onNavigateToTab('agentStatements', undefined, agent.id);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (flatResultItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (flatResultItems.length || 1)) % (flatResultItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResultItems[selectedIndex]) {
        handleSelectResult(flatResultItems[selectedIndex]);
      } else if (query.trim()) {
        // Default navigate to loan files with the query
        onNavigateToTab('loanFiles', query.trim());
        setIsOpen(false);
        setIsMobileSearchOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2">
      
      {/* Desktop Search Input Field */}
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-emerald-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={
            language === 'hi' 
              ? 'ग्राहक, लोन ID, बैंक खोजें...' 
              : 'Search client, loan ID, bank...'
          }
          className="w-full pl-9 pr-16 py-1.5 bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-900 text-xs text-white placeholder-slate-400 rounded-xl border border-slate-700/80 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
        />

        <div className="absolute right-2.5 flex items-center space-x-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 rounded-md">
              <span className="text-[9px] mr-0.5">Ctrl</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Overlay Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[75vh] flex flex-col">
          
          {/* Header Bar of Results */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400 text-[11px] flex items-center space-x-1.5">
              <span>{language === 'hi' ? 'ग्लोबल सर्च परिणाम' : 'Global Search Results'}</span>
              {query && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  {searchResults.totalCount} {language === 'hi' ? 'मिले' : 'found'}
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-500">
              Esc to close • Enter to select
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-3">
            
            {/* If Query is empty: Show Quick Guidance & Categories */}
            {!query.trim() && (
              <div className="p-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">
                  {language === 'hi' ? 'ऑल-इन-वन ग्लोबल सर्च' : 'Cross-Module Instant Search'}
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {language === 'hi' 
                    ? 'ग्राहक का नाम (Borrower), लोन फ़ाइल नंबर (LN-...), या बैंक का नाम (HDFC, SBI, Axis) लिखकर तुरंत खोजें।' 
                    : 'Search across Client Names, Loan Application IDs (LN-...), Partner Banks, Bankers, and Ledgers.'}
                </p>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  {['HDFC', 'SBI', 'ICICI', 'Home Loan', 'Disbursed', 'LN-'].map((pill) => (
                    <button
                      key={pill}
                      onClick={() => {
                        setQuery(pill);
                        inputRef.current?.focus();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] transition-colors"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* If Query is typed but zero results */}
            {query.trim() && searchResults.totalCount === 0 && (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  {language === 'hi' 
                    ? `"${query}" के लिए कोई रिकॉर्ड नहीं मिला` 
                    : `No matches found for "${query}"`}
                </p>
                <p className="text-[11px] text-slate-500">
                  {language === 'hi'
                    ? 'कृपया ग्राहक का नाम, लोन नंबर या बैंक नाम सही से जांचें।'
                    : 'Check spelling or search by client name, loan file #, or bank name.'}
                </p>
                <button
                  onClick={() => {
                    onNavigateToTab('loanFiles', query);
                    setIsOpen(false);
                  }}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <span>{language === 'hi' ? 'लोन फाइल्स में खोजें' : 'Search in Loan Files'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Category 1: Loan Files & Clients (Matched by Borrower Name or Loan App ID or Bank) */}
            {searchResults.matchedFiles.length > 0 && (
              <div className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' ? 'लोन फाइलें एवं ग्राहक' : 'Loan Files & Clients'} ({searchResults.matchedFiles.length})
                  </span>
                </div>
                {searchResults.matchedFiles.map(file => {
                  return (
                    <button
                      key={file.id}
                      onClick={() => {
                        onNavigateToTab('loanFiles', file.fileNo || file.borrowerName);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span className="truncate">{file.borrowerName}</span>
                            <span className="font-mono text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 bg-emerald-950/60 rounded border border-emerald-500/30">
                              {file.fileNo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {file.bankName} • {file.product} • {file.agentName || 'Direct'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-bold text-emerald-300">
                          {formatINR(file.loanAmount)}
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          file.status === 'Disbursed' ? 'bg-emerald-500/20 text-emerald-300' :
                          file.status === 'Sanctioned' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {file.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category 2: Bankers & Banks */}
            {searchResults.matchedBankers.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' ? 'बैंक एवं बैंकर संपर्क' : 'Banks & Loan Officers'} ({searchResults.matchedBankers.length})
                  </span>
                </div>
                {searchResults.matchedBankers.map(banker => (
                  <button
                    key={banker.id}
                    onClick={() => {
                      onNavigateToTab('bankerDirectory', banker.bankName);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">
                          {banker.bankName} <span className="font-normal text-slate-400">({banker.branch}, {banker.city})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {banker.name} • {banker.designation} • {banker.mobile}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                        {banker.payoutSharingRate ? `${banker.payoutSharingRate}% Slab` : 'Banker'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Category 3: Financial Transactions / Ledger (Bank Inflows & Agent Outflows) */}
            {searchResults.matchedTransactions.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' ? 'कैश फ्लो लेनदेन एवं UTR' : 'Cash Flow Ledger & Payouts'} ({searchResults.matchedTransactions.length})
                  </span>
                </div>
                {searchResults.matchedTransactions.map(tx => (
                  <button
                    key={tx.id}
                    onClick={() => {
                      onNavigateToTab('bankPayoutCashflow', tx.referenceNo || tx.bankName);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'Inflow' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      }`}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>{tx.bankName}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-normal">
                            Ref: {tx.referenceNo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tx.category} • {tx.date} {tx.fileNo ? `• File #${tx.fileNo}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <div className={`text-xs font-bold ${
                        tx.type === 'Inflow' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {tx.type === 'Inflow' ? '+' : '-'}{formatINR(tx.amount)}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {tx.paymentMode}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Category 4: Agents / Sub-DSAs */}
            {searchResults.matchedAgents.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' ? 'एजेंट एवं सब-डीएसए' : 'Agents & Channel Partners'} ({searchResults.matchedAgents.length})
                  </span>
                </div>
                {searchResults.matchedAgents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onNavigateToTab('agentStatements', undefined, agent.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>{agent.name}</span>
                          <span className="font-mono text-[10px] text-amber-400 font-semibold px-1 bg-amber-950/60 rounded border border-amber-500/30">
                            {agent.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {agent.agencyName} • {agent.city} • {agent.mobile}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {agent.defaultCommissionRate}% Rate
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Quick Footer Navigation */}
          {query.trim() && (
            <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{language === 'hi' ? 'सीधे मॉड्यूल में खोलें:' : 'Explore directly in:'}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onNavigateToTab('loanFiles', query);
                    setIsOpen(false);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline"
                >
                  Loan Files
                </button>
                <span>•</span>
                <button
                  onClick={() => {
                    onNavigateToTab('bankerDirectory', query);
                    setIsOpen(false);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline"
                >
                  Bankers
                </button>
                <span>•</span>
                <button
                  onClick={() => {
                    onNavigateToTab('bankPayoutCashflow', query);
                    setIsOpen(false);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
                >
                  Ledger
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

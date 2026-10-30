import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Banker, LoanProduct } from '../types';
import { createWhatsAppUrl, exportToExcel, exportToCSV } from '../utils/formatters';
import { 
  Search, 
  MapPin, 
  Building2, 
  Briefcase, 
  Phone, 
  MessageCircle, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Filter, 
  LayoutGrid, 
  List,
  Sparkles,
  ExternalLink,
  Percent
} from 'lucide-react';

interface BankerDirectoryProps {
  onOpenPasteImporter: () => void;
  initialSearchQuery?: string;
}

const ALL_LOAN_PRODUCTS: LoanProduct[] = [
  'Home Loan',
  'Loan Against Property (LAP)',
  'Business Loan',
  'Personal Loan',
  'MSME / CC-OD',
  'Car Loan',
  'Education Loan',
  'Doctor / Professional Loan'
];

export const BankerDirectory: React.FC<BankerDirectoryProps> = ({ 
  onOpenPasteImporter,
  initialSearchQuery = ''
}) => {
  const { 
    bankers, 
    addBanker, 
    updateBanker, 
    deleteBanker, 
    clearBankersData, 
    resetToDemoData, 
    t, 
    language 
  } = useApp();

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanker, setEditingBanker] = useState<Banker | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    bankName: 'HDFC Bank',
    branch: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    products: ['Home Loan'] as LoanProduct[],
    designation: 'Sales Manager',
    mobile: '',
    email: '',
    payoutSharingRate: 1.25,
    activeStatus: 'Active' as 'Active' | 'Transferred' | 'Inactive',
    remarks: ''
  });

  // Unique lists for quick filter pills
  const cities = useMemo(() => {
    return Array.from(new Set(bankers.map(b => b.city))).sort();
  }, [bankers]);

  const banks = useMemo(() => {
    return Array.from(new Set(bankers.map(b => b.bankName))).sort();
  }, [bankers]);

  // Filter logic
  const filteredBankers = useMemo(() => {
    return bankers.filter(b => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        b.name.toLowerCase().includes(query) ||
        b.bankName.toLowerCase().includes(query) ||
        b.branch.toLowerCase().includes(query) ||
        b.city.toLowerCase().includes(query) ||
        b.mobile.includes(query) ||
        b.designation.toLowerCase().includes(query) ||
        (b.remarks && b.remarks.toLowerCase().includes(query));

      // City filter
      const matchesCity = selectedCity === 'all' || b.city === selectedCity;

      // Bank filter
      const matchesBank = selectedBank === 'all' || b.bankName === selectedBank;

      // Product filter
      const matchesProduct = selectedProduct === 'all' || b.products.includes(selectedProduct as LoanProduct);

      return matchesSearch && matchesCity && matchesBank && matchesProduct;
    });
  }, [bankers, searchQuery, selectedCity, selectedBank, selectedProduct]);

  // Handle Copy details
  const handleCopy = (b: Banker) => {
    const text = `🏦 ${b.bankName} - ${b.branch}, ${b.city}\n👤 ${b.name} (${b.designation})\n📞 ${b.mobile}\n📧 ${b.email || 'N/A'}\n💼 Products: ${b.products.join(', ')}\n💰 Payout Rate: ${b.payoutSharingRate || 0}%`;
    navigator.clipboard.writeText(text);
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Edit Modal
  const handleEditClick = (b: Banker) => {
    setEditingBanker(b);
    setFormData({
      name: b.name,
      bankName: b.bankName,
      branch: b.branch,
      city: b.city,
      state: b.state,
      products: b.products,
      designation: b.designation,
      mobile: b.mobile,
      email: b.email,
      payoutSharingRate: b.payoutSharingRate || 1.0,
      activeStatus: b.activeStatus,
      remarks: b.remarks || ''
    });
    setShowAddModal(true);
  };

  // Submit Add or Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.bankName || !formData.mobile) {
      alert('Please fill in Name, Bank Name, and Mobile Number.');
      return;
    }

    if (editingBanker) {
      updateBanker(editingBanker.id, formData);
    } else {
      addBanker(formData);
    }

    setShowAddModal(false);
    setEditingBanker(null);
  };

  // Export
  const handleExport = (type: 'excel' | 'csv') => {
    const data = filteredBankers.map(b => ({
      'Officer Name': b.name,
      'Bank / NBFC': b.bankName,
      'Branch': b.branch,
      'City': b.city,
      'State': b.state,
      'Designation': b.designation,
      'Mobile': b.mobile,
      'Email': b.email,
      'Products Handled': b.products.join(', '),
      'Payout Slab %': b.payoutSharingRate || '',
      'Status': b.activeStatus,
      'Remarks': b.remarks || ''
    }));

    if (type === 'excel') {
      exportToExcel(data, 'All_India_Bankers_Directory');
    } else {
      exportToCSV(data, 'All_India_Bankers_Directory');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'ऑल-इंडिया बैंकर एवं लोन ऑफिसर्स डायरेक्टरी' : 'All-India Bankers & Loan Officers Directory'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500 text-slate-950 rounded-full">
                {filteredBankers.length} {language === 'hi' ? 'अधिकारी' : 'Bankers'}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'hi'
                ? '1-क्लिक में शहर, बैंक और लोन प्रोडक्ट के अनुसार सही बैंकर को खोजें और सीधे व्हाट्सएप या कॉल पर फाइल शेयर करें।'
                : '1-click instant search by City, Bank Name, and Loan Product with direct WhatsApp file submission & call links.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenPasteImporter}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t.pasteExcel}</span>
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            </button>
            <button
              onClick={() => {
                setEditingBanker(null);
                setFormData({
                  name: '',
                  bankName: 'HDFC Bank',
                  branch: '',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  products: ['Home Loan'],
                  designation: 'Sales Manager',
                  mobile: '',
                  email: '',
                  payoutSharingRate: 1.25,
                  activeStatus: 'Active',
                  remarks: ''
                });
                setShowAddModal(true);
              }}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{t.addBanker}</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
              title="Download Excel file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel</span>
            </button>
            {bankers.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(language === 'hi' ? 'क्या आप सभी सैंपल बैंकर हटाना चाहते हैं? इसके बाद आप अपनी एक्सेल शीट से नए बैंकर पेस्ट कर सकते हैं।' : 'Are you sure you want to remove all sample bankers? You can then paste your own Excel sheets.')) {
                    clearBankersData();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-colors"
                title="सैंपल बैंकर हटाएं"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{language === 'hi' ? 'सैंपल बैंकर हटाएं' : 'Clear Bankers'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1-Click Multi-Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        
        {/* Search Bar + View Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs sm:text-sm bg-slate-50/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setSelectedCity('all');
                setSelectedBank('all');
                setSelectedProduct('all');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {t.resetFilters}
            </button>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 1-Click City Filter Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>1-Click City Filter:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCity('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedCity === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Cities ({bankers.length})
            </button>
            {cities.map((city) => {
              const count = bankers.filter(b => b.city === city).length;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedCity === city
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {city} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1-Click Bank Filter Pills */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>1-Click Bank Filter:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedBank('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedBank === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Banks
            </button>
            {banks.map((bank) => {
              const count = bankers.filter(b => b.bankName === bank).length;
              return (
                <button
                  key={bank}
                  onClick={() => setSelectedBank(bank)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedBank === bank
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {bank} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1-Click Loan Product Pills */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5 text-purple-600" />
            <span>1-Click Product Filter:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedProduct('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedProduct === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Products
            </button>
            {ALL_LOAN_PRODUCTS.map((prod) => {
              const count = bankers.filter(b => b.products.includes(prod)).length;
              if (count === 0) return null;
              return (
                <button
                  key={prod}
                  onClick={() => setSelectedProduct(prod)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedProduct === prod
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {prod} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bankers Results - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBankers.map((b) => (
            <div 
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3.5">
                
                {/* Header: Bank & City Tag */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white tracking-wide">
                      {b.bankName}
                    </span>
                    <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{b.branch}, {b.city}</span>
                    </div>
                  </div>

                  {b.payoutSharingRate && (
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {b.payoutSharingRate}% Payout
                      </span>
                    </div>
                  )}
                </div>

                {/* Officer Name & Designation */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {b.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600">
                    {b.designation}
                  </p>
                </div>

                {/* Products Badges */}
                <div className="flex flex-wrap gap-1">
                  {b.products.map(p => (
                    <span 
                      key={p}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                {/* Remarks / Special Powers */}
                {b.remarks && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl italic border border-slate-100">
                    "{b.remarks}"
                  </p>
                )}

              </div>

              {/* Action Footer: WhatsApp, Call, Copy, Edit */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                
                {/* WhatsApp Direct 1-Click Link */}
                <a
                  href={createWhatsAppUrl(b.mobile, b.name, b.products[0], b.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                {/* Phone Call Link */}
                <a
                  href={`tel:${b.mobile}`}
                  className="flex items-center justify-center p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
                  title={`Call ${b.mobile}`}
                >
                  <Phone className="w-4 h-4" />
                </a>

                {/* Copy Info Button */}
                <button
                  onClick={() => handleCopy(b)}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
                  title="Copy details"
                >
                  {copiedId === b.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => handleEditClick(b)}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
                  title="Edit banker"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    if (window.confirm(language === 'hi' ? `क्या आप ${b.name} (${b.bankName}) को हटाना चाहते हैं?` : `Delete loan officer ${b.name}?`)) {
                      deleteBanker(b.id);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-600 transition-colors"
                  title={language === 'hi' ? 'बैंकर हटाएं' : 'Delete banker'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bankers Results - Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Bank & Branch</th>
                  <th className="py-3 px-4">Officer Name & Designation</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Payout Slab</th>
                  <th className="py-3 px-4 text-right">Direct Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBankers.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{b.bankName}</div>
                      <div className="text-[11px] text-slate-500">{b.branch}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-500">{b.designation}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        {b.city}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] text-slate-600 max-w-xs truncate">
                        {b.products.join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {b.mobile}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {b.payoutSharingRate ? `${b.payoutSharingRate}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <a
                        href={createWhatsAppUrl(b.mobile, b.name, b.products[0], b.city)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] space-x-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat</span>
                      </a>
                      <a
                        href={`tel:${b.mobile}`}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px]"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleEditClick(b)}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px]"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(language === 'hi' ? `क्या आप ${b.name} (${b.bankName}) को हटाना चाहते हैं?` : `Delete ${b.name}?`)) {
                            deleteBanker(b.id);
                          }
                        }}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-600 text-[11px]"
                        title={language === 'hi' ? 'हटाएं' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredBankers.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {bankers.length === 0
                ? (language === 'hi' ? 'डायरेक्टरी पूरी तरह खाली है' : 'Banker Directory is Clean & Empty')
                : (language === 'hi' ? 'कोई लोन अधिकारी नहीं मिला' : 'No loan officers found')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {bankers.length === 0
                ? (language === 'hi' 
                    ? 'सभी सैंपल बैंकर हटा दिए गए हैं। अब अपनी एक्सेल शीट से असली बैंकर्स को पेस्ट करने के लिए नीचे दिए गए बटन पर क्लिक करें।' 
                    : 'All sample bankers have been cleared. Click below to paste your own Excel sheet.')
                : (language === 'hi'
                    ? 'फ़िल्टर बदलें या अपनी एक्सेल शीट से सीधे बैंकर पेस्ट करें।'
                    : 'Try adjusting your search query, or paste your Excel banker sheets directly.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenPasteImporter}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{language === 'hi' ? 'एक्सेल से बैंकर पेस्ट करें (Ctrl + V)' : 'Paste Bankers from Excel'}</span>
            </button>
            <button
              onClick={() => {
                setEditingBanker(null);
                setFormData({
                  name: '',
                  bankName: 'HDFC Bank',
                  branch: '',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  products: ['Home Loan'],
                  designation: '',
                  mobile: '',
                  email: '',
                  payoutSharingRate: 1.0,
                  activeStatus: 'Active',
                  remarks: ''
                });
                setShowAddModal(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? '+ नया बैंकर जोड़ें' : '+ Add New Banker'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Banker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>{editingBanker ? t.editBanker : t.addBanker}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Officer Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.officerName} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Verma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.bank} *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank / SBI / ICICI"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. Connaught Place"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.city} *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Delhi NCR / Mumbai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.designation}</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Area Sales Manager (ASM)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t.mobile} *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="officer@bank.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Payout Sharing Rate % */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payout Sharing Slab (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.payoutSharingRate}
                    onChange={(e) => setFormData({ ...formData, payoutSharingRate: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 1.25"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

              </div>

              {/* Products Multi-Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Products Handled</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_LOAN_PRODUCTS.map((prod) => {
                    const isSelected = formData.products.includes(prod);
                    return (
                      <button
                        type="button"
                        key={prod}
                        onClick={() => {
                          if (isSelected) {
                            if (formData.products.length > 1) {
                              setFormData({
                                ...formData,
                                products: formData.products.filter(p => p !== prod)
                              });
                            }
                          } else {
                            setFormData({
                              ...formData,
                              products: [...formData.products, prod]
                            });
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors border ${
                          isSelected 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {prod}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Login Criteria</label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. Max ticket size, surrogate programs, processing turnaround..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
                >
                  {editingBanker ? t.save : t.addBanker}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

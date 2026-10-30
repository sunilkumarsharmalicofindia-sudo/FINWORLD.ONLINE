import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Plus, 
  Check, 
  Copy, 
  Globe, 
  Search, 
  ShieldAlert,
  Server,
  Sparkles
} from 'lucide-react';

export interface BankPortalConfig {
  id: string;
  bankName: string;
  portalName: string;
  loginUrl: string;
  dsaCode: string;
  username: string;
  encryptedPasswordMask: string;
  authMethod: 'Password + OTP' | 'Biometric / Token' | 'Digital Signature' | 'SSO';
  status: 'Live & Active' | 'Maintenance' | 'Restricted';
  category: 'Mortgages & Home Loan' | 'Unsecured Loans' | 'MSME & SME' | 'Multi-Product';
  lastAccessed?: string;
  notes?: string;
}

const DEFAULT_BANK_PORTALS: BankPortalConfig[] = [
  {
    id: 'prt-urban-money',
    bankName: 'Urban Money (Square Yards)',
    portalName: 'Urban Money Partner & Connector Portal',
    loginUrl: 'https://partner.urbanmoney.com/login',
    dsaCode: 'UM-CONNECTOR-9941',
    username: 'SUNIL_UM_PARTNER',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Password + OTP',
    status: 'Live & Active',
    category: 'Multi-Product',
    lastAccessed: '2026-10-26 10:15',
    notes: 'National Aggregator Portal: Single-window access to 90+ banks & NBFCs, digital file tracking, and connector commission payout sync.'
  },
  {
    id: 'prt-hdfc',
    bankName: 'HDFC Bank',
    portalName: 'LeadPlus DSA Portal',
    loginUrl: 'https://leads.hdfcbank.com/channel/login',
    dsaCode: 'DSA-HDFC-9921',
    username: 'SUNIL_DSA_MUM',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Password + OTP',
    status: 'Live & Active',
    category: 'Mortgages & Home Loan',
    lastAccessed: '2026-10-25 15:40',
    notes: 'Direct login for Home Loan & LAP files login and monthly payout credit advice.'
  },
  {
    id: 'prt-icici',
    bankName: 'ICICI Bank',
    portalName: 'ICICI Channel Connect',
    loginUrl: 'https://channelconnect.icicibank.com/login',
    dsaCode: 'ICIC-DSA-4412',
    username: 'FIN_DSA_DELHI',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Password + OTP',
    status: 'Live & Active',
    category: 'Unsecured Loans',
    lastAccessed: '2026-10-24 18:20',
    notes: 'Business Loan & Personal Loan instant sanction tracking and commission MIS.'
  },
  {
    id: 'prt-sbi',
    bankName: 'State Bank of India (SBI)',
    portalName: 'SBI LOS / RASMECCC Channel Portal',
    loginUrl: 'https://sbi.co.in/web/business/partner-portal',
    dsaCode: 'SBI-DSA-RAJ-108',
    username: 'JAIPUR_RASMECCC_01',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Biometric / Token',
    status: 'Live & Active',
    category: 'Mortgages & Home Loan',
    lastAccessed: '2026-10-23 11:10',
    notes: 'Nationalized bank home loan portal with takeover cases and interest subvention.'
  },
  {
    id: 'prt-axis',
    bankName: 'Axis Bank',
    portalName: 'Axis FinConnect Partner Desk',
    loginUrl: 'https://finconnect.axisbank.com/auth/login',
    dsaCode: 'AXIS-DSA-7712',
    username: 'AXIS_WEST_MITRA',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Password + OTP',
    status: 'Live & Active',
    category: 'MSME & SME',
    lastAccessed: '2026-10-22 14:05',
    notes: 'MSME, Working capital limits, and Mortgage files login.'
  },
  {
    id: 'prt-bajaj',
    bankName: 'Bajaj Housing Finance Ltd',
    portalName: 'BHFL Partner Express',
    loginUrl: 'https://partner.bajajhousingfinance.in',
    dsaCode: 'BHFL-PARTNER-331',
    username: 'BAJAJ_DSA_PN',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Password + OTP',
    status: 'Live & Active',
    category: 'Mortgages & Home Loan',
    lastAccessed: '2026-10-24 16:50',
    notes: 'High speed digital sanction and disbursement tracking.'
  },
  {
    id: 'prt-kotak',
    bankName: 'Kotak Mahindra Bank',
    portalName: 'Kotak Mitra Partner Portal',
    loginUrl: 'https://partner.kotak.com/dsa-portal',
    dsaCode: 'KTK-DSA-8812',
    username: 'KOTAK_BL_AGENT',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Password + OTP',
    status: 'Live & Active',
    category: 'Unsecured Loans',
    lastAccessed: '2026-10-25 10:15',
    notes: 'Digital PL and salaried doctor loans.'
  },
  {
    id: 'prt-tata',
    bankName: 'Tata Capital',
    portalName: 'Tata Capital Channel Connect',
    loginUrl: 'https://channel.tatacapital.com',
    dsaCode: 'TCFSL-DSA-5590',
    username: 'TATA_HYD_DSA',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Password + OTP',
    status: 'Live & Active',
    category: 'Multi-Product',
    lastAccessed: '2026-10-25 12:30',
    notes: 'BL, LAP, and equipment finance channel submissions.'
  },
  {
    id: 'prt-bob',
    bankName: 'Bank of Baroda',
    portalName: 'Baroda Mortgage & MSME Connect',
    loginUrl: 'https://bobconnect.bankofbaroda.in',
    dsaCode: 'BOB-DSA-UP-412',
    username: 'BOB_LKO_HUB',
    encryptedPasswordMask: '••••••••••••',
    authMethod: 'Password + OTP',
    status: 'Live & Active',
    category: 'MSME & SME',
    lastAccessed: '2026-10-21 09:30',
    notes: 'Baroda Mortgage Store digital file tracking.'
  }
];

export const BankPortalVault: React.FC = () => {
  const { addNotification, language, t } = useApp();

  const [portals, setPortals] = useState<BankPortalConfig[]>(() => {
    const saved = localStorage.getItem('dsa_bank_portals');
    return saved ? JSON.parse(saved) : DEFAULT_BANK_PORTALS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    bankName: '',
    portalName: '',
    loginUrl: 'https://',
    dsaCode: '',
    username: '',
    authMethod: 'Password + OTP' as BankPortalConfig['authMethod'],
    category: 'Mortgages & Home Loan' as BankPortalConfig['category'],
    notes: ''
  });

  const savePortals = (newPortals: BankPortalConfig[]) => {
    setPortals(newPortals);
    localStorage.setItem('dsa_bank_portals', JSON.stringify(newPortals));
  };

  const filteredPortals = portals.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      p.bankName.toLowerCase().includes(q) ||
      p.portalName.toLowerCase().includes(q) ||
      p.dsaCode.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q);

    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleLaunch = (portal: BankPortalConfig) => {
    // Audit log
    const updated = portals.map(p => p.id === portal.id ? { ...p, lastAccessed: new Date().toISOString().replace('T', ' ').slice(0, 16) } : p);
    savePortals(updated);
    addNotification('Bank Portal Launched', `Securely launched ${portal.bankName} (${portal.portalName}) portal in encrypted browser session.`, 'info');
    
    // Open in new tab
    window.open(portal.loginUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddPortal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName || !formData.loginUrl) {
      alert('Please fill in Bank Name and Portal URL');
      return;
    }

    const newPortal: BankPortalConfig = {
      id: `prt-${Date.now()}`,
      bankName: formData.bankName,
      portalName: formData.portalName || `${formData.bankName} Partner Portal`,
      loginUrl: formData.loginUrl,
      dsaCode: formData.dsaCode || `DSA-${formData.bankName.slice(0, 4).toUpperCase()}`,
      username: formData.username || 'DSA_ADMIN',
      encryptedPasswordMask: '••••••••••••',
      authMethod: formData.authMethod,
      status: 'Live & Active',
      category: formData.category,
      lastAccessed: 'Just now',
      notes: formData.notes
    };

    savePortals([newPortal, ...portals]);
    addNotification('Bank Portal Added', `${newPortal.bankName} secure login configuration saved to portal vault.`, 'success');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight">
                {language === 'hi' ? 'सुरक्षित बैंक यूआरएल लॉगिन पोर्टल एवं वॉल्ट' : 'Secure Bank URL Login Portal & Vault'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500 text-slate-950 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SSL Encrypted Vault</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'hi'
                ? 'सभी बैंकों (HDFC, ICICI, SBI, Axis, Bajaj) के आधिकारिक DSA व लोन लॉगिन पोर्टल का सीधा सुरक्षित एक्सेस। एक ही जगह से अपने चैनल कोड और लॉगिन आईडी से बैंक पोर्टल चलाएं।'
                : 'Direct secure launchers for partner bank DSA portals. Manage official login URLs, DSA agency codes, and login credentials with encrypted audit logging.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setFormData({
                  bankName: '',
                  portalName: '',
                  loginUrl: 'https://',
                  dsaCode: '',
                  username: '',
                  authMethod: 'Password + OTP',
                  category: 'Mortgages & Home Loan',
                  notes: ''
                });
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Bank Login URL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Status Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900">Protected Gateway Protocol Active</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-slate-500 text-[11px]">
              Credential masking enabled • 256-bit AES encryption simulation • Anti-phishing URL verification
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <span>{portals.length} Bank Partner Desks Configured</span>
        </div>
      </div>

      {/* Urban Money Partner Hub Integration Spotlight */}
      <div className="bg-gradient-to-r from-amber-500/10 via-white to-orange-500/10 rounded-2xl border-2 border-amber-400/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
              UM
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Urban Money Partner Portal (Square Yards) - Integrated
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                  National Aggregator
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {language === 'hi'
                  ? 'हाँ! अर्बन मनी (Square Yards) का पार्टनर पोर्टल आपके सॉफ्टवेयर में पूरी तरह इंटीग्रेटेड है। 90+ पार्टनर बैंकों और NBFCs में एक ही जगह से लोन फाइलें सबमिट करें, डिजिटल सैंक्शन ट्रैक करें और ऑटोमैटिक कमीशन पेआउट सिंक करें।'
                  : 'Yes! Urban Money Partner & Connector Portal is fully integrated into your system. Access 90+ partner lenders, check digital multi-bank loan eligibility, and monitor connector commission payouts directly.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href="https://partner.urbanmoney.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-102"
            >
              <span>Launch Urban Money Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Urban Money Partner Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/90 p-3 rounded-xl border border-amber-200/70 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Partner Access</span>
            <span className="font-bold text-slate-800">90+ Banks & NBFCs</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Connector Portal</span>
            <span className="font-mono font-bold text-amber-700">partner.urbanmoney.com</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Login Auth</span>
            <span className="font-semibold text-slate-800">Mobile OTP / Password</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Payout Sync Status</span>
            <span className="font-bold text-emerald-700 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active & Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bank name, portal, DSA code..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['all', 'Mortgages & Home Loan', 'Unsecured Loans', 'MSME & SME', 'Multi-Product'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Verticals' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bank Portal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPortals.map((portal) => (
          <div 
            key={portal.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
          >
            <div className="p-5 space-y-3.5">
              
              {/* Header: Bank & Security Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white tracking-wide">
                    {portal.bankName}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    {portal.portalName}
                  </h3>
                </div>

                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{portal.status}</span>
                </span>
              </div>

              {/* URL Preview */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Bank Portal URL</span>
                <div className="text-xs font-mono font-medium text-emerald-700 truncate">
                  {portal.loginUrl}
                </div>
              </div>

              {/* Credentials Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block">DSA Channel Code</span>
                  <div className="flex items-center justify-between font-mono font-bold text-slate-800 mt-0.5">
                    <span className="truncate">{portal.dsaCode}</span>
                    <button 
                      onClick={() => handleCopy(portal.dsaCode, `dsa-${portal.id}`)}
                      className="text-slate-400 hover:text-slate-700 ml-1"
                    >
                      {copiedId === `dsa-${portal.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block">Login Username</span>
                  <div className="flex items-center justify-between font-mono font-bold text-slate-800 mt-0.5">
                    <span className="truncate">{portal.username}</span>
                    <button 
                      onClick={() => handleCopy(portal.username, `usr-${portal.id}`)}
                      className="text-slate-400 hover:text-slate-700 ml-1"
                    >
                      {copiedId === `usr-${portal.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes / Advice */}
              {portal.notes && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                  "{portal.notes}"
                </p>
              )}

              {/* Last Access Meta */}
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Auth: {portal.authMethod}</span>
                <span>Last Access: {portal.lastAccessed || 'Never'}</span>
              </div>

            </div>

            {/* Launch Action Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleLaunch(portal)}
                className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 group-hover:bg-emerald-600"
              >
                <span>Launch {portal.bankName} Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Portal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                <span>Configure Partner Bank Portal</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddPortal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Partner Bank Name *</label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. IndusInd Bank / PNB"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Portal Name</label>
                <input
                  type="text"
                  value={formData.portalName}
                  onChange={(e) => setFormData({ ...formData, portalName: e.target.value })}
                  placeholder="e.g. IndusDirect Channel Portal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Login URL *</label>
                <input
                  type="url"
                  required
                  value={formData.loginUrl}
                  onChange={(e) => setFormData({ ...formData, loginUrl: e.target.value })}
                  placeholder="https://partner.bank.com/login"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DSA Agency Code</label>
                  <input
                    type="text"
                    value={formData.dsaCode}
                    onChange={(e) => setFormData({ ...formData, dsaCode: e.target.value })}
                    placeholder="e.g. DSA-9912"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. AGENT_USER"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Loan Vertical</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="Mortgages & Home Loan">Mortgages & Home Loan</option>
                  <option value="Unsecured Loans">Unsecured Loans (BL/PL)</option>
                  <option value="MSME & SME">MSME & SME</option>
                  <option value="Multi-Product">Multi-Product</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Security Notes / Login Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Mobile OTP required, submit files before 6 PM for same-day processing..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Save Bank Login URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

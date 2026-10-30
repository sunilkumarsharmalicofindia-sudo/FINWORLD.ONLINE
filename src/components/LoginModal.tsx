import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserAccount } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  UserCheck, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  LogOut
} from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

const PRECONFIGURED_USERS: UserAccount[] = [
  {
    id: 'usr-admin',
    name: 'Sunil Kumar Sharma (Proprietor)',
    email: 'admin@dsamitra.com',
    role: 'Administrator',
    avatar: 'SS',
    lastLogin: 'Today, 02:40 PM'
  },
  {
    id: 'usr-manager',
    name: 'Vikram Rajput (Accounts Manager)',
    email: 'manager@dsamitra.com',
    role: 'Manager',
    avatar: 'VR',
    lastLogin: 'Yesterday, 05:15 PM'
  },
  {
    id: 'usr-agent-1',
    name: 'Rameshwar Vyas (DSA-101)',
    email: 'dsa101@dsamitra.com',
    role: 'Agent',
    agentId: 'agt-1',
    avatar: 'RV',
    lastLogin: 'Today, 11:20 AM'
  },
  {
    id: 'usr-agent-2',
    name: 'Manoj Kulkarni (DSA-102)',
    email: 'dsa102@dsamitra.com',
    role: 'Agent',
    agentId: 'agt-2',
    avatar: 'MK',
    lastLogin: '24 Oct, 04:30 PM'
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { role, setRole, selectedAgentId, setSelectedAgentId, agents, addNotification } = useApp();

  const [emailInput, setEmailInput] = useState('admin@dsamitra.com');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Authenticate user
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const match = PRECONFIGURED_USERS.find(u => u.email.toLowerCase() === emailInput.toLowerCase().trim());
    if (!match) {
      setAuthError('User not recognized. Please use a registered email address.');
      return;
    }

    // Role assignment
    setRole(match.role);
    if (match.agentId) {
      setSelectedAgentId(match.agentId);
    }

    setAuthSuccess(`Secure session initiated as ${match.name} (${match.role})`);
    addNotification('User Authenticated', `Logged in with role: ${match.role}`, 'success');

    setTimeout(() => {
      onClose();
    }, 900);
  };

  // Quick Switcher
  const handleQuickLogin = (user: UserAccount) => {
    setEmailInput(user.email);
    setPasswordInput('pass123');
    setRole(user.role);
    if (user.agentId) {
      setSelectedAgentId(user.agentId);
    }
    setAuthSuccess(`Switched account to ${user.name} (${user.role})`);
    addNotification('Account Switched', `Active user changed to ${user.name} (${user.role})`, 'info');

    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Secure Multi-User Access Protocol</h3>
              <p className="text-[11px] text-slate-400">Role-Based Access Control (RBAC)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          
          {/* Active Role Status */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {role.slice(0, 1)}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Active Session</span>
                <span className="font-extrabold text-slate-900 text-sm">{role}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Authenticated
            </span>
          </div>

          {/* Quick Account Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                1-Click Quick Demo Login:
              </span>
              <span className="text-[10px] text-slate-400">Instant Switch</span>
            </div>

            <div className="space-y-2">
              {PRECONFIGURED_USERS.map((usr) => {
                const isActive = usr.role === role && (!usr.agentId || usr.agentId === selectedAgentId);
                return (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => handleQuickLogin(usr)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isActive 
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20' 
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                        usr.role === 'Administrator' ? 'bg-slate-900' : usr.role === 'Manager' ? 'bg-blue-600' : 'bg-indigo-600'
                      }`}>
                        {usr.avatar}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{usr.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{usr.email}</div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        usr.role === 'Administrator' 
                          ? 'bg-slate-100 text-slate-800' 
                          : usr.role === 'Manager' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {usr.role}
                      </span>
                      {isActive && <div className="text-[9px] font-bold text-emerald-600 mt-0.5">Active</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Credentials Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-3 border-t border-slate-200">
            <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider block">
              Or Authenticate with Email & Password:
            </span>

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Password / Security PIN</label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
              >
                Log In / Authenticate
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

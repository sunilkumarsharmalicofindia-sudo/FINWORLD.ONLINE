import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppNotification, NotificationSettings } from '../types';
import { formatINR } from '../utils/formatters';
import { 
  Bell, 
  Settings, 
  X, 
  CheckCheck, 
  Trash2, 
  Mail, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles,
  Send
} from 'lucide-react';

interface NotificationModalProps {
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ onClose }) => {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    clearNotifications,
    addNotification,
    t,
    language 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const [filterType, setFilterType] = useState<string>('all');
  const [emailSentToast, setEmailSentToast] = useState<string | null>(null);

  // Stored notification settings in localStorage
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('dsa_notif_settings');
    return saved ? JSON.parse(saved) : {
      largeTransactionThreshold: 50000,
      enableEmailAlerts: true,
      alertEmail: 'sunilkumarsharmalicofindia@gmail.com',
      notifyOnReconciliation: true,
      notifyOnNegativeBalance: true,
      notifyOnLargeTransaction: true
    };
  });

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dsa_notif_settings', JSON.stringify(newSettings));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'unread') return !n.read;
    if (filterType === 'large') return n.category === 'large_transaction';
    if (filterType === 'rec') return n.category === 'reconciliation_completed';
    return true;
  });

  // Test simulation for user
  const handleSimulateLargeTransaction = () => {
    const amt = settings.largeTransactionThreshold + 15000;
    const msg = `Large bank credit detected: ₹${amt.toLocaleString('en-IN')} received from HDFC Bank for #HDFC-HL-2026-081. (Threshold: ₹${settings.largeTransactionThreshold.toLocaleString('en-IN')})`;
    
    addNotification('High-Value Transaction Alert', msg, 'info');

    if (settings.enableEmailAlerts) {
      setEmailSentToast(`Email notification dispatched to ${settings.alertEmail}`);
      setTimeout(() => setEmailSentToast(null), 3500);
    }
  };

  const handleSimulateReconciliationAlert = () => {
    addNotification(
      'Monthly Reconciliation Completed',
      'Automated reconciliation executed for October 2026. 4 channel partners fully matched with zero discrepancies.',
      'success'
    );

    if (settings.enableEmailAlerts) {
      setEmailSentToast(`Reconciliation audit summary emailed to ${settings.alertEmail}`);
      setTimeout(() => setEmailSentToast(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Automated Notification System</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'alerts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alerts & Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Thresholds & Email Alerts</span>
            </button>
          </div>

          {activeTab === 'alerts' && notifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                Mark Read
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={clearNotifications}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Email Sent Toast */}
        {emailSentToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top">
            <span className="flex items-center space-x-1.5">
              <Mail className="w-4 h-4" />
              <span>{emailSentToast}</span>
            </span>
            <button onClick={() => setEmailSentToast(null)}>✕</button>
          </div>
        )}

        {/* Tab 1: Alerts List */}
        {activeTab === 'alerts' && (
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    !n.read 
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-xs' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        n.type === 'success' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : n.type === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-2 font-mono">
                          <span>{n.timestamp}</span>
                          {settings.enableEmailAlerts && (
                            <span className="text-emerald-600 font-semibold flex items-center space-x-0.5">
                              <Mail className="w-3 h-3" />
                              <span>Email Synced</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                {t.noNotifications}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Alert Settings & Thresholds */}
        {activeTab === 'settings' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            
            {/* Large Transaction Threshold */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-800">
                1. Large Transaction Alert Threshold (₹ INR)
              </label>
              <p className="text-slate-500 text-[11px]">
                Trigger automatic alerts whenever an incoming bank credit or outgoing agent payout exceeds this amount.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="font-bold text-slate-700">₹</span>
                <input
                  type="number"
                  step="5000"
                  value={settings.largeTransactionThreshold}
                  onChange={(e) => saveSettings({
                    ...settings,
                    largeTransactionThreshold: parseFloat(e.target.value) || 0
                  })}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 w-44"
                />
                <span className="text-[11px] text-slate-400">Default: ₹50,000</span>
              </div>
            </div>

            {/* Email Dispatch Settings */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-bold text-slate-800">2. Dispatch Alerts via Email</span>
                  <span className="text-[11px] text-slate-500">Send instant notification copy to designated email</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) => saveSettings({
                    ...settings,
                    enableEmailAlerts: e.target.checked
                  })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              {settings.enableEmailAlerts && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Alert Destination Email:
                  </label>
                  <input
                    type="email"
                    value={settings.alertEmail}
                    onChange={(e) => saveSettings({
                      ...settings,
                      alertEmail: e.target.value
                    })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Event Checkboxes */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="block font-bold text-slate-800">3. Active Notification Triggers</span>
              <div className="space-y-2 pt-1">
                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnLargeTransaction}
                    onChange={(e) => saveSettings({ ...settings, notifyOnLargeTransaction: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Large incoming or outgoing transaction</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnReconciliation}
                    onChange={(e) => saveSettings({ ...settings, notifyOnReconciliation: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Completion of monthly bank reconciliation</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnNegativeBalance}
                    onChange={(e) => saveSettings({ ...settings, notifyOnNegativeBalance: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Negative account balance or overdue agent payout</span>
                </label>
              </div>
            </div>

            {/* Live Test Simulation Buttons */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <span className="block font-bold text-emerald-950">Test System Notification Triggers:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSimulateLargeTransaction}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Simulate Large Transaction Alert</span>
                </button>
                <button
                  type="button"
                  onClick={handleSimulateReconciliationAlert}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] shadow-sm"
                >
                  Simulate Reconciliation Complete
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};

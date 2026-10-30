import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Laptop, 
  Apple, 
  Download, 
  CheckCircle2, 
  X, 
  Globe, 
  HardDrive, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface OfflineGuideModalProps {
  onClose: () => void;
}

export const OfflineGuideModal: React.FC<OfflineGuideModalProps> = ({ onClose }) => {
  const { language } = useApp();
  const [deviceTab, setDeviceTab] = useState<'android' | 'ios' | 'pc'>('android');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Capture PWA native install prompt if available
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setInstalledSuccess(true);
      setInstallPromptEvent(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {language === 'hi' ? 'ऑफलाइन कैसे चलाएं (PWA Setup Guide)' : 'Run Offline - PWA Setup Guide'}
              </h3>
              <p className="text-xs text-teal-200/80">
                {language === 'hi' 
                  ? 'बिना इंटरनेट के मोबाइल व लैपटॉप पर एक असली ऐप की तरह चलाएं' 
                  : 'Install and use without internet on Android, iPhone, and PC'}
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

        <div className="p-6 space-y-5">
          
          {/* Status Bar Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  {language === 'hi' 
                    ? (isOnline ? 'वर्तमान स्थिति: ऑनलाइन कनेक्टेड' : 'वर्तमान स्थिति: ऑफलाइन मोड चालू!')
                    : (isOnline ? 'Current Status: Online' : 'Current Status: Offline Mode Active!')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {language === 'hi' 
                    ? 'सर्विस वर्कर और लोकल स्टोरेज सक्रिय हैं। डेटा कभी नहीं रुकेगा।'
                    : 'Service Worker and LocalStorage caching are active.'}
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isOnline ? 'Ready' : 'Offline OK'}
            </span>
          </div>

          {/* 1-Click Native Install Button (if browser triggered beforeinstallprompt) */}
          {installPromptEvent && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black">
                  {language === 'hi' ? 'सीधे 1-क्लिक में इंस्टॉल करें' : '1-Click Direct Install Available'}
                </h4>
                <p className="text-xs text-emerald-100">
                  {language === 'hi' ? 'फोन या पीसी की होम स्क्रीन पर जोड़ें' : 'Add DSA Mitra to your home screen or desktop'}
                </p>
              </div>
              <button
                onClick={handleNativeInstall}
                className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-black text-xs hover:bg-emerald-50 shadow-md transition-all active:scale-95"
              >
                {language === 'hi' ? 'इंस्टॉल करें' : 'Install Now'}
              </button>
            </div>
          )}

          {installedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'hi' ? 'ऐप सफलतापूर्वक इंस्टॉल हो चुकी है!' : 'App installed successfully on your device!'}
              </span>
            </div>
          )}

          {/* Device Tabs */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-2">
              {language === 'hi' ? 'अपना डिवाइस चुनें (Choose Device Instructions):' : 'Choose Your Device:'}
            </label>
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 border border-slate-200">
              
              <button
                type="button"
                onClick={() => setDeviceTab('android')}
                className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  deviceTab === 'android' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceTab('ios')}
                className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  deviceTab === 'ios' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceTab('pc')}
                className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  deviceTab === 'pc' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Laptop / PC</span>
              </button>

            </div>
          </div>

          {/* Tab Content: Steps */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            
            {deviceTab === 'android' && (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">Chrome ब्राउज़र में लिंक खोलें</strong>
                    <span>अपने फोन के Google Chrome में यह ऐप खोलें।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">3 डॉट्स मेनू (⋮) दबाएं</strong>
                    <span>ऊपर दाएं कोने में दिए गए तीन डॉट्स (Menu) पर क्लिक करें।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">"Install app" या "Add to Home screen" दबाएं</strong>
                    <span>स्क्रीन पर "होम स्क्रीन पर जोड़ें" या "ऐप इंस्टॉल करें" चुनें।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">अब बिना इंटरनेट चलाएं!</strong>
                    <span>आपके मोबाइल पर इसका आइकॉन बन जाएगा। अब इंटरनेट बंद होने पर भी आप इसे क्लिक करके तुरंत खोल सकते हैं।</span>
                  </div>
                </div>
              </div>
            )}

            {deviceTab === 'ios' && (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">Safari ब्राउज़र में खोलें</strong>
                    <span>iPhone में Safari ब्राउज़र का उपयोग करके लिंक खोलें।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">Share (शेयर) बटन दबाएं</strong>
                    <span>नीचे बार में बीच वाला शेयर आइकन (तीर वाला बॉक्स ⎋) दबाएं।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">"Add to Home Screen" चुनें</strong>
                    <span>नीचे स्क्रॉल करके "+" Add to Home Screen (होम स्क्रीन पर जोड़ें) चुनें।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">"Add" पर क्लिक करें</strong>
                    <span>अब आपके iPhone की होम स्क्रीन पर DSA Mitra का ऐप आइकॉन बन जाएगा। बिना इंटरनेट के भी यह हमेशा खुलेगा!</span>
                  </div>
                </div>
              </div>
            )}

            {deviceTab === 'pc' && (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">Chrome या Edge ब्राउज़र में खोलें</strong>
                    <span>अपने कंप्यूटर या लैपटॉप में Chrome या Microsoft Edge खोलें।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">Address Bar में Install आइकन (⊕) दबाएं</strong>
                    <span>URL बार के बिल्कुल दाईं ओर एक छोटा "Install" या कंप्यूटर जैसा आइकन दिखेगा, उस पर क्लिक करें।</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <strong className="text-slate-900 font-bold block">"Install" पर क्लिक करें</strong>
                    <span>यह सॉफ्टवेयर आपके लैपटॉप में एक स्वतंत्र डेस्कटॉप सॉफ्टवेयर की तरह पिन हो जाएगा और बिना वाई-फाई के भी सुपरफास्ट काम करेगा!</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Data Guarantee Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <strong className="font-bold">
                {language === 'hi' ? 'ऑफलाइन काम करते समय डेटा सुरक्षा:' : 'Offline Data Safety Guarantee:'}
              </strong>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {language === 'hi'
                ? 'ऑफलाइन रहते हुए आप जो भी नई लोन फाइलें, भुगतान या हिसाब दर्ज करेंगे, वह तुरंत आपके फोन के LocalStorage में सुरक्षित हो जाएगा। इंटरनेट आने पर कुछ भी खोएगा नहीं।'
                : 'All entries and edits made offline are instantly preserved in your device LocalStorage with zero data loss.'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            {language === 'hi' ? 'समझ गया (Close)' : 'Got it, Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

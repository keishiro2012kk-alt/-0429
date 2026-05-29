import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

    setIsStandalone(isPWA);

    if (isIosDevice && !isPWA) {
      setIsIOS(true);
      // Automatically show for iOS to notify them about Safari share menu
      const hasDismissed = localStorage.getItem('lingoai_dismiss_install');
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      const hasDismissed = localStorage.getItem('lingoai_dismiss_install');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const closePrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('lingoai_dismiss_install', 'true');
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 pointer-events-auto"
        >
          <div className="glass-panel p-4 flex items-center justify-between border-cyan-500/30 bg-[#0A0F1F]/90 shadow-[0_10px_40px_-5px_rgba(34,211,238,0.2)] pt-5 relative">
            <button onClick={closePrompt} className="text-slate-500 hover:text-white p-1.5 absolute top-1 right-1 z-10 transition-colors">
               <X className="w-4 h-4" />
            </button>
            <div className="flex-1 pr-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-cyan-400" />
                アプリ版をインストール
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isIOS 
                  ? "Safariの下部メニュー「共有」から「ホーム画面に追加」を選択するとアプリとしてご利用いただけます。"
                  : "ホーム画面に追加して、全画面でいつでも学習にアクセスできるようにしましょう。"}
              </p>
            </div>
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0A0F1F] px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-[0_0_15px_rgba(34,211,238,0.4)] ml-2"
              >
                追加する
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

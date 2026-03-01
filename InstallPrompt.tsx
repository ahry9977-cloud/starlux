import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // التحقق من iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // التحقق من وضع التطبيق المستقل
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // التحقق من إخفاء الرسالة سابقاً
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // استماع لحدث beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // عرض الرسالة بعد 3 ثواني إذا لم يتم إخفاؤها خلال 7 أيام
      if (daysSinceDismissed > 7 || !dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // عرض رسالة iOS إذا لم يكن التطبيق مثبتاً
    if (isIOSDevice && !isInStandaloneMode && (daysSinceDismissed > 7 || !dismissed)) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  // لا تعرض شيئاً إذا كان التطبيق مثبتاً بالفعل
  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-2 left-2 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg mb-1">
              ثبّت STAR LUX
            </h3>
            <p className="text-slate-400 text-sm mb-3">
              {isIOS 
                ? 'اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"'
                : 'احصل على تجربة أفضل مع التطبيق على جهازك'}
            </p>

            {!isIOS && deferredPrompt && (
              <Button
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
              >
                <Download className="w-4 h-4 ml-2" />
                تثبيت التطبيق
              </Button>
            )}

            {isIOS && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                </svg>
                <span>اضغط على أيقونة المشاركة أدناه</span>
              </div>
            )}
          </div>
        </div>

        {/* مؤشر التقدم */}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
          </div>
          <span>سريع وآمن</span>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;

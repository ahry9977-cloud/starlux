import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    canInstall: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // التحقق من وضع التطبيق المستقل
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setStatus(prev => ({ ...prev, isInstalled: isStandalone }));

    // استماع لحدث beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus(prev => ({ ...prev, canInstall: true }));
    };

    // استماع لحالة الاتصال
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    // استماع لتثبيت التطبيق
    const handleAppInstalled = () => {
      setStatus(prev => ({ ...prev, isInstalled: true, canInstall: false }));
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleAppInstalled);

    // تسجيل Service Worker والتحقق من التحديثات
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // التحقق من التحديثات
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setStatus(prev => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // تثبيت التطبيق
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setStatus(prev => ({ ...prev, canInstall: false }));
    
    return outcome === 'accepted';
  }, [deferredPrompt]);

  // تحديث التطبيق
  const update = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // طلب إذن الإشعارات
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    
    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  // إرسال إشعار محلي
  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    if (registration) {
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      } as NotificationOptions);
      return true;
    }

    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      ...options,
    });
    return true;
  }, [registration]);

  // مسح الكاش
  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      return true;
    }
    return false;
  }, []);

  return {
    ...status,
    install,
    update,
    requestNotificationPermission,
    sendNotification,
    clearCache,
  };
}

export default usePWA;

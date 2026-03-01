import { useCallback, useRef } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook آمن للتنقل بين الصفحات
 * يمنع race conditions و removeChild errors
 * 
 * الاستخدام:
 * const safeNavigate = useSafeNavigate();
 * safeNavigate('/dashboard', 300);
 */
export const useSafeNavigate = () => {
  const [, navigate] = useLocation();
  const navigationPendingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (path: string, delay = 300) => {
      // منع التنقل المزدوج
      if (navigationPendingRef.current) {
        console.warn('Navigation already in progress, ignoring duplicate request');
        return;
      }

      navigationPendingRef.current = true;

      // استخدام requestAnimationFrame لضمان اكتمال render cycle
      const rafId = requestAnimationFrame(() => {
        // تأخير إضافي لضمان اكتمال جميع التحديثات
        timeoutRef.current = setTimeout(() => {
          try {
            navigate(path);
          } catch (error) {
            console.error('Navigation error:', error);
          } finally {
            navigationPendingRef.current = false;
          }
        }, delay);
      });

      // cleanup function
      return () => {
        cancelAnimationFrame(rafId);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        navigationPendingRef.current = false;
      };
    },
    [navigate]
  );
};

export default useSafeNavigate;

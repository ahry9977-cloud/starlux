/**
 * Admin Redirect Component
 * يضمن توجيه الأدمن فوراً إلى لوحة التحكم عند الدخول
 * ومنع أي إعادة توجيه خاطئة
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AdminRedirectProps {
  children: React.ReactNode;
}

export default function AdminRedirect({ children }: AdminRedirectProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    // انتظار انتهاء التحميل
    if (loading) return;

    // إذا كان المستخدم أدمن وليس في لوحة التحكم
    if (isAuthenticated && user && (user.role === 'admin' || user.role === 'sub_admin')) {
      // إذا كان في الصفحة الرئيسية أو أي صفحة أخرى غير لوحة التحكم
      if (!location.startsWith('/admin')) {
        console.log('[AdminRedirect] Redirecting admin to dashboard from:', location);
        navigate('/admin-dashboard');
      }
    }
  }, [user, loading, isAuthenticated, location, navigate]);

  // عرض Loading أثناء التحقق
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

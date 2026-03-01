/**
 * Protected Route Component - نظام حماية المسارات الشامل
 * يضمن:
 * 1. التحقق من تسجيل الدخول
 * 2. التحقق من الصلاحيات
 * 3. التوجيه الصحيح حسب الدور
 * 4. عرض رسائل واضحة للمستخدم
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UserRole = 'user' | 'seller' | 'admin' | 'sub_admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  showAccessDenied?: boolean;
}

// مكون التحميل
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-white/70 text-lg">جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  );
}

// مكون رفض الوصول
function AccessDenied({ 
  message, 
  onGoHome, 
  onLogin 
}: { 
  message: string; 
  onGoHome: () => void; 
  onLogin: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">وصول مرفوض</h1>
        <p className="text-white/70 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={onGoHome}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            الصفحة الرئيسية
          </Button>
          <Button 
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    </div>
  );
}

// مكون تسجيل الدخول مطلوب
function LoginRequired({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">تسجيل الدخول مطلوب</h1>
        <p className="text-white/70 mb-6">يجب عليك تسجيل الدخول للوصول إلى هذه الصفحة</p>
        <Button 
          onClick={onLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
        >
          تسجيل الدخول
        </Button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [accessState, setAccessState] = useState<'loading' | 'granted' | 'denied' | 'login_required'>('loading');

  useEffect(() => {
    // انتظار انتهاء التحميل
    if (loading) {
      setAccessState('loading');
      return;
    }

    // التحقق من تسجيل الدخول
    if (!isAuthenticated || !user) {
      console.log('[ProtectedRoute] User not authenticated');
      setAccessState('login_required');
      return;
    }

    // التحقق من الصلاحيات إذا تم تحديدها
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.role as UserRole;
      if (!allowedRoles.includes(userRole)) {
        console.log('[ProtectedRoute] Access denied for role:', userRole, 'Allowed:', allowedRoles);
        setAccessState('denied');
        return;
      }
    }

    // الوصول مسموح
    console.log('[ProtectedRoute] Access granted for:', user.email, 'Role:', user.role);
    setAccessState('granted');
  }, [user, loading, isAuthenticated, allowedRoles]);

  // حالة التحميل
  if (accessState === 'loading') {
    return <LoadingScreen />;
  }

  // حالة تسجيل الدخول مطلوب
  if (accessState === 'login_required') {
    if (redirectTo) {
      // التوجيه التلقائي
      window.location.href = redirectTo;
      return <LoadingScreen />;
    }
    return <LoginRequired onLogin={() => navigate('/auth')} />;
  }

  // حالة رفض الوصول
  if (accessState === 'denied') {
    // إذا كان الأدمن يحاول الوصول لصفحة غير مسموحة، وجهه للوحة التحكم
    if (user && (user.role === 'admin' || user.role === 'sub_admin')) {
      console.log('[ProtectedRoute] Admin trying to access unauthorized page, redirecting to dashboard');
      navigate('/admin-dashboard');
      return <LoadingScreen />;
    }
    
    if (!showAccessDenied) {
      // التوجيه للصفحة الرئيسية بدون عرض رسالة
      navigate('/');
      return <LoadingScreen />;
    }
    return (
      <AccessDenied 
        message="ليس لديك صلاحية للوصول إلى هذه الصفحة"
        onGoHome={() => navigate('/')}
        onLogin={() => navigate('/auth')}
      />
    );
  }

  // الوصول مسموح - عرض المحتوى
  return <>{children}</>;
}

// مكونات مساعدة للاستخدام السريع
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'sub_admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function SellerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['seller', 'admin', 'sub_admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['user', 'seller', 'admin', 'sub_admin']}>
      {children}
    </ProtectedRoute>
  );
}

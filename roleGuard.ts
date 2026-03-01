/**
 * Role Guard System - نظام حماية الأدوار
 * يمنع أي محاولة للتلاعب بالأدوار أو الوصول غير المصرح
 */

import { TRPCError } from '@trpc/server';

// الأدوار المتاحة في النظام
export type UserRole = 'user' | 'seller' | 'admin' | 'sub_admin';

// صلاحيات كل دور
export const ROLE_PERMISSIONS = {
  user: ['view_products', 'add_to_cart', 'checkout', 'view_orders', 'update_profile'],
  seller: ['view_products', 'add_to_cart', 'checkout', 'view_orders', 'update_profile', 
           'manage_store', 'manage_products', 'view_seller_orders', 'view_seller_stats'],
  sub_admin: ['view_products', 'add_to_cart', 'checkout', 'view_orders', 'update_profile',
              'manage_store', 'manage_products', 'view_seller_orders', 'view_seller_stats',
              'view_admin_stats', 'manage_users', 'manage_stores'],
  admin: ['*'], // كل الصلاحيات
} as const;

// التحقق من صلاحية معينة
export function hasPermission(role: UserRole, permission: string): boolean {
  if (role === 'admin') return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission as any);
}

// التحقق من أن المستخدم لديه دور معين أو أعلى
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: UserRole[] = ['user', 'seller', 'sub_admin', 'admin'];
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
}

// التحقق من صحة الدور
export function isValidRole(role: string): role is UserRole {
  return ['user', 'seller', 'admin', 'sub_admin'].includes(role);
}

// رسائل الخطأ
export const ROLE_ERROR_MESSAGES = {
  UNAUTHORIZED: 'غير مصرح بالوصول',
  FORBIDDEN: 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
  INVALID_ROLE: 'دور غير صالح',
  ROLE_MISMATCH: 'الدور لا يتطابق مع المطلوب',
  SESSION_EXPIRED: 'انتهت صلاحية الجلسة',
  ACCOUNT_BLOCKED: 'الحساب محظور',
  STORE_NOT_ACTIVE: 'المتجر غير نشط',
  PAYMENT_REQUIRED: 'يجب إكمال الدفع أولاً',
} as const;

// إنشاء خطأ TRPC مع رسالة مناسبة
export function createRoleError(type: keyof typeof ROLE_ERROR_MESSAGES): TRPCError {
  return new TRPCError({
    code: type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN',
    message: ROLE_ERROR_MESSAGES[type],
  });
}

// التحقق من الجلسة
export interface SessionValidation {
  isValid: boolean;
  error?: string;
  user?: {
    id: number;
    email: string;
    role: UserRole;
    isBlocked: boolean;
  };
}

// تسجيل محاولات الوصول غير المصرح
export interface AccessLog {
  userId?: number;
  ip?: string;
  action: string;
  resource: string;
  allowed: boolean;
  timestamp: Date;
  reason?: string;
}

// سجل محاولات الوصول (في الذاكرة - يمكن نقله لقاعدة البيانات لاحقاً)
const accessLogs: AccessLog[] = [];

export function logAccess(log: AccessLog): void {
  accessLogs.push(log);
  // الاحتفاظ بآخر 1000 سجل فقط
  if (accessLogs.length > 1000) {
    accessLogs.shift();
  }
  
  // طباعة محاولات الوصول المرفوضة للمراقبة
  if (!log.allowed) {
    console.warn(`[SECURITY] Access denied: ${JSON.stringify(log)}`);
  }
}

export function getRecentAccessLogs(limit = 100): AccessLog[] {
  return accessLogs.slice(-limit);
}

// التحقق من محاولات الوصول المشبوهة
export function detectSuspiciousActivity(userId: number): boolean {
  const recentLogs = accessLogs.filter(
    log => log.userId === userId && 
    !log.allowed && 
    log.timestamp > new Date(Date.now() - 60000) // آخر دقيقة
  );
  
  // إذا كان هناك أكثر من 5 محاولات فاشلة في الدقيقة
  return recentLogs.length > 5;
}

// Middleware للتحقق من الدور
export function createRoleMiddleware(requiredRole: UserRole) {
  return (ctx: { user?: { role: UserRole; id: number; isBlocked: boolean } }) => {
    if (!ctx.user) {
      logAccess({
        action: 'access',
        resource: requiredRole,
        allowed: false,
        timestamp: new Date(),
        reason: 'No user in context',
      });
      throw createRoleError('UNAUTHORIZED');
    }

    if (ctx.user.isBlocked) {
      logAccess({
        userId: ctx.user.id,
        action: 'access',
        resource: requiredRole,
        allowed: false,
        timestamp: new Date(),
        reason: 'Account blocked',
      });
      throw createRoleError('ACCOUNT_BLOCKED');
    }

    if (!hasRole(ctx.user.role, requiredRole)) {
      logAccess({
        userId: ctx.user.id,
        action: 'access',
        resource: requiredRole,
        allowed: false,
        timestamp: new Date(),
        reason: `Role ${ctx.user.role} cannot access ${requiredRole} resources`,
      });
      throw createRoleError('FORBIDDEN');
    }

    // تسجيل الوصول الناجح
    logAccess({
      userId: ctx.user.id,
      action: 'access',
      resource: requiredRole,
      allowed: true,
      timestamp: new Date(),
    });

    return true;
  };
}

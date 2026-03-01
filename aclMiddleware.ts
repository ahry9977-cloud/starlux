/**
 * Middleware للتحقق من الصلاحيات (Access Control List)
 * ACL Middleware for Permission Checking
 */

import { TRPCError } from '@trpc/server';
import * as roleDb from '../roleDb';

/**
 * التحقق من امتلاك المستخدم صلاحية محددة
 */
export async function checkPermission(userId: number, permissionName: string): Promise<boolean> {
  try {
    return await roleDb.hasPermission(userId, permissionName);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * التحقق من امتلاك المستخدم جميع الصلاحيات
 */
export async function checkAllPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
  try {
    return await roleDb.hasAllPermissions(userId, permissionNames);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * التحقق من امتلاك المستخدم أي من الصلاحيات
 */
export async function checkAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
  try {
    return await roleDb.hasAnyPermission(userId, permissionNames);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Middleware للتحقق من صلاحية واحدة
 */
export function requirePermission(permissionName: string) {
  return async (userId: number) => {
    const hasPermission = await checkPermission(userId, permissionName);
    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permissionName}`,
      });
    }
  };
}

/**
 * Middleware للتحقق من جميع الصلاحيات
 */
export function requireAllPermissions(permissionNames: string[]) {
  return async (userId: number) => {
    const hasPermissions = await checkAllPermissions(userId, permissionNames);
    if (!hasPermissions) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing required permissions: ${permissionNames.join(', ')}`,
      });
    }
  };
}

/**
 * Middleware للتحقق من أي من الصلاحيات
 */
export function requireAnyPermission(permissionNames: string[]) {
  return async (userId: number) => {
    const hasPermission = await checkAnyPermission(userId, permissionNames);
    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing at least one of required permissions: ${permissionNames.join(', ')}`,
      });
    }
  };
}

/**
 * Procedure middleware لتطبيق الصلاحيات
 */
export function withPermission(permissionName: string) {
  return async (userId: number) => {
    const hasPermission = await checkPermission(userId, permissionName);
    return hasPermission;
  };
}

/**
 * Procedure middleware لتطبيق عدة صلاحيات
 */
export function withPermissions(permissionNames: string[], requireAll: boolean = false) {
  return async (userId: number) => {
    if (requireAll) {
      return await checkAllPermissions(userId, permissionNames);
    } else {
      return await checkAnyPermission(userId, permissionNames);
    }
  };
}

/**
 * تسجيل محاولة وصول مرفوضة
 */
export async function logAccessDenied(
  userId: number,
  permissionName: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await roleDb.logRoleAudit({
      action: 'access_denied',
      entityType: 'permission',
      entityId: 0,
      notes: `Access denied for permission: ${permissionName}`,
      changedBy: userId,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Error logging access denied:', error);
  }
}

/**
 * تسجيل محاولة وصول ناجحة
 */
export async function logAccessGranted(
  userId: number,
  permissionName: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await roleDb.logRoleAudit({
      action: 'access_granted',
      entityType: 'permission',
      entityId: 0,
      notes: `Access granted for permission: ${permissionName}`,
      changedBy: userId,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Error logging access granted:', error);
  }
}

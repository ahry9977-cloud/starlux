/**
 * دوال قاعدة البيانات للأدوار والصلاحيات
 * Role & Permission Database Functions
 */

import { getDb } from './db';
import { 
  roles, 
  permissions, 
  rolePermissions, 
  userRoles, 
  userPermissions,
  roleAuditLogs,
  type Role,
  type Permission,
  type RolePermission,
  type UserRole,
  type UserPermission,
  type InsertRole,
  type InsertPermission,
  type InsertRolePermission,
  type InsertUserRole,
  type InsertUserPermission,
  type InsertRoleAuditLog,
} from './drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';

// ============= دوال الأدوار (Roles) =============

/**
 * جلب جميع الأدوار
 */
export async function getAllRoles(): Promise<Role[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.select().from(roles).where(eq(roles.isActive, true));
}

/**
 * جلب دور محدد
 */
export async function getRoleById(roleId: number): Promise<Role | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.select().from(roles).where(eq(roles.id, roleId));
  return result[0] || null;
}

/**
 * جلب دور بالاسم
 */
export async function getRoleByName(name: string): Promise<Role | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.select().from(roles).where(eq(roles.name, name));
  return result[0] || null;
}

/**
 * إنشاء دور جديد
 */
export async function createRole(data: InsertRole): Promise<Role> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(roles).values(data);
  const roleId = (result as any).insertId || result[0];
  
  const newRole = await getRoleById(roleId);
  if (!newRole) throw new Error('Failed to create role');
  
  return newRole;
}

/**
 * تحديث دور
 */
export async function updateRole(roleId: number, data: Partial<InsertRole>): Promise<Role> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(roles).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(roles.id, roleId));
  
  const updatedRole = await getRoleById(roleId);
  if (!updatedRole) throw new Error('Failed to update role');
  
  return updatedRole;
}

/**
 * حذف دور (تعطيل فقط)
 */
export async function deleteRole(roleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const role = await getRoleById(roleId);
  if (!role) throw new Error('Role not found');
  
  if (role.isSystem) {
    throw new Error('Cannot delete system roles');
  }
  
  await db.update(roles).set({
    isActive: false,
    updatedAt: new Date(),
  }).where(eq(roles.id, roleId));
}

// ============= دوال الصلاحيات (Permissions) =============

/**
 * جلب جميع الصلاحيات
 */
export async function getAllPermissions(): Promise<Permission[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.select().from(permissions);
}

/**
 * جلب صلاحيات حسب الفئة
 */
export async function getPermissionsByCategory(category: string): Promise<Permission[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.select().from(permissions).where(
    eq(permissions.category, category)
  );
}

/**
 * جلب صلاحية محددة
 */
export async function getPermissionById(permissionId: number): Promise<Permission | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.select().from(permissions).where(eq(permissions.id, permissionId));
  return result[0] || null;
}

/**
 * إنشاء صلاحية جديدة
 */
export async function createPermission(data: InsertPermission): Promise<Permission> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(permissions).values(data);
  const permissionId = (result as any).insertId || result[0];
  
  const newPermission = await getPermissionById(permissionId);
  if (!newPermission) throw new Error('Failed to create permission');
  
  return newPermission;
}

// ============= دوال ربط الأدوار بالصلاحيات (Role-Permission Mapping) =============

/**
 * جلب صلاحيات دور محدد
 */
export async function getRolePermissions(roleId: number): Promise<Permission[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select({ permission: permissions })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.granted, true)
      )
    );
  
  return result.map((r: any) => r.permission);
}

/**
 * إضافة صلاحية لدور
 */
export async function addPermissionToRole(
  roleId: number,
  permissionId: number,
  grantedBy?: number,
  notes?: string
): Promise<RolePermission> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(rolePermissions).values({
    roleId,
    permissionId,
    granted: true,
    grantedBy,
    notes,
  });
  
  const result = await db
    .select()
    .from(rolePermissions)
    .where(
      and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      )
    );
  
  return result[0];
}

/**
 * إزالة صلاحية من دور
 */
export async function removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(rolePermissions).where(
    and(
      eq(rolePermissions.roleId, roleId),
      eq(rolePermissions.permissionId, permissionId)
    )
  );
}

// ============= دوال ربط المستخدمين بالأدوار (User-Role Mapping) =============

/**
 * جلب أدوار المستخدم
 */
export async function getUserRoles(userId: number): Promise<Role[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select({ role: roles })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
  
  return result.map((r: any) => r.role);
}

/**
 * جلب الدور الأساسي للمستخدم
 */
export async function getUserPrimaryRole(userId: number): Promise<Role | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select({ role: roles })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.isPrimary, true)
      )
    );
  
  return result[0]?.role || null;
}

/**
 * تعيين دور للمستخدم
 */
export async function assignRoleToUser(
  userId: number,
  roleId: number,
  isPrimary: boolean = false,
  assignedBy?: number,
  expiresAt?: Date,
  notes?: string
): Promise<UserRole> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // إذا كان الدور الأساسي، أزل الدور الأساسي السابق
  if (isPrimary) {
    await db.update(userRoles).set({ isPrimary: false }).where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.isPrimary, true)
      )
    );
  }
  
  await db.insert(userRoles).values({
    userId,
    roleId,
    isPrimary,
    assignedBy,
    expiresAt,
    notes,
  });
  
  const result = await db
    .select()
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      )
    );
  
  return result[0];
}

/**
 * إزالة دور من المستخدم
 */
export async function removeRoleFromUser(userId: number, roleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(userRoles).where(
    and(
      eq(userRoles.userId, userId),
      eq(userRoles.roleId, roleId)
    )
  );
}

// ============= دوال الصلاحيات المخصصة للمستخدم (User-Specific Permissions) =============

/**
 * جلب الصلاحيات المخصصة للمستخدم
 */
export async function getUserSpecificPermissions(userId: number): Promise<Permission[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db
    .select({ permission: permissions })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.granted, true)
      )
    );
  
  return result.map((r: any) => r.permission);
}

/**
 * إضافة صلاحية مخصصة للمستخدم
 */
export async function addPermissionToUser(
  userId: number,
  permissionId: number,
  grantedBy?: number,
  expiresAt?: Date,
  reason?: string
): Promise<UserPermission> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(userPermissions).values({
    userId,
    permissionId,
    granted: true,
    grantedBy,
    expiresAt,
    reason,
  });
  
  const result = await db
    .select()
    .from(userPermissions)
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permissionId, permissionId)
      )
    );
  
  return result[0];
}

/**
 * إزالة صلاحية مخصصة من المستخدم
 */
export async function removePermissionFromUser(userId: number, permissionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(userPermissions).where(
    and(
      eq(userPermissions.userId, userId),
      eq(userPermissions.permissionId, permissionId)
    )
  );
}

// ============= دوال التحقق من الصلاحيات =============

/**
 * التحقق من امتلاك المستخدم صلاحية محددة
 */
export async function hasPermission(userId: number, permissionName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // جلب صلاحيات المستخدم من خلال أدواره
  const rolePerms = await db
    .select({ permissionName: permissions.name })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(rolePermissions.granted, true)
      )
    );
  
  // جلب الصلاحيات المخصصة للمستخدم
  const userPerms = await db
    .select({ permissionName: permissions.name })
    .from(userPermissions)
    .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.granted, true)
      )
    );
  
  const allPermissions = [...rolePerms, ...userPerms].map(p => p.permissionName);
  return allPermissions.includes(permissionName);
}

/**
 * التحقق من امتلاك المستخدم صلاحيات متعددة
 */
export async function hasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  for (const permName of permissionNames) {
    const has = await hasPermission(userId, permName);
    if (!has) return false;
  }
  
  return true;
}

/**
 * التحقق من امتلاك المستخدم أي من الصلاحيات
 */
export async function hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  for (const permName of permissionNames) {
    const has = await hasPermission(userId, permName);
    if (has) return true;
  }
  
  return false;
}

// ============= دوال سجل التدقيق =============

/**
 * تسجيل تغيير في الأدوار أو الصلاحيات
 */
export async function logRoleAudit(data: InsertRoleAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(roleAuditLogs).values(data);
}

/**
 * جلب سجل التدقيق
 */
export async function getRoleAuditLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return db.select().from(roleAuditLogs).limit(limit).offset(offset);
}

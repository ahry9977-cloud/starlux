/**
 * tRPC Router للأدوار والصلاحيات
 * Role & Permission Management APIs
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import * as roleDb from './roleDb';

// ============= Validation Schemas =============

const CreateRoleSchema = z.object({
  name: z.string().min(3).max(100),
  displayName: z.string().min(3).max(150),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  priority: z.number().int().default(0),
});

const UpdateRoleSchema = z.object({
  displayName: z.string().min(3).max(150).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const CreatePermissionSchema = z.object({
  name: z.string().min(3).max(100),
  displayName: z.string().min(3).max(150),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  requiresApproval: z.boolean().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const AssignRoleSchema = z.object({
  userId: z.number().int(),
  roleId: z.number().int(),
  isPrimary: z.boolean().optional(),
  expiresAt: z.date().optional(),
  notes: z.string().optional(),
});

const AssignPermissionSchema = z.object({
  roleId: z.number().int(),
  permissionId: z.number().int(),
  notes: z.string().optional(),
});

// ============= Admin Procedure =============

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'sub_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// ============= Role Router =============

export const roleRouter = router({
  // ===== جلب الأدوار =====
  
  /**
   * جلب جميع الأدوار
   */
  getAllRoles: publicProcedure.query(async () => {
    try {
      return await roleDb.getAllRoles();
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch roles',
      });
    }
  }),

  /**
   * جلب دور محدد
   */
  getRoleById: publicProcedure
    .input(z.object({ roleId: z.number().int() }))
    .query(async ({ input }) => {
      try {
        const role = await roleDb.getRoleById(input.roleId);
        if (!role) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Role not found',
          });
        }
        return role;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch role',
        });
      }
    }),

  /**
   * جلب صلاحيات دور محدد
   */
  getRolePermissions: publicProcedure
    .input(z.object({ roleId: z.number().int() }))
    .query(async ({ input }) => {
      try {
        return await roleDb.getRolePermissions(input.roleId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch role permissions',
        });
      }
    }),

  // ===== إنشاء وتحديث الأدوار =====

  /**
   * إنشاء دور جديد
   */
  createRole: adminProcedure
    .input(CreateRoleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // التحقق من عدم وجود دور بنفس الاسم
        const existing = await roleDb.getRoleByName(input.name);
        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Role with this name already exists',
          });
        }

        const newRole = await roleDb.createRole({
          ...input,
          isSystem: false,
        });

        // تسجيل في سجل التدقيق
        await roleDb.logRoleAudit({
          action: 'role_created',
          entityType: 'role',
          entityId: newRole.id,
          newData: newRole as any,
          changedBy: ctx.user?.id,
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers['user-agent'],
        });

        return newRole;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create role',
        });
      }
    }),

  /**
   * تحديث دور
   */
  updateRole: adminProcedure
    .input(z.object({ roleId: z.number().int(), ...UpdateRoleSchema.shape }))
    .mutation(async ({ input, ctx }) => {
      try {
        const role = await roleDb.getRoleById(input.roleId);
        if (!role) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Role not found',
          });
        }

        if (role.isSystem) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot modify system roles',
          });
        }

        const { roleId, ...updateData } = input;
        const updatedRole = await roleDb.updateRole(roleId, updateData);

        // تسجيل في سجل التدقيق
        await roleDb.logRoleAudit({
          action: 'role_updated',
          entityType: 'role',
          entityId: roleId,
          oldData: role as any,
          newData: updatedRole as any,
          changedBy: ctx.user?.id,
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers['user-agent'],
        });

        return updatedRole;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update role',
        });
      }
    }),

  /**
   * حذف دور
   */
  deleteRole: adminProcedure
    .input(z.object({ roleId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const role = await roleDb.getRoleById(input.roleId);
        if (!role) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Role not found',
          });
        }

        if (role.isSystem) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Cannot delete system roles',
          });
        }

        await roleDb.deleteRole(input.roleId);

        // تسجيل في سجل التدقيق
        await roleDb.logRoleAudit({
          action: 'role_deleted',
          entityType: 'role',
          entityId: input.roleId,
          oldData: role as any,
          changedBy: ctx.user?.id,
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers['user-agent'],
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete role',
        });
      }
    }),

  // ===== إدارة صلاحيات الدور =====

  /**
   * إضافة صلاحية لدور
   */
  addPermissionToRole: adminProcedure
    .input(AssignPermissionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const role = await roleDb.getRoleById(input.roleId);
        if (!role) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Role not found',
          });
        }

        const permission = await roleDb.getPermissionById(input.permissionId);
        if (!permission) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Permission not found',
          });
        }

        const result = await roleDb.addPermissionToRole(
          input.roleId,
          input.permissionId,
          ctx.user?.id,
          input.notes
        );

        // تسجيل في سجل التدقيق
        await roleDb.logRoleAudit({
          action: 'permission_assigned',
          entityType: 'role_permission',
          entityId: input.roleId,
          newData: result as any,
          changedBy: ctx.user?.id,
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers['user-agent'],
        });

        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add permission to role',
        });
      }
    }),

  /**
   * إزالة صلاحية من دور
   */
  removePermissionFromRole: adminProcedure
    .input(AssignPermissionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await roleDb.removePermissionFromRole(input.roleId, input.permissionId);

        // تسجيل في سجل التدقيق
        await roleDb.logRoleAudit({
          action: 'permission_revoked',
          entityType: 'role_permission',
          entityId: input.roleId,
          changedBy: ctx.user?.id,
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers['user-agent'],
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove permission from role',
        });
      }
    }),

  // ===== إدارة أدوار المستخدم =====

  /**
   * جلب أدوار المستخدم
   */
  getUserRoles: protectedProcedure
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      try {
        // يمكن للمستخدم رؤية أدواره فقط، أو للأدمن رؤية أدوار أي مستخدم
        if (ctx.user?.id !== input.userId && ctx.user?.role !== 'admin' && ctx.user?.role !== 'sub_admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to view this user roles',
          });
        }

        return await roleDb.getUserRoles(input.userId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user roles',
        });
      }
    }),

  /**
   * تعيين دور للمستخدم
   */
  assignRoleToUser: adminProcedure
    .input(AssignRoleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const role = await roleDb.getRoleById(input.roleId);
        if (!role) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Role not found',
          });
        }

        const result = await roleDb.assignRoleToUser(
          input.userId,
          input.roleId,
          input.isPrimary,
          ctx.user?.id,
          input.expiresAt,
          input.notes
        );

        // تسجيل في سجل التدقيق
        await roleDb.logRoleAudit({
          action: 'user_role_assigned',
          entityType: 'user_role',
          entityId: input.userId,
          newData: result as any,
          changedBy: ctx.user?.id,
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers['user-agent'],
        });

        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to assign role to user',
        });
      }
    }),

  /**
   * إزالة دور من المستخدم
   */
  removeRoleFromUser: adminProcedure
    .input(z.object({ userId: z.number().int(), roleId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await roleDb.removeRoleFromUser(input.userId, input.roleId);

        // تسجيل في سجل التدقيق
        await roleDb.logRoleAudit({
          action: 'user_role_removed',
          entityType: 'user_role',
          entityId: input.userId,
          changedBy: ctx.user?.id,
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers['user-agent'],
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove role from user',
        });
      }
    }),

  // ===== التحقق من الصلاحيات =====

  /**
   * التحقق من امتلاك المستخدم صلاحية
   */
  hasPermission: protectedProcedure
    .input(z.object({ permissionName: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return await roleDb.hasPermission(ctx.user!.id, input.permissionName);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check permission',
        });
      }
    }),

  /**
   * التحقق من امتلاك المستخدم صلاحيات متعددة
   */
  hasAllPermissions: protectedProcedure
    .input(z.object({ permissionNames: z.array(z.string()) }))
    .query(async ({ input, ctx }) => {
      try {
        return await roleDb.hasAllPermissions(ctx.user!.id, input.permissionNames);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check permissions',
        });
      }
    }),

  /**
   * التحقق من امتلاك المستخدم أي من الصلاحيات
   */
  hasAnyPermission: protectedProcedure
    .input(z.object({ permissionNames: z.array(z.string()) }))
    .query(async ({ input, ctx }) => {
      try {
        return await roleDb.hasAnyPermission(ctx.user!.id, input.permissionNames);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check permissions',
        });
      }
    }),

  // ===== إدارة الصلاحيات =====

  /**
   * جلب جميع الصلاحيات
   */
  getAllPermissions: adminProcedure.query(async () => {
    try {
      return await roleDb.getAllPermissions();
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch permissions',
      });
    }
  }),

  /**
   * جلب صلاحيات حسب الفئة
   */
  getPermissionsByCategory: adminProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      try {
        return await roleDb.getPermissionsByCategory(input.category);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch permissions',
        });
      }
    }),

  /**
   * إنشاء صلاحية جديدة
   */
  createPermission: adminProcedure
    .input(CreatePermissionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const newPermission = await roleDb.createPermission({
          ...input,
          isSystem: false,
        });

        // تسجيل في سجل التدقيق
        await roleDb.logRoleAudit({
          action: 'permission_created',
          entityType: 'permission',
          entityId: newPermission.id,
          newData: newPermission as any,
          changedBy: ctx.user?.id,
          ipAddress: ctx.req?.ip,
          userAgent: ctx.req?.headers['user-agent'],
        });

        return newPermission;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create permission',
        });
      }
    }),
});

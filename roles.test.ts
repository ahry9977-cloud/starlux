/**
 * اختبارات شاملة لنظام الأدوار والصلاحيات
 * Comprehensive tests for Role & Permission System
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as roleDb from './roleDb';

describe('Role & Permission System', () => {
  let testRoleId: number;
  let testPermissionId: number;
  let testUserId = 1;

  // ===== Role Tests =====
  describe('Role Management', () => {
    it('should create a new role', async () => {
      const role = await roleDb.createRole({
        name: 'test_role',
        displayName: 'Test Role',
        description: 'A test role for testing',
        color: '#FF0000',
        priority: 10,
        isSystem: false,
      });

      expect(role).toBeDefined();
      expect(role.name).toBe('test_role');
      expect(role.displayName).toBe('Test Role');
      testRoleId = role.id;
    });

    it('should get role by ID', async () => {
      const role = await roleDb.getRoleById(testRoleId);
      expect(role).toBeDefined();
      expect(role?.id).toBe(testRoleId);
      expect(role?.name).toBe('test_role');
    });

    it('should get role by name', async () => {
      const role = await roleDb.getRoleByName('test_role');
      expect(role).toBeDefined();
      expect(role?.name).toBe('test_role');
    });

    it('should get all active roles', async () => {
      const roles = await roleDb.getAllRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should update a role', async () => {
      const updatedRole = await roleDb.updateRole(testRoleId, {
        displayName: 'Updated Test Role',
        description: 'Updated description',
      });

      expect(updatedRole.displayName).toBe('Updated Test Role');
      expect(updatedRole.description).toBe('Updated description');
    });

    it('should not delete system roles', async () => {
      const adminRole = await roleDb.getRoleByName('admin');
      if (adminRole) {
        await expect(roleDb.deleteRole(adminRole.id)).rejects.toThrow();
      }
    });

    it('should delete non-system roles', async () => {
      await roleDb.deleteRole(testRoleId);
      const role = await roleDb.getRoleById(testRoleId);
      expect(role?.isActive).toBe(false);
    });
  });

  // ===== Permission Tests =====
  describe('Permission Management', () => {
    it('should create a new permission', async () => {
      const permission = await roleDb.createPermission({
        name: 'users.create',
        displayName: 'Create Users',
        description: 'Permission to create new users',
        category: 'users',
        action: 'create',
        riskLevel: 'high',
        isSystem: false,
      });

      expect(permission).toBeDefined();
      expect(permission.name).toBe('users.create');
      expect(permission.category).toBe('users');
      testPermissionId = permission.id;
    });

    it('should get permission by ID', async () => {
      const permission = await roleDb.getPermissionById(testPermissionId);
      expect(permission).toBeDefined();
      expect(permission?.id).toBe(testPermissionId);
    });

    it('should get all active permissions', async () => {
      const permissions = await roleDb.getAllPermissions();
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should get permissions by category', async () => {
      const permissions = await roleDb.getPermissionsByCategory('users');
      expect(Array.isArray(permissions)).toBe(true);
      permissions.forEach((p) => {
        expect(p.category).toBe('users');
      });
    });
  });

  // ===== Role-Permission Mapping Tests =====
  describe('Role-Permission Mapping', () => {
    let mappedRoleId: number;

    beforeAll(async () => {
      const role = await roleDb.createRole({
        name: 'mapper_test_role',
        displayName: 'Mapper Test Role',
        isSystem: false,
      });
      mappedRoleId = role.id;
    });

    it('should add permission to role', async () => {
      const result = await roleDb.addPermissionToRole(mappedRoleId, testPermissionId);
      expect(result).toBeDefined();
      expect(result.roleId).toBe(mappedRoleId);
      expect(result.permissionId).toBe(testPermissionId);
      expect(result.granted).toBe(true);
    });

    it('should get role permissions', async () => {
      const permissions = await roleDb.getRolePermissions(mappedRoleId);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.some((p) => p.id === testPermissionId)).toBe(true);
    });

    it('should remove permission from role', async () => {
      await roleDb.removePermissionFromRole(mappedRoleId, testPermissionId);
      const permissions = await roleDb.getRolePermissions(mappedRoleId);
      expect(permissions.some((p) => p.id === testPermissionId)).toBe(false);
    });

    afterAll(async () => {
      await roleDb.deleteRole(mappedRoleId);
    });
  });

  // ===== User-Role Mapping Tests =====
  describe('User-Role Mapping', () => {
    let userRoleTestRoleId: number;

    beforeAll(async () => {
      const role = await roleDb.createRole({
        name: 'user_role_test',
        displayName: 'User Role Test',
        isSystem: false,
      });
      userRoleTestRoleId = role.id;
    });

    it('should assign role to user', async () => {
      const result = await roleDb.assignRoleToUser(
        testUserId,
        userRoleTestRoleId,
        true
      );
      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.roleId).toBe(userRoleTestRoleId);
      expect(result.isPrimary).toBe(true);
    });

    it('should get user roles', async () => {
      const roles = await roleDb.getUserRoles(testUserId);
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.some((r) => r.id === userRoleTestRoleId)).toBe(true);
    });

    it('should get user primary role', async () => {
      const primaryRole = await roleDb.getUserPrimaryRole(testUserId);
      expect(primaryRole).toBeDefined();
      expect(primaryRole?.id).toBe(userRoleTestRoleId);
    });

    it('should remove role from user', async () => {
      await roleDb.removeRoleFromUser(testUserId, userRoleTestRoleId);
      const roles = await roleDb.getUserRoles(testUserId);
      expect(roles.some((r) => r.id === userRoleTestRoleId)).toBe(false);
    });

    afterAll(async () => {
      await roleDb.deleteRole(userRoleTestRoleId);
    });
  });

  // ===== User-Specific Permissions Tests =====
  describe('User-Specific Permissions', () => {
    it('should add permission to user', async () => {
      const result = await roleDb.addPermissionToUser(
        testUserId,
        testPermissionId
      );
      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.permissionId).toBe(testPermissionId);
      expect(result.granted).toBe(true);
    });

    it('should get user specific permissions', async () => {
      const permissions = await roleDb.getUserSpecificPermissions(testUserId);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.some((p) => p.id === testPermissionId)).toBe(true);
    });

    it('should remove permission from user', async () => {
      await roleDb.removePermissionFromUser(testUserId, testPermissionId);
      const permissions = await roleDb.getUserSpecificPermissions(testUserId);
      expect(permissions.some((p) => p.id === testPermissionId)).toBe(false);
    });
  });

  // ===== Permission Checking Tests =====
  describe('Permission Checking', () => {
    let checkRoleId: number;
    let checkPermissionId: number;

    beforeAll(async () => {
      const role = await roleDb.createRole({
        name: 'check_role',
        displayName: 'Check Role',
        isSystem: false,
      });
      checkRoleId = role.id;

      const permission = await roleDb.createPermission({
        name: 'test.check',
        displayName: 'Test Check',
        category: 'test',
        action: 'check',
        isSystem: false,
      });
      checkPermissionId = permission.id;

      await roleDb.assignRoleToUser(testUserId, checkRoleId, false);
      await roleDb.addPermissionToRole(checkRoleId, checkPermissionId);
    });

    it('should check if user has permission', async () => {
      const hasPermission = await roleDb.hasPermission(testUserId, 'test.check');
      expect(hasPermission).toBe(true);
    });

    it('should return false for non-existent permission', async () => {
      const hasPermission = await roleDb.hasPermission(testUserId, 'non.existent');
      expect(hasPermission).toBe(false);
    });

    it('should check all permissions', async () => {
      const hasAll = await roleDb.hasAllPermissions(testUserId, ['test.check']);
      expect(hasAll).toBe(true);
    });

    it('should check any permission', async () => {
      const hasAny = await roleDb.hasAnyPermission(testUserId, ['test.check', 'non.existent']);
      expect(hasAny).toBe(true);
    });

    afterAll(async () => {
      await roleDb.removeRoleFromUser(testUserId, checkRoleId);
      await roleDb.deleteRole(checkRoleId);
    });
  });

  // ===== Audit Logging Tests =====
  describe('Audit Logging', () => {
    it('should log role audit', async () => {
      await roleDb.logRoleAudit({
        action: 'test_action',
        entityType: 'role',
        entityId: testRoleId,
        notes: 'Test audit log',
        changedBy: testUserId,
      });

      const logs = await roleDb.getRoleAuditLogs(10, 0);
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  // ===== Edge Cases Tests =====
  describe('Edge Cases', () => {
    it('should handle duplicate role names', async () => {
      const role1 = await roleDb.createRole({
        name: 'unique_role',
        displayName: 'Unique Role',
        isSystem: false,
      });

      try {
        await roleDb.createRole({
          name: 'unique_role',
          displayName: 'Another Unique Role',
          isSystem: false,
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }

      await roleDb.deleteRole(role1.id);
    });

    it('should handle expired user roles', async () => {
      const role = await roleDb.createRole({
        name: 'expiring_role',
        displayName: 'Expiring Role',
        isSystem: false,
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1); // Yesterday

      await roleDb.assignRoleToUser(testUserId, role.id, false, undefined, expiresAt);

      // In a real scenario, expired roles should be filtered out
      const roles = await roleDb.getUserRoles(testUserId);
      expect(Array.isArray(roles)).toBe(true);

      await roleDb.removeRoleFromUser(testUserId, role.id);
      await roleDb.deleteRole(role.id);
    });

    it('should handle concurrent permission checks', async () => {
      const permission = await roleDb.createPermission({
        name: 'concurrent.test',
        displayName: 'Concurrent Test',
        category: 'test',
        action: 'concurrent',
        isSystem: false,
      });

      const role = await roleDb.createRole({
        name: 'concurrent_role',
        displayName: 'Concurrent Role',
        isSystem: false,
      });

      await roleDb.addPermissionToRole(role.id, permission.id);
      await roleDb.assignRoleToUser(testUserId, role.id, false);

      const checks = await Promise.all([
        roleDb.hasPermission(testUserId, 'concurrent.test'),
        roleDb.hasPermission(testUserId, 'concurrent.test'),
        roleDb.hasPermission(testUserId, 'concurrent.test'),
      ]);

      expect(checks.every((c) => c === true)).toBe(true);

      await roleDb.removeRoleFromUser(testUserId, role.id);
      await roleDb.deleteRole(role.id);
    });
  });
});

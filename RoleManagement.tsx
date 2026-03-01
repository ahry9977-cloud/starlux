/**
 * صفحة إدارة الأدوار والصلاحيات
 * Role & Permission Management Page
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useStarLuxSound } from '@/hooks/useStarLuxSound';

export function RoleManagement() {
  const { playSound } = useStarLuxSound();
  const utils = trpc.useUtils();
  
  // ===== State Management =====
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#6366f1');
  
  // ===== Queries =====
  const { data: roles, isLoading: rolesLoading } = trpc.roles.getAllRoles.useQuery();
  const { data: permissions, isLoading: permissionsLoading } = trpc.roles.getAllPermissions.useQuery();
  const { data: selectedRolePermissions } = trpc.roles.getRolePermissions.useQuery(
    { roleId: selectedRole?.id || 0 },
    { enabled: !!selectedRole }
  );
  
  // ===== Mutations =====
  const createRoleMutation = trpc.roles.createRole.useMutation({
    onSuccess: () => {
      playSound('success');
      utils.roles.getAllRoles.invalidate();
      setIsCreateRoleOpen(false);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setNewRoleDescription('');
    },
    onError: () => {
      playSound('error');
    },
  });
  
  const updateRoleMutation = trpc.roles.updateRole.useMutation({
    onSuccess: () => {
      playSound('success');
      utils.roles.getAllRoles.invalidate();
      setIsEditRoleOpen(false);
    },
    onError: () => {
      playSound('error');
    },
  });
  
  const deleteRoleMutation = trpc.roles.deleteRole.useMutation({
    onSuccess: () => {
      playSound('success');
      utils.roles.getAllRoles.invalidate();
      setIsDeleteRoleOpen(false);
      setSelectedRole(null);
    },
    onError: () => {
      playSound('error');
    },
  });
  
  const addPermissionMutation = trpc.roles.addPermissionToRole.useMutation({
    onSuccess: () => {
      playSound('success');
      utils.roles.getRolePermissions.invalidate();
    },
    onError: () => {
      playSound('error');
    },
  });
  
  const removePermissionMutation = trpc.roles.removePermissionFromRole.useMutation({
    onSuccess: () => {
      playSound('success');
      utils.roles.getRolePermissions.invalidate();
    },
    onError: () => {
      playSound('error');
    },
  });
  
  // ===== Handlers =====
  const handleCreateRole = async () => {
    if (!newRoleName || !newRoleDisplayName) return;
    
    await createRoleMutation.mutateAsync({
      name: newRoleName,
      displayName: newRoleDisplayName,
      description: newRoleDescription || undefined,
      color: newRoleColor,
    });
  };
  
  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    await updateRoleMutation.mutateAsync({
      roleId: selectedRole.id,
      displayName: selectedRole.displayName,
      description: selectedRole.description,
      color: selectedRole.color,
    });
  };
  
  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    await deleteRoleMutation.mutateAsync({
      roleId: selectedRole.id,
    });
  };
  
  const handleAddPermission = async (permissionId: number) => {
    if (!selectedRole) return;
    
    await addPermissionMutation.mutateAsync({
      roleId: selectedRole.id,
      permissionId,
    });
  };
  
  const handleRemovePermission = async (permissionId: number) => {
    if (!selectedRole) return;
    
    await removePermissionMutation.mutateAsync({
      roleId: selectedRole.id,
      permissionId,
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأدوار والصلاحيات</h1>
          <p className="text-muted-foreground">تخصيص الأدوار والصلاحيات للمستخدمين</p>
        </div>
      </div>
      
      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
        </TabsList>
        
        {/* ===== Roles Tab ===== */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">الأدوار المتاحة</h2>
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة دور جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء دور جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات الدور الجديد
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-name">اسم الدور (بالإنجليزية)</Label>
                    <Input
                      id="role-name"
                      placeholder="admin, moderator, support_agent"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-display-name">اسم الدور (معروض)</Label>
                    <Input
                      id="role-display-name"
                      placeholder="مسؤول، وسيط، وكيل الدعم"
                      value={newRoleDisplayName}
                      onChange={(e) => setNewRoleDisplayName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-description">الوصف</Label>
                    <Textarea
                      id="role-description"
                      placeholder="وصف الدور ومسؤولياته"
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-color">اللون</Label>
                    <div className="flex gap-2">
                      <input
                        id="role-color"
                        type="color"
                        value={newRoleColor}
                        onChange={(e) => setNewRoleColor(e.target.value)}
                        className="w-12 h-10 rounded border"
                      />
                      <span className="text-sm text-muted-foreground">{newRoleColor}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateRole}
                    disabled={createRoleMutation.isPending || !newRoleName || !newRoleDisplayName}
                    className="w-full"
                  >
                    {createRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    إنشاء الدور
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {rolesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles?.map((role) => (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all ${
                    selectedRole?.id === role.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: role.color || '#6366f1' }}
                        />
                        <CardTitle className="text-lg">{role.displayName}</CardTitle>
                      </div>
                      {role.isSystem && (
                        <Badge variant="secondary">نظام</Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {role.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {role.description && (
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    )}
                    <div className="flex gap-2">
                      {!role.isSystem && (
                        <>
                          <Dialog open={isEditRoleOpen && selectedRole?.id === role.id} onOpenChange={setIsEditRoleOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRole(role);
                                }}
                              >
                                <Edit2 className="w-3 h-3" />
                                تعديل
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>تعديل الدور</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>اسم الدور (معروض)</Label>
                                  <Input
                                    value={selectedRole?.displayName || ''}
                                    onChange={(e) =>
                                      setSelectedRole({
                                        ...selectedRole,
                                        displayName: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>الوصف</Label>
                                  <Textarea
                                    value={selectedRole?.description || ''}
                                    onChange={(e) =>
                                      setSelectedRole({
                                        ...selectedRole,
                                        description: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  onClick={handleUpdateRole}
                                  disabled={updateRoleMutation.isPending}
                                  className="w-full"
                                >
                                  {updateRoleMutation.isPending && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  )}
                                  حفظ التغييرات
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog open={isDeleteRoleOpen && selectedRole?.id === role.id} onOpenChange={setIsDeleteRoleOpen}>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRole(role);
                                setIsDeleteRoleOpen(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                              حذف
                            </Button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الدور</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف الدور "{role.displayName}"؟ هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-2">
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteRole}
                                  disabled={deleteRoleMutation.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteRoleMutation.isPending && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  )}
                                  حذف
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* ===== Permissions Tab ===== */}
        <TabsContent value="permissions" className="space-y-4">
          {selectedRole ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>صلاحيات الدور: {selectedRole.displayName}</CardTitle>
                  <CardDescription>
                    إدارة الصلاحيات المتاحة لهذا الدور
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {permissionsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {permissions?.map((permission) => {
                        const isAssigned = selectedRolePermissions?.some(
                          (p) => p.id === permission.id
                        );
                        
                        return (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{permission.displayName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {permission.category}
                                </Badge>
                                <Badge
                                  variant={
                                    permission.riskLevel === 'critical'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {permission.riskLevel}
                                </Badge>
                              </div>
                              {permission.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant={isAssigned ? 'default' : 'outline'}
                              className="gap-1"
                              onClick={() =>
                                isAssigned
                                  ? handleRemovePermission(permission.id)
                                  : handleAddPermission(permission.id)
                              }
                              disabled={
                                addPermissionMutation.isPending ||
                                removePermissionMutation.isPending
                              }
                            >
                              {isAssigned ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  مُعطى
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3" />
                                  غير مُعطى
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  اختر دوراً من قائمة الأدوار لإدارة صلاحياته
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

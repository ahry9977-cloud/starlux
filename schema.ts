  // متى تم التعيين
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
  index("idx_roleId").on(table.roleId),
  index("idx_permissionId").on(table.permissionId),
  index("idx_granted").on(table.granted)
]);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

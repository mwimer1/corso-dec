/**
 * Authorization types for permissions and roles
 * @module auth/authorization
 * @description Permission system types for role-based access control
 */

/**
 * Permission definition for resource access control
 * @category Authorization
 * @aiContext Used throughout the application for access control decisions and permission validation
 * @aiPurpose Defines granular permissions that can be assigned to roles for fine-grained access control
 * @businessValue Enables secure, scalable permission management with clear audit trails
 *
 * @example Database resource permission
 * ```typescript
 * const readProjectsPermission: Permission = {
 *   id: "perm_001",
 *   resource: "projects",
 *   action: "read",
 *   scope: "organization",
 *   description: "View organization projects",
 *   system: false
 * };
 * ```
 *
 * @example Administrative permission
 * ```typescript
 * const systemAdminPermission: Permission = {
 *   id: "perm_sys_001",
 *   resource: "users",
 *   action: "delete",
 *   scope: "global",
 *   description: "Delete any user (system admin only)",
 *   system: true
 * };
 * ```
 *
 * @example Export permission with organization scope
 * ```typescript
 * const exportDataPermission: Permission = {
 *   id: "perm_002",
 *   resource: "analytics",
 *   action: "export",
 *   scope: "organization",
 *   description: "Export organization analytics data"
 * };
 * ```
 */
export interface Permission {
  /** Unique permission identifier */
  id: string;
  /** Resource being accessed (e.g., 'projects', 'users', 'analytics') */
  resource: string;
  /** Action being performed (e.g., 'create', 'read', 'update', 'delete') */
  action: 'create' | 'read' | 'update' | 'delete' | 'list' | 'execute' | 'export';
  /** Access scope - determines the breadth of access */
  scope?: 'own' | 'organization' | 'global';
  /** Human-readable description of the permission */
  description?: string;
  /** Whether this permission is system-level (cannot be modified by users) */
  system?: boolean;
}

/**
 * Role definition with associated permissions
 * @category Authorization
 * @aiContext Used to group permissions into logical roles for assignment to users
 * @aiPurpose Simplifies permission management by bundling related permissions into named roles
 * @businessValue Reduces administrative overhead and ensures consistent permission assignments
 *
 * @example Organization admin role
 * ```typescript
 * const orgAdminRole: Role = {
 *   id: "role_org_admin",
 *   name: "Organization Admin",
 *   description: "Full administrative access within organization",
 *   permissions: [
 *     { id: "perm_001", resource: "users", action: "create", scope: "organization" },
 *     { id: "perm_002", resource: "projects", action: "delete", scope: "organization" },
 *     { id: "perm_003", resource: "billing", action: "update", scope: "organization" }
 *   ],
 *   priority: 100,
 *   system: false
 * };
 * ```
 *
 * @example Viewer role with read-only access
 * ```typescript
 * const viewerRole: Role = {
 *   id: "role_viewer",
 *   name: "Viewer",
 *   description: "Read-only access to organization data",
 *   permissions: [
 *     { id: "perm_004", resource: "projects", action: "read", scope: "organization" },
 *     { id: "perm_005", resource: "analytics", action: "read", scope: "organization" }
 *   ],
 *   priority: 10,
 *   system: false
 * };
 * ```
 *
 * @example System role with elevated privileges
 * ```typescript
 * const systemSupportRole: Role = {
 *   id: "role_sys_support",
 *   name: "System Support",
 *   description: "Support staff with cross-organization access",
 *   permissions: [
 *     { id: "perm_sys_001", resource: "*", action: "read", scope: "global" }
 *   ],
 *   priority: 1000,
 *   system: true
 * };
 * ```
 */
export interface Role {
  /** Unique role identifier */
  id: string;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Permissions granted by this role */
  permissions: Permission[];
  /** Role priority for hierarchy */
  priority: number;
  /** Whether this is a system role (cannot be deleted) */
  system?: boolean;
}

/**
 * User role assignment
 * @category Authorization
 * @aiContext Used to track which roles are assigned to which users
 * @aiPurpose Creates the link between users and roles, enabling permission resolution
 * @businessValue Provides audit trails and temporal role assignments for compliance
 *
 * @example User role assignment
 * ```typescript
 * const memberAssignment: UserRole = {
 *   user_id: "user_123",
 *   role_id: "role_member",
 *   assigned_at: new Date("2025-01-15T10:00:00Z"),
 *   assigned_by: "user_789",
 *   expires_at: new Date("2025-12-31T23:59:59Z")
 * };
 * ```
 *
 * @example Permanent admin role assignment
 * ```typescript
 * const adminAssignment: UserRole = {
 *   user_id: "admin_001",
 *   role_id: "role_admin",
 *   assigned_at: new Date("2025-01-01T00:00:00Z"),
 *   assigned_by: "system"
 *   // No expires_at for permanent assignments
 * };
 * ```
 *
 * @example Temporary elevated access
 * ```typescript
 * const tempAdminAssignment: UserRole = {
 *   user_id: "user_456",
 *   role_id: "role_admin",
 *   assigned_at: new Date("2025-06-30T09:00:00Z"),
 *   assigned_by: "admin_002",
 *   expires_at: new Date("2025-02-05T17:00:00Z") // 1 week temporary access
 * };
 * ```
 */
export interface UserRole {
  /** User ID */
  user_id: string;
  /** Role ID */
  role_id: string;
  /** When the role was assigned */
  assigned_at: Date;
  /** Who assigned the role */
  assigned_by: string;
  /** When the role expires (if applicable) */
  expires_at?: Date;
}





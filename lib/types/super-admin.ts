// Super Admin Types and Interfaces

import { ObjectId } from "mongodb"

/**
 * Super Admin account stored in super_admins collection
 */
export interface SuperAdmin {
  _id: ObjectId
  email: string // unique index
  password: string // bcrypt hashed
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
}

/**
 * JWT payload for super admin authentication
 */
export interface SuperAdminJWTPayload {
  userId: string
  role: "super_admin"
  email: string
  iat: number
  exp: number
}

/**
 * Super admin context passed to authenticated routes
 */
export interface SuperAdminContext {
  userId: string
  email: string
  role: "super_admin"
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalOrganizations: number
  totalActiveUsers: number
  totalStaff: number
  activeTenants: number
  suspendedTenants: number
  dailyCheckins: number
}

/**
 * Organization growth data
 */
export interface OrgGrowthData {
  month: string
  count: number
}

/**
 * Tenant activity metrics
 */
export interface TenantActivity {
  organizationId: string
  organizationName: string
  totalCheckins: number
  activeUsers: number
}

/**
 * Detailed organization information
 */
export interface OrganizationDetails {
  organization: any // Organization type from existing system
  users: any[] // User type from existing system
  analytics: {
    totalStaff: number
    activeStaff: number
    totalCheckins: number
    averageAttendanceRate: number
  }
  auditLogs: any[]
}

/**
 * Paginated organizations response
 */
export interface PaginatedOrganizations {
  organizations: any[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

/**
 * Paginated users response
 */
export interface PaginatedUsers {
  users: UserWithTenant[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

/**
 * User with tenant information
 */
export interface UserWithTenant {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  lastLogin?: Date
  tenantName: string
  tenantSubdomain: string
}

/**
 * Paginated audit logs response
 */
export interface PaginatedAuditLogs {
  logs: SystemAuditLog[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

/**
 * System audit log entry
 */
export interface SystemAuditLog {
  _id: ObjectId
  actorId: string // super admin _id
  actorRole: "super_admin"
  actorEmail: string
  tenantId?: string // optional, for tenant-specific actions
  action: AuditAction
  metadata: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
}

/**
 * Audit action types
 */
export type AuditAction =
  | "SUSPEND_TENANT"
  | "ACTIVATE_TENANT"
  | "DELETE_TENANT"
  | "UPGRADE_PLAN"
  | "DOWNGRADE_PLAN"
  | "DELETE_USER"
  | "SUSPEND_USER"
  | "RESET_PASSWORD"
  | "VIEW_REPORT"
  | "EXPORT_DATA"
  | "UPDATE_SETTINGS"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "LOGIN"
  | "LOGOUT"
  | "VIEW_ORGANIZATIONS"
  | "VIEW_USERS"
  | "VIEW_PAYMENTS"
  | "VIEW_ANALYTICS"
  | "VIEW_LOGS"

/**
 * Platform stats cache entry
 */
export interface PlatformStatsCache {
  _id: ObjectId
  metric: string
  value: number | string | Record<string, any>
  calculatedAt: Date
  expiresAt: Date
}

/**
 * Date range filter
 */
export interface DateRange {
  from: Date
  to: Date
}

/**
 * Organization filters
 */
export interface OrgFilters {
  page?: number
  perPage?: number
  search?: string
  status?: string
}

/**
 * User filters
 */
export interface UserFilters {
  page?: number
  perPage?: number
  search?: string
  role?: string
  tenantId?: string
  isActive?: boolean
}

/**
 * Audit log filters
 */
export interface AuditLogFilters {
  page?: number
  perPage?: number
  search?: string
  action?: AuditAction
  tenantId?: string
  dateFrom?: Date
  dateTo?: Date
}

/**
 * Time period for analytics
 */
export type TimePeriod = "day" | "week" | "month" | "year"

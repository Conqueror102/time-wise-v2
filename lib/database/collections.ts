/**
 * Database Collections Helper
 * Provides typed collection accessors for super admin collections
 */

import { Collection, Db } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import type {
  SystemAuditLog,
  PaystackWebhook,
  PlatformStatsCache,
  SuperAdmin,
} from "@/lib/types/super-admin"
import type { Organization, User, Staff, AttendanceLog } from "@/lib/types"

/**
 * Get typed collection for system audit logs
 */
export async function getAuditLogsCollection(
  db?: Db
): Promise<Collection<SystemAuditLog>> {
  const database = db || (await getDatabase())
  return database.collection<SystemAuditLog>("system_audit_logs")
}

/**
 * Get typed collection for Paystack webhooks
 */
export async function getPaystackWebhooksCollection(
  db?: Db
): Promise<Collection<PaystackWebhook>> {
  const database = db || (await getDatabase())
  return database.collection<PaystackWebhook>("paystack_webhooks")
}

/**
 * Get typed collection for platform stats cache
 */
export async function getPlatformStatsCacheCollection(
  db?: Db
): Promise<Collection<PlatformStatsCache>> {
  const database = db || (await getDatabase())
  return database.collection<PlatformStatsCache>("platform_stats_cache")
}

/**
 * Get typed collection for super admins
 */
export async function getSuperAdminsCollection(
  db?: Db
): Promise<Collection<SuperAdmin>> {
  const database = db || (await getDatabase())
  return database.collection<SuperAdmin>("super_admins")
}

/**
 * Get typed collection for organizations
 */
export async function getOrganizationsCollection(
  db?: Db
): Promise<Collection<Organization>> {
  const database = db || (await getDatabase())
  return database.collection<Organization>("organizations")
}

/**
 * Get typed collection for users
 */
export async function getUsersCollection(db?: Db): Promise<Collection<User>> {
  const database = db || (await getDatabase())
  return database.collection<User>("users")
}

/**
 * Get typed collection for staff
 */
export async function getStaffCollection(db?: Db): Promise<Collection<Staff>> {
  const database = db || (await getDatabase())
  return database.collection<Staff>("staff")
}

/**
 * Get typed collection for attendance logs
 */
export async function getAttendanceCollection(
  db?: Db
): Promise<Collection<AttendanceLog>> {
  const database = db || (await getDatabase())
  return database.collection<AttendanceLog>("attendance")
}

/**
 * Collection names constants
 */
export const COLLECTIONS = {
  SUPER_ADMINS: "super_admins",
  SYSTEM_AUDIT_LOGS: "system_audit_logs",
  PAYSTACK_WEBHOOKS: "paystack_webhooks",
  PLATFORM_STATS_CACHE: "platform_stats_cache",
  ORGANIZATIONS: "organizations",
  USERS: "users",
  STAFF: "staff",
  ATTENDANCE: "attendance",
} as const

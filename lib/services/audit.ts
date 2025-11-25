// Audit Service - Handles system audit logging for super admin actions

import { getDatabase } from "@/lib/mongodb"
import {
  SystemAuditLog,
  AuditAction,
  AuditLogFilters,
  PaginatedAuditLogs,
} from "@/lib/types/super-admin"
import { ObjectId } from "mongodb"
import { escapeRegex } from "@/lib/utils/regex"

/**
 * Parameters for creating an audit log
 */
export interface CreateAuditLogParams {
  actorId: string
  actorEmail: string
  tenantId?: string
  action: AuditAction
  metadata: Record<string, any>
  ipAddress: string
  userAgent: string
}

/**
 * Audit Service - Manages system audit logs
 */
export class AuditService {
  /**
   * Create a new audit log entry
   */
  async createLog(params: CreateAuditLogParams): Promise<void> {
    try {
      const db = await getDatabase()
      const auditLogs = db.collection<SystemAuditLog>("system_audit_logs")

      await auditLogs.insertOne({
        _id: new ObjectId(),
        actorId: params.actorId,
        actorRole: "super_admin",
        actorEmail: params.actorEmail,
        tenantId: params.tenantId,
        action: params.action,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        timestamp: new Date(),
      })
    } catch (error) {
      console.error("Failed to create audit log:", error)
      // Don't throw - logging failures shouldn't break the main operation
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs> {
    const db = await getDatabase()
    const auditLogs = db.collection<SystemAuditLog>("system_audit_logs")

    // Build query
    const query: any = {}

    if (filters.search) {
      query.$or = [
        { actorEmail: { $regex: filters.search, $options: "i" } },
        { action: { $regex: filters.search, $options: "i" } },
      ]
    }

    if (filters.action) {
      query.action = filters.action
    }

    if (filters.tenantId) {
      query.tenantId = filters.tenantId
    }

    if (filters.dateFrom || filters.dateTo) {
      query.timestamp = {}
      if (filters.dateFrom) {
        query.timestamp.$gte = filters.dateFrom
      }
      if (filters.dateTo) {
        query.timestamp.$lte = filters.dateTo
      }
    }

    // Pagination
    const page = filters.page || 1
    const perPage = filters.perPage || 50
    const skip = (page - 1) * perPage

    // Execute query
    const [logs, total] = await Promise.all([
      auditLogs
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(perPage)
        .toArray(),
      auditLogs.countDocuments(query),
    ])

    return {
      logs,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    }
  }

  /**
   * Export audit logs to CSV format
   */
  async exportLogs(filters: AuditLogFilters): Promise<string> {
    const db = await getDatabase()
    const auditLogs = db.collection<SystemAuditLog>("system_audit_logs")

    // Build query (same as getLogs)
    const query: any = {}

    if (filters.search) {
      query.$or = [
        { actorEmail: { $regex: filters.search, $options: "i" } },
        { action: { $regex: filters.search, $options: "i" } },
      ]
    }

    if (filters.action) {
      query.action = filters.action
    }

    if (filters.tenantId) {
      query.tenantId = filters.tenantId
    }

    if (filters.dateFrom || filters.dateTo) {
      query.timestamp = {}
      if (filters.dateFrom) {
        query.timestamp.$gte = filters.dateFrom
      }
      if (filters.dateTo) {
        query.timestamp.$lte = filters.dateTo
      }
    }

    // Get all matching logs (limit to 10000 for safety)
    const logs = await auditLogs
      .find(query)
      .sort({ timestamp: -1 })
      .limit(10000)
      .toArray()

    // Convert to CSV
    const headers = [
      "Timestamp",
      "Actor Email",
      "Action",
      "Tenant ID",
      "IP Address",
      "User Agent",
      "Metadata",
    ]

    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.actorEmail,
      log.action,
      log.tenantId || "N/A",
      log.ipAddress,
      log.userAgent,
      JSON.stringify(log.metadata),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    return csvContent
  }

  /**
   * Get recent audit logs (for real-time display)
   */
  async getRecentLogs(limit: number = 10): Promise<SystemAuditLog[]> {
    const db = await getDatabase()
    const auditLogs = db.collection<SystemAuditLog>("system_audit_logs")

    return await auditLogs
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Get audit logs for a specific tenant
   */
  async getTenantLogs(
    tenantId: string,
    limit: number = 20
  ): Promise<SystemAuditLog[]> {
    const db = await getDatabase()
    const auditLogs = db.collection<SystemAuditLog>("system_audit_logs")

    return await auditLogs
      .find({ tenantId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Get audit log statistics
   */
  async getLogStats(): Promise<{
    totalLogs: number
    todayLogs: number
    actionBreakdown: Array<{ action: AuditAction; count: number }>
  }> {
    const db = await getDatabase()
    const auditLogs = db.collection<SystemAuditLog>("system_audit_logs")

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalLogs, todayLogs, actionBreakdown] = await Promise.all([
      auditLogs.countDocuments(),
      auditLogs.countDocuments({ timestamp: { $gte: today } }),
      auditLogs
        .aggregate([
          {
            $group: {
              _id: "$action",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              action: "$_id",
              count: 1,
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray() as any,
    ])

    return {
      totalLogs,
      todayLogs,
      actionBreakdown,
    }
  }
}

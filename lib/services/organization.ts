// Organization Service - Handles organization/tenant management for super admin

import { getDatabase } from "@/lib/mongodb"
import { toPublicUser } from "@/lib/auth/public-user"
import {
  OrgFilters,
  PaginatedOrganizations,
  OrganizationDetails,
} from "@/lib/types/super-admin"
import { AuditService } from "./audit"
import { ObjectId } from "mongodb"
import { SuperAdminError, SuperAdminErrorCodes } from "@/lib/errors/super-admin-errors"
import { escapeRegex } from "@/lib/utils/regex"

/**
 * Organization analytics data
 */
export interface OrgAnalytics {
  totalStaff: number
  activeStaff: number
  totalCheckins: number
  averageAttendanceRate: number
  lastCheckIn?: Date
}

/**
 * Organization Service - Manages platform organizations/tenants
 */
export class OrganizationService {
  private auditService: AuditService

  constructor() {
    this.auditService = new AuditService()
  }

  /**
   * Get all organizations with filtering and pagination
   */
  async getAllOrganizations(
    filters: OrgFilters
  ): Promise<PaginatedOrganizations> {
    const db = await getDatabase()
    const organizations = db.collection("organizations")

    // Build query
    const query: any = {}

    if (filters.search) {
      const safeSearch = escapeRegex(filters.search)
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { subdomain: { $regex: safeSearch, $options: "i" } },
        { adminEmail: { $regex: safeSearch, $options: "i" } },
      ]
    }

    if (filters.status) {
      query.status = filters.status
    }


    // Pagination
    const page = filters.page || 1
    const perPage = filters.perPage || 50
    const skip = (page - 1) * perPage

    // Execute query
    const [orgs, total] = await Promise.all([
      organizations.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage).toArray(),
      organizations.countDocuments(query),
    ])

    return {
      organizations: orgs,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    }
  }

  /**
   * Get detailed information about a specific organization
   */
  async getOrganizationDetails(orgId: string): Promise<OrganizationDetails> {
    const db = await getDatabase()

    // Validate ObjectId
    if (!ObjectId.isValid(orgId)) {
      throw new SuperAdminError(
        "Invalid organization ID",
        SuperAdminErrorCodes.ORGANIZATION_NOT_FOUND,
        404
      )
    }

    const organizations = db.collection("organizations")
    const users = db.collection("users")
    const attendance = db.collection("attendance")

    // Get organization
    const organization = await organizations.findOne({ _id: new ObjectId(orgId) })

    if (!organization) {
      throw new SuperAdminError(
        "Organization not found",
        SuperAdminErrorCodes.ORGANIZATION_NOT_FOUND,
        404
      )
    }

    // Get users
    const orgUsers = await users
      .find({ tenantId: orgId })
      .sort({ createdAt: -1 })
      .toArray()

    // Get analytics
    const analytics = await this.getOrganizationAnalytics(orgId)

    // Get audit logs
    const auditLogs = await this.auditService.getTenantLogs(orgId, 20)

    return {
      organization,
      users: orgUsers.map(toPublicUser),
      analytics,
      auditLogs,
    }
  }

  /**
   * Suspend an organization
   */
  async suspendOrganization(
    orgId: string,
    actorId: string,
    actorEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = await getDatabase()
    const organizations = db.collection("organizations")

    // Validate organization exists
    const org = await organizations.findOne({ _id: new ObjectId(orgId) })

    if (!org) {
      throw new SuperAdminError(
        "Organization not found",
        SuperAdminErrorCodes.ORGANIZATION_NOT_FOUND,
        404
      )
    }

    // Update status
    await organizations.updateOne(
      { _id: new ObjectId(orgId) },
      {
        $set: {
          status: "suspended",
          updatedAt: new Date(),
        },
      }
    )

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: orgId,
      action: "SUSPEND_TENANT",
      metadata: {
        organizationName: org.name,
        subdomain: org.subdomain,
      },
      ipAddress,
      userAgent,
    })
  }

  /**
   * Activate an organization
   */
  async activateOrganization(
    orgId: string,
    actorId: string,
    actorEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = await getDatabase()
    const organizations = db.collection("organizations")

    // Validate organization exists
    const org = await organizations.findOne({ _id: new ObjectId(orgId) })

    if (!org) {
      throw new SuperAdminError(
        "Organization not found",
        SuperAdminErrorCodes.ORGANIZATION_NOT_FOUND,
        404
      )
    }

    // Update status
    await organizations.updateOne(
      { _id: new ObjectId(orgId) },
      {
        $set: {
          status: "active",
          updatedAt: new Date(),
        },
      }
    )

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: orgId,
      action: "ACTIVATE_TENANT",
      metadata: {
        organizationName: org.name,
        subdomain: org.subdomain,
      },
      ipAddress,
      userAgent,
    })
  }

  /**
   * Delete an organization (soft delete - mark as cancelled)
   */
  async deleteOrganization(
    orgId: string,
    actorId: string,
    actorEmail: string,
    ipAddress: string,
    userAgent: string,
    hardDelete: boolean = false
  ): Promise<void> {
    const db = await getDatabase()
    const organizations = db.collection("organizations")

    // Validate organization exists
    const org = await organizations.findOne({ _id: new ObjectId(orgId) })

    if (!org) {
      throw new SuperAdminError(
        "Organization not found",
        SuperAdminErrorCodes.ORGANIZATION_NOT_FOUND,
        404
      )
    }

    if (hardDelete) {
      // Hard delete - remove from database
      await organizations.deleteOne({ _id: new ObjectId(orgId) })

      // Also delete associated users (optional - be careful!)
      // await db.collection("users").deleteMany({ tenantId: orgId })
    } else {
      // Soft delete - mark as cancelled
      await organizations.updateOne(
        { _id: new ObjectId(orgId) },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
          },
        }
      )
    }

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: orgId,
      action: "DELETE_TENANT",
      metadata: {
        organizationName: org.name,
        subdomain: org.subdomain,
        hardDelete,
      },
      ipAddress,
      userAgent,
    })
  }

  /**
   * Get organization users
   */
  async getOrganizationUsers(orgId: string): Promise<any[]> {
    const db = await getDatabase()
    const users = db.collection("users")

    const orgUsers = await users.find({ tenantId: orgId }).sort({ createdAt: -1 }).toArray()
    return orgUsers.map(toPublicUser)
  }

  /**
   * Get organization analytics
   */
  async getOrganizationAnalytics(orgId: string): Promise<OrgAnalytics> {
    const db = await getDatabase()
    const staff = db.collection("staff")
    const attendance = db.collection("attendance")

    const [totalStaff, activeStaff, totalCheckins, lastCheckIn] = await Promise.all([
      staff.countDocuments({ tenantId: orgId }),
      staff.countDocuments({ tenantId: orgId, isActive: true }),
      attendance.countDocuments({ tenantId: orgId }),
      attendance
        .findOne({ tenantId: orgId }, { sort: { checkInTime: -1 } })
        .then((doc) => doc?.checkInTime),
    ])

    // Calculate average attendance rate (simplified)
    const averageAttendanceRate =
      totalStaff > 0 ? (activeStaff / totalStaff) * 100 : 0

    return {
      totalStaff,
      activeStaff,
      totalCheckins,
      averageAttendanceRate,
      lastCheckIn,
    }
  }
}

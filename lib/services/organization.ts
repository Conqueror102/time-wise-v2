// Organization Service - Handles organization/tenant management for super admin

import { getDatabase } from "@/lib/mongodb"
import {
  OrgFilters,
  PaginatedOrganizations,
  OrganizationDetails,
} from "@/lib/types/super-admin"
import { AuditService } from "./audit"
import { ObjectId } from "mongodb"
import { SuperAdminError, SuperAdminErrorCodes } from "@/lib/errors/super-admin-errors"

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
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { subdomain: { $regex: filters.search, $options: "i" } },
        { adminEmail: { $regex: filters.search, $options: "i" } },
      ]
    }

    if (filters.status) {
      query.status = filters.status
    }

    if (filters.subscriptionTier) {
      query.subscriptionTier = filters.subscriptionTier
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

    // Get recent payments from webhook logs
    const webhooks = db.collection("paystack_webhooks")
    const recentPayments = await webhooks
      .find({ tenantId: orgId })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    // Get analytics
    const analytics = await this.getOrganizationAnalytics(orgId)

    // Get audit logs
    const auditLogs = await this.auditService.getTenantLogs(orgId, 20)

    return {
      organization,
      users: orgUsers,
      recentPayments,
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

    // Check if org has active subscription
    if (org.subscriptionStatus === "active" && !hardDelete) {
      throw new SuperAdminError(
        "Cannot delete organization with active subscription. Suspend first or use hard delete.",
        SuperAdminErrorCodes.CANNOT_DELETE_ACTIVE_ORG,
        400
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
            subscriptionStatus: "cancelled",
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
   * Update organization subscription plan
   */
  async updateSubscriptionPlan(
    orgId: string,
    newPlan: string,
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

    const oldPlan = org.subscriptionTier
    const action = this.isUpgrade(oldPlan, newPlan) ? "UPGRADE_PLAN" : "DOWNGRADE_PLAN"

    // Update plan
    await organizations.updateOne(
      { _id: new ObjectId(orgId) },
      {
        $set: {
          subscriptionTier: newPlan,
          updatedAt: new Date(),
        },
      }
    )

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: orgId,
      action,
      metadata: {
        organizationName: org.name,
        subdomain: org.subdomain,
        oldPlan,
        newPlan,
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

    return await users.find({ tenantId: orgId }).sort({ createdAt: -1 }).toArray()
  }

  /**
   * Get organization payments
   */
  async getOrganizationPayments(orgId: string): Promise<any[]> {
    const db = await getDatabase()
    const webhooks = db.collection("paystack_webhooks")

    return await webhooks
      .find({ tenantId: orgId })
      .sort({ timestamp: -1 })
      .toArray()
  }

  /**
   * Get organization analytics
   */
  async getOrganizationAnalytics(orgId: string): Promise<OrgAnalytics> {
    const db = await getDatabase()
    const users = db.collection("users")
    const attendance = db.collection("attendance")

    const [totalStaff, activeStaff, totalCheckins, lastCheckIn] = await Promise.all([
      users.countDocuments({ tenantId: orgId, role: "staff" }),
      users.countDocuments({ tenantId: orgId, role: "staff", isActive: true }),
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

  /**
   * Helper: Determine if plan change is an upgrade
   */
  private isUpgrade(oldPlan: string, newPlan: string): boolean {
    const planHierarchy = ["free", "basic", "pro", "enterprise"]
    const oldIndex = planHierarchy.indexOf(oldPlan)
    const newIndex = planHierarchy.indexOf(newPlan)
    return newIndex > oldIndex
  }
}

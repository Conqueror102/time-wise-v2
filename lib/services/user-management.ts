// User Management Service - Handles user management for super admin

import { getDatabase } from "@/lib/mongodb"
import {
  UserFilters,
  PaginatedUsers,
  UserWithTenant,
} from "@/lib/types/super-admin"
import { AuditService } from "./audit"
import { ObjectId } from "mongodb"
import { SuperAdminError, SuperAdminErrorCodes } from "@/lib/errors/super-admin-errors"
import { hashPassword } from "@/lib/auth/password"
import { sendEmail } from "./email"

/**
 * User Management Service - Manages platform users across all tenants
 */
export class UserManagementService {
  private auditService: AuditService

  constructor() {
    this.auditService = new AuditService()
  }

  /**
   * Get all users across all tenants with filtering and pagination
   */
  async getAllUsers(filters: UserFilters): Promise<PaginatedUsers> {
    const db = await getDatabase()
    const users = db.collection("users")

    // Build query
    const query: any = {}

    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: "i" } },
        { firstName: { $regex: filters.search, $options: "i" } },
        { lastName: { $regex: filters.search, $options: "i" } },
      ]
    }

    if (filters.role) {
      query.role = filters.role
    }

    if (filters.tenantId) {
      query.tenantId = filters.tenantId
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive
    }

    // Pagination
    const page = filters.page || 1
    const perPage = filters.perPage || 50
    const skip = (page - 1) * perPage

    // Execute query with tenant information
    const usersData = await users
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "organizations",
            let: { tenantId: { $toObjectId: "$tenantId" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$tenantId"] } } },
              { $project: { name: 1, subdomain: 1 } },
            ],
            as: "tenant",
          },
        },
        {
          $project: {
            _id: { $toString: "$_id" },
            email: 1,
            firstName: 1,
            lastName: 1,
            role: 1,
            isActive: 1,
            lastLogin: 1,
            tenantName: { $arrayElemAt: ["$tenant.name", 0] },
            tenantSubdomain: { $arrayElemAt: ["$tenant.subdomain", 0] },
          },
        },
        { $sort: { lastLogin: -1 } },
        { $skip: skip },
        { $limit: perPage },
      ])
      .toArray()

    const total = await users.countDocuments(query)

    return {
      users: usersData as UserWithTenant[],
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    }
  }

  /**
   * Suspend a user
   */
  async suspendUser(
    userId: string,
    actorId: string,
    actorEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = await getDatabase()
    const users = db.collection("users")

    // Validate user exists
    const user = await users.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      throw new SuperAdminError(
        "User not found",
        SuperAdminErrorCodes.USER_NOT_FOUND,
        404
      )
    }

    // Update user status
    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    )

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: user.tenantId,
      action: "SUSPEND_USER",
      metadata: {
        userId,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
      },
      ipAddress,
      userAgent,
    })
  }

  /**
   * Activate a user
   */
  async activateUser(
    userId: string,
    actorId: string,
    actorEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = await getDatabase()
    const users = db.collection("users")

    // Validate user exists
    const user = await users.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      throw new SuperAdminError(
        "User not found",
        SuperAdminErrorCodes.USER_NOT_FOUND,
        404
      )
    }

    // Update user status
    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isActive: true,
          updatedAt: new Date(),
        },
      }
    )

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: user.tenantId,
      action: "SUSPEND_USER", // Reuse same action type for activate
      metadata: {
        userId,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        activated: true,
      },
      ipAddress,
      userAgent,
    })
  }

  /**
   * Delete a user
   */
  async deleteUser(
    userId: string,
    actorId: string,
    actorEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = await getDatabase()
    const users = db.collection("users")

    // Validate user exists
    const user = await users.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      throw new SuperAdminError(
        "User not found",
        SuperAdminErrorCodes.USER_NOT_FOUND,
        404
      )
    }

    // Don't allow deleting admins
    if (user.role === "admin") {
      throw new SuperAdminError(
        "Cannot delete organization admin. Please delete the organization instead.",
        SuperAdminErrorCodes.USER_NOT_FOUND,
        400
      )
    }

    // Delete user
    await users.deleteOne({ _id: new ObjectId(userId) })

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: user.tenantId,
      action: "DELETE_USER",
      metadata: {
        userId,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
      ipAddress,
      userAgent,
    })
  }

  /**
   * Reset user password
   */
  async resetUserPassword(
    userId: string,
    newPassword: string,
    actorId: string,
    actorEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = await getDatabase()
    const users = db.collection("users")

    // Validate user exists
    const user = await users.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      throw new SuperAdminError(
        "User not found",
        SuperAdminErrorCodes.USER_NOT_FOUND,
        404
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    )

    // Send email notification to user
    try {
      await sendEmail({
        to: user.email,
        subject: "Your password has been reset",
        html: `
          <h2>Password Reset</h2>
          <p>Hello ${user.firstName},</p>
          <p>Your password has been reset by the system administrator.</p>
          <p>Your new password is: <strong>${newPassword}</strong></p>
          <p>Please log in and change your password immediately.</p>
          <p>If you did not request this change, please contact support immediately.</p>
        `,
      })
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      // Don't fail the operation if email fails
    }

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: user.tenantId,
      action: "RESET_PASSWORD",
      metadata: {
        userId,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
      },
      ipAddress,
      userAgent,
    })
  }

  /**
   * Send email to a user
   */
  async sendEmailToUser(
    userId: string,
    subject: string,
    body: string,
    actorId: string,
    actorEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const db = await getDatabase()
    const users = db.collection("users")

    // Validate user exists
    const user = await users.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      throw new SuperAdminError(
        "User not found",
        SuperAdminErrorCodes.USER_NOT_FOUND,
        404
      )
    }

    // Send email
    await sendEmail({
      to: user.email,
      subject,
      html: body,
    })

    // Create audit log
    await this.auditService.createLog({
      actorId,
      actorEmail,
      tenantId: user.tenantId,
      action: "EXPORT_DATA", // Reuse for email sending
      metadata: {
        userId,
        userEmail: user.email,
        emailSubject: subject,
        action: "send_email",
      },
      ipAddress,
      userAgent,
    })
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string): Promise<any> {
    const db = await getDatabase()
    const users = db.collection("users")

    const user = await users.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      throw new SuperAdminError(
        "User not found",
        SuperAdminErrorCodes.USER_NOT_FOUND,
        404
      )
    }

    // Get organization info
    const organizations = db.collection("organizations")
    const organization = await organizations.findOne({
      _id: new ObjectId(user.tenantId),
    })

    return {
      ...user,
      organization,
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number
    activeUsers: number
    adminUsers: number
    staffUsers: number
    recentSignups: number
  }> {
    const db = await getDatabase()
    const users = db.collection("users")

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [totalUsers, activeUsers, adminUsers, staffUsers, recentSignups] =
      await Promise.all([
        users.countDocuments(),
        users.countDocuments({ isActive: true }),
        users.countDocuments({ role: "admin" }),
        users.countDocuments({ role: "staff" }),
        users.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ])

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      staffUsers,
      recentSignups,
    }
  }
}

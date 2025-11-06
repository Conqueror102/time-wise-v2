// Analytics Service - Handles dashboard statistics and system analytics

import { getDatabase } from "@/lib/mongodb"
import { getUTCDate, subtractDaysUTC } from "@/lib/utils/date"
import {
  DashboardStats,
  RevenueData,
  OrgGrowthData,
  SubscriptionData,
  PaymentRateData,
  TenantActivity,
  TimePeriod,
  PlatformStatsCache,
} from "@/lib/types/super-admin"
import { ObjectId } from "mongodb"

/**
 * Staff ratio data
 */
export interface StaffRatioData {
  active: number
  inactive: number
  total: number
  activePercentage: number
}

/**
 * Analytics Service - Provides platform-wide analytics and metrics
 */
export class AnalyticsService {
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.getCachedMetric("dashboard_stats", async () => {
      const db = await getDatabase()

      const [
        totalOrganizations,
        totalActiveUsers,
        totalActiveSubscriptions,
        totalRevenue,
        mrr,
        activeTenants,
        suspendedTenants,
        dailyCheckins,
      ] = await Promise.all([
        this.getTotalOrganizations(),
        this.getTotalActiveUsers(),
        this.getTotalActiveSubscriptions(),
        this.getTotalRevenue(),
        this.getMRR(),
        this.getActiveTenants(),
        this.getSuspendedTenants(),
        this.getDailyCheckins(),
      ])

      return {
        totalOrganizations,
        totalActiveUsers,
        totalActiveSubscriptions,
        totalRevenue,
        mrr,
        activeTenants,
        suspendedTenants,
        dailyCheckins,
      }
    })
  }

  /**
   * Get revenue growth data
   */
  async getRevenueGrowth(period: TimePeriod): Promise<RevenueData[]> {
    const cacheKey = `revenue_growth_${period}`

    return this.getCachedMetric(cacheKey, async () => {
      const db = await getDatabase()
      const webhooks = db.collection("paystack_webhooks")

      // Calculate date range based on period
      const now = getUTCDate()
      let startDate: Date

      switch (period) {
        case "day":
          startDate = subtractDaysUTC(now, 30) // Last 30 days
          break
        case "week":
          startDate = subtractDaysUTC(now, 12 * 7) // Last 12 weeks
          break
        case "month":
          startDate = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - 12,
            now.getUTCDate()
          )) // Last 12 months
          break
        case "year":
          startDate = new Date(Date.UTC(
            now.getUTCFullYear() - 5,
            now.getUTCMonth(),
            now.getUTCDate()
          )) // Last 5 years
          break
        default:
          startDate = subtractDaysUTC(now, 30) // Default to last 30 days
      }

      const revenueData = await webhooks
        .aggregate([
          {
            $match: {
              event: { $in: ["charge.success", "invoice.payment_success"] },
              status: "success",
              timestamp: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format:
                    period === "day"
                      ? "%Y-%m-%d"
                      : period === "week"
                        ? "%Y-W%V"
                        : period === "month"
                          ? "%Y-%m"
                          : "%Y",
                  date: "$timestamp",
                },
              },
              amount: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              date: "$_id",
              amount: { $divide: ["$amount", 100] }, // Convert from kobo to naira
              currency: "NGN",
            },
          },
        ])
        .toArray()

      return revenueData as RevenueData[]
    })
  }

  /**
   * Get organization growth data
   */
  async getOrganizationGrowth(): Promise<OrgGrowthData[]> {
    return this.getCachedMetric("org_growth", async () => {
      const db = await getDatabase()
      const organizations = db.collection("organizations")

      const growthData = await organizations
        .aggregate([
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 12 }, // Last 12 months
          {
            $project: {
              _id: 0,
              month: "$_id",
              count: 1,
            },
          },
        ])
        .toArray()

      return growthData as OrgGrowthData[]
    })
  }

  /**
   * Get subscription distribution
   */
  async getSubscriptionDistribution(): Promise<SubscriptionData[]> {
    return this.getCachedMetric("subscription_distribution", async () => {
      const db = await getDatabase()
      const organizations = db.collection("organizations")

      const total = await organizations.countDocuments()

      const distribution = await organizations
        .aggregate([
          {
            $group: {
              _id: "$subscriptionTier",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              plan: "$_id",
              count: 1,
              percentage: {
                $multiply: [{ $divide: ["$count", total] }, 100],
              },
            },
          },
        ])
        .toArray()

      return distribution as SubscriptionData[]
    })
  }

  /**
   * Get payment success rate
   */
  async getPaymentSuccessRate(): Promise<PaymentRateData> {
    return this.getCachedMetric("payment_success_rate", async () => {
      const db = await getDatabase()
      const webhooks = db.collection("paystack_webhooks")

      const [successful, failed] = await Promise.all([
        webhooks.countDocuments({
          event: { $in: ["charge.success", "invoice.payment_success"] },
          status: "success",
        }),
        webhooks.countDocuments({
          event: "invoice.payment_failed",
          status: "failed",
        }),
      ])

      const total = successful + failed
      const successRate = total > 0 ? (successful / total) * 100 : 0

      return {
        successful,
        failed,
        successRate,
      }
    })
  }

  /**
   * Get today's check-ins count
   */
  async getTodayCheckins(): Promise<number> {
    const db = await getDatabase()
    const attendance = db.collection("attendance")

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await attendance.countDocuments({
      checkInTime: { $gte: today },
    })
  }

  /**
   * Get today's late arrivals count
   */
  async getTodayLateArrivals(): Promise<number> {
    const db = await getDatabase()
    const attendance = db.collection("attendance")

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return await attendance.countDocuments({
      checkInTime: { $gte: today },
      isLate: true,
    })
  }

  /**
   * Get total attendance logs count
   */
  async getTotalAttendanceLogs(): Promise<number> {
    const db = await getDatabase()
    const attendance = db.collection("attendance")

    return await attendance.countDocuments()
  }

  /**
   * Get active vs inactive staff ratio
   */
  async getActiveVsInactiveStaff(): Promise<StaffRatioData> {
    const db = await getDatabase()
    const users = db.collection("users")

    const [active, total] = await Promise.all([
      users.countDocuments({ isActive: true, role: "staff" }),
      users.countDocuments({ role: "staff" }),
    ])

    const inactive = total - active
    const activePercentage = total > 0 ? (active / total) * 100 : 0

    return {
      active,
      inactive,
      total,
      activePercentage,
    }
  }

  /**
   * Get photo verification rate
   */
  async getPhotoVerificationRate(): Promise<number> {
    const db = await getDatabase()
    const attendance = db.collection("attendance")

    const [withPhoto, total] = await Promise.all([
      attendance.countDocuments({ photoUrl: { $exists: true, $ne: null } }),
      attendance.countDocuments(),
    ])

    return total > 0 ? (withPhoto / total) * 100 : 0
  }

  /**
   * Get most active tenants
   */
  async getMostActiveTenants(limit: number = 10): Promise<TenantActivity[]> {
    const db = await getDatabase()
    const attendance = db.collection("attendance")

    const activeTenants = await attendance
      .aggregate([
        {
          $group: {
            _id: "$tenantId",
            totalCheckins: { $sum: 1 },
          },
        },
        { $sort: { totalCheckins: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "organizations",
            localField: "_id",
            foreignField: "_id",
            as: "organization",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { tenantId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$tenantId", "$$tenantId"] },
                  isActive: true,
                },
              },
              { $count: "count" },
            ],
            as: "activeUsersCount",
          },
        },
        {
          $project: {
            _id: 0,
            organizationId: { $toString: "$_id" },
            organizationName: {
              $arrayElemAt: ["$organization.name", 0],
            },
            totalCheckins: 1,
            activeUsers: {
              $ifNull: [
                { $arrayElemAt: ["$activeUsersCount.count", 0] },
                0,
              ],
            },
          },
        },
      ])
      .toArray()

    return activeTenants as TenantActivity[]
  }

  // Private helper methods

  private async getTotalOrganizations(): Promise<number> {
    const db = await getDatabase()
    return await db.collection("organizations").countDocuments()
  }

  private async getTotalActiveUsers(): Promise<number> {
    const db = await getDatabase()
    return await db.collection("users").countDocuments({ isActive: true })
  }

  private async getTotalActiveSubscriptions(): Promise<number> {
    const db = await getDatabase()
    return await db
      .collection("organizations")
      .countDocuments({ subscriptionStatus: "active" })
  }

  private async getTotalRevenue(): Promise<number> {
    const db = await getDatabase()
    const webhooks = db.collection("paystack_webhooks")

    const result = await webhooks
      .aggregate([
        {
          $match: {
            event: { $in: ["charge.success", "invoice.payment_success"] },
            status: "success",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray()

    return result.length > 0 ? result[0].total / 100 : 0 // Convert from kobo to naira
  }

  private async getMRR(): Promise<number> {
    const db = await getDatabase()
    const organizations = db.collection("organizations")

    const activeSubs = await organizations
      .aggregate([
        {
          $match: { subscriptionStatus: "active" },
        },
        {
          $lookup: {
            from: "paystack_webhooks",
            let: { tenantId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$tenantId", "$$tenantId"] },
                  event: "subscription.create",
                  status: "success",
                },
              },
              { $sort: { timestamp: -1 } },
              { $limit: 1 },
            ],
            as: "subscription",
          },
        },
        {
          $project: {
            amount: { $arrayElemAt: ["$subscription.amount", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray()

    return activeSubs.length > 0 ? activeSubs[0].total / 100 : 0
  }

  private async getActiveTenants(): Promise<number> {
    const db = await getDatabase()
    return await db.collection("organizations").countDocuments({ status: "active" })
  }

  private async getSuspendedTenants(): Promise<number> {
    const db = await getDatabase()
    return await db
      .collection("organizations")
      .countDocuments({ status: "suspended" })
  }

  private async getDailyCheckins(): Promise<number> {
    return this.getTodayCheckins()
  }

  /**
   * Cache helper methods
   */
  private async getCachedMetric<T>(
    key: string,
    calculator: () => Promise<T>
  ): Promise<T> {
    const db = await getDatabase()
    const cache = db.collection<PlatformStatsCache>("platform_stats_cache")

    // Check cache
    const cached = await cache.findOne({
      metric: key,
      expiresAt: { $gt: new Date() },
    })

    if (cached) {
      return cached.value as T
    }

    // Calculate and cache
    const value = await calculator()

    await cache.insertOne({
      _id: new ObjectId(),
      metric: key,
      value: value as any,
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.CACHE_TTL),
    })

    return value
  }

  /**
   * Clear cache for a specific metric or all metrics
   */
  async clearCache(metric?: string): Promise<void> {
    const db = await getDatabase()
    const cache = db.collection<PlatformStatsCache>("platform_stats_cache")

    if (metric) {
      await cache.deleteMany({ metric })
    } else {
      await cache.deleteMany({})
    }
  }
}

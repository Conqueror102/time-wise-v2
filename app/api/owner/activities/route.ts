import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    const db = await getDatabase()

    // Get recent activities from different sources
    const [
      recentOrganizations,
      recentUsers,
      recentPayments,
      recentCheckins,
    ] = await Promise.all([
      // Recent organizations (last 10)
      db
        .collection("organizations")
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),

      // Recent users (last 10)
      db
        .collection("users")
        .aggregate([
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "organizations",
              let: { tenantId: { $toObjectId: "$tenantId" } },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$tenantId"] } } },
                { $project: { name: 1 } },
              ],
              as: "organization",
            },
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              role: 1,
              createdAt: 1,
              organizationName: { $arrayElemAt: ["$organization.name", 0] },
            },
          },
        ])
        .toArray(),

      // Recent successful payments (last 10)
      db
        .collection("paystack_webhooks")
        .find({
          event: { $in: ["charge.success", "invoice.payment_success"] },
          status: "success",
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray(),

      // Recent check-ins (last 10)
      db
        .collection("attendance")
        .aggregate([
          { $sort: { checkInTime: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $lookup: {
              from: "organizations",
              let: { tenantId: { $toObjectId: "$tenantId" } },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$tenantId"] } } },
                { $project: { name: 1 } },
              ],
              as: "organization",
            },
          },
          {
            $project: {
              _id: 1,
              checkInTime: 1,
              isLate: 1,
              userName: {
                $concat: [
                  { $arrayElemAt: ["$user.firstName", 0] },
                  " ",
                  { $arrayElemAt: ["$user.lastName", 0] },
                ],
              },
              organizationName: { $arrayElemAt: ["$organization.name", 0] },
            },
          },
        ])
        .toArray(),
    ])

    // Combine and format activities
    const activities: any[] = []

    // Add organizations
    recentOrganizations.forEach((org) => {
      activities.push({
        id: org._id.toString(),
        type: "organization_created",
        title: "New Organization",
        description: `${org.name} signed up`,
        metadata: {
          organizationName: org.name,
          subdomain: org.subdomain,
          plan: org.subscriptionTier,
        },
        timestamp: org.createdAt,
        icon: "building",
        color: "blue",
      })
    })

    // Add users
    recentUsers.forEach((user: any) => {
      activities.push({
        id: user._id.toString(),
        type: "user_created",
        title: "New User",
        description: `${user.firstName} ${user.lastName} joined ${user.organizationName || "Unknown"}`,
        metadata: {
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          organizationName: user.organizationName,
        },
        timestamp: user.createdAt,
        icon: "user",
        color: "green",
      })
    })

    // Add payments
    recentPayments.forEach((payment) => {
      activities.push({
        id: payment._id.toString(),
        type: "payment_success",
        title: "Payment Received",
        description: `${payment.organizationName || "Organization"} paid ₦${((payment.amount || 0) / 100).toLocaleString()}`,
        metadata: {
          organizationName: payment.organizationName,
          amount: payment.amount,
          planCode: payment.planCode,
        },
        timestamp: payment.timestamp,
        icon: "dollar",
        color: "emerald",
      })
    })

    // Add check-ins
    recentCheckins.forEach((checkin: any) => {
      activities.push({
        id: checkin._id.toString(),
        type: "checkin",
        title: checkin.isLate ? "Late Check-in" : "Check-in",
        description: `${checkin.userName} checked in at ${checkin.organizationName}`,
        metadata: {
          userName: checkin.userName,
          organizationName: checkin.organizationName,
          isLate: checkin.isLate,
        },
        timestamp: checkin.checkInTime,
        icon: "clock",
        color: checkin.isLate ? "orange" : "purple",
      })
    })

    // Sort by timestamp (most recent first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Return top 50 activities
    return NextResponse.json({
      activities: activities.slice(0, 50),
      total: activities.length,
    })
  } catch (error: any) {
    console.error("Get activities error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch activities" },
      { status: 500 }
    )
  }
}

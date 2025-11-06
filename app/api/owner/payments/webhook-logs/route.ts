import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { getDatabase } from "@/lib/mongodb"
import { AuditService } from "@/lib/services/audit"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "50")
    const event = searchParams.get("event") || ""
    const status = searchParams.get("status") || ""

    // Build query
    const db = await getDatabase()
    const webhooks = db.collection("paystack_webhooks")

    const query: any = {}
    if (event) query.event = event
    if (status) query.status = status

    // Pagination
    const skip = (page - 1) * perPage

    // Get webhook logs
    const [logs, total] = await Promise.all([
      webhooks
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(perPage)
        .toArray(),
      webhooks.countDocuments(query),
    ])

    // Log action
    const auditService = new AuditService()
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_PAYMENTS",
      metadata: { type: "webhook_logs", page, perPage },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error: any) {
    console.error("Get webhook logs error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch webhook logs" },
      { status: 500 }
    )
  }
}

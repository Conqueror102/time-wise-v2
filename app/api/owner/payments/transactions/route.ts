import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { getAllTransactions } from "@/lib/services/paystack"
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
    const from = searchParams.get("from") || undefined
    const to = searchParams.get("to") || undefined

    // Get transactions from Paystack
    const result = await getAllTransactions({ page, perPage, from, to })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Log action
    const auditService = new AuditService()
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_PAYMENTS",
      metadata: { type: "transactions", page, perPage },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({
      transactions: result.transactions,
      meta: result.meta,
    })
  } catch (error: any) {
    console.error("Get transactions error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}

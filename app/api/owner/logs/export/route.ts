import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { AuditService } from "@/lib/services/audit"
import { AuditAction } from "@/lib/types/super-admin"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const action = searchParams.get("action") as AuditAction | ""
    const tenantId = searchParams.get("tenantId") || ""
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined

    // Export audit logs to CSV
    const auditService = new AuditService()
    const csvContent = await auditService.exportLogs({
      search,
      action: action || undefined,
      tenantId: tenantId || undefined,
      dateFrom,
      dateTo,
    })

    // Log this action
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "EXPORT_DATA",
      metadata: { type: "audit_logs", search, action, tenantId },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    })

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Export audit logs error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to export audit logs" },
      { status: 500 }
    )
  }
}

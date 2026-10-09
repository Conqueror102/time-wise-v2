import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { OrganizationService } from "@/lib/services/organization"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Suspend organization
    const orgService = new OrganizationService()
    await orgService.suspendOrganization(
      id,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request)
    )

    return NextResponse.json({
      success: true,
      message: "Organization suspended successfully",
    })
  } catch (error: any) {
    console.error("Suspend organization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to suspend organization" },
      { status: error.statusCode || 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { OrganizationService } from "@/lib/services/organization"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Activate organization
    const orgService = new OrganizationService()
    await orgService.activateOrganization(
      params.id,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request)
    )

    return NextResponse.json({
      success: true,
      message: "Organization activated successfully",
    })
  } catch (error: any) {
    console.error("Activate organization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to activate organization" },
      { status: error.statusCode || 500 }
    )
  }
}

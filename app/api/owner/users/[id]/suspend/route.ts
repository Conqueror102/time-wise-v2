import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { UserManagementService } from "@/lib/services/user-management"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Suspend user
    const userService = new UserManagementService()
    await userService.suspendUser(
      params.id,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request)
    )

    return NextResponse.json({
      success: true,
      message: "User suspended successfully",
    })
  } catch (error: any) {
    console.error("Suspend user error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to suspend user" },
      { status: error.statusCode || 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { UserManagementService } from "@/lib/services/user-management"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Activate user
    const userService = new UserManagementService()
    await userService.activateUser(
      params.id,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request)
    )

    return NextResponse.json({
      success: true,
      message: "User activated successfully",
    })
  } catch (error: any) {
    console.error("Activate user error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to activate user" },
      { status: error.statusCode || 500 }
    )
  }
}

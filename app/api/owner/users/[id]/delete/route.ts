import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { UserManagementService } from "@/lib/services/user-management"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Delete user
    const userService = new UserManagementService()
    await userService.deleteUser(
      params.id,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request)
    )

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: error.statusCode || 500 }
    )
  }
}

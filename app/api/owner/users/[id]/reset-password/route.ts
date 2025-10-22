import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { UserManagementService } from "@/lib/services/user-management"
import { getIpAddress, getUserAgent } from "@/lib/utils/request"

/**
 * Generate random password
 */
function generateRandomPassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)

    // Generate new password
    const newPassword = generateRandomPassword()

    // Reset user password
    const userService = new UserManagementService()
    await userService.resetUserPassword(
      params.id,
      newPassword,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request)
    )

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. User has been notified via email.",
      newPassword, // Only return in response for super admin to see
    })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: error.statusCode || 500 }
    )
  }
}

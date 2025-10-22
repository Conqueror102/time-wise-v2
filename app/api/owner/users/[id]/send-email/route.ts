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

    // Parse request body
    const body = await request.json()
    const { subject, message } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

    // Send email to user
    const userService = new UserManagementService()
    await userService.sendEmailToUser(
      params.id,
      subject,
      message,
      context.userId,
      context.email,
      getIpAddress(request),
      getUserAgent(request)
    )

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    })
  } catch (error: any) {
    console.error("Send email error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: error.statusCode || 500 }
    )
  }
}

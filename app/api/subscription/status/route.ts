import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getSubscriptionStatus } from "@/lib/subscription/subscription-manager"
import { withErrorHandler } from "@/lib/middleware/error-handler"
import { TenantError, ErrorCodes } from "@/lib/types"

export const dynamic = 'force-dynamic'

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Get token from Authorization header
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    throw new TenantError(
      "No token provided",
      ErrorCodes.UNAUTHORIZED,
      401
    )
  }

  const token = authHeader.split(" ")[1]
  if (!token) {
    throw new TenantError(
      "Invalid token format",
      ErrorCodes.UNAUTHORIZED,
      401
    )
  }

  // Verify JWT token
  const decoded = verifyToken(token)
  if (!decoded?.tenantId) {
    throw new TenantError(
      "Invalid or expired token",
      ErrorCodes.UNAUTHORIZED,
      401
    )
  }

  const status = await getSubscriptionStatus(decoded.tenantId)

  return NextResponse.json(status)
})

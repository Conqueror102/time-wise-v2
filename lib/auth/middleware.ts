/**
 * Authentication middleware for API routes
 */

import { NextRequest } from "next/server"
import { verifyToken, extractTokenFromHeader } from "./jwt"
import { TenantContext, TenantError, ErrorCodes, UserRole } from "@/lib/types"

/**
 * Extract and verify authentication from request
 * Returns tenant context or throws error
 */
export async function authenticate(request: NextRequest): Promise<TenantContext> {
  const authHeader = request.headers.get("Authorization")
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    throw new TenantError(
      "Authentication required. Please provide a valid token.",
      ErrorCodes.UNAUTHORIZED,
      401
    )
  }

  const payload = verifyToken(token)

  return {
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
    email: payload.email,
  }
}

/**
 * Require specific roles for access
 */
export function requireRole(
  context: TenantContext,
  allowedRoles: UserRole[]
): void {
  if (!allowedRoles.includes(context.role)) {
    throw new TenantError(
      "Insufficient permissions to access this resource",
      ErrorCodes.UNAUTHORIZED,
      403
    )
  }
}

/**
 * Verify tenant context matches the requested tenant
 */
export function verifyTenantAccess(
  context: TenantContext,
  requestedTenantId: string
): void {
  if (context.role === "super_admin") {
    // Super admin can access any tenant
    return
  }

  if (context.tenantId !== requestedTenantId) {
    throw new TenantError(
      "Cross-tenant access denied",
      ErrorCodes.CROSS_TENANT_ACCESS,
      403
    )
  }
}

/**
 * Authentication helper for API routes
 * Usage in API route:
 * 
 * export async function GET(request: NextRequest) {
 *   const context = await withAuth(request)
 *   // ... use context.tenantId, context.userId, etc.
 * }
 */
export async function withAuth(
  request: NextRequest,
  options?: {
    allowedRoles?: UserRole[]
  }
): Promise<TenantContext> {
  const context = await authenticate(request)

  if (options?.allowedRoles) {
    requireRole(context, options.allowedRoles)
  }

  return context
}

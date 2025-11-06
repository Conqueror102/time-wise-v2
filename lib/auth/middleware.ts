/**
 * Authentication middleware for API routes
 */

import { NextRequest } from "next/server"
import { verifyToken, extractTokenFromHeader } from "./jwt"
import { TenantContext, TenantError, ErrorCodes, UserRole } from "@/lib/types"

interface AuthOptions {
  allowedRoles?: UserRole[]
}

/**
 * Extract and verify authentication from request
 * Returns tenant context or throws TenantError
 */
export async function authenticate(request: NextRequest): Promise<TenantContext> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    throw new TenantError(
      "Authentication required. Please login to continue.",
      ErrorCodes.UNAUTHORIZED,
      401
    )
  }

  let payload: any
  try {
    payload = verifyToken(token)
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      throw new TenantError(
        "Your session has expired. Please login again.",
        ErrorCodes.TOKEN_EXPIRED,
        401
      )
    }
    throw new TenantError(
      "Invalid authentication token. Please login again.",
      ErrorCodes.TOKEN_INVALID,
      401
    )
  }

  if (!payload?.userId || !payload?.tenantId) {
    throw new TenantError(
      "Invalid token format. Please login again.",
      ErrorCodes.TOKEN_INVALID,
      401
    )
  }

  // Build TenantContext to return
  const context: TenantContext = {
    tenantId: payload.tenantId,
    user: {
      _id: payload.userId,
      role: payload.role as UserRole,
      email: payload.email,
    },
    organization: payload.organization ? { name: payload.organization.name, status: payload.organization.status } : undefined,
  }

  return context
}

/**
 * Require that the context user has one of the allowed roles
 */
export function requireRole(context: TenantContext, allowedRoles: UserRole[]) {
  if (!context.user || !allowedRoles.includes(context.user.role)) {
    throw new TenantError(
      "Insufficient permissions to access this resource",
      ErrorCodes.INSUFFICIENT_PERMISSIONS,
      403
    )
  }
}

/**
 * Verify tenant context matches the requested tenant
 */
export function verifyTenantAccess(context: TenantContext, requestedTenantId: string) {
  if (context.user && context.user.role === "super_admin") return

  if (context.tenantId !== requestedTenantId) {
    throw new TenantError(
      "Cross-tenant access denied",
      ErrorCodes.CROSS_TENANT_ACCESS,
      403
    )
  }
}

/**
 * Helper wrapper to use in API routes
 */
export async function withAuth(request: NextRequest, options: AuthOptions = {}): Promise<TenantContext> {
  const context = await authenticate(request)

  if (options.allowedRoles && options.allowedRoles.length > 0) {
    requireRole(context, options.allowedRoles)
  }

  return context
}

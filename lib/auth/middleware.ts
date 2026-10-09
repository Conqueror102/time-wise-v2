/**
 * Authentication middleware for API routes
 */

import { NextRequest } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
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

  await assertAccountActive(payload.userId, payload.tenantId)

  // Build TenantContext to return
  const context: TenantContext = {
    tenantId: payload.tenantId,
    userId: payload.userId,
    role: payload.role as UserRole,
    email: payload.email,
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
 * Tokens stay valid for 24h, so re-check that the user and their organization
 * have not been suspended or deleted since the token was issued.
 */
async function assertAccountActive(userId: string, tenantId: string) {
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(tenantId)) {
    throw new TenantError("Invalid token format. Please login again.", ErrorCodes.TOKEN_INVALID, 401)
  }

  const db = await getDatabase()
  const [user, organization] = await Promise.all([
    db.collection("users").findOne(
      { _id: new ObjectId(userId), tenantId },
      { projection: { isActive: 1 } }
    ),
    db.collection("organizations").findOne(
      { _id: new ObjectId(tenantId) },
      { projection: { status: 1 } }
    ),
  ])

  if (!user || user.isActive === false) {
    throw new TenantError(
      "Your account has been deactivated. Please contact your administrator.",
      ErrorCodes.ACCOUNT_DEACTIVATED,
      401
    )
  }

  if (!organization || organization.status === "suspended" || organization.status === "cancelled") {
    throw new TenantError(
      "Your organization's account is not active. Please contact support.",
      ErrorCodes.TENANT_SUSPENDED,
      403
    )
  }
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

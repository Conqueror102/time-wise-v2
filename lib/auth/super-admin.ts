/**
 * Super Admin Authentication Middleware
 * Handles authentication and authorization for super admin routes
 */

import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { SuperAdminContext, SuperAdminJWTPayload } from "@/lib/types/super-admin"
import {
  SuperAdminError,
  createAuthError,
  createTokenExpiredError,
  createInsufficientPermissionsError,
} from "@/lib/errors/super-admin-errors"
import { extractTokenFromHeader } from "./jwt"

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const TOKEN_EXPIRATION = "24h" // 24 hours

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("⚠️  WARNING: Using default JWT_SECRET in production. Please set JWT_SECRET environment variable!")
}

/**
 * Generate JWT token for super admin
 */
export function generateSuperAdminToken(payload: {
  userId: string
  email: string
}): string {
  const tokenPayload: Omit<SuperAdminJWTPayload, "iat" | "exp"> = {
    userId: payload.userId,
    role: "super_admin",
    email: payload.email,
  }

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  })
}

/**
 * Verify super admin JWT token
 */
export function verifySuperAdminToken(token: string): SuperAdminJWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SuperAdminJWTPayload

    // Validate required fields
    if (!decoded.userId || !decoded.email || decoded.role !== "super_admin") {
      throw createAuthError("Invalid token payload")
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createTokenExpiredError()
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw createAuthError("Invalid token")
    }
    if (error instanceof SuperAdminError) {
      throw error
    }
    throw createAuthError("Token verification failed")
  }
}

/**
 * Extract and verify super admin authentication from request
 * Returns super admin context or throws error
 */
export async function authenticateSuperAdmin(
  request: NextRequest
): Promise<SuperAdminContext> {
  const authHeader = request.headers.get("Authorization")
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    throw createAuthError("Authentication required. Please provide a valid token.")
  }

  const payload = verifySuperAdminToken(token)

  // Double-check role
  if (payload.role !== "super_admin") {
    throw createInsufficientPermissionsError()
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  }
}

/**
 * Authentication middleware for super admin API routes
 * 
 * Usage in API route:
 * 
 * export async function GET(request: NextRequest) {
 *   const context = await withSuperAdminAuth(request)
 *   // ... use context.userId, context.email, etc.
 * }
 */
export async function withSuperAdminAuth(
  request: NextRequest
): Promise<SuperAdminContext> {
  return authenticateSuperAdmin(request)
}

/**
 * Extract super admin context from request without throwing
 * Returns null if authentication fails
 */
export async function getSuperAdminContext(
  request: NextRequest
): Promise<SuperAdminContext | null> {
  try {
    return await authenticateSuperAdmin(request)
  } catch {
    return null
  }
}

/**
 * Decode super admin token without verification (use carefully)
 */
export function decodeSuperAdminToken(token: string): SuperAdminJWTPayload | null {
  try {
    return jwt.decode(token) as SuperAdminJWTPayload
  } catch {
    return null
  }
}

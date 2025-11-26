/**
 * JWT token generation and validation utilities
 */

import jwt from "jsonwebtoken"
import { JWTPayload, TenantError, ErrorCodes } from "@/lib/types"

// Get JWT secret from environment or use default for development
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const TOKEN_EXPIRATION = "24h" // 24 hours
const REFRESH_TOKEN_EXPIRATION = "7d" // 7 days

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("❌ CRITICAL: JWT_SECRET must be set in production environment!")
}

if (process.env.JWT_SECRET === "your-super-secret-jwt-key-change-in-production" && process.env.NODE_ENV === "production") {
  throw new Error("❌ CRITICAL: JWT_SECRET is using default value. Change it in production!")
}

/**
 * Generate access token with tenant context
 */
export function generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  })
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string, tenantId: string): string {
  return jwt.sign({ userId, tenantId, type: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  })
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    // Validate required fields
    if (!decoded.userId || !decoded.tenantId || !decoded.role) {
      throw new TenantError(
        "Invalid token payload",
        ErrorCodes.UNAUTHORIZED,
        401
      )
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TenantError(
        "Token has expired",
        ErrorCodes.UNAUTHORIZED,
        401
      )
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TenantError(
        "Invalid token",
        ErrorCodes.UNAUTHORIZED,
        401
      )
    }
    throw error
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  // Support both "Bearer <token>" and just "<token>"
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  
  return authHeader
}

/**
 * Decode token without verification (use carefully)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}

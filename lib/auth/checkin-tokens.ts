/**
 * Short-lived tokens for the public check-in kiosk and biometric enrollment.
 *
 * - Kiosk token: issued after the org passcode is verified; proves which tenant
 *   the kiosk belongs to. Check-in endpoints take the tenant from this token,
 *   never from the request body.
 * - Enrollment token: issued by an org admin for one staff member; required to
 *   register their face.
 * - Biometric proof: issued after a face is recognised server-side; required by
 *   the check-in endpoint for face check-ins.
 * - Photo token: short-lived link to one stored check-in photo, so an <img>
 *   tag can load it without sending the admin's access token.
 */

import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"
import { TenantError, ErrorCodes } from "@/lib/types"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const ISSUER = "timewise-checkin"

export const CHECKIN_TOKEN_HEADER = "x-checkin-token"

type TokenKind = "kiosk" | "enroll" | "biometric_proof" | "photo"

interface BaseClaims {
  kind: TokenKind
  tenantId: string
}

export interface KioskClaims extends BaseClaims {
  kind: "kiosk"
}

export interface EnrollClaims extends BaseClaims {
  kind: "enroll"
  staffId: string
}

export interface BiometricProofClaims extends BaseClaims {
  kind: "biometric_proof"
  staffId: string
  method: "face"
}

function sign(claims: BaseClaims & Record<string, unknown>, expiresIn: jwt.SignOptions["expiresIn"]): string {
  return jwt.sign(claims, JWT_SECRET, { expiresIn, issuer: ISSUER, audience: claims.kind })
}

function verify<T extends BaseClaims>(token: string | null | undefined, kind: TokenKind): T {
  if (!token) {
    throw new TenantError("Missing check-in authorization", ErrorCodes.UNAUTHORIZED, 401)
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: ISSUER, audience: kind }) as T
    if (decoded.kind !== kind || !decoded.tenantId) throw new Error("wrong token kind")
    return decoded
  } catch {
    const message = kind === "kiosk"
      ? "Check-in session expired. Please unlock the kiosk again."
      : "Invalid or expired authorization"
    throw new TenantError(message, ErrorCodes.UNAUTHORIZED, 401)
  }
}

export function signKioskToken(tenantId: string): string {
  return sign({ kind: "kiosk", tenantId }, "12h")
}

/** Verify the kiosk token sent in the `x-checkin-token` header */
export function verifyKioskRequest(request: NextRequest): KioskClaims {
  return verify<KioskClaims>(request.headers.get(CHECKIN_TOKEN_HEADER), "kiosk")
}

export function signEnrollmentToken(tenantId: string, staffId: string): string {
  return sign({ kind: "enroll", tenantId, staffId }, "24h")
}

export function verifyEnrollmentToken(token: string | null | undefined): EnrollClaims {
  return verify<EnrollClaims>(token, "enroll")
}

export function signBiometricProof(tenantId: string, staffId: string, method: "face"): string {
  return sign({ kind: "biometric_proof", tenantId, staffId, method }, "2m")
}

export function verifyBiometricProof(token: string | null | undefined): BiometricProofClaims {
  return verify<BiometricProofClaims>(token, "biometric_proof")
}

export interface PhotoClaims extends BaseClaims {
  kind: "photo"
  photoId: string
}

export function signPhotoToken(tenantId: string, photoId: string): string {
  return sign({ kind: "photo", tenantId, photoId }, "1h")
}

export function verifyPhotoToken(token: string | null | undefined): PhotoClaims {
  return verify<PhotoClaims>(token, "photo")
}

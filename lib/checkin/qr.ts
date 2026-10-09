/**
 * Signed staff QR codes.
 *
 * A QR code contains the organization, the staff ID and a signature made with
 * the server's secret. The check-in API only accepts a QR check-in with a valid
 * signature, so knowing someone's staff ID is not enough to check in "by QR".
 * (Changing JWT_SECRET invalidates every QR code; they are regenerated on the
 * Staff page and need reprinting.)
 */

import crypto from "crypto"

export const QR_VERSION = 2

const SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"

function signature(tenantId: string, staffId: string): string {
  return crypto.createHmac("sha256", SECRET).update(`qr:v${QR_VERSION}:${tenantId}:${staffId}`).digest("base64url").slice(0, 22)
}

/** Text encoded into a staff member's QR code */
export function buildStaffQrPayload(tenantId: string, staffId: string): string {
  const data = { tenantId, staffId, version: String(QR_VERSION), sig: signature(tenantId, staffId) }
  return Buffer.from(JSON.stringify(data)).toString("base64")
}

/** Staff ID from a scanned QR payload, or null if it isn't a valid code for this organization */
export function verifyStaffQrPayload(payload: unknown, tenantId: string): string | null {
  if (typeof payload !== "string" || payload.length > 1000) return null
  try {
    const data = JSON.parse(Buffer.from(payload.trim(), "base64").toString("utf8"))
    if (data?.version !== String(QR_VERSION) || data.tenantId !== tenantId || typeof data.staffId !== "string") return null
    const expected = Buffer.from(signature(tenantId, data.staffId))
    const given = Buffer.from(String(data.sig || ""))
    return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? data.staffId : null
  } catch {
    return null
  }
}

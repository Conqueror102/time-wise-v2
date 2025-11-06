/**
 * OTP Service - Generate and validate OTPs
 * Production-ready with security best practices
 */

import crypto from "crypto"
import { getUTCDate } from "@/lib/utils/date"

export interface OTPData {
  code: string
  expiresAt: Date
  attempts: number
  createdAt: Date
}

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3

/**
 * Generate a secure 6-digit OTP
 */
export function generateOTP(): string {
  // Use crypto for secure random number generation
  const buffer = crypto.randomBytes(4)
  const number = buffer.readUInt32BE(0)
  
  // Generate 6-digit code
  const otp = (number % 1000000).toString().padStart(OTP_LENGTH, "0")
  
  return otp
}

/**
 * Create OTP data with expiry
 */
export function createOTPData(): OTPData {
  const code = generateOTP()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  
  return {
    code,
    expiresAt,
    attempts: 0,
    createdAt: new Date(),
  }
}

/**
 * Validate OTP code
 */
export function validateOTP(
  inputCode: string,
  storedOTP: OTPData
): { valid: boolean; error?: string } {
  // Check if OTP exists
  if (!storedOTP) {
    return { valid: false, error: "No OTP found. Please request a new one." }
  }

  // Check if expired
  if (new Date() > storedOTP.expiresAt) {
    return { valid: false, error: "OTP has expired. Please request a new one." }
  }

  // Check max attempts
  if (storedOTP.attempts >= MAX_ATTEMPTS) {
    return {
      valid: false,
      error: "Too many failed attempts. Please request a new OTP.",
    }
  }

  // Validate code (constant-time comparison to prevent timing attacks)
  const inputBuffer = Buffer.from(inputCode)
  const storedBuffer = Buffer.from(storedOTP.code)

  if (inputBuffer.length !== storedBuffer.length) {
    return { valid: false, error: "Invalid OTP code." }
  }

  const isValid = crypto.timingSafeEqual(inputBuffer, storedBuffer)

  if (!isValid) {
    return { valid: false, error: "Invalid OTP code." }
  }

  return { valid: true }
}

/**
 * Hash OTP for storage (optional extra security layer)
 */
export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

/**
 * Generate password reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Create reset token data with expiry
 */
export function createResetTokenData() {
  const token = generateResetToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  
  return {
    token,
    expiresAt,
    createdAt: new Date(),
  }
}

/**
 * Check rate limiting for OTP requests
 */
export function checkRateLimit(
  lastRequests: Date[],
  now: Date = new Date()
): { allowed: boolean; error?: string } {
  // Filter requests within the time window
  const recentRequests = lastRequests.filter(
    (requestTime) => getUTCDate().getTime() - requestTime.getTime() < RATE_LIMIT_WINDOW_MS
  )

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      error: "Too many requests. Please wait a minute before trying again.",
    }
  }

  return { allowed: true }
}

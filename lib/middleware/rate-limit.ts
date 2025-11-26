/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks on critical endpoints
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitMap = new Map<string, RateLimitRecord>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limit configuration presets
 */
export const RateLimitPresets = {
  AUTH_LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  AUTH_REGISTER: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many registration attempts. Please try again in 1 hour.',
  },
  PAYMENT: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many payment requests. Please try again in a minute.',
  },
  API_DEFAULT: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.',
  },
  OTP: {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many OTP requests. Please try again in 15 minutes.',
  },
} as const

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

/**
 * Get client identifier (IP address)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback to connection IP
  return request.ip || 'unknown'
}

/**
 * Check if request should be rate limited
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // No record or expired - create new
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  // Increment count
  record.count++
  
  return {
    limited: false,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Apply rate limiting to a request
 * Returns NextResponse if rate limited, null otherwise
 */
export function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const identifier = getClientIdentifier(request)
  const result = rateLimit(identifier, config)

  if (result.limited) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
    
    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        },
      }
    )
  }

  // Add rate limit headers to response (handled by caller)
  return null
}

/**
 * Get rate limit headers for successful requests
 * Read-only operation that doesn't increment the counter
 */
export function getRateLimitHeaders(
  identifier: string,
  config: RateLimitConfig
): Record<string, string> {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  let remaining: number
  let resetTime: number

  if (!record || now > record.resetTime) {
    // No active window yet – everything still available
    remaining = config.maxRequests
    resetTime = now + config.windowMs
  } else {
    remaining = Math.max(0, config.maxRequests - record.count)
    resetTime = record.resetTime
  }

  return {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": new Date(resetTime).toISOString(),
  }
}

/**
 * Rate Limiting Middleware
 *
 * Fixed-window counters stored in MongoDB so limits hold across serverless
 * instances. Expired windows are removed by a TTL index.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

const COLLECTION = 'rate_limits'

/**
 * Rate limit configuration presets
 */
export const RateLimitPresets = {
  AUTH_LOGIN: {
    name: 'auth_login',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  AUTH_REGISTER: {
    name: 'auth_register',
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many registration attempts. Please try again in 1 hour.',
  },
  PAYMENT: {
    name: 'payment',
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many payment requests. Please try again in a minute.',
  },
  CHECKIN_PASSCODE: {
    name: 'checkin_passcode',
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many passcode attempts. Please try again in 15 minutes.',
  },
  API_DEFAULT: {
    name: 'api_default',
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.',
  },
} as const

export interface RateLimitConfig {
  name: string
  maxRequests: number
  windowMs: number
  message?: string
}

let indexReady: Promise<unknown> | null = null

/**
 * Get client identifier (IP address)
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Count a request against the limit for `identifier`
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
  const now = Date.now()
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs
  const resetTime = windowStart + config.windowMs

  const db = await getDatabase()
  const collection = db.collection<{ _id: string; count: number; expiresAt: Date }>(COLLECTION)

  if (!indexReady) {
    indexReady = collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch((err) => {
      indexReady = null
      console.error('Failed to create rate limit TTL index:', err)
    })
  }

  const record = await collection.findOneAndUpdate(
    { _id: `${config.name}:${identifier}:${windowStart}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetTime) } },
    { upsert: true, returnDocument: 'after' }
  )

  const count = record?.count ?? 1
  return {
    limited: count > config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
    resetTime,
  }
}

/**
 * Apply rate limiting to a request
 * Returns NextResponse if rate limited, null otherwise.
 * `key` narrows the limit further (e.g. per email) in addition to the client IP.
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  key?: string
): Promise<NextResponse | null> {
  const identifier = key ? `${getClientIdentifier(request)}:${key}` : getClientIdentifier(request)

  let result
  try {
    result = await rateLimit(identifier, config)
  } catch (error) {
    // Never lock users out because the limiter's storage is unavailable
    console.error('Rate limit check failed:', error)
    return null
  }

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

  return null
}

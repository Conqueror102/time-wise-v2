/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 */

export interface EnvConfig {
  MONGODB_URI: string
  JWT_SECRET: string
  PAYSTACK_SECRET_KEY: string
  PAYSTACK_PUBLIC_KEY: string
  NEXT_PUBLIC_APP_URL: string
  NODE_ENV: string
}

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const

/**
 * Validate that all required environment variables are set
 * Throws error in production if any are missing
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = []
  const warnings: string[] = []

  // Check for missing variables
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  // In production, missing variables are critical
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `❌ CRITICAL: Missing required environment variables in production:\n${missing.map(v => `  - ${v}`).join('\n')}`
    )
  }

  // Check for default/insecure values in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
      throw new Error('❌ CRITICAL: JWT_SECRET is using default value in production!')
    }
    
    if (process.env.MONGODB_URI?.includes('localhost') || process.env.MONGODB_URI?.includes('127.0.0.1')) {
      warnings.push('⚠️  WARNING: MONGODB_URI appears to be pointing to localhost in production')
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('\n' + warnings.join('\n') + '\n')
  }

  // In development, provide helpful warnings
  if (missing.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `⚠️  WARNING: Missing environment variables (using defaults):\n${missing.map(v => `  - ${v}`).join('\n')}\n`
    )
  }

  return {
    MONGODB_URI: process.env.MONGODB_URI || '',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
  }
}

/**
 * Get validated environment config
 * Call this at app startup
 */
export function getEnvConfig(): EnvConfig {
  return validateEnv()
}

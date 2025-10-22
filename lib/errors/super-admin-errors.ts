// Super Admin Error Types and Codes

/**
 * Custom error class for super admin operations
 */
export class SuperAdminError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
    this.name = "SuperAdminError"
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SuperAdminError)
    }
  }
}

/**
 * Error codes for super admin operations
 */
export const SuperAdminErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: "SUPER_ADMIN_UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  
  // Resource errors
  ORGANIZATION_NOT_FOUND: "ORGANIZATION_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  SUPER_ADMIN_NOT_FOUND: "SUPER_ADMIN_NOT_FOUND",
  
  // Operation errors
  CANNOT_DELETE_ACTIVE_ORG: "CANNOT_DELETE_ACTIVE_ORG",
  CANNOT_SUSPEND_SUSPENDED_ORG: "CANNOT_SUSPEND_SUSPENDED_ORG",
  CANNOT_ACTIVATE_ACTIVE_ORG: "CANNOT_ACTIVATE_ACTIVE_ORG",
  
  // External service errors
  PAYSTACK_API_ERROR: "PAYSTACK_API_ERROR",
  RESEND_API_ERROR: "RESEND_API_ERROR",
  AWS_REKOGNITION_ERROR: "AWS_REKOGNITION_ERROR",
  
  // Database errors
  DATABASE_ERROR: "DATABASE_ERROR",
  DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR",
  
  // Export errors
  EXPORT_FAILED: "EXPORT_FAILED",
  REPORT_GENERATION_FAILED: "REPORT_GENERATION_FAILED",
  
  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_DATE_RANGE: "INVALID_DATE_RANGE",
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const

/**
 * Helper function to create authentication error
 */
export function createAuthError(message: string = "Authentication required"): SuperAdminError {
  return new SuperAdminError(message, SuperAdminErrorCodes.UNAUTHORIZED, 401)
}

/**
 * Helper function to create invalid credentials error
 */
export function createInvalidCredentialsError(): SuperAdminError {
  return new SuperAdminError(
    "Invalid email or password",
    SuperAdminErrorCodes.INVALID_CREDENTIALS,
    401
  )
}

/**
 * Helper function to create token expired error
 */
export function createTokenExpiredError(): SuperAdminError {
  return new SuperAdminError(
    "Token has expired",
    SuperAdminErrorCodes.TOKEN_EXPIRED,
    401
  )
}

/**
 * Helper function to create insufficient permissions error
 */
export function createInsufficientPermissionsError(): SuperAdminError {
  return new SuperAdminError(
    "Super admin access required",
    SuperAdminErrorCodes.INSUFFICIENT_PERMISSIONS,
    403
  )
}

/**
 * Helper function to create not found error
 */
export function createNotFoundError(resource: string): SuperAdminError {
  return new SuperAdminError(
    `${resource} not found`,
    `${resource.toUpperCase()}_NOT_FOUND`,
    404
  )
}

/**
 * Helper function to create database error
 */
export function createDatabaseError(message: string = "Database operation failed"): SuperAdminError {
  return new SuperAdminError(message, SuperAdminErrorCodes.DATABASE_ERROR, 500)
}

/**
 * Helper function to create validation error
 */
export function createValidationError(message: string): SuperAdminError {
  return new SuperAdminError(message, SuperAdminErrorCodes.INVALID_INPUT, 400)
}

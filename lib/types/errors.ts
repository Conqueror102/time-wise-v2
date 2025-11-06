/**
 * Error handling types and utilities
 */

export enum ErrorCodes {
  // Authentication Errors
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  AUTH_ERROR = "AUTH_ERROR",

  // Tenant Errors
  TENANT_NOT_FOUND = "TENANT_NOT_FOUND",
  TENANT_SUSPENDED = "TENANT_SUSPENDED",
  CROSS_TENANT_ACCESS = "CROSS_TENANT_ACCESS",

  // Account Status Errors
  ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",

  // Database Errors
  DATABASE_ERROR = "DATABASE_ERROR",
  DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
  DATABASE_QUERY_ERROR = "DATABASE_QUERY_ERROR",

  // Validation Errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",

  // Permission Errors
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server Errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
}

export class TenantError extends Error {
  code: ErrorCodes
  statusCode: number
  details?: any

  constructor(
    message: string,
    code: ErrorCodes,
    statusCode: number = 500,
    details?: any
  ) {
    super(message)
    this.name = "TenantError"
    this.code = code
    this.statusCode = statusCode
    this.details = details

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, TenantError.prototype)
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details })
    }
  }
}
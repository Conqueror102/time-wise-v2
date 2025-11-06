/**
 * Authentication types
 */

import { ErrorCodes } from './errors'

export interface LoginResponse {
  ok: boolean
  accessToken?: string
  user?: any
  organization?: any
  error?: string
  code?: ErrorCodes
  email?: string
}

export const getAuthErrorMessage = (code?: ErrorCodes, defaultMessage: string = "Login failed"): string => {
  if (!code) return defaultMessage

  const errorMessages: Partial<Record<ErrorCodes, string>> = {
    [ErrorCodes.INVALID_CREDENTIALS]: "Invalid email or password",
    [ErrorCodes.EMAIL_NOT_VERIFIED]: "Email not verified. Please check your inbox for verification email",
    [ErrorCodes.ACCOUNT_DEACTIVATED]: "Your account has been deactivated. Please contact support",
    [ErrorCodes.ACCOUNT_LOCKED]: "Your account has been locked. Please contact support",
    [ErrorCodes.SUBSCRIPTION_EXPIRED]: "Your organization's subscription has expired",
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: "Too many login attempts. Please try again later",
    [ErrorCodes.SERVICE_UNAVAILABLE]: "Service is temporarily unavailable. Please try again later",
    [ErrorCodes.TOKEN_EXPIRED]: "Your session has expired. Please log in again",
    [ErrorCodes.TOKEN_INVALID]: "Invalid session. Please log in again",
    [ErrorCodes.DATABASE_ERROR]: "Unable to connect to service. Please try again later",
    [ErrorCodes.UNAUTHORIZED]: "Unauthorized access",
    [ErrorCodes.AUTH_ERROR]: "Authentication error",
    [ErrorCodes.DATABASE_CONNECTION_ERROR]: "Service connection error",
    [ErrorCodes.DATABASE_QUERY_ERROR]: "Service error",
    [ErrorCodes.VALIDATION_ERROR]: "Invalid input provided",
    [ErrorCodes.INVALID_INPUT]: "Invalid input provided",
    [ErrorCodes.MISSING_REQUIRED_FIELDS]: "Please fill in all required fields",
    [ErrorCodes.FORBIDDEN]: "Access denied",
    [ErrorCodes.INSUFFICIENT_PERMISSIONS]: "Insufficient permissions",
    [ErrorCodes.INTERNAL_SERVER_ERROR]: "An unexpected error occurred",
    [ErrorCodes.TENANT_NOT_FOUND]: "Tenant not found",
    [ErrorCodes.TENANT_SUSPENDED]: "Tenant account suspended",
    [ErrorCodes.CROSS_TENANT_ACCESS]: "Cross-tenant access denied",
  }

  return errorMessages[code] || defaultMessage
}
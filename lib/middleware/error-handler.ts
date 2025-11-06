/**
 * Global error handling middleware for API routes
 */

import { NextResponse } from "next/server"
import { TenantError, ErrorCodes } from "@/lib/types"
import { MongoServerError, MongoError } from "mongodb"

export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  // Handle TenantError (our custom error type)
  if (error instanceof TenantError) {
    return NextResponse.json(error.toJSON(), {
      status: error.statusCode
    })
  }

  // Handle MongoDB Errors
  if (error instanceof MongoError || error instanceof MongoServerError) {
    return NextResponse.json({
      error: "Database operation failed. Please try again later.",
      code: ErrorCodes.DATABASE_ERROR,
      statusCode: 503
    }, { status: 503 })
  }

  // Handle JWT Errors
  if (error instanceof Error && error.name === "JsonWebTokenError") {
    return NextResponse.json({
      error: "Invalid authentication token. Please login again.",
      code: ErrorCodes.TOKEN_INVALID,
      statusCode: 401
    }, { status: 401 })
  }

  if (error instanceof Error && error.name === "TokenExpiredError") {
    return NextResponse.json({
      error: "Your session has expired. Please login again.",
      code: ErrorCodes.TOKEN_EXPIRED,
      statusCode: 401
    }, { status: 401 })
  }

  // Handle other errors
  return NextResponse.json({
    error: "An unexpected error occurred. Please try again later.",
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    statusCode: 500
  }, { status: 500 })
}

export function withErrorHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
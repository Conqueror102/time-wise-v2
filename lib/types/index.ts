// Core multi-tenant types and interfaces

import { ObjectId } from "mongodb"

// ============================================
// User & Organization Types
// ============================================

export type UserRole = "super_admin" | "org_admin" | "manager" | "staff"
export type OrganizationStatus = "active" | "suspended" | "trial" | "cancelled"

// Authentication methods used across the app
export type AuthMethod = "manual" | "qr" | "face" | "fingerprint"

export interface TenantContext {
  tenantId: string
  // Backwards-compatible top-level fields
  userId?: string
  role?: UserRole
  email?: string

  // Nested user object (preferred)
  user?: {
    _id: string
    role: UserRole
    email: string
  }

  organization?: {
    name: string
    status: OrganizationStatus
  }
}

export interface Organization {
  _id?: ObjectId
  name: string
  subdomain: string
  adminEmail: string
  status: OrganizationStatus
  subscriptionTier: "starter" | "professional" | "enterprise"
  subscriptionStatus: "active" | "trial" | "cancelled"
  createdAt: Date
  updatedAt?: Date
  trialEndsAt?: Date
  settings?: OrganizationSettings
  allowedMethods?: AuthMethod[]
}

export interface User {
  _id?: ObjectId
  tenantId: string // Organization ID
  email: string
  password: string // Hashed
  role: UserRole
  firstName: string
  lastName: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt?: Date
  lastLogin?: Date
}

export interface OrganizationSettings {
  latenessTime: string // Format: "HH:MM"
  workStartTime: string // Format: "HH:MM"
  workEndTime: string // Format: "HH:MM"
  earlyDepartureTime?: string // Format: "HH:MM"
  maxStaff: number
  allowedMethods: AuthMethod[]
  timezone: string
  checkInPasscode?: string
  capturePhotos?: boolean // Toggle for automatic photo capture
  photoRetentionDays?: number // Days to keep photos (default 7)
}

// ============================================
// Staff & Attendance Types
// ============================================

export interface BiometricCredential {
  credentialId: string
  publicKey: string
  deviceName?: string
  registeredAt: Date
  lastUsed?: Date
}

export interface FaceData {
  faceId: string
  faceEmbedding?: string // For AI-based recognition
  faceImage?: string // Base64 image (fallback)
  registeredAt: Date
  lastUsed?: Date
}

export interface Staff {
  _id?: ObjectId
  tenantId: string
  staffId: string // Unique within tenant
  name: string
  email?: string
  department: string
  position: string
  qrCode: string
  isActive: boolean
  biometricCredentials?: BiometricCredential[] // Multiple fingerprint devices
  faceData?: FaceData // Face recognition data
  createdAt: Date
  updatedAt?: Date
}

export interface AttendanceLog {
  _id?: ObjectId
  tenantId: string
  staffId: string
  staffName: string
  department: string
  type: "check-in" | "check-out"
  status: "present" | "late" | "early" | "absent"
  timestamp: Date
  date: string // Format: "YYYY-MM-DD"
  isLate?: boolean
  isEarly?: boolean
  method: "qr" | "manual" | "face" | "fingerprint"
  location?: string
  notes?: string
  checkInPhoto?: string // Cloudinary URL or Base64 image captured at check-in
  checkOutPhoto?: string // Cloudinary URL or Base64 image captured at check-out
  checkInPhotoPublicId?: string // Cloudinary public ID for check-in photo
  checkOutPhotoPublicId?: string // Cloudinary public ID for check-out photo
  photosCapturedAt?: Date
  // Legacy fields for backward compatibility
  checkInTime?: Date
  checkOutTime?: Date
  checkInMethod?: string
  checkOutMethod?: string
}

// ============================================
// Authentication & Authorization Types
// ============================================

export interface JWTPayload {
  userId: string
  tenantId: string
  role: UserRole
  email: string
  iat?: number
  exp?: number
}

// TenantContext is declared earlier (uses nested `user` and backward-compatible top-level fields)

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

// ============================================
// QR Code Types
// ============================================

export interface QRCodeData {
  tenantId: string
  staffId: string
  version: string // For future compatibility
}

// ============================================
// API Request/Response Types
// ============================================

export interface RegisterOrganizationRequest {
  name: string
  subdomain: string
  adminEmail: string
  adminPassword: string
  firstName: string
  lastName: string
}

export interface RegisterOrganizationResponse {
  success: boolean
  organization: Organization
  user: Omit<User, "password">
  message: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  accessToken: string
  user: Omit<User, "password">
  organization: Organization
}

export interface RegisterStaffRequest {
  name: string
  email?: string
  department: string
  position: string
}

export interface CheckInRequest {
  staffId?: string
  qrData?: string
  method: "qr" | "manual"
  type: "check-in" | "check-out"
}

// ============================================
// Database Query Types
// ============================================

export interface TenantQuery {
  tenantId: string
  [key: string]: any
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// Error Types
// ============================================
// Re-export canonical error types from dedicated module
export * from "./errors"

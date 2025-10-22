/**
 * Database validation utilities
 */

import { TenantError, ErrorCodes } from "@/lib/types"

/**
 * Validate subdomain format
 */
export function validateSubdomain(subdomain: string): void {
  const errors: string[] = []

  if (subdomain.length < 3 || subdomain.length > 30) {
    errors.push("Subdomain must be between 3 and 30 characters")
  }

  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    errors.push("Subdomain can only contain lowercase letters, numbers, and hyphens")
  }

  if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
    errors.push("Subdomain cannot start or end with a hyphen")
  }

  if (subdomain.includes("--")) {
    errors.push("Subdomain cannot contain consecutive hyphens")
  }

  // Reserved subdomains
  const reserved = ["www", "api", "admin", "app", "mail", "ftp", "localhost", "dashboard"]
  if (reserved.includes(subdomain)) {
    errors.push("This subdomain is reserved and cannot be used")
  }

  if (errors.length > 0) {
    throw new TenantError(errors.join(". "), ErrorCodes.VALIDATION_ERROR, 400)
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    throw new TenantError(
      "Invalid email format",
      ErrorCodes.VALIDATION_ERROR,
      400
    )
  }
}

/**
 * Sanitize organization name
 */
export function sanitizeOrganizationName(name: string): string {
  return name.trim().substring(0, 100)
}

/**
 * Generate subdomain from organization name
 */
export function generateSubdomainFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 30) // Limit length
}

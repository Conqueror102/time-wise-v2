/**
 * Staff Management API - Multi-tenant aware
 * GET - List all staff for tenant
 * POST - Register new staff member
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, RegisterStaffRequest, TenantError } from "@/lib/types"
import { canAddStaff, PLAN_FEATURES } from "@/lib/features/feature-manager"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Generate unique staff ID within tenant
 */
async function generateUniqueStaffId(tenantDb: any, prefix: string = "STAFF"): Promise<string> {
  let staffId: string
  let exists = true
  let attempts = 0
  const maxAttempts = 10

  while (exists && attempts < maxAttempts) {
    // Generate random 4-digit number
    const random = Math.floor(1000 + Math.random() * 9000)
    staffId = `${prefix}${random}`
    
    const existingStaff = await tenantDb.findOne<Staff>("staff", { staffId })
    exists = !!existingStaff
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique staff ID")
  }

  return staffId!
}

/**
 * Generate QR code data for staff
 */
function generateQRData(tenantId: string, staffId: string): string {
  const qrData = {
    tenantId,
    staffId,
    version: "1.0",
  }
  return Buffer.from(JSON.stringify(qrData)).toString("base64")
}

/**
 * GET - List all staff members for authenticated tenant
 */
export async function GET(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Get all staff for this tenant
    const staff = await tenantDb.find<Staff>("staff", {}, {
      sort: { createdAt: -1 },
    })

    return NextResponse.json({
      success: true,
      staff,
      total: staff.length,
    })
  } catch (error) {
    console.error("Get staff error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    )
  }
}

/**
 * POST - Register new staff member
 */
export async function POST(request: NextRequest) {
  try {
    const context = await withAuth(request, {
      allowedRoles: ["org_admin", "manager"],
    })

    const body: RegisterStaffRequest = await request.json()
    const { name, email, department, position } = body

    // Validate required fields
    if (!name || !department || !position) {
      return NextResponse.json(
        { error: "Name, department, and position are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    // Check staff limit (unless in development mode)
    const isDevelopment = process.env.NODE_ENV === "development"
    if (!isDevelopment) {
      // Get organization to check subscription tier
      const organization = await tenantDb.findOne("organizations", { _id: context.tenantId })
      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        )
      }

      // Count current staff
      const currentStaffCount = await tenantDb.count("staff", {})
      
      // Check if can add more staff
      if (!canAddStaff(organization.subscriptionTier, currentStaffCount, isDevelopment)) {
        const maxStaff = PLAN_FEATURES[organization.subscriptionTier]?.maxStaff || 10
        return NextResponse.json(
          { 
            error: `Staff limit reached. Your ${organization.subscriptionTier} plan allows up to ${maxStaff} staff members. Please upgrade to add more.`,
            code: "STAFF_LIMIT_REACHED"
          },
          { status: 403 }
        )
      }
    }

    // Check if email already exists in this tenant (if provided)
    if (email) {
      const existingStaff = await tenantDb.findOne<Staff>("staff", { email })
      if (existingStaff) {
        return NextResponse.json(
          { error: "Staff member with this email already exists" },
          { status: 400 }
        )
      }
    }

    // Generate unique staff ID
    const staffId = await generateUniqueStaffId(tenantDb)

    // Generate QR code data
    const qrData = generateQRData(context.tenantId, staffId)

    // Import QR code generator
    const { generateQRCode } = await import("@/lib/utils/qr-generator")
    const qrCode = await generateQRCode(qrData)

    // Create staff member
    const newStaff = await tenantDb.insertOne<Staff>("staff", {
      staffId,
      name,
      email,
      department,
      position,
      qrCode,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)

    return NextResponse.json({
      success: true,
      message: "Staff registered successfully",
      staff: newStaff,
    })
  } catch (error) {
    console.error("Register staff error:", error)

    if (error instanceof TenantError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to register staff" },
      { status: 500 }
    )
  }
}

/**
 * Staff Management API - Multi-tenant aware
 * GET - List all staff for tenant
 * POST - Register new staff member
 */

import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { createTenantDatabase } from "@/lib/database/tenant-db"
import { withAuth } from "@/lib/auth"
import { Staff, RegisterStaffRequest, TenantError } from "@/lib/types"
import { generateQRCode } from "@/lib/utils/qr-generator"
import { buildStaffQrPayload, QR_VERSION } from "@/lib/checkin/qr"

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
    // Random 6-digit number; staff IDs must not be guessable
    const random = crypto.randomInt(100000, 1000000)
    staffId = `${prefix}${random}`
    
    const existingStaff = await tenantDb.findOne("staff", { staffId })
    exists = !!existingStaff
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique staff ID")
  }

  return staffId!
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

    // Replace QR codes from before they were signed (old printed badges stop working)
    for (const member of staff as any[]) {
      if (member.qrVersion !== QR_VERSION) {
        member.qrCode = await generateQRCode(buildStaffQrPayload(context.tenantId, member.staffId))
        member.qrVersion = QR_VERSION
        member.qrUpdatedAt = new Date()
        await tenantDb.updateOne<Staff>(
          "staff",
          { staffId: member.staffId },
          { $set: { qrCode: member.qrCode, qrVersion: QR_VERSION, qrUpdatedAt: member.qrUpdatedAt } as any }
        )
      }
    }

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
    if (![name, department, position].every((v) => typeof v === "string" && v.trim())) {
      return NextResponse.json(
        { error: "Name, department, and position are required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const tenantDb = createTenantDatabase(db, context.tenantId)

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

    // Check if email already exists in this tenant (if provided)
    if (normalizedEmail) {
      const existingStaff = await tenantDb.findOne<Staff>("staff", { email: normalizedEmail })
      if (existingStaff) {
        return NextResponse.json(
          { error: "Staff member with this email already exists" },
          { status: 400 }
        )
      }
    }

    // Generate unique staff ID
    const staffId = await generateUniqueStaffId(tenantDb)

    // Signed QR code: proves the person has their own code, not just their staff ID
    const qrCode = await generateQRCode(buildStaffQrPayload(context.tenantId, staffId))

    // Create staff member
    const newStaff = await tenantDb.insertOne<Staff>("staff", {
      staffId,
      name: name.trim(),
      email: normalizedEmail,
      department: department.trim(),
      position: position.trim(),
      qrCode,
      qrVersion: QR_VERSION,
      qrUpdatedAt: new Date(),
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

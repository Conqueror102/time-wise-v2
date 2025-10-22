/**
 * Database Migration Script
 * Migrates existing single-tenant data to multi-tenant structure
 * 
 * Usage: npx ts-node scripts/migrate-to-multitenant.ts
 */

import { MongoClient, ObjectId } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "staff_checkin"

async function migrate() {
  console.log("🚀 Starting multi-tenant migration...\n")

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB\n")

    const db = client.db(DB_NAME)

    // Step 1: Create default "Legacy" organization if data exists
    const existingStaff = await db.collection("staff").countDocuments()
    const existingAttendance = await db.collection("attendance").countDocuments()

    let legacyOrgId: string | null = null

    if (existingStaff > 0 || existingAttendance > 0) {
      console.log(`📊 Found ${existingStaff} staff and ${existingAttendance} attendance records`)
      console.log("Creating legacy organization...\n")

      const legacyOrg = {
        name: "Legacy Organization",
        subdomain: "legacy",
        adminEmail: "admin@legacy.local",
        status: "active" as const,
        subscriptionTier: "free" as const,
        subscriptionStatus: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          latenessTime: "09:00",
          workStartTime: "09:00",
          workEndTime: "17:00",
          maxStaff: 1000,
          allowedMethods: ["qr", "manual"],
          timezone: "UTC",
        },
      }

      const orgResult = await db.collection("organizations").insertOne(legacyOrg)
      legacyOrgId = orgResult.insertedId.toString()
      console.log(`✅ Created legacy organization: ${legacyOrgId}\n`)

      // Create admin user for legacy org
      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash("admin123", 12)

      const adminUser = {
        tenantId: legacyOrgId,
        email: "admin@legacy.local",
        password: hashedPassword,
        role: "org_admin" as const,
        firstName: "Admin",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.collection("users").insertOne(adminUser)
      console.log("✅ Created admin user (email: admin@legacy.local, password: admin123)\n")

      // Step 2: Add tenantId to existing staff
      console.log("Adding tenantId to staff...")
      const staffUpdate = await db.collection("staff").updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: legacyOrgId, isActive: true, updatedAt: new Date() } }
      )
      console.log(`✅ Updated ${staffUpdate.modifiedCount} staff records\n`)

      // Step 3: Add tenantId to existing attendance logs
      console.log("Adding tenantId to attendance logs...")
      const attendanceUpdate = await db.collection("attendance").updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: legacyOrgId, method: "manual" } }
      )
      console.log(`✅ Updated ${attendanceUpdate.modifiedCount} attendance records\n`)

      // Step 4: Migrate settings
      const existingSettings = await db.collection("settings").findOne({})
      if (existingSettings) {
        await db.collection("organizations").updateOne(
          { _id: new ObjectId(legacyOrgId) },
          {
            $set: {
              "settings.latenessTime": existingSettings.latenessTime || "09:00",
              "settings.workEndTime": existingSettings.workEndTime || "17:00",
            },
          }
        )
        console.log("✅ Migrated settings to organization\n")
      }
    } else {
      console.log("ℹ️  No existing data found - fresh installation\n")
    }

    // Step 5: Create indexes
    console.log("Creating database indexes...")

    await db.collection("organizations").createIndex({ subdomain: 1 }, { unique: true })
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ tenantId: 1 })

    await db.collection("staff").createIndex({ tenantId: 1, staffId: 1 }, { unique: true })
    await db.collection("staff").createIndex({ tenantId: 1, email: 1 }, { sparse: true })

    await db.collection("attendance").createIndex({ tenantId: 1, date: -1 })
    await db.collection("attendance").createIndex({ tenantId: 1, staffId: 1, date: -1 })

    console.log("✅ Created all indexes\n")

    console.log("✨ Migration completed successfully!\n")

    if (legacyOrgId) {
      console.log("📝 IMPORTANT: Legacy organization created")
      console.log("   Email: admin@legacy.local")
      console.log("   Password: admin123")
      console.log("   Please change these credentials after first login!\n")
    }
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    await client.close()
    console.log("👋 Disconnected from MongoDB")
  }
}

// Run migration
migrate()
  .then(() => {
    console.log("\n✅ All done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error:", error)
    process.exit(1)
  })

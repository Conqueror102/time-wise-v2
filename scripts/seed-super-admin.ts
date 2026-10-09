/**
 * Seed script to create initial super admin account
 * 
 * Usage:
 *   npx ts-node scripts/seed-super-admin.ts
 * 
 * Environment variables required:
 *   MONGODB_URI - MongoDB connection string
 *   SUPER_ADMIN_SEED_EMAIL - Email for super admin account
 *   SUPER_ADMIN_SEED_PASSWORD - Password for super admin account
 *   SUPER_ADMIN_SEED_FIRST_NAME - (Optional) First name, defaults to "Super"
 *   SUPER_ADMIN_SEED_LAST_NAME - (Optional) Last name, defaults to "Admin"
 */

import { MongoClient } from "mongodb"
import { hashPassword } from "../lib/auth/password"
import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables from .env file
config({ path: resolve(__dirname, "../.env") })

async function seedSuperAdmin() {
  console.log("🚀 Starting super admin seed script...")

  // Validate environment variables
  if (!process.env.MONGODB_URI) {
    console.error("❌ Error: MONGODB_URI environment variable is required")
    process.exit(1)
  }

  if (!process.env.SUPER_ADMIN_SEED_EMAIL) {
    console.error("❌ Error: SUPER_ADMIN_SEED_EMAIL environment variable is required")
    process.exit(1)
  }

  if (!process.env.SUPER_ADMIN_SEED_PASSWORD) {
    console.error("❌ Error: SUPER_ADMIN_SEED_PASSWORD environment variable is required")
    process.exit(1)
  }

  const email = process.env.SUPER_ADMIN_SEED_EMAIL
  const password = process.env.SUPER_ADMIN_SEED_PASSWORD
  const firstName = process.env.SUPER_ADMIN_SEED_FIRST_NAME || "Super"
  const lastName = process.env.SUPER_ADMIN_SEED_LAST_NAME || "Admin"

  let client: MongoClient | null = null

  try {
    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...")
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    console.log("✅ Connected to MongoDB")

    const db = client.db("staff_checkin")
    const superAdminsCollection = db.collection("super_admins")

    // Check if super admin already exists
    console.log(`🔍 Checking if super admin with email ${email} already exists...`)
    const existing = await superAdminsCollection.findOne({ email })

    if (existing) {
      console.log("⚠️  Super admin with this email already exists")
      console.log("   If you want to reset the password, please delete the existing account first")
      await client.close()
      return
    }

    // Hash password
    console.log("🔐 Hashing password...")
    const hashedPassword = await hashPassword(password)

    // Create super admin
    console.log("👤 Creating super admin account...")
    const result = await superAdminsCollection.insertOne({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log(`✅ Super admin created successfully with ID: ${result.insertedId}`)

    // Create indexes
    console.log("📊 Creating database indexes...")

    // Super admins collection indexes
    await superAdminsCollection.createIndex({ email: 1 }, { unique: true })
    console.log("   ✓ Created unique index on super_admins.email")

    // System audit logs collection indexes
    const auditLogsCollection = db.collection("system_audit_logs")
    await auditLogsCollection.createIndex({ timestamp: -1 })
    console.log("   ✓ Created index on system_audit_logs.timestamp")
    await auditLogsCollection.createIndex({ actorId: 1, timestamp: -1 })
    console.log("   ✓ Created index on system_audit_logs.actorId + timestamp")
    await auditLogsCollection.createIndex({ tenantId: 1, timestamp: -1 })
    console.log("   ✓ Created index on system_audit_logs.tenantId + timestamp")

    // Platform stats cache collection with TTL index
    const statsCollection = db.collection("platform_stats_cache")
    await statsCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    )
    console.log("   ✓ Created TTL index on platform_stats_cache.expiresAt")

    // Organizations collection indexes (if not already exist)
    const orgsCollection = db.collection("organizations")
    await orgsCollection.createIndex({ status: 1, createdAt: -1 })
    console.log("   ✓ Created index on organizations.status + createdAt")

    // Users collection indexes (if not already exist)
    const usersCollection = db.collection("users")
    await usersCollection.createIndex({ tenantId: 1, role: 1 })
    console.log("   ✓ Created index on users.tenantId + role")

    // Attendance collection indexes (if not already exist)
    const attendanceCollection = db.collection("attendance")
    await attendanceCollection.createIndex({ tenantId: 1, date: -1 })
    console.log("   ✓ Created index on attendance.tenantId + date")

    console.log("✅ All indexes created successfully")

    console.log("\n🎉 Super admin setup complete!")
    console.log("\n📝 Login credentials:")
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log("\n🔗 Login URL: /owner/login")
    console.log("\n⚠️  IMPORTANT: Please change the password after first login!")

  } catch (error) {
    console.error("❌ Error during seed process:", error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("\n📡 MongoDB connection closed")
    }
  }
}

// Run the seed script
seedSuperAdmin()
  .then(() => {
    console.log("\n✅ Seed script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Seed script failed:", error)
    process.exit(1)
  })

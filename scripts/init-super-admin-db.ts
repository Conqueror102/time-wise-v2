#!/usr/bin/env ts-node
/**
 * Initialize Super Admin Database Collections and Indexes
 * 
 * This script creates the necessary collections and indexes for the super admin panel:
 * - system_audit_logs: Stores all administrative actions
 * - paystack_webhooks: Stores Paystack webhook events
 * - platform_stats_cache: Stores cached analytics with TTL
 * - Verifies and extends organizations collection
 * 
 * Usage:
 *   npx ts-node scripts/init-super-admin-db.ts
 *   or
 *   npm run init-super-admin-db
 */

import { initSuperAdminCollections } from "../lib/database/init-super-admin-collections"
import { getDatabase } from "../lib/mongodb"

async function main() {
  console.log("🚀 Starting super admin database initialization...\n")

  try {
    // Get database connection
    const db = await getDatabase()
    console.log("✅ Connected to MongoDB\n")

    // Initialize collections and indexes
    await initSuperAdminCollections(db)

    console.log("\n✅ Super admin database initialization complete!")
    console.log("\nNext steps:")
    console.log("1. Run the seed script to create your first super admin:")
    console.log("   npx ts-node scripts/seed-super-admin.ts")
    console.log("2. Start your application and login at /owner/login")

    process.exit(0)
  } catch (error) {
    console.error("\n❌ Error initializing super admin database:", error)
    process.exit(1)
  }
}

main()

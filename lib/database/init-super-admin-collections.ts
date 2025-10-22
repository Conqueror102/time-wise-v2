/**
 * Database initialization script for Super Admin collections
 * Creates collections and indexes for system_audit_logs, paystack_webhooks, and platform_stats_cache
 */

import { Db } from "mongodb"
import { getDatabase } from "@/lib/mongodb"

/**
 * Initialize all super admin collections and indexes
 */
export async function initSuperAdminCollections(db?: Db): Promise<void> {
  const database = db || (await getDatabase())

  console.log("🔧 Initializing super admin collections...")

  // Create system_audit_logs collection and indexes
  await initAuditLogsCollection(database)

  // Create paystack_webhooks collection and indexes
  await initPaystackWebhooksCollection(database)

  // Create platform_stats_cache collection and indexes
  await initPlatformStatsCacheCollection(database)

  // Verify and extend organizations collection
  await verifyOrganizationsCollection(database)

  console.log("✅ Super admin collections initialized successfully")
}

/**
 * Initialize system_audit_logs collection
 * Stores all administrative actions performed by super admins
 */
async function initAuditLogsCollection(db: Db): Promise<void> {
  const collectionName = "system_audit_logs"

  // Check if collection exists
  const collections = await db.listCollections({ name: collectionName }).toArray()
  const exists = collections.length > 0

  if (!exists) {
    await db.createCollection(collectionName)
    console.log(`✅ Created collection: ${collectionName}`)
  } else {
    console.log(`ℹ️  Collection already exists: ${collectionName}`)
  }

  // Create indexes
  const collection = db.collection(collectionName)

  // Index on timestamp for chronological queries (descending for recent-first)
  await collection.createIndex({ timestamp: -1 }, { name: "timestamp_desc" })
  console.log(`✅ Created index: ${collectionName}.timestamp_desc`)

  // Compound index on actorId and timestamp for actor-specific queries
  await collection.createIndex(
    { actorId: 1, timestamp: -1 },
    { name: "actorId_timestamp" }
  )
  console.log(`✅ Created index: ${collectionName}.actorId_timestamp`)

  // Compound index on tenantId and timestamp for tenant-specific queries
  await collection.createIndex(
    { tenantId: 1, timestamp: -1 },
    { name: "tenantId_timestamp", sparse: true } // sparse because tenantId is optional
  )
  console.log(`✅ Created index: ${collectionName}.tenantId_timestamp`)

  // Index on action for filtering by action type
  await collection.createIndex({ action: 1 }, { name: "action" })
  console.log(`✅ Created index: ${collectionName}.action`)
}

/**
 * Initialize paystack_webhooks collection
 * Stores all Paystack webhook events for audit and debugging
 */
async function initPaystackWebhooksCollection(db: Db): Promise<void> {
  const collectionName = "paystack_webhooks"

  // Check if collection exists
  const collections = await db.listCollections({ name: collectionName }).toArray()
  const exists = collections.length > 0

  if (!exists) {
    await db.createCollection(collectionName)
    console.log(`✅ Created collection: ${collectionName}`)
  } else {
    console.log(`ℹ️  Collection already exists: ${collectionName}`)
  }

  // Create indexes
  const collection = db.collection(collectionName)

  // Index on timestamp for chronological queries (descending for recent-first)
  await collection.createIndex({ timestamp: -1 }, { name: "timestamp_desc" })
  console.log(`✅ Created index: ${collectionName}.timestamp_desc`)

  // Compound index on tenantId and timestamp for tenant-specific queries
  await collection.createIndex(
    { tenantId: 1, timestamp: -1 },
    { name: "tenantId_timestamp", sparse: true } // sparse because tenantId is optional
  )
  console.log(`✅ Created index: ${collectionName}.tenantId_timestamp`)

  // Index on event type for filtering by webhook event
  await collection.createIndex({ event: 1 }, { name: "event" })
  console.log(`✅ Created index: ${collectionName}.event`)

  // Index on reference for quick lookup by transaction reference
  await collection.createIndex({ reference: 1 }, { name: "reference" })
  console.log(`✅ Created index: ${collectionName}.reference`)
}

/**
 * Initialize platform_stats_cache collection
 * Stores cached analytics metrics with TTL for automatic expiration
 */
async function initPlatformStatsCacheCollection(db: Db): Promise<void> {
  const collectionName = "platform_stats_cache"

  // Check if collection exists
  const collections = await db.listCollections({ name: collectionName }).toArray()
  const exists = collections.length > 0

  if (!exists) {
    await db.createCollection(collectionName)
    console.log(`✅ Created collection: ${collectionName}`)
  } else {
    console.log(`ℹ️  Collection already exists: ${collectionName}`)
  }

  // Create indexes
  const collection = db.collection(collectionName)

  // TTL index on expiresAt for automatic document deletion
  // expireAfterSeconds: 0 means documents expire at the time specified in expiresAt field
  await collection.createIndex(
    { expiresAt: 1 },
    { name: "expiresAt_ttl", expireAfterSeconds: 0 }
  )
  console.log(`✅ Created TTL index: ${collectionName}.expiresAt_ttl`)

  // Index on metric for quick lookup by metric name
  await collection.createIndex({ metric: 1 }, { name: "metric" })
  console.log(`✅ Created index: ${collectionName}.metric`)

  // Compound index on metric and expiresAt for efficient cache queries
  await collection.createIndex(
    { metric: 1, expiresAt: 1 },
    { name: "metric_expiresAt" }
  )
  console.log(`✅ Created index: ${collectionName}.metric_expiresAt`)
}

/**
 * Verify and extend organizations collection
 * Ensures required fields and indexes exist for super admin functionality
 */
async function verifyOrganizationsCollection(db: Db): Promise<void> {
  const collectionName = "organizations"

  // Check if collection exists
  const collections = await db.listCollections({ name: collectionName }).toArray()
  const exists = collections.length > 0

  if (!exists) {
    console.log(`⚠️  Warning: ${collectionName} collection does not exist yet`)
    console.log(`   It will be created when the first organization registers`)
    return
  }

  console.log(`ℹ️  Verifying collection: ${collectionName}`)

  // Create indexes
  const collection = db.collection(collectionName)

  // Compound index on status and createdAt for filtering and sorting
  await collection.createIndex(
    { status: 1, createdAt: -1 },
    { name: "status_createdAt" }
  )
  console.log(`✅ Created index: ${collectionName}.status_createdAt`)

  // Index on subdomain (should already exist as unique, but verify)
  await collection.createIndex({ subdomain: 1 }, { name: "subdomain", unique: true })
  console.log(`✅ Verified unique index: ${collectionName}.subdomain`)

  // Index on subscriptionTier for filtering
  await collection.createIndex({ subscriptionTier: 1 }, { name: "subscriptionTier" })
  console.log(`✅ Created index: ${collectionName}.subscriptionTier`)

  // Index on subscriptionStatus for filtering
  await collection.createIndex({ subscriptionStatus: 1 }, { name: "subscriptionStatus" })
  console.log(`✅ Created index: ${collectionName}.subscriptionStatus`)
}

/**
 * Drop all super admin collections (for testing/cleanup)
 * WARNING: This will delete all data in these collections
 */
export async function dropSuperAdminCollections(db?: Db): Promise<void> {
  const database = db || (await getDatabase())

  console.log("⚠️  Dropping super admin collections...")

  const collections = ["system_audit_logs", "paystack_webhooks", "platform_stats_cache"]

  for (const collectionName of collections) {
    try {
      await database.collection(collectionName).drop()
      console.log(`✅ Dropped collection: ${collectionName}`)
    } catch (error: any) {
      if (error.codeName === "NamespaceNotFound") {
        console.log(`ℹ️  Collection does not exist: ${collectionName}`)
      } else {
        console.error(`❌ Error dropping collection ${collectionName}:`, error.message)
      }
    }
  }

  console.log("✅ Super admin collections cleanup complete")
}

# Super Admin Database Collections

This directory contains database initialization and helper functions for the Super Admin panel.

## Collections

### 1. system_audit_logs
Stores all administrative actions performed by super admins.

**Schema:**
```typescript
{
  _id: ObjectId
  actorId: string          // Super admin ID
  actorRole: "super_admin"
  actorEmail: string
  tenantId?: string        // Optional, for tenant-specific actions
  action: AuditAction      // Type of action performed
  metadata: object         // Additional action details
  ipAddress: string
  userAgent: string
  timestamp: Date
}
```

**Indexes:**
- `timestamp_desc`: Descending index on timestamp for recent-first queries
- `actorId_timestamp`: Compound index for actor-specific queries
- `tenantId_timestamp`: Compound sparse index for tenant-specific queries
- `action`: Index on action type for filtering

### 2. paystack_webhooks
Stores all Paystack webhook events for audit and debugging.

**Schema:**
```typescript
{
  _id: ObjectId
  event: PaystackEvent     // e.g., "charge.success"
  tenantId?: string
  organizationName?: string
  planCode?: string
  status: "success" | "failed"
  amount?: number
  currency?: string
  reference: string
  timestamp: Date
  rawPayload: object       // Complete webhook payload
}
```

**Indexes:**
- `timestamp_desc`: Descending index on timestamp
- `tenantId_timestamp`: Compound sparse index for tenant-specific queries
- `event`: Index on event type
- `reference`: Index on transaction reference

### 3. platform_stats_cache
Stores cached analytics metrics with automatic expiration (TTL).

**Schema:**
```typescript
{
  _id: ObjectId
  metric: string           // e.g., "total_organizations", "mrr"
  value: any              // Cached value (number, string, or object)
  calculatedAt: Date
  expiresAt: Date         // TTL expiration time
}
```

**Indexes:**
- `expiresAt_ttl`: TTL index for automatic document deletion
- `metric`: Index on metric name
- `metric_expiresAt`: Compound index for efficient cache queries

### 4. organizations (Extended)
Existing collection with additional indexes for super admin queries.

**Additional Indexes:**
- `status_createdAt`: Compound index for filtering and sorting
- `subdomain`: Unique index (verified)
- `subscriptionTier`: Index for filtering by plan
- `subscriptionStatus`: Index for filtering by subscription status

## Initialization

### Setup Database Collections

Run the initialization script to create all collections and indexes:

```bash
npm run init:super-admin-db
```

Or manually:

```bash
npx tsx scripts/init-super-admin-db.ts
```

This will:
1. Create the three new collections (if they don't exist)
2. Create all required indexes
3. Verify and extend the organizations collection
4. Display confirmation messages

### Using Collection Helpers

Import typed collection accessors:

```typescript
import {
  getAuditLogsCollection,
  getPaystackWebhooksCollection,
  getPlatformStatsCacheCollection,
  getSuperAdminsCollection,
  getOrganizationsCollection,
} from "@/lib/database/collections"

// Example: Insert audit log
const auditLogs = await getAuditLogsCollection()
await auditLogs.insertOne({
  actorId: "admin123",
  actorRole: "super_admin",
  actorEmail: "admin@example.com",
  action: "SUSPEND_TENANT",
  metadata: { tenantId: "org123", reason: "Payment overdue" },
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: new Date(),
})

// Example: Query webhooks
const webhooks = await getPaystackWebhooksCollection()
const recentWebhooks = await webhooks
  .find({ event: "charge.success" })
  .sort({ timestamp: -1 })
  .limit(10)
  .toArray()

// Example: Cache a metric
const cache = await getPlatformStatsCacheCollection()
await cache.insertOne({
  metric: "total_revenue",
  value: 1500000,
  calculatedAt: new Date(),
  expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
})
```

## Cleanup (Development Only)

To drop all super admin collections (WARNING: deletes all data):

```typescript
import { dropSuperAdminCollections } from "@/lib/database/init-super-admin-collections"

await dropSuperAdminCollections()
```

## Performance Considerations

1. **Audit Logs**: Indexes on timestamp, actorId, and tenantId ensure fast queries even with millions of records
2. **Webhooks**: Timestamp and reference indexes enable quick lookups and debugging
3. **Cache**: TTL index automatically removes expired entries, preventing collection bloat
4. **Organizations**: Compound indexes optimize common super admin queries (filtering by status, sorting by date)

## Monitoring

Monitor collection sizes and index usage:

```javascript
// In MongoDB shell or Compass
db.system_audit_logs.stats()
db.paystack_webhooks.stats()
db.platform_stats_cache.stats()

// Check index usage
db.system_audit_logs.aggregate([{ $indexStats: {} }])
```

## Backup Recommendations

- **Audit Logs**: Critical for compliance - backup daily, retain for 1+ years
- **Webhooks**: Important for debugging - backup weekly, retain for 3-6 months
- **Cache**: Ephemeral data - no backup needed (auto-regenerates)
- **Organizations**: Critical - backup daily with point-in-time recovery

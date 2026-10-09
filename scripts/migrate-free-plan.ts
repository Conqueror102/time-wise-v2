/**
 * One-time migration for the switch to a free product.
 *
 * - Organizations with the old "trial" status become "active"
 * - Plan/trial fields are removed from organizations
 *
 * The `subscriptions` and `paystack_webhooks` collections are left untouched
 * so payment history is not lost; drop them manually if you no longer need them.
 *
 * Usage:
 *   pnpm migrate:free-plan
 */

import { MongoClient } from "mongodb"
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(__dirname, "../.env.local") })
config({ path: resolve(__dirname, "../.env") })

async function migrate() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI environment variable is required")
    process.exit(1)
  }

  const client = new MongoClient(process.env.MONGODB_URI)
  try {
    await client.connect()
    const organizations = client.db("staff_checkin").collection("organizations")

    const trial = await organizations.updateMany({ status: "trial" }, { $set: { status: "active", updatedAt: new Date() } })
    console.log(`✅ ${trial.modifiedCount} trial organization(s) set to active`)

    const cleaned = await organizations.updateMany(
      {},
      {
        $unset: {
          subscriptionTier: "",
          subscriptionStatus: "",
          trialEndsAt: "",
          "settings.maxStaff": "",
        },
      }
    )
    console.log(`✅ Removed plan fields from ${cleaned.modifiedCount} organization(s)`)
  } finally {
    await client.close()
  }
}

migrate().catch((error) => {
  console.error("❌ Migration failed:", error)
  process.exit(1)
})

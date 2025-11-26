/**
 * Migration Script: Update Subscriptions to New Plan Structure
 * 
 * Run with: npx ts-node scripts/migrate-subscriptions.ts
 * 
 * Changes:
 * - free_trial → starter (with isTrialActive: true)
 * - paid → professional (if amount <= 5000) or enterprise (if amount > 5000)
 * - Adds isTrialActive field
 */

import { getDatabase } from "../lib/mongodb"

async function migrateSubscriptions() {
  console.log("Starting subscription migration...")

  try {
    const db = await getDatabase()
    const subscriptions = db.collection("subscriptions")

    // Migrate free_trial to starter
    const freeTrialResult = await subscriptions.updateMany(
      { plan: "free_trial" },
      {
        $set: {
          plan: "starter",
          isTrialActive: true,
        },
      }
    )
    console.log(`✓ Migrated ${freeTrialResult.modifiedCount} free_trial subscriptions to starter`)

    // Migrate paid to professional or enterprise based on amount
    const paidSubs = await subscriptions.find({ plan: "paid" }).toArray()
    
    for (const sub of paidSubs) {
      const newPlan = (sub.amount || 0) > 5000 ? "enterprise" : "professional"
      await subscriptions.updateOne(
        { _id: sub._id },
        {
          $set: {
            plan: newPlan,
            isTrialActive: false,
          },
        }
      )
    }
    console.log(`✓ Migrated ${paidSubs.length} paid subscriptions`)

    // Add isTrialActive to any subscriptions missing it
    const missingFieldResult = await subscriptions.updateMany(
      { isTrialActive: { $exists: false } },
      {
        $set: {
          isTrialActive: false,
        },
      }
    )
    console.log(`✓ Added isTrialActive field to ${missingFieldResult.modifiedCount} subscriptions`)

    console.log("\n✅ Migration completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

migrateSubscriptions()

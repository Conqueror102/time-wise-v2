/**
 * Cancel Subscription API
 * Allows users to cancel their subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { cancelSubscription, getSubscription } from '@/lib/subscription/subscription-manager'
import { cancelSubscription as cancelPaystackSubscription } from '@/lib/services/paystack'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get tenant context
    const context = await withAuth(request, { allowedRoles: ['org_admin'] })
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tenantId } = context

    // Get current subscription
    const subscription = await getSubscription(tenantId)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Can't cancel if already cancelled
    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }

    // If on starter plan, just mark as cancelled
    if (subscription.plan === 'starter') {
      await cancelSubscription(tenantId)

      // Update organization status for consistency
      const db = await getDatabase()
      await db.collection('organizations').updateOne(
        { _id: new ObjectId(tenantId) },
        {
          $set: {
            subscriptionStatus: 'cancelled',
            updatedAt: new Date(),
          },
        }
      )
      
      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully. You can reactivate anytime.',
      })
    }

    // For paid plans, cancel with Paystack first
    if (subscription.paystackSubscriptionCode) {
      const db = await getDatabase()
      const org = await db.collection('organizations').findOne({ _id: new ObjectId(tenantId) })
      
      if (org) {
        // TODO: The Paystack API requires an email token, not an email address.
        // To properly implement this, you need to:
        // 1. Send a cancellation link to the org admin email via Paystack
        // 2. Have the admin click the link to generate a token
        // 3. Use that token to complete the cancellation
        // 
        // For now, we continue without remote cancellation and log a warning.
        // This means the subscription may remain active in Paystack while appearing cancelled locally.
        console.warn(
          `Paystack subscription ${subscription.paystackSubscriptionCode} requires email token for cancellation. ` +
          `User ${org.adminEmail} should receive cancellation link via email.`
        )
        
        // Uncomment below once email token flow is implemented:
        // const cancelResult = await cancelPaystackSubscription(
        //   subscription.paystackSubscriptionCode,
        //   emailToken // This should be the token from Paystack email link
        // )
      }
    }

    // Cancel in our system
    await cancelSubscription(tenantId)

    // Update organization status
    const db = await getDatabase()
    await db.collection('organizations').updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          subscriptionStatus: 'cancelled',
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully. You will retain access until the end of your billing period.',
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
